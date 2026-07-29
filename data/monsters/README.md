# data/monsters/ — Dữ liệu quái vật

Chỉ số, hành vi và bảng rơi đồ của quái.

```text
monsters/
├── normal/   # Quái thường
├── elite/    # Tinh anh
├── boss/     # Boss hầm ngục, boss thế giới
└── drops/    # Bảng rơi đồ (drop table) dùng chung nhiều loại quái
```

## Cấu trúc một con quái

```gdscript
class_name MonsterData extends Resource

@export var id: String              # "soi_hoang_lv10"
@export var name_key: String
@export var level: int
@export var element: int            # quyết định tương sinh tương khắc khi bị đánh

@export var max_hp: int
@export var attack: int
@export var defense: int
@export var move_speed: float
@export var attack_speed: float
@export var attack_range: float

@export var ai_type: int            # PASSIVE / AGGRESSIVE / GUARD / PATROL
@export var detect_range: float     # bán kính phát hiện người chơi
@export var chase_range: float      # đuổi xa bao nhiêu thì quay về
@export var respawn_time: float

@export var exp_reward: int
@export var gold_reward: Vector2i   # khoảng min–max
@export var drop_table_id: String   # trỏ tới data/monsters/drops/

@export var scene_path: String      # res://entities/monsters/...
@export var skills: Array[String]   # id kỹ năng con quái này biết dùng
```

## Bảng rơi đồ

Tách riêng ra `drops/` để nhiều quái dùng chung một bảng:

```json
{
  "id": "drop_soi_thuong",
  "entries": [
    { "item_id": "material_da_soi", "chance": 0.35, "min": 1, "max": 3 },
    { "item_id": "sword_thanh_long_01", "chance": 0.001, "min": 1, "max": 1 }
  ]
}
```

## Quy tắc

* **Server quyết định đồ rơi.** Client chỉ nhận kết quả và hiển thị. Nếu client tự quay
  số, người chơi sẽ chỉnh xác suất thành 100%.
* Boss thế giới nên có bảng rơi riêng theo **đóng góp sát thương**, không rơi ngẫu nhiên
  cho một người — ghi rõ luật này trong `docs/`.
* Chỉ số quái nên sinh từ **công thức theo cấp** (`data/balance/monster_curve.json`) rồi
  ghi đè thủ công cho boss, thay vì gõ tay 300 con quái. Dùng script ở `tools/` để sinh.
