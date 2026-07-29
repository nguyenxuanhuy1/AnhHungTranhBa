# scripts/core/ — Nền móng

## Chỗ này để làm gì?

Chứa những thứ **cơ bản nhất, không phụ thuộc gì cả**: enum, hằng số, class dữ liệu,
hàm tiện ích thuần. Mọi thư mục khác đều được phép dùng `core/`,
nhưng `core/` **không được dùng ngược lại bất cứ thứ gì**.

```text
core/
├── enums.gd            # Element, Rarity, DamageType, TargetType, NpcService...
├── constants.gd        # Hằng số: TILE_SIZE, MAX_LEVEL, AOI_RADIUS, màu sắc
├── item_data.gd        # class ItemData extends Resource
├── skill_data.gd       # class SkillData extends Resource
├── monster_data.gd     # class MonsterData extends Resource
├── status_effect_data.gd
├── iso_utils.gd        # Đổi tọa độ isometric ↔ màn hình, tính hướng 8 phương
└── math_utils.gd       # Hàm toán dùng chung
```

## `enums.gd` — nguồn sự thật cho ngũ hành

```gdscript
class_name Enums

enum Element { NONE, KIM, MOC, THUY, HOA, THO }
enum Rarity  { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY }
enum DamageType { NORMAL, CRIT, ADVANTAGE, DISADVANTAGE, HEAL, IMMUNE }
enum TargetType { SELF, SINGLE, AOE_CIRCLE, AOE_CONE, LINE }
```

Định nghĩa **một lần** ở đây. Nếu bạn thấy `"KIM"` viết dưới dạng chuỗi rải rác trong
code, đó là bug đang chờ xảy ra — gõ sai một chữ là im lặng chạy sai.

## `iso_utils.gd` — dùng nhiều nhất trong dự án

Tỷ lệ isometric 1:2 theo GDD. Gom hết phép đổi tọa độ vào một chỗ:

```gdscript
class_name IsoUtils

const TILE_SIZE := Vector2(64, 32)

static func cart_to_iso(cart: Vector2) -> Vector2:
    return Vector2(cart.x - cart.y, (cart.x + cart.y) * 0.5)

static func iso_to_cart(iso: Vector2) -> Vector2:
    return Vector2(iso.y + iso.x * 0.5, iso.y - iso.x * 0.5)

## Trả về 0–7 tương ứng 8 hướng, bắt đầu từ "down" đi ngược chiều kim đồng hồ
static func dir_to_index(dir: Vector2) -> int:
    if dir == Vector2.ZERO:
        return 0
    var angle := fposmod(dir.angle() + TAU / 16.0, TAU)
    return int(angle / (TAU / 8.0))
```

Chép công thức này ra nhiều file là cách chắc chắn để có nhân vật đi lệch hướng ở đúng
một màn hình nào đó mà không ai tìm ra.

## Quy tắc

* Ưu tiên **`static func`** — hàm thuần, không đụng node, gọi được từ mọi nơi, **test dễ**.
* Mọi class ở đây phải có `class_name` để gọi trực tiếp không cần `preload`.
* **Không** `get_node()`, **không** truy cập cây scene, **không** dùng Autoload.
  Vi phạm điều này là `core/` mất tính độc lập và kéo theo cả dự án phải nạp lên mới test được.
* Đây là nơi **nên có test tự động nhất**. Hàm thuần rất dễ test và sai ở đây thì hỏng toàn game.
