# data/skills/ — Dữ liệu kỹ năng

Định nghĩa kỹ năng của 5 hệ ngũ hành, chia theo hệ:

```text
skills/
├── kim/    # Lôi/Điện: bạo kích cao, đánh nhanh, tê liệt, làm chậm tốc đánh
├── moc/    # Độc, rút máu theo thời gian (DoT), khống chế diện rộng
├── thuy/   # Băng giá, đóng băng, hồi máu/giáp, phản sát thương
├── hoa/    # Bộc phá diện rộng, thiêu đốt giảm giáp
└── tho/    # Phòng thủ kiên cố, máu dày, choáng, phản đòn
```

## Cấu trúc một kỹ năng

```gdscript
class_name SkillData extends Resource

@export var id: String              # "kim_loi_dinh_kich"
@export var name_key: String
@export var desc_key: String
@export var element: int            # Element.KIM ...
@export var max_level: int

@export var mana_cost: PackedInt32Array    # theo từng cấp kỹ năng
@export var cooldown: float                # giây
@export var cast_time: float               # thời gian đọc chiêu (0 = tức thì)
@export var range: float                   # tầm xa, đơn vị mét trong game
@export var target_type: int               # SELF / SINGLE / AOE_CIRCLE / AOE_CONE / LINE
@export var aoe_radius: float

@export var damage_ratio: PackedFloat32Array   # hệ số nhân với chỉ số công
@export var status_effects: Array[StatusEffectData]  # tê liệt, độc, đóng băng...

@export var animation_name: String     # tên animation trên AnimatedSprite2D
@export var vfx_path: String           # res://assets/sprites/effects/skills/...
@export var sfx_path: String
@export var icon_path: String
```

## Quy tắc

* **Server tính sát thương, không phải client.** Client dùng dữ liệu này để phát
  animation và *dự đoán* kết quả cho mượt; con số cuối cùng lấy từ server.
  Nếu lệch, tin server và sửa lại hiển thị.
* Hệ số theo cấp lưu bằng mảng (`damage_ratio[level]`), **không viết công thức trong code**.
  Designer cân bằng game bằng cách sửa mảng, không cần lập trình viên.
* Hiệu ứng trạng thái (tê liệt, độc, choáng) định nghĩa thành resource riêng và
  **dùng lại giữa các kỹ năng** — đừng chép công thức độc vào 8 chiêu hệ Mộc.
* Hệ số ngũ hành tương khắc **không nằm trong file kỹ năng** — nó ở `data/balance/`,
  áp dụng chung cho mọi kỹ năng.
