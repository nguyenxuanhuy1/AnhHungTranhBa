# assets/sprites/effects/ — Hiệu ứng hình ảnh (VFX)

Chứa ảnh cho hiệu ứng kỹ năng, vụ nổ, vệt chém, aura buff, hiệu ứng trạng thái.

```text
effects/
├── skills/     # Hiệu ứng chiêu thức, chia theo hệ: kim/ moc/ thuy/ hoa/ tho/
├── impact/     # Chớp trúng đòn, tóe máu, đỡ đòn
├── status/     # Vòng buff/debuff: độc, đóng băng, choáng, thiêu đốt
└── aura/       # Hào quang tinh anh, hiệu ứng cánh, vòng sáng thăng cấp
```

## Đặt tên theo hệ (theo GDD mục 2)

```text
fx_kim_thunder_strike.png     # Kim: sét, tê liệt
fx_moc_poison_cloud.png       # Mộc: độc, DoT
fx_thuy_ice_shard.png         # Thủy: băng, đóng băng
fx_hoa_explosion.png          # Hỏa: bộc phá, thiêu đốt
fx_tho_stone_wall.png         # Thổ: phòng thủ, choáng
```

## Sprite sheet hay particle?

* **Sprite sheet animation**: hợp với hiệu ứng có hình dáng cụ thể (vệt chém, tia sét,
  vụ nổ vẽ tay). Chi phí GPU thấp, kiểm soát được hình ảnh chính xác.
* **GPUParticles2D**: hợp với khói, tàn lửa, mưa, bụi. Nhưng **tốn GPU trên mobile** —
  giới hạn số hạt, và tắt bớt khi đông người.

Với game này, ưu tiên **sprite sheet** cho kỹ năng, chỉ dùng particle cho môi trường.

## Bắt buộc: Object Pooling

Theo GDD mục 3, hiệu ứng đòn đánh và chiêu thức **phải qua object pool**
(`scripts/gameplay/object_pool.gd`). Lúc đại chiến bang hội, việc `instantiate()` và
`queue_free()` hàng trăm hiệu ứng mỗi giây sẽ gây khựng hình do garbage collection.

## Bắt buộc: cho phép tắt VFX của người ngoài

GDD yêu cầu tùy chọn giảm/tắt hiệu ứng kỹ năng của người chơi ngoài bang hội.
Mỗi hiệu ứng khi tạo ra phải mang theo thông tin **ai là chủ**, để tầng hiển thị
quyết định có vẽ hay không. Thiết kế điều này từ đầu, đừng chắp vá sau.
