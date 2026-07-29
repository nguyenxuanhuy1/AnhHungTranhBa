# entities/ — Thực thể trong thế giới

## Chỗ này để làm gì?

Chứa mọi thứ **sống và hành động** trong bản đồ: nhân vật người chơi, quái, NPC, đạn
kỹ năng. Mỗi entity là một scene độc lập, **chạy được riêng lẻ** (nhấn F6 mở thẳng
scene đó vẫn không lỗi).

```text
entities/
├── player/        # Nhân vật người chơi + nhân vật người chơi khác (remote)
├── monsters/      # Quái thường, tinh anh, boss thế giới
├── npcs/          # NPC nhiệm vụ, thương nhân, thợ rèn, bảo vệ thành
├── projectiles/   # Đạn, phi tiêu, cầu lửa, vùng sát thương di chuyển
└── components/    # Mảnh ghép tái dùng: máu, hitbox, buff, state machine
```

## Quy ước 1 entity = 1 thư mục

```text
entities/monsters/hoa_long_vuong/
├── hoa_long_vuong.tscn
├── hoa_long_vuong.gd
└── hoa_long_vuong_stats.tres    # nếu chỉ riêng con này dùng
```

Script gắn chặt entity nào thì nằm cạnh entity đó, **không nhét vào `scripts/`**.
`scripts/` chỉ giữ code dùng chung nhiều nơi.

## Cấu trúc node chuẩn (theo GDD)

```text
CharacterBody2D                 # Player / Monster
├── AnimatedSprite2D            # 8 hướng isometric
├── CollisionShape2D            # va chạm di chuyển (hình ellipse dẹt cho isometric)
├── HealthComponent             # từ entities/components/
├── HitboxComponent             # vùng gây sát thương
├── HurtboxComponent            # vùng nhận sát thương
└── Camera2D                    # CHỈ có ở player local, không có ở remote player
```

## Ưu tiên Composition hơn Inheritance

Đừng làm cây kế thừa sâu (`Entity → Character → Enemy → FlyingEnemy → ...`).
Hãy lắp component vào: quái nào cũng có `HealthComponent`, con nào biết bắn thì
gắn thêm `ShooterComponent`. Sửa 1 component là mọi entity hưởng ngay.

## Lưu ý hiệu năng (game đông người)

* Quái và đạn **phải qua Object Pool** (`scripts/gameplay/object_pool.gd`),
  không `instantiate()` / `queue_free()` liên tục giữa combat.
* Player khác (remote) dùng scene **rút gọn**: không Camera2D, không xử lý input,
  vị trí do server đẩy về rồi nội suy — xem `scripts/network/`.
* Y-sort: bật `y_sort_enabled` trên node cha để nhân vật đứng trước/sau đúng chiều sâu.
