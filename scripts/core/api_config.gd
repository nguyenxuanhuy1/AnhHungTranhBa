class_name ApiConfig
extends RefCounted

## Địa chỉ backend của game.
##
## Bản debug dùng server dev, bản release dùng server thật — tự chuyển,
## không cần nhớ sửa tay trước mỗi lần build (quên sửa là bản phát hành
## trỏ về localhost, và không ai đăng nhập được).

const DEV_BASE_URL := "http://127.0.0.1:8080"
const PROD_BASE_URL := "https://api.anhhungxungba.com"  # ← đổi thành tên miền thật của bạn

## File ghi đè để test trên điện thoại thật.
##
## Chạy trên máy Android, "127.0.0.1" là chính chiếc điện thoại đó chứ không
## phải máy tính của bạn — nên bản debug trên điện thoại sẽ không kết nối được.
## Cách xử lý: tạo file này trên máy và ghi vào địa chỉ LAN của máy tính,
## ví dụ  http://192.168.1.12:8080
const OVERRIDE_FILE := "user://api_base_url.txt"

static func base_url() -> String:
	if FileAccess.file_exists(OVERRIDE_FILE):
		var f := FileAccess.open(OVERRIDE_FILE, FileAccess.READ)
		if f != null:
			var url := f.get_as_text().strip_edges()
			f.close()
			if url.begins_with("http"):
				return url.trim_suffix("/")

	if OS.is_debug_build():
		return DEV_BASE_URL
	return PROD_BASE_URL


## Chuỗi nhận dạng nền tảng gửi kèm lên server (phục vụ thống kê và log).
static func platform_name() -> String:
	match OS.get_name():
		"Android": return "android"
		"iOS": return "ios"
		"Windows": return "windows"
		"Linux", "FreeBSD", "NetBSD", "OpenBSD", "BSD": return "linux"
		"macOS": return "macos"
		"Web": return "web"
		_: return "unknown"


static func client_version() -> String:
	return str(ProjectSettings.get_setting("application/config/version", "0.1.0"))
