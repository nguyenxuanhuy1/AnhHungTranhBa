class_name AuthClient
extends Node

## Đăng nhập Google cho game.
##
## ── VÌ SAO LẠI ĐI ĐƯỜNG VÒNG QUA TRÌNH DUYỆT ───────────────────────
## Google CHẶN việc hiện màn hình đăng nhập bên trong webview nhúng của
## app (chính sách chống lừa đảo). Bắt buộc phải dùng trình duyệt hệ thống.
##
## Nhưng để trình duyệt gọi ngược lại vào game thì cần đăng ký deep link,
## mà việc đó đòi custom build Android với AndroidManifest sửa tay.
## Cách làm ở đây tránh hẳn chuyện đó:
##
##   1. Game xin server một phiên  → nhận session_id + authorize_url
##   2. Game mở authorize_url bằng trình duyệt hệ thống
##   3. Người chơi chọn tài khoản Google
##   4. Google gọi thẳng về SERVER (không gọi về game)
##   5. Game hỏi server "xong chưa?" mỗi 2.5 giây → nhận token
##
## Ưu điểm: chạy y hệt nhau trên Android, iOS, Windows và cả trong editor.
## Không cần plugin, không cần sửa manifest, test được ngay trên máy tính.
## ───────────────────────────────────────────────────────────────────

signal status_changed(message: String)
signal login_succeeded(account: Dictionary)
signal login_failed(code: String, message: String)
signal browser_opened(url: String)

const REQUEST_TIMEOUT_SEC := 15.0
const REFRESH_MARGIN_MS := 60_000  ## Làm mới access token khi còn dưới 60 giây

var account: Dictionary = {}

var _http: HTTPRequest
var _base_url := ""
var _busy := false
var _cancelled := false
var _access_token := ""
var _access_expires_at_ms := 0
var _wants_immediate_poll := false


func _ready() -> void:
	_base_url = ApiConfig.base_url()

	_http = HTTPRequest.new()
	_http.timeout = REQUEST_TIMEOUT_SEC
	# Cho phép chuyển hướng; Godot tự kiểm tra chứng chỉ TLS nên
	# không cần cấu hình gì thêm cho https.
	_http.max_redirects = 3
	add_child(_http)


func _notification(what: int) -> void:
	# Người chơi vừa từ trình duyệt quay lại game — hỏi server ngay lập tức
	# thay vì đợi hết chu kỳ 2.5 giây. Cảm giác vào game tức thì.
	if what == NOTIFICATION_APPLICATION_RESUMED:
		_wants_immediate_poll = true


# =====================================================================
#  API công khai
# =====================================================================

func get_access_token() -> String:
	return _access_token


## Thử đăng nhập lại bằng token đã lưu. Gọi lúc mở game.
## Trả về true nếu vào được luôn, false nếu cần bấm đăng nhập Google.
func try_auto_login() -> bool:
	var refresh_token := TokenStore.load_refresh_token()
	if refresh_token.is_empty():
		return false

	status_changed.emit("Đang khôi phục phiên đăng nhập...")

	var res := await _request(HTTPClient.METHOD_POST, "/auth/refresh", {
		"refresh_token": refresh_token,
	})

	if not res["ok"]:
		# Token hỏng, hết hạn, hoặc bị thu hồi. Xoá đi và bắt đăng nhập lại.
		TokenStore.clear()
		var code := String(res["error_code"])
		if code == "token_reused":
			login_failed.emit(code, _message_for(code))
		return false

	_store_tokens(res["data"])

	var me := await _request(HTTPClient.METHOD_GET, "/auth/me", {})
	if not me["ok"]:
		TokenStore.clear()
		return false

	account = me["data"]
	login_succeeded.emit(account)
	return true


