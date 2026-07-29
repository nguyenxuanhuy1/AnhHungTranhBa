# scenes/ui/ — Giao diện người dùng

```text
ui/
├── hud/          # Luôn hiển thị khi chơi: thanh máu, joystick, nút kỹ năng, chat
├── screens/      # Màn hình mở ra rồi đóng: túi đồ, kỹ năng, bang hội, cửa hàng
└── components/   # Mảnh UI nhỏ dùng lại nhiều nơi: ô đồ, nút, thanh bar
```

## Nguyên tắc số một: UI không được biết gameplay

UI **không bao giờ** đi tìm entity trong cây node:

```gdscript
# SAI — đổi cây node là vỡ, và không chạy được khi test riêng
var hp = get_node("/root/World/EntityContainer/Player").health

# ĐÚNG — nghe signal
func _ready() -> void:
    EventBus.player_health_changed.connect(_on_health_changed)

func _on_health_changed(current: int, max_value: int) -> void:
    health_bar.value = float(current) / max_value * 100.0
```

Nhờ vậy mở riêng `hud.tscn` bằng F6 vẫn chạy được, và đổi cấu trúc gameplay không
kéo theo sửa UI.

## Chuẩn mobile (GDD: 1280x720, stretch canvas_items, aspect expand)

* **Vùng chạm tối thiểu 48x48** ở độ phân giải chuẩn — nhỏ hơn là bấm trượt.
* Bố cục theo **Anchor**, không đặt tọa độ cứng. `aspect = expand` nghĩa là chiều rộng
  thực tế thay đổi theo máy; neo sai là UI lệch hẳn trên máy màn hình dài.
* Chừa **lề an toàn ~40px** hai bên cho máy có tai thỏ / bo góc.
* Nút hay dùng đặt trong tầm ngón cái: **hai góc dưới**.
* Test tối thiểu ở 3 tỷ lệ: `16:9`, `19.5:9`, `4:3`.

## Hiệu năng

* Node UI ẩn nên `hide()` **và** tắt xử lý; tốt hơn nữa là chỉ `instantiate()` khi
  người chơi mở lần đầu. Dựng sẵn 20 màn hình lúc vào game làm loading lâu vô ích.
* Text cập nhật liên tục (số máu, DPS) đừng đặt lại mỗi frame — chỉ đặt khi giá trị đổi.
  Mỗi lần đổi `Label.text` là một lần Godot dựng lại bố cục chữ.
* Danh sách dài (túi đồ 200 ô, bảng xếp hạng): dùng kỹ thuật **tái sử dụng ô hiển thị**,
  chỉ tạo đủ số ô nhìn thấy được thay vì tạo hết.

## Theme

Font, màu, khoảng cách, style nút cấu hình tập trung ở `resources/themes/`.
Gán Theme ở node Control gốc — node con tự kế thừa. Đừng chỉnh màu tay từng Label.
