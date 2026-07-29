extends Control

## Màn hình Tạo Nhân Vật (5 Hệ Ngũ Hành: Kim, Mộc, Thủy, Hỏa, Thổ)

const WORLD_SCENE := "res://scenes/main/world.tscn"

# Thông tin mô tả 5 Hệ Ngũ Hành
const ELEMENT_INFO := {
	"kim": {
		"name": "Hệ Kim (Đại diện: Lôi / Điện)",
		"weapon": "Thanh Long Kiếm",
		"desc": "Sát thương bạo kích cao, tốc độ đánh nhanh, đòn đánh dồn dập. Tê liệt và làm chậm đối thủ.",
		"color": Color(0.95, 0.85, 0.40)
	},
	"moc": {
		"name": "Hệ Mộc (Đại diện: Độc / Lọc)",
		"weapon": "Bích Ngọc Quạt",
		"desc": "Độc tố rút máu theo thời gian (DoT), khống chế diện rộng, quấy rối kẻ địch.",
		"color": Color(0.35, 0.85, 0.45)
	},
	"thuy": {
		"name": "Hệ Thủy (Đại diện: Băng / Hàn)",
		"weapon": "Băng Sương Trượng",
		"desc": "Băng giá làm chậm/đóng băng đối thủ, hồi phục máu/giáp, phản sát thương.",
		"color": Color(0.30, 0.70, 0.95)
	},
	"hoa": {
		"name": "Hệ Hỏa (Đại diện: Hỏa / Viêm)",
		"weapon": "Xích Diễm Thương",
		"desc": "Bộc phá sát thương diện rộng mạnh mẽ, thiêu đốt giảm giáp đối phương.",
		"color": Color(0.95, 0.35, 0.30)
	},
	"tho": {
		"name": "Hệ Thổ (Đại diện: Nham / Thạch)",
		"weapon": "Hoàng Long Búa",
		"desc": "Phòng thủ kiên cố, lượng máu dồi dào, có khả năng làm choáng (Stun) và phản đòn.",
		"color": Color(0.80, 0.60, 0.35)
	}
}

const GENDER_PREVIEW_PATH := "res://assets/ui/portraits/default_%s.png"

@onready var _name_input: LineEdit = %NameInput
@onready var _element_desc_label: Label = %ElementDescLabel
@onready var _element_weapon_label: Label = %ElementWeaponLabel
@onready var _element_title_label: Label = %ElementTitleLabel
@onready var _create_button: Button = %CreateButton
@onready var _status_label: Label = %StatusLabel
@onready var _character_preview: TextureRect = %CharacterPreview

# Nút 5 hệ ngũ hành
@onready var _btn_kim: Button = %BtnKim
@onready var _btn_moc: Button = %BtnMoc
@onready var _btn_thuy: Button = %BtnThuy
@onready var _btn_hoa: Button = %BtnHoa
@onready var _btn_tho: Button = %BtnTho

# Nút chọn giới tính
@onready var _btn_male: Button = %BtnMale
@onready var _btn_female: Button = %BtnFemale

var _char_client: CharacterClient
var _selected_element: String = "kim"
var _selected_gender: String = "male"
var _selected_hair: int = 1
var _access_token: String = ""


func _ready() -> void:
	_char_client = CharacterClient.new()
	_char_client.name = "CharacterClient"
	add_child(_char_client)

	_char_client.character_created.connect(_on_character_created)
	_char_client.character_failed.connect(_on_character_failed)

	_btn_kim.pressed.connect(func(): _select_element("kim"))
	_btn_moc.pressed.connect(func(): _select_element("moc"))
	_btn_thuy.pressed.connect(func(): _select_element("thuy"))
	_btn_hoa.pressed.connect(func(): _select_element("hoa"))
	_btn_tho.pressed.connect(func(): _select_element("tho"))

	_btn_male.pressed.connect(func(): _select_gender("male"))
	_btn_female.pressed.connect(func(): _select_gender("female"))

	_create_button.pressed.connect(_on_create_pressed)

	_select_element("kim")
	_select_gender("male")
	_status_label.text = ""


func set_access_token(token: String) -> void:
	_access_token = token


func _select_element(element: String) -> void:
	_selected_element = element
	var info: Dictionary = ELEMENT_INFO.get(element, {})

	_element_title_label.text = info.get("name", "")
	_element_title_label.add_theme_color_override("font_color", info.get("color", Color.WHITE))

	_element_weapon_label.text = "Vũ khí tân thủ: " + info.get("weapon", "")
	_element_desc_label.text = info.get("desc", "")


func _select_gender(gender: String) -> void:
	_selected_gender = gender

	_btn_male.disabled = gender == "male"
	_btn_female.disabled = gender == "female"

	var preview_path := GENDER_PREVIEW_PATH % gender
	if ResourceLoader.exists(preview_path):
		_character_preview.texture = load(preview_path)
	else:
		# Chưa có ảnh preview cho giới tính này — tránh crash, để trống.
		_character_preview.texture = null


func _on_create_pressed() -> void:
	var char_name := _name_input.text.strip_edges()
	if char_name.length() < 3:
		_status_label.text = "Tên nhân vật phải từ 3 ký tự trở lên!"
		return

	_status_label.text = "Đang tạo nhân vật..."
	_create_button.disabled = true

	# Gọi API Server tạo nhân vật
	_char_client.create_character(_access_token, char_name, _selected_element, _selected_gender, _selected_hair)


func _on_character_created(character: Dictionary) -> void:
	_status_label.text = "Tạo nhân vật %s thành công! Đang vào game..." % character.get("name", "")
	PlayerState.set_character(character)
	PlayerState.access_token = _access_token
	await get_tree().create_timer(1.0).timeout

	if ResourceLoader.exists(WORLD_SCENE):
		get_tree().change_scene_to_file(WORLD_SCENE)
	else:
		_status_label.text = "Nhân vật %s đã sẵn sàng!" % character.get("name", "")
		_create_button.disabled = false


func _on_character_failed(code: String, message: String) -> void:
	_status_label.text = "Lỗi: " + message
	_create_button.disabled = false
