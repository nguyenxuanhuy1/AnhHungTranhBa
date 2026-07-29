# entities/components/ — Mảnh ghép tái sử dụng

## Chỗ này để làm gì?

Chứa các node nhỏ, mỗi node lo **đúng một việc**, lắp vào entity nào cũng chạy.
Đây là cách tránh cây kế thừa rối rắm: thay vì
`Entity → Character → Enemy → RangedEnemy → ...`, ta **lắp ghép** thứ mình cần.

## Component nên có

| Component | Việc nó lo |
|---|---|
| `health_component.gd` | Máu hiện tại/tối đa, nhận sát thương, chết, phát signal |
| `hitbox_component.gd` | Vùng **gây** sát thương, bật/tắt theo frame animation |
| `hurtbox_component.gd` | Vùng **nhận** sát thương |
| `stats_component.gd` | Công, thủ, tốc đánh, bạo kích, kháng ngũ hành |
| `status_effect_component.gd` | Buff/debuff: độc, đóng băng, choáng, thiêu đốt |
| `state_machine.gd` | Quản lý trạng thái: idle/walk/attack/hurt/dead |
| `movement_component.gd` | Di chuyển 8 hướng isometric |
| `network_sync_component.gd` | Nội suy vị trí từ server, dự đoán, hòa giải |
| `loot_component.gd` | Rơi đồ khi chết |

## Nguyên tắc thiết kế

**Component không được biết cha nó là ai.** `HealthComponent` không được viết
`get_parent().play_death_animation()`. Nó chỉ phát signal:

```gdscript
signal health_changed(current: int, max: int)
signal died()
```

Entity nghe signal và tự quyết định làm gì. Nhờ vậy cùng một `HealthComponent` dùng được
cho player, quái, boss, và cả thùng gỗ đập vỡ được — không sửa một dòng.

Nếu bạn thấy mình phải viết `if get_parent() is Player` trong component,
component đó đang làm sai việc.

## Ví dụ hoàn chỉnh

```gdscript
class_name HealthComponent extends Node

signal health_changed(current: int, max_value: int)
signal died()

@export var max_health: int = 100
var current_health: int

func _ready() -> void:
    current_health = max_health

func take_damage(amount: int) -> void:
    if current_health <= 0:
        return                       # đã chết rồi, bỏ qua
    current_health = maxi(0, current_health - amount)
    health_changed.emit(current_health, max_health)
    if current_health == 0:
        died.emit()
```

## Vì sao component đặt ở `entities/` chứ không ở `scripts/`?

Vì chúng là **node gắn vào scene**, không phải logic thuần. Chúng sống trong cây scene,
có `_ready()`, có signal. Còn `scripts/` giữ code không cần cây scene: công thức, hằng số,
tầng mạng, singleton.
