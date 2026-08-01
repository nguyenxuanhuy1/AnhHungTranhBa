extends CharacterBody2D

const SPEED := 220.0
const SPRITE_BASE := "res://assets/sprites/characters/default/%s/"

@export var sprite_scale: Vector2 = Vector2(0.24, 0.24)
@onready var _sprite: AnimatedSprite2D = %AnimatedSprite2D

var _current_dir: String = "down"


func _ready() -> void:
	_sprite.scale = sprite_scale
	_load_sprite_frames(PlayerState.gender)


func _load_sprite_frames(gender: String) -> void:
	var base := SPRITE_BASE % gender
	var frames := SpriteFrames.new()
	frames.remove_animation("default")

	for dir in ["down", "up", "side"]:
		_add_strip_animation(frames, "idle_" + dir, base + "idle_" + dir + ".png", 4, 6.0)
		_add_strip_animation(frames, "run_" + dir, base + "run_" + dir + ".png", 4, 10.0)

	# Fallbacks
	_add_strip_animation(frames, "idle", base + "idle.png", 4, 6.0)
	_add_strip_animation(frames, "run", base + "run.png", 4, 10.0)

	_sprite.sprite_frames = frames
	_sprite.play("idle_down")


func _add_strip_animation(frames: SpriteFrames, anim_name: String, path: String, default_frame_count: int, fps: float) -> void:
	if not ResourceLoader.exists(path):
		return
	var texture: Texture2D = load(path)
	var frame_count := int(round(float(texture.get_width()) / 256.0))
	if frame_count <= 0:
		frame_count = default_frame_count
	var frame_width := texture.get_width() / frame_count
	frames.add_animation(anim_name)
	frames.set_animation_speed(anim_name, fps)
	frames.set_animation_loop(anim_name, true)
	for i in frame_count:
		var atlas := AtlasTexture.new()
		atlas.atlas = texture
		atlas.region = Rect2(i * frame_width, 0, frame_width, texture.get_height())
		frames.add_frame(anim_name, atlas)


func _physics_process(_delta: float) -> void:
	var input := _get_input_vector()
	velocity = input * SPEED
	move_and_slide()

	if input.length() > 0.1:
		if abs(input.x) > abs(input.y):
			_current_dir = "side"
			_sprite.flip_h = input.x < 0.0
		elif input.y > 0:
			_current_dir = "down"
			_sprite.flip_h = false
		elif input.y < 0:
			_current_dir = "up"
			_sprite.flip_h = false

		var anim := "run_" + _current_dir
		if _sprite.sprite_frames.has_animation(anim):
			if _sprite.animation != anim:
				_sprite.play(anim)
		else:
			if _sprite.animation != "run":
				_sprite.play("run")
	else:
		var anim := "idle_" + _current_dir
		if _sprite.sprite_frames.has_animation(anim):
			if _sprite.animation != anim:
				_sprite.play(anim)
		else:
			if _sprite.animation != "idle":
				_sprite.play("idle")


func _get_input_vector() -> Vector2:
	var v := Vector2.ZERO
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		v.x -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		v.x += 1.0
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP):
		v.y -= 1.0
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN):
		v.y += 1.0

	# Bỏ di chuyển xéo - chỉ cho phép di chuyển 4 hướng chính (Trái, Phải, Lên, Xuống)
	if v.x != 0.0 and v.y != 0.0:
		v.y = 0.0

	return v
