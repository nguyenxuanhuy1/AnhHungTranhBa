class_name TokenStore
extends RefCounted

## Lưu refresh token trên máy người chơi để lần sau mở game vào thẳng,
## không phải bấm Google lại.
##
## ─────────────────────────────────────────────────────────────────
##  NÓI THẲNG VỀ MỨC ĐỘ AN TOÀN
##
##  File được mã hoá bằng khoá dẫn xuất từ mã định danh thiết bị. Điều này
##  chặn được: người khác cầm máy lên đọc file, ứng dụng khác đọc bừa,
##  và token bị chép nguyên si sang máy khác (vì khoá sẽ không khớp).
##
##  Điều này KHÔNG chặn được: máy đã root/jailbreak, hoặc mã độc chạy với
##  quyền của chính app này. Muốn chống được thì phải dùng Android Keystore /
##  iOS Keychain, và Godot cần plugin native mới truy cập được.
##
##  Vì vậy lớp phòng thủ thật sự nằm ở SERVER, không nằm ở đây:
##    - access token chỉ sống 15 phút
##    - refresh token xoay vòng mỗi lần dùng
##    - dùng lại token cũ => server thu hồi toàn bộ phiên
##  Token bị đánh cắp thì chỉ dùng được tới lần refresh kế tiếp của người
##  chơi thật, sau đó cả hai bên đều bị đá ra.
## ─────────────────────────────────────────────────────────────────

const TOKEN_PATH := "user://auth.bin"
const _SALT := "anhhung-xung-ba/token-store/v1"


static func _encryption_key() -> String:
	var device_id := OS.get_unique_id()
	if device_id.is_empty():
		# Một số nền tảng không cấp mã thiết bị (Web, vài bản Linux).
		# Vẫn mã hoá được, chỉ là không ràng buộc vào thiết bị nữa.
		device_id = "no-device-id"
	return (device_id + "|" + _SALT).sha256_text()


static func save_refresh_token(token: String) -> void:
	if token.is_empty():
		clear()
		return

	var f := FileAccess.open_encrypted_with_pass(TOKEN_PATH, FileAccess.WRITE, _encryption_key())
	if f == null:
		push_warning("TokenStore: không ghi được token (%s)" % error_string(FileAccess.get_open_error()))
		return

	f.store_line("1")  # phiên bản định dạng, để sau này đổi cấu trúc còn biết đường
	f.store_line(token)
	f.close()


## Trả về chuỗi rỗng nếu chưa có token, hoặc token không giải mã được.
static func load_refresh_token() -> String:
	if not FileAccess.file_exists(TOKEN_PATH):
		return ""

	var f := FileAccess.open_encrypted_with_pass(TOKEN_PATH, FileAccess.READ, _encryption_key())
	if f == null:
		# Giải mã hỏng — thường do cài lại app nên mã thiết bị đổi.
		# Không phải lỗi: chỉ cần bắt người chơi đăng nhập lại.
		clear()
		return ""

	var version := f.get_line()
	var token := f.get_line()
	f.close()

	if version != "1":
		clear()
		return ""

	return token.strip_edges()


static func has_token() -> bool:
	return not load_refresh_token().is_empty()


static func clear() -> void:
	if FileAccess.file_exists(TOKEN_PATH):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(TOKEN_PATH))
