# assets/ui/ — Ảnh giao diện

Chứa ảnh dựng nên giao diện: khung, nút, thanh máu, icon chức năng, nền popup.

```text
ui/
├── frames/      # Khung cửa sổ, panel, viền độ hiếm vật phẩm
├── buttons/     # Nút: normal / hover / pressed / disabled
├── icons/       # Icon chức năng: túi đồ, kỹ năng, bang hội, cài đặt
├── bars/        # Thanh máu, mana, EXP (phần nền + phần đầy)
├── joystick/    # Cần gạt ảo: đế và núm
└── portraits/   # Chân dung NPC/nhân vật trong khung hội thoại
```

## Dùng 9-patch cho khung và nút

Khung cửa sổ và nút **không vẽ theo kích thước cố định**. Vẽ một ảnh nhỏ rồi dùng
`NinePatchRect` để Godot kéo giãn phần giữa, giữ nguyên bốn góc. Một ảnh `48x48` phục vụ
được mọi kích thước panel — vừa nhẹ vừa co giãn đẹp trên mọi tỷ lệ màn hình điện thoại.

## Chuẩn cho mobile (theo GDD: 1280x720, aspect Expand)

* **Vùng chạm tối thiểu 48x48 px** ở độ phân giải chuẩn. Nhỏ hơn là ngón tay bấm trượt —
  đây là lỗi trải nghiệm bị phàn nàn nhiều nhất ở game mobile.
* Thiết kế cho **màn hình tai thỏ / lỗ đục**: chừa lề an toàn ~40px hai bên khi máy có tỷ lệ dài.
* Nút quan trọng đặt trong tầm ngón cái — góc dưới phải và dưới trái, tránh mép trên.

## Bộ trạng thái cho mỗi nút

```text
btn_confirm_normal.png
btn_confirm_pressed.png
btn_confirm_disabled.png
```

Trên mobile không có chuột nên **không cần `hover`** — bỏ đi cho gọn.

## Lưu ý

* Icon UI **không dùng Filter Nearest nếu là ảnh vector độ phân giải cao** — trường hợp
  này Linear cho kết quả mượt hơn. Chỉ pixel art mới bắt buộc Nearest.
* Màu sắc, font, khoảng cách thống nhất qua Theme ở `resources/themes/`,
  không chỉnh tay từng node.
* Gộp icon UI vào atlas chung để giảm draw call — HUD vẽ lại mỗi frame nên rất đáng.
