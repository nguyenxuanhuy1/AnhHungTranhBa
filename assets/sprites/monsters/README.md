# assets/sprites/monsters/ — Sprite quái vật

```text
monsters/
├── normal/   # Quái thường, cày cuốc hàng ngày
├── elite/    # Tinh anh — thường là quái thường phóng to + đổi màu + thêm hào quang
└── boss/     # Boss thế giới, boss hầm ngục
```

## Bộ animation tối thiểu

`idle`, `walk`, `attack`, `hurt`, `die`. Boss thêm `skill_01`, `skill_02`, `enrage`, `spawn`.

Quái thường có thể rút gọn xuống **4 hướng** thay vì 8 (down, up, left, right) — người
chơi ít nhìn kỹ quái thường, tiết kiệm được rất nhiều công vẽ và dung lượng. Boss thì
làm đủ 8 hướng.

## Mẹo tái sử dụng

Một bộ sprite quái dùng lại được cho nhiều cấp độ bằng cách **đổi màu bằng shader**
(`modulate` hoặc palette swap) thay vì vẽ lại. Sói xám cấp 10 → sói đỏ cấp 30 →
sói đen tinh anh cấp 60. Người chơi vẫn cảm nhận được sự đa dạng, chi phí gần bằng 0.

## Đặt tên

```text
soi_hoang_idle_down.png
boss_hoa_long_vuong_skill_01_left.png
```

## Lưu ý hiệu năng

Map cày cuốc có thể có 50–100 quái cùng lúc trong tầm nhìn. Quái thường **phải dùng
chung atlas** và **chung material** để Godot gộp draw call. Mỗi loại quái một texture
riêng lẻ là công thức chắc chắn để tụt FPS.
