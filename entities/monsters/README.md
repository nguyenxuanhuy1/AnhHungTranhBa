# entities/monsters/ — Quái vật

```text
monsters/
├── base_monster.tscn    # Scene gốc, mọi quái kế thừa
├── base_monster.gd
├── normal/              # Quái thường
├── elite/               # Tinh anh
└── boss/                # Boss hầm ngục và boss thế giới
```

## Một scene gốc, nhiều cấu hình

Đừng làm 200 scene cho 200 loại quái. Làm **một** `base_monster.tscn`, rồi nạp
`MonsterData` từ `data/monsters/` để đặt chỉ số, sprite, AI, bảng rơi đồ:

```gdscript
func setup(data: MonsterData) -> void:
    sprite.sprite_frames = load(data.sprite_frames_path)
    health.max_hp = data.max_hp
    ai.configure(data.ai_type, data.detect_range, data.chase_range)
```

Chỉ tạo scene riêng khi quái có **hành vi đặc biệt** mà dữ liệu không mô tả nổi —
boss nhiều giai đoạn, quái tách đôi khi chết, quái bay.

## AI

AI quái nên đơn giản và rẻ. State machine 5 trạng thái là đủ cho 95% trường hợp:

```text
IDLE → (thấy người chơi) → CHASE → (trong tầm) → ATTACK
                              ↓ (đi quá xa)
                           RETURN → IDLE
                                      ↓ (hết máu)
                                     DIE
```

Tránh pathfinding phức tạp cho quái thường. `NavigationAgent2D` cho từng con trong số
100 con là gánh nặng lớn — quái thường đi thẳng về phía mục tiêu là chấp nhận được.
Chỉ boss mới đáng dùng navigation đầy đủ.

## AI chạy ở đâu?

**Trên server.** Client chỉ nhận vị trí và trạng thái animation. Nếu client tự chạy AI,
mỗi người chơi sẽ thấy con quái ở một chỗ khác nhau.

Client có thể chạy AI ở chế độ **offline/luyện tập** hoặc để dự đoán mượt hình, nhưng
kết quả chiến đấu luôn theo server.

## Hiệu năng

* Quái **phải qua object pool** — map cày cuốc hồi sinh quái liên tục.
* Quái ngoài màn hình: tắt xử lý (`set_physics_process(false)`), tắt animation.
  Server đã lo AOI, client không cần vẽ và tính thứ người chơi không thấy.
* Quái thường dùng chung atlas và material để gộp draw call.
