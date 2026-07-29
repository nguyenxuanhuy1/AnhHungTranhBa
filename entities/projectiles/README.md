# entities/projectiles/ — Đạn và vùng sát thương di chuyển

Chứa mọi thứ **bay đi và gây sát thương khi chạm**: mũi tên, phi tiêu, cầu lửa, tia sét,
băng thương, vùng độc lan rộng.

```text
projectiles/
├── base_projectile.tscn   # Scene gốc: bay thẳng, va chạm, hết hạn
├── base_projectile.gd
├── homing_projectile.gd   # Đuổi theo mục tiêu
├── piercing_projectile.gd # Xuyên qua nhiều mục tiêu
└── area_projectile.gd     # Nổ ra vùng sát thương khi chạm
```

## Cấu trúc node

```text
Area2D (base_projectile.gd)
├── Sprite2D / AnimatedSprite2D
├── CollisionShape2D
└── VisibleOnScreenNotifier2D   # tự thu hồi khi bay ra ngoài màn hình
```

Dùng `Area2D` chứ không phải `RigidBody2D` — đạn game không cần vật lý thật, và
`Area2D` rẻ hơn nhiều.

## Bắt buộc: Object Pooling

Đây là thứ **quan trọng nhất** trong thư mục này. Lúc đại chiến, hàng trăm viên đạn
sinh ra và biến mất mỗi giây. `instantiate()` + `queue_free()` liên tục sẽ gây khựng hình.

```gdscript
# Đúng
var p := ObjectPool.acquire("fireball")
p.launch(from, direction, data)
# ... khi trúng hoặc hết hạn:
ObjectPool.release(p)     # KHÔNG queue_free()
```

Pool phải **cấp phát sẵn** lúc vào map (ví dụ 200 viên mỗi loại), không đợi đến lúc
đông người mới cấp phát — đó chính là lúc không được phép giật.

Xem `scripts/gameplay/object_pool.gd`.

## Ai quyết định trúng hay trượt?

**Server.** Client bắn đạn ra ngay để người chơi thấy phản hồi tức thì (dự đoán), nhưng
sát thương chỉ được tính khi server xác nhận. Nếu client tự tính, người chơi sửa code
là bắn trúng từ đầu bản đồ.

Hệ quả: đôi khi client thấy đạn trúng mà server nói trượt. Cách xử lý đúng là **vẫn phát
hiệu ứng nổ** nhưng không hiện số sát thương — người chơi hầu như không nhận ra,
còn nếu xóa đạn giữa chừng thì trông rất lỗi.

## Lưu ý isometric

Đạn bay trong không gian isometric phải đổi vector giống nhân vật (tỷ lệ 1:2), nếu không
đạn sẽ bay lệch so với hướng nhắm. Sprite đạn cũng cần nhiều hướng, hoặc xoay bằng
`rotation` nếu hình dạng cho phép.
