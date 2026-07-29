class_name CharacterClient
extends Node

## Client quản lý API Nhân Vật (Tạo, lấy danh sách, chọn nhân vật)

signal character_list_loaded(characters: Array)
signal character_created(character: Dictionary)
signal character_failed(code: String, message: String)

const REQUEST_TIMEOUT_SEC := 15.0

var characters: Array = []

var _http: HTTPRequest
var _base_url := ""


func _ready() -> void:
	_base_url = ApiConfig.base_url()

	_http = HTTPRequest.new()
	_http.timeout = REQUEST_TIMEOUT_SEC
	add_child(_http)


## Lấy danh sách nhân vật của tài khoản
func fetch_characters(access_token: String) -> Array:
	if access_token.is_empty():
		character_failed.emit("no_token", "Chưa có token xác thực")
		return []

	var url := _base_url + "/auth/characters"
	var headers := [
		"Authorization: Bearer " + access_token,
		"Content-Type: application/json"
	]

	var err := _http.request(url, headers, HTTPClient.METHOD_GET)
	if err != OK:
		character_failed.emit("network_error", "Không thể gửi yêu cầu lấy nhân vật")
		return []

	var res: Array = await _http.request_completed
	var result_code: int = res[0]
	var response_code: int = res[1]
	var body: PackedByteArray = res[3]

	if result_code != HTTPRequest.RESULT_SUCCESS:
		character_failed.emit("http_error", "Lỗi kết nối máy chủ (%d)" % result_code)
		return []

	var json := JSON.new()
	if json.parse(body.get_string_from_utf8()) != OK:
		character_failed.emit("json_error", "Dữ liệu máy chủ không hợp lệ")
		return []

	var data = json.get_data()
	if response_code == 200 and data is Dictionary and data.get("ok", false):
		characters = data.get("data", [])
		character_list_loaded.emit(characters)
		return characters
	else:
		var msg = data.get("message", "Lỗi lấy danh sách nhân vật") if data is Dictionary else "Lỗi lấy danh sách nhân vật"
		character_failed.emit("api_error", msg)
		return []


## Tạo nhân vật mới
func create_character(access_token: String, name: String, element: String, gender: String = "male", hair_style: int = 1) -> Dictionary:
	if access_token.is_empty():
		character_failed.emit("no_token", "Chưa có token xác thực")
		return {}

	var url := _base_url + "/auth/characters"
	var headers := [
		"Authorization: Bearer " + access_token,
		"Content-Type: application/json"
	]
	var payload := {
		"name": name,
		"element": element,
		"gender": gender,
		"hair_style": hair_style
	}

	var err := _http.request(url, headers, HTTPClient.METHOD_POST, JSON.stringify(payload))
	if err != OK:
		character_failed.emit("network_error", "Không thể gửi yêu cầu tạo nhân vật")
		return {}

	var res: Array = await _http.request_completed
	var result_code: int = res[0]
	var response_code: int = res[1]
	var body: PackedByteArray = res[3]

	var json := JSON.new()
	if json.parse(body.get_string_from_utf8()) != OK:
		character_failed.emit("json_error", "Dữ liệu máy chủ không hợp lệ")
		return {}

	var data = json.get_data()
	if (response_code == 200 or response_code == 201) and data is Dictionary and data.get("ok", false):
		var new_char = data.get("data", {})
		character_created.emit(new_char)
		return new_char
	else:
		var msg = data.get("message", "Tạo nhân vật thất bại") if data is Dictionary else "Tạo nhân vật thất bại"
		character_failed.emit("api_error", msg)
		return {}
