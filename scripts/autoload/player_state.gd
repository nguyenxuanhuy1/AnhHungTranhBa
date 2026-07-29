extends Node

## Autoload: giữ dữ liệu nhân vật đang chơi xuyên suốt các lần đổi scene
## (login -> tạo nhân vật -> world), vì change_scene_to_file() hủy toàn bộ
## cây node cũ nên biến cục bộ trong script màn hình sẽ mất.

var character_name: String = "Du Khách"
var element: String = "kim"
var gender: String = "male"
var access_token: String = ""


func set_character(data: Dictionary) -> void:
	character_name = String(data.get("name", character_name))
	element = String(data.get("element", element))
	gender = String(data.get("gender", gender))
