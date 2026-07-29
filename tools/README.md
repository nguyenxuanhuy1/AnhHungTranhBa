# tools/ — Script tiện ích cho Editor

## Chỗ này để làm gì?

Chứa script `@tool` chạy **trong Godot Editor** (hoặc chạy headless bằng dòng lệnh) để
làm những việc lặp đi lặp lại thay cho tay người. Không có script nào ở đây được
chạy trong game thật.

## Ví dụ việc nên tự động hóa

* Cắt spritesheet 8 hướng thành `SpriteFrames` cho `AnimatedSprite2D`.
* Sinh hàng loạt file `data/items/*.tres` từ một bảng CSV mà designer điền.
* Kiểm tra tính toàn vẹn: có `id` nào trùng không, skill nào trỏ tới icon không tồn tại không.
* Đặt lại import setting (Filter = Nearest) cho toàn bộ `assets/sprites/`.
* Vẽ overlay lưới isometric lên map để artist canh vị trí.

## Phân biệt với `addons/`

| | `tools/` | `addons/` |
|---|---|---|
| Hình thức | Script rời, chạy thủ công khi cần | Plugin có `plugin.cfg`, bật là chạy nền |
| Ví dụ | `generate_items_from_csv.gd` | GUT, Dialogic |

## Cách chạy

Trong editor: mở file → menu **File → Run** (`Ctrl+Shift+X`), script phải kế thừa
`EditorScript` và có hàm `_run()`.

Headless từ dòng lệnh:

```bash
godot --headless -s res://tools/ten_script.gd
```

## Lưu ý

* Script ghi đè file trong `data/` hoặc `assets/` thì phải **in ra danh sách file sẽ đổi
  trước khi ghi**, và chỉ chạy khi cây làm việc git đang sạch — chạy nhầm một lần là mất
  hàng giờ công.
* Loại trừ `tools/*` khỏi bản export game.