## Bắt đầu luồng đăng nhập Google.
func start_google_login() -> void:
	if _busy:
		return

	_cancelled = false
	status_changed.emit("Đang chuẩn bị...")

	# Bí mật này KHÔNG BAO GIỜ rời khỏi máy. Server chỉ nhận SHA-256 của nó.
	# Nhờ vậy dù ai đó đọc được lịch sử trình duyệt hay chặn được lưu lượng
	# tới server, họ vẫn không đổi được phiên này lấy token.
	var crypto := Crypto.new()
	var poll_secret := crypto.generate_random_bytes(32).hex_encode()
	var poll_secret_hash := poll_secret.sha256_text()

	var created := await _request(HTTPClient.METHOD_POST, "/auth/session", {
		"poll_secret_hash": poll_secret_hash,
		"platform": ApiConfig.platform_name(),
		"client_version": ApiConfig.client_version(),
	})

	if _cancelled:
		return

	if not created["ok"]:
		var code := String(created["error_code"])
		login_failed.emit(code, _message_for(code))
		return

	var data: Dictionary = created["data"]
	var session_id := String(data.get("session_id", ""))
	var authorize_url := String(data.get("authorize_url", ""))
	var poll_interval_ms := int(data.get("poll_interval_ms", 2500))
	var expires_in := int(data.get("expires_in", 300))

	if session_id.is_empty() or authorize_url.is_empty():
		login_failed.emit("bad_response", "Server trả về dữ liệu không hợp lệ.")
		return

	status_changed.emit("Đang mở trình duyệt...")
	OS.shell_open(authorize_url)
	browser_opened.emit(authorize_url)

	await _poll_until_done(session_id, poll_secret, poll_interval_ms, expires_in)


## Huỷ luồng đăng nhập đang chạy (người chơi bấm "Huỷ").
func cancel() -> void:
	_cancelled = true
	status_changed.emit("")


func logout() -> void:
	var refresh_token := TokenStore.load_refresh_token()
	if not refresh_token.is_empty():
		await _request(HTTPClient.METHOD_POST, "/auth/logout", {"refresh_token": refresh_token})

	TokenStore.clear()
	_access_token = ""
	_access_expires_at_ms = 0
	account = {}


## Access token còn hiệu lực, tự làm mới nếu sắp hết hạn.
## Server game realtime dùng token này để xác thực kết nối.
func get_valid_access_token() -> String:
	if _access_token.is_empty():
		return ""

	if Time.get_ticks_msec() < _access_expires_at_ms - REFRESH_MARGIN_MS:
		return _access_token

	var refresh_token := TokenStore.load_refresh_token()
	if refresh_token.is_empty():
		return ""

	var res := await _request(HTTPClient.METHOD_POST, "/auth/refresh", {
		"refresh_token": refresh_token,
	})

	if not res["ok"]:
		TokenStore.clear()
		_access_token = ""
		return ""

	_store_tokens(res["data"])
	return _access_token


# =====================================================================
#  Nội bộ
# =====================================================================

func _poll_until_done(
	session_id: String,
	poll_secret: String,
	interval_ms: int,
	expires_in_sec: int,
) -> void:
	var deadline_ms := Time.get_ticks_msec() + expires_in_sec * 1000
	status_changed.emit("Đang chờ xác nhận từ Google...")

	while Time.get_ticks_msec() < deadline_ms:
		# Chờ theo chu kỳ, nhưng cắt ngang ngay nếu người chơi vừa quay lại app.
		var waited := 0.0
		while waited < interval_ms / 1000.0:
			await get_tree().create_timer(0.25).timeout
			waited += 0.25
			if _cancelled:
				return
			if _wants_immediate_poll:
				_wants_immediate_poll = false
				break

		if _cancelled:
			return

		var res := await _request(HTTPClient.METHOD_POST, "/auth/session/claim", {
			"session_id": session_id,
			"poll_secret": poll_secret,
		})

		if _cancelled:
			return

		if not res["ok"]:
			var code := String(res["error_code"])
			# Lỗi mạng chập chờn thì thử lại, đừng bỏ cuộc ngay —
			# mạng 4G rớt vài giây là chuyện bình thường.
			if code == "network_error" or code == "timeout":
				status_changed.emit("Mạng không ổn định, đang thử lại...")
				continue
			login_failed.emit(code, _message_for(code))
			return

		var data: Dictionary = res["data"]
		match String(data.get("status", "")):
			"pending":
				continue
			"failed":
				var err := String(data.get("error_code", "unknown"))
				login_failed.emit(err, _message_for(err))
				return
			"ready":
				_store_tokens(data)
				account = data.get("account", {})
				status_changed.emit("")
				login_succeeded.emit(account)
				return
			_:
				login_failed.emit("bad_response", "Server trả về trạng thái lạ.")
				return

	login_failed.emit("session_expired", _message_for("session_expired"))


