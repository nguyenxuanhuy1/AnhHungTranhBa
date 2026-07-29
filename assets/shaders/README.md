# assets/shaders/ — Shader

Chứa file `.gdshader` viết bằng ngôn ngữ shader của Godot.

## Shader thường cần cho game kiểu này

| File | Công dụng |
|---|---|
| `hit_flash.gdshader` | Lóe trắng khi trúng đòn |
| `outline.gdshader` | Viền sáng quanh mục tiêu đang chọn / vật phẩm nhặt được |
| `dissolve.gdshader` | Hiệu ứng tan biến khi quái chết |
| `water_wave.gdshader` | Sóng nước trên tile isometric |
| `poison_tint.gdshader` | Ám màu xanh khi trúng độc (hệ Mộc) |
| `freeze_tint.gdshader` | Ám màu xanh băng + đóng băng animation (hệ Thủy) |
| `grayscale.gdshader` | Xám toàn màn hình khi nhân vật chết |

## Cách tổ chức

* `.gdshader` (code) để ở đây.
* `ShaderMaterial` (`.tres`, đã gán tham số cụ thể) để ở `resources/materials/`.

Tách như vậy để một shader dùng lại cho nhiều material khác nhau —
`hit_flash` dùng chung cho player, quái và boss, chỉ khác màu và thời lượng.

## Cảnh báo hiệu năng trên mobile

Shader chạy trên **từng pixel**, GPU điện thoại yếu hơn PC rất nhiều:

* Tránh vòng lặp và nhánh `if` trong `fragment()`.
* Tránh shader toàn màn hình (full-screen post-process) — rất tốn fill rate.
* Mỗi ShaderMaterial khác nhau là một lần đổi state của GPU. Trong đại chiến có
  200 nhân vật, hãy để tất cả **dùng chung một material instance** thay vì mỗi con một bản.
* Test thật trên máy tầm trung, đừng chỉ test trên máy dev.
