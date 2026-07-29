# entities/player/ — Nhân vật người chơi

```text
player/
├── player.tscn          # Nhân vật CỦA MÌNH — có input, có camera
├── player.gd
├── remote_player.tscn   # Nhân vật NGƯỜI KHÁC — chỉ hiển thị
├── remote_player.gd
└── states/              # State machine: idle, walk, attack, cast, hurt, dead
```

## Vì sao tách `player` và `remote_player`?

Đây là quyết định kiến trúc quan trọng nhất của thư mục này. Nhân vật của mình cần
input, camera, dự đoán chuyển động, UI riêng. Nhân vật người khác **không cần gì trong
số đó** — chỉ cần vị trí do server đẩy về rồi nội suy cho mượt.

Lúc đại chiến có 200 người trong tầm nhìn. Nếu dùng chung một scene nặng, 200 bản sao
sẽ chạy 200 lần logic input vô ích và làm sập FPS. Tách ra là tiết kiệm được phần lớn chi phí.

## Cấu trúc node `player.tscn`

```text
CharacterBody2D (player.gd)
├── AnimatedSprite2D          # 8 hướng isometric
├── CollisionShape2D          # ellipse dẹt, khớp tỷ lệ isometric 1:2
├── HealthComponent
├── HurtboxComponent (Area2D)
├── HitboxComponent  (Area2D) # bật/tắt theo frame animation
├── StateMachine
├── Camera2D                  # CHỈ có ở đây, remote_player KHÔNG có
└── NamePlate                 # tên + thanh máu + tên bang hội
```

## Di chuyển 8 hướng isometric

Vector input phải đổi sang không gian isometric trước khi áp dụng, theo tỷ lệ 1:2:

```gdscript
var input := Input.get_vector("move_left", "move_right", "move_up", "move_down")
var iso := Vector2(input.x - input.y, (input.x + input.y) * 0.5).normalized()
velocity = iso * speed
```

Chọn animation theo góc của `iso`, chia 360° thành 8 cung 45°.

## Điều khiển mobile (theo GDD)

* **Virtual joystick** — node UI ở `scenes/ui/hud/`, gửi vector qua Signal.
  Đừng để `player.gd` đi tìm node joystick trong cây UI.
* **Nút auto-attack** và **touch-to-target**: chạm vào quái để chọn mục tiêu.
* Auto-đánh là tính năng bắt buộc với thể loại cày cuốc — thiết kế từ đầu, không chắp vá.

## Network: dự đoán và hòa giải

Client di chuyển ngay khi người chơi bấm (client-side prediction) để không thấy độ trễ.
Server xác nhận sau; nếu lệch quá ngưỡng thì kéo nhân vật về vị trí server —
nhưng **nội suy mượt trong ~100ms**, đừng dịch chuyển tức thì (giật hình rất khó chịu).

Logic này ở `scripts/network/`, `player.gd` chỉ gọi vào.