func _store_tokens(data: Dictionary) -> void:
	_access_token = String(data.get("access_token", ""))
	var ttl := int(data.get("expires_in", 900))
	_access_expires_at_ms = Time.get_ticks_msec() + ttl * 1000

	var refresh := String(data.get("refresh_token", ""))
	if not refresh.is_empty():
		# Refresh token xoay vòng: server cấp cái mới mỗi lần dùng.
		# Lưu đè ngay, nếu không lần sau gửi cái cũ là server báo động trộm
		# và đá mình ra khỏi tài khoản.
		TokenStore.save_refresh_token(refresh)


## Trả về { ok: bool, status: int, data: Dictionary, error_code: String }
func _request(method: int, path: String, body: Dictionary) -> Dictionary:
	if _busy:
		return {"ok": false, "status": 0, "data": {}, "error_code": "busy"}

	_busy = true

	var headers := PackedStringArray([
		"Accept: application/json",
		"User-Agent: AnhHungClient/%s (%s)" % [ApiConfig.client_version(), OS.get_name()],
	])

	var payload := ""
	if method == HTTPClient.METHOD_POST or method == HTTPClient.METHOD_DELETE:
		headers.append("Content-Type: application/json")
		payload = JSON.stringify(body)

	if not _access_token.is_empty() and (path == "/auth/me" or path == "/auth/account"):
		headers.append("Authorization: Bearer " + _access_token)

	var err := _http.request(_base_url + path, headers, method, payload)
	if err != OK:
		_busy = false
		push_warning("AuthClient: gửi request thất bại (%s)" % error_string(err))
		return {"ok": false, "status": 0, "data": {}, "error_code": "network_error"}

	var response: Array = await _http.request_completed
	_busy = false

	var result: int = response[0]
	var status_code: int = response[1]
	var raw: PackedByteArray = response[3]

	if result == HTTPRequest.RESULT_TIMEOUT:
		return {"ok": false, "status": 0, "data": {}, "error_code": "timeout"}

	if result != HTTPRequest.RESULT_SUCCESS:
		return {"ok": false, "status": 0, "data": {}, "error_code": "network_error"}

	var parsed = JSON.parse_string(raw.get_string_from_utf8())
	var data: Dictionary = parsed if parsed is Dictionary else {}

	if status_code >= 200 and status_code < 300:
		return {"ok": true, "status": status_code, "data": data, "error_code": ""}

	return {
		"ok": false,
		"status": status_code,
		"data": data,
		"error_code": String(data.get("error", "http_%d" % status_code)),
	}


## Mã lỗi từ server → câu tiếng Việt hiển thị cho người chơi.
func _message_for(code: String) -> String:
	match code:
		"network_error":
			return "Không kết nối được máy chủ. Kiểm tra lại mạng."
		"timeout":
			return "Máy chủ phản hồi quá chậm. Vui lòng thử lại."
		"access_denied":
			return "Bạn đã huỷ đăng nhập."
		"session_expired", "session_not_found":
			return "Phiên đăng nhập đã hết hạn. Vui lòng thử lại."
		"account_banned":
			return "Tài khoản của bạn đã bị khoá."
		"token_reused":
			return "Phát hiện bất thường về bảo mật. Vui lòng đăng nhập lại."
		"google_failed":
			return "Không xác thực được với Google. Vui lòng thử lại."
		"rate_limited":
			return "Bạn thao tác quá nhanh. Chờ một lát rồi thử lại."
		_:
			return "Đăng nhập thất bại. Vui lòng thử lại."
