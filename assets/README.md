# assets/ — Tài nguyên thô

## Chỗ này để làm gì?

Chứa **file do artist / sound designer xuất ra**, chưa gắn logic gì cả: ảnh, âm thanh,
font, shader, tileset. Đây là nguyên liệu; scene và script ở nơi khác sẽ tham chiếu tới.

```text
assets/
├── audio/         # Nhạc nền + hiệu ứng âm thanh
├── fonts/         # Font chữ
├── shaders/       # File .gdshader
├── sprites/       # Ảnh nhân vật, quái, item, hiệu ứng, cảnh vật
├── tilesets/      # Ảnh nguồn cho TileMap isometric
└── ui/            # Ảnh giao diện: khung, nút, icon, thanh máu
```

## Không chứa gì

* `.tscn` — scene để ở `entities/` hoặc `scenes/`.
* `.gd` — script để cạnh scene hoặc trong `scripts/`.
* File nguồn nặng của phần mềm thiết kế (`.psd`, `.aseprite`, `.blend`, `.wav` gốc).
  Những file này để **ngoài project Godot** (ví dụ `F:\Game\art-source\`) rồi export
  bản nhẹ vào đây. Nếu bắt buộc để chung, đặt trong thư mục có file `.gdignore`.

## Quy ước import (rất quan trọng cho pixel art)

Vào Import tab của Godot, chọn file `.png` → đặt:

* **Filter: Nearest** (nếu để Linear, pixel art sẽ bị nhòe)
* **Mipmaps: off**
* Bấm **Preset → Set as Default for Texture2D** để áp cho toàn bộ ảnh sau này.

Godot sinh kèm file `.import` cho mỗi asset — **phải commit `.import` vào git**,
nếu không mỗi máy sẽ import ra UID khác nhau và làm hỏng tham chiếu trong scene.

## Quy ước đặt tên

```text
<đối tượng>_<hành động>_<hướng>.png
kiem_khach_attack_down_left.png
boss_hoa_long_idle.png
```

Hướng isometric dùng 8 tên cố định:
`up`, `down`, `left`, `right`, `up_left`, `up_right`, `down_left`, `down_right`.
