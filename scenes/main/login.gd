extends Control

## Màn hình đăng nhập.
##
## Chỉ lo phần hiển thị: bấm nút, đổi chữ trạng thái, bật tắt nút.
## Toàn bộ logic xác thực nằm ở AuthClient — nhờ vậy đổi giao diện
## không đụng tới bảo mật, và đổi luồng đăng nhập không đụng tới giao diện.

const NEXT_SCENE := "res://scenes/main/character_select.tscn"
const GOOGLE_LOGO_PATH := "res://assets/ui/google_logo.png"

## Google BẮT BUỘC phải có hai link này trên màn hình đồng ý OAuth,
## và Google Play cũng yêu cầu link chính sách bảo mật. Đổi thành link thật.
const TERMS_URL := "https://anhhungxungba.com/dieu-khoan"
const PRIVACY_URL := "https://anhhungxungba.com/bao-mat"

const COLOR_IDLE := Color(0.72, 0.67, 0.60)
const COLOR_BUSY := Color(0.92, 0.80, 0.48)
const COLOR_ERROR := Color(0.91, 0.51, 0.42)

@onready var _google_button: Button = %GoogleButton
@onready var _cancel_button: Button = %CancelButton
@onready var _status_label: Label = %StatusLabel
@onready var _legal_label: RichTextLabel = %LegalLabel
@onready var _version_label: Label = %VersionLabel

var _auth: AuthClient
var _busy := false


func _ready() -> void:
	_auth = AuthClient.new()
	_auth.name = "AuthClient"
	add_child(_auth)

	_auth.status_changed.connect(_on_status_changed)
	_auth.login_succeeded.connect(_on_login_succeeded)
	_auth.login_failed.connect(_on_login_failed)

	_google_button.pressed.connect(_on_google_pressed)
	_cancel_button.pressed.connect(_on_cancel_pressed)
	_legal_label.meta_clicked.connect(_on_legal_clicked)

	# Logo Google là tuỳ chọn — chưa có file thì nút vẫn chạy bình thường.
	# Xem README để biết chỗ tải logo chính thức.
	if ResourceLoader.exists(GOOGLE_LOGO_PATH):
		_google_button.icon = load(GOOGLE_LOGO_PATH)

	_version_label.text = "v%s" % ApiConfig.client_version()
	_legal_label.text = (
		"[center]Khi đăng nhập, bạn đồng ý với "
		+ "[url=terms][color=#c9a55f]Điều khoản sử dụng[/color][/url] và "
		+ "[url=privacy][color=#c9a55f]Chính sách bảo mật[/color][/url][/center]"
	)

	_set_busy(false)
	_status_label.text = ""

	# Có token cũ thì vào thẳng, không bắt bấm lại.
	if TokenStore.has_token():
		_set_busy(true)
		var ok: bool = await _auth.try_auto_login()
		if not ok:
			_set_busy(false)
			_status_label.text = ""


func _on_google_pressed() -> void:
	if _busy:
		return
	_set_busy(true)
	_auth.start_google_login()


func _on_cancel_pressed() -> void:
	_auth.cancel()
	_set_busy(false)
	_status_label.text = ""


func _on_status_changed(message: String) -> void:
	_status_label.text = message
	_status_label.add_theme_color_override("font_color", COLOR_BUSY if message != "" else COLOR_IDLE)


const CREATE_CHAR_SCENE := "res://scenes/main/create_character.tscn"
const WORLD_SCENE := "res://scenes/main/world.tscn"

func _on_login_succeeded(account: Dictionary) -> void:
	var display_name := String(account.get("display_name", "Anh Hùng"))
	_status_label.add_theme_color_override("font_color", COLOR_BUSY)
	_status_label.text = "Đang kiểm tra nhân vật..."

	var token := _auth.get_access_token()
	var char_client := CharacterClient.new()
	add_child(char_client)

	var characters: Array = await char_client.fetch_characters(token)

	if characters.is_empty():
		# Chưa có nhân vật nào -> Chuyển sang màn hình Tạo Nhân Vật
		if ResourceLoader.exists(CREATE_CHAR_SCENE):
			var next_scene = load(CREATE_CHAR_SCENE).instantiate()
			get_tree().root.add_child(next_scene)
			if next_scene.has_method("set_access_token"):
				next_scene.set_access_token(token)
			queue_free()
		else:
			_set_busy(false)
			_status_label.text = "Chưa có nhân vật! (Màn hình tạo nhân vật chưa sẵn sàng)"
	else:
		# Đã có nhân vật -> Vào thẳng game!
		_status_label.text = "Chào mừng %s trở lại! Đang vào game..." % characters[0].get("name", display_name)
		await get_tree().create_timer(1.0).timeout
		if ResourceLoader.exists(WORLD_SCENE):
			get_tree().change_scene_to_file(WORLD_SCENE)
		else:
			_set_busy(false)
			_google_button.text = "Vào game (Bản đồ đang phát triển)"
			_google_button.disabled = true


func _on_login_failed(code: String, message: String) -> void:
	_set_busy(false)
	_status_label.add_theme_color_override("font_color", COLOR_ERROR)
	_status_label.text = message
	_google_button.text = "Thử lại"
	push_warning("Đăng nhập thất bại [%s]: %s" % [code, message])


func _on_legal_clicked(meta: Variant) -> void:
	match String(meta):
		"terms": OS.shell_open(TERMS_URL)
		"privacy": OS.shell_open(PRIVACY_URL)


func _set_busy(busy: bool) -> void:
	_busy = busy
	_google_button.disabled = busy
	_cancel_button.visible = busy
