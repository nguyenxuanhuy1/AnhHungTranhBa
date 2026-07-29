# Anh Hùng Xưng Bá Mobile

MMORPG 2.5D Isometric cày cuốc cổ điển, làm bằng **Godot Engine 4.7.1-stable**, target **Android & iOS**.

Tài liệu thiết kế đầy đủ: [`docs/GDD.md`](docs/GDD.md)

---

## Cấu trúc thư mục

```text
res://
├── addons/          # Plugin bên thứ ba / plugin tự viết cho Editor
├── assets/          # Tài nguyên thô: sprite, tileset, audio, font, shader
├── data/            # Dữ liệu cấu hình game (items, skills, monsters, balance)
├── docs/            # Tài liệu thiết kế, kiến trúc, quy ước
├── entities/        # Thực thể sống trong thế giới: Player, Monster, NPC, Projectile
├── localization/    # File dịch đa ngôn ngữ (.csv / .po)
├── resources/       # Godot Resource dùng chung: Theme, Material, Curve...
├── scenes/          # Màn hình & bản đồ: Main, Maps, UI, VFX
├── scripts/         # GDScript logic thuần: core, gameplay, network, managers
├── server/          # Mã nguồn server authoritative (KHÔNG được Godot import)
├── tests/           # Unit test / integration test (GUT)
├── tools/           # Script tiện ích chạy trong Editor (@tool)
├── icon.svg
└── project.godot
```

Mỗi thư mục đều có `README.md` riêng mô tả chính xác thứ được phép đặt vào đó.
**Đọc README của thư mục trước khi thêm file mới vào nó.**

---

## Nguyên tắc phân tách quan trọng

| Thư mục | Chứa gì | Không chứa gì |
|---|---|---|
| `assets/` | File thô do artist/sound designer xuất ra (`.png`, `.ogg`, `.ttf`) | `.tscn`, `.gd` |
| `entities/` | Scene **có hành vi**, tự chạy được (`.tscn` + `.gd` đi kèm) | Map, màn hình UI |
| `scenes/` | Scene **là nơi chốn hoặc màn hình** (map, HUD, popup) | Logic thuần |
| `scripts/` | GDScript **không gắn scene** (singleton, util, class dữ liệu) | Script gắn liền 1 scene cụ thể |
| `data/` | Số liệu cân bằng game, đọc lúc runtime | Code |

Quy tắc vàng: **script gắn chặt với 1 scene thì để cạnh scene đó**, script dùng
chung ở nhiều nơi thì để trong `scripts/`.

---

## Quy ước đặt tên

* Thư mục và file: `snake_case` → `fire_mage.tscn`, `damage_number.gd`
* `class_name` trong GDScript: `PascalCase` → `class_name FireMage`
* Signal: `snake_case` thì quá khứ/hiện tại → `health_changed`, `died`
* Hằng số: `SCREAMING_SNAKE_CASE`
* Biến private / hàm private: `_prefix_underscore`
* Scene và script của cùng 1 thực thể đặt **cùng tên, cùng thư mục**:
  `entities/player/player.tscn` + `entities/player/player.gd`

---

## Bắt đầu

1. Mở project bằng Godot 4.7.1-stable.
2. Scene khởi động: `scenes/main/main.tscn` (đặt trong Project Settings → Run → Main Scene).
3. Các Autoload bắt buộc khai báo tại Project Settings → Autoload, lấy từ `scripts/autoload/`.

## Cấu hình project cần chỉnh (checklist)

* [ ] `display/window/size/viewport_width = 1280`, `viewport_height = 720`
* [ ] `display/window/stretch/mode = canvas_items`, `aspect = expand`
* [ ] Renderer: **Mobile** (hiện đang là Forward Plus — cần đổi trước khi build mobile)
* [ ] `display/window/handheld/orientation = landscape`
* [ ] Import Default cho pixel art: Filter = **Nearest**, Mipmaps = off
* [ ] Physics 2D layers đặt tên rõ ràng (xem `docs/`)
