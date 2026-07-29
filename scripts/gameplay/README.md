# scripts/gameplay/ — Luật chơi

## Chỗ này để làm gì?

Chứa **luật của game**: tính sát thương, áp dụng ngũ hành, xử lý buff/debuff, tính EXP,
quay bảng rơi đồ, object pool.

```text
gameplay/
├── damage_calculator.gd    # Công thức sát thương — trái tim của combat
├── elemental_system.gd     # Ngũ hành tương khắc
├── status_effect_system.gd # Buff/debuff: độc, đóng băng, choáng, thiêu đốt
├── stat_calculator.gd      # Cộng dồn chỉ số từ cấp + trang bị + buff
├── exp_system.gd           # EXP, thăng cấp
├── loot_system.gd          # Quay bảng rơi đồ (chỉ để dự đoán hiển thị)
├── inventory_system.gd     # Quy tắc túi đồ: xếp chồng, giới hạn ô
├── skill_system.gd         # Cooldown, tiêu mana, điều kiện dùng chiêu
└── object_pool.gd          # Pool cho đạn, VFX, số sát thương
```

## `elemental_system.gd` — cốt lõi gameplay

Vòng khắc theo GDD: **Kim > Mộc > Thổ > Thủy > Hỏa > Kim**

```gdscript
class_name ElementalSystem

## Trả về hệ số nhân sát thương dựa trên hệ của bên đánh và bên đỡ.
static func get_multiplier(attacker: Enums.Element, defender: Enums.Element) -> float:
    var table := GameData.elemental_table
    if attacker == Enums.Element.NONE or defender == Enums.Element.NONE:
        return table.neutral_multiplier
    if table.counters.get(attacker) == defender:
        return table.advantage_multiplier      # 1.30
    if table.counters.get(defender) == attacker:
        return table.disadvantage_multiplier   # 0.75
    return table.neutral_multiplier            # 1.00
```

Hệ số **đọc từ `data/balance/elemental_table.json`**, không viết cứng trong code.

## `damage_calculator.gd`

```gdscript
static func calculate(atk: StatsData, def: StatsData, skill: SkillData, level: int) -> DamageResult:
    var base := atk.attack * skill.damage_ratio[level]
    var after_def := base * (1.0 - def.get_damage_reduction())
    var elem := ElementalSystem.get_multiplier(skill.element, def.element)
    var is_crit := randf() < atk.crit_rate
    var crit := atk.crit_damage if is_crit else 1.0
    return DamageResult.new(int(after_def * elem * crit), is_crit, elem)
```

Viết dạng **`static func` thuần**: cùng đầu vào luôn ra cùng kết quả, không đụng node.
Nhờ vậy hàm này test được đầy đủ ở `tests/unit/test_damage_formula.gd` — và nó xứng đáng
được test, vì sai ở đây là hỏng cân bằng toàn game.

## Quan trọng: đây là bản của CLIENT

Code trong thư mục này chạy trên client để **dự đoán và hiển thị**. Bản có thẩm quyền
nằm ở `server/src/combat/`.

Client tính trước để số sát thương hiện ra tức thì thay vì chờ hết một vòng mạng.
Khi server trả về con số thật, **lấy theo server**. Nếu lệch thường xuyên, đó là dấu hiệu
hai bên đã lệch công thức — phải sửa ngay, đừng bỏ qua.

Đặc biệt: `loot_system.gd` ở client **chỉ để hiển thị**. Đồ rơi do server quyết định.

## `object_pool.gd`

Bắt buộc theo GDD mục 3. Cấp phát sẵn khi vào map, không cấp phát giữa lúc đại chiến:

```gdscript
ObjectPool.prewarm("damage_number", 300)
ObjectPool.prewarm("fireball", 200)
ObjectPool.prewarm("hit_spark", 150)
```

Đối tượng lấy ra bằng `acquire()`, trả về bằng `release()` — **không bao giờ `queue_free()`**
một đối tượng thuộc pool.
