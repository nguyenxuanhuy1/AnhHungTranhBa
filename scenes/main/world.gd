extends Node2D

## Làng Tân Thủ — bản đồ đặt chỗ (placeholder) dựng bằng code, chưa có
## tileset/hoạ sĩ vẽ tay. Mục đích: cho nhân vật vừa tạo có chỗ để đi lại
## và test luồng đăng nhập -> tạo nhân vật -> vào game.

const PLAYER_SCENE := preload("res://entities/player/player.tscn")

const LEVEL_WIDTH := 2000.0
const LEVEL_HEIGHT := 720.0
const GROUND_Y := 500.0
const SPAWN_POSITION := Vector2(150.0, 560.0)

const HOUSE_X_POSITIONS := [260.0, 720.0, 1300.0, 1760.0]
const TREE_X_POSITIONS := [110.0, 480.0, 950.0, 1580.0, 1920.0]


func _ready() -> void:
	_build_sky()
	_build_ground()
	_build_path()
	_build_well(LEVEL_WIDTH * 0.5)
	for x in HOUSE_X_POSITIONS:
		_build_house(x)
	for x in TREE_X_POSITIONS:
		_build_tree(x)
	_build_boundaries()
	_spawn_player()


func _build_sky() -> void:
	var sky := ColorRect.new()
	sky.color = Color(0.56, 0.78, 0.90)
	sky.size = Vector2(LEVEL_WIDTH, GROUND_Y)
	add_child(sky)


func _build_ground() -> void:
	var ground := ColorRect.new()
	ground.color = Color(0.42, 0.62, 0.36)
	ground.size = Vector2(LEVEL_WIDTH, LEVEL_HEIGHT - GROUND_Y)
	ground.position = Vector2(0.0, GROUND_Y)
	add_child(ground)


func _build_path() -> void:
	var path := ColorRect.new()
	path.color = Color(0.78, 0.67, 0.47)
	path.size = Vector2(LEVEL_WIDTH, 90.0)
	path.position = Vector2(0.0, LEVEL_HEIGHT - 140.0)
	add_child(path)


func _build_house(x: float) -> void:
	var base_y := GROUND_Y + 40.0

	var body := ColorRect.new()
	body.color = Color(0.85, 0.78, 0.62)
	body.size = Vector2(140.0, 90.0)
	body.position = Vector2(x - 70.0, base_y - 90.0)
	add_child(body)

	var roof := Polygon2D.new()
	roof.color = Color(0.55, 0.24, 0.20)
	roof.polygon = PackedVector2Array([
		Vector2(x, base_y - 150.0),
		Vector2(x - 85.0, base_y - 90.0),
		Vector2(x + 85.0, base_y - 90.0),
	])
	add_child(roof)

	var door := ColorRect.new()
	door.color = Color(0.35, 0.22, 0.12)
	door.size = Vector2(30.0, 45.0)
	door.position = Vector2(x - 15.0, base_y - 45.0)
	add_child(door)


func _build_tree(x: float) -> void:
	var base_y := GROUND_Y + 60.0

	var trunk := ColorRect.new()
	trunk.color = Color(0.36, 0.24, 0.14)
	trunk.size = Vector2(14.0, 40.0)
	trunk.position = Vector2(x - 7.0, base_y - 40.0)
	add_child(trunk)

	var foliage := Polygon2D.new()
	foliage.color = Color(0.24, 0.5, 0.24)
	foliage.polygon = _circle_points(Vector2(x, base_y - 60.0), 34.0, 12)
	add_child(foliage)


func _build_well(x: float) -> void:
	var base_y := LEVEL_HEIGHT - 170.0

	var rim := Polygon2D.new()
	rim.color = Color(0.5, 0.5, 0.52)
	rim.polygon = _circle_points(Vector2(x, base_y), 36.0, 14)
	add_child(rim)

	var water := Polygon2D.new()
	water.color = Color(0.25, 0.45, 0.6)
	water.polygon = _circle_points(Vector2(x, base_y), 24.0, 12)
	add_child(water)


func _circle_points(center: Vector2, radius: float, segments: int) -> PackedVector2Array:
	var points := PackedVector2Array()
	for i in segments:
		var angle := TAU * float(i) / float(segments)
		points.append(center + Vector2(cos(angle), sin(angle)) * radius)
	return points


func _build_boundaries() -> void:
	var thickness := 40.0
	_add_wall(Vector2(LEVEL_WIDTH * 0.5, -thickness * 0.5), Vector2(LEVEL_WIDTH, thickness))
	_add_wall(Vector2(LEVEL_WIDTH * 0.5, LEVEL_HEIGHT + thickness * 0.5), Vector2(LEVEL_WIDTH, thickness))
	_add_wall(Vector2(-thickness * 0.5, LEVEL_HEIGHT * 0.5), Vector2(thickness, LEVEL_HEIGHT))
	_add_wall(Vector2(LEVEL_WIDTH + thickness * 0.5, LEVEL_HEIGHT * 0.5), Vector2(thickness, LEVEL_HEIGHT))


func _add_wall(center: Vector2, size: Vector2) -> void:
	var body := StaticBody2D.new()
	body.position = center
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = size
	shape.shape = rect
	body.add_child(shape)
	add_child(body)


func _spawn_player() -> void:
	var player := PLAYER_SCENE.instantiate()
	add_child(player)
	player.global_position = SPAWN_POSITION

	var camera := player.get_node_or_null("Camera2D") as Camera2D
	if camera:
		camera.limit_left = 0
		camera.limit_top = 0
		camera.limit_right = int(LEVEL_WIDTH)
		camera.limit_bottom = int(LEVEL_HEIGHT)
		camera.make_current()
