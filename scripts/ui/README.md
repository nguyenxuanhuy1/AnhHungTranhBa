# scripts/ui/ — Code UI dùng chung

## Chỗ này để làm gì?

Chứa class UI **tái sử dụng** và code định dạng hiển thị — phần logic của UI mà không
gắn với một scene cụ thể nào.

```text
ui/
├── base_screen.gd       # Class gốc cho mọi màn hình: mở/đóng, animation, nút Back
├── base_popup.gd        # Class gốc cho popup
├── formatter.gd         # Định dạng số, thời gian, tên vật phẩm có màu
├── tooltip_builder.gd   # Dựng nội dung bảng chi tiết vật phẩm
├── virtual_list.gd      # Danh sách dài có tái sử dụng ô hiển thị
└── ui_animations.gd     # Animation mở/đóng dùng chung
```

Script gắn chặt với một scene UI cụ thể (`inventory.gd`) thì để **cạnh scene đó** trong
`scenes/ui/screens/`, không để ở đây.

## `formatter.gd` — nhỏ nhưng dùng khắp nơi

```gdscript
class_name Formatter

## 1234567 → "1.23Tr" ; 45000 → "45N"
static func number(value: int) -> String:
    if value >= 1_000_000_000: return "%.2fT" % (value / 1e9)
    if value >= 1_000_000:     return "%.2fTr" % (value / 1e6)
    if value >= 10_000:        return "%.1fN" % (value / 1e3)
    return str(value)

## 3725 giây → "1g 2p"
static func duration(seconds: int) -> String: ...

## Tên vật phẩm kèm màu theo độ hiếm (BBCode cho RichTextLabel)
static func item_name(item: ItemData) -> String:
    return "[color=#%s]%s[/color]" % [
        Constants.RARITY_COLORS[item.rarity].to_html(false), tr(item.name_key)]
```

Gom vào một chỗ để cách hiển thị số vàng ở túi đồ, cửa hàng, kho và hòm thư **giống hệt nhau**.
Mỗi màn hình tự định dạng theo cách riêng là trải nghiệm lộn xộn.

## `base_screen.gd` — làm nút Back cho đúng

```gdscript
class_name BaseScreen extends Control

signal closed()

func open() -> void:
    show()
    UIManager.push(self)
    _play_open_animation()

func close() -> void:
    await _play_close_animation()
    hide()
    closed.emit()

## Trả về true nếu màn hình này đã xử lý nút Back.
func handle_back() -> bool:
    close()
    return true
```

Nút Back của Android xử lý sai là một trong những lỗi bị đánh giá thấp nhiều nhất:
người chơi bấm Back để đóng túi đồ, game lại thoát ra ngoài. `UIManager` giữ ngăn xếp,
Back luôn đóng đúng lớp trên cùng.

## `virtual_list.gd` — bắt buộc cho danh sách dài

Túi đồ 200 ô, bảng xếp hạng 500 dòng, danh sách thành viên bang hội — **đừng tạo 500 node**.
Chỉ tạo đủ số ô nhìn thấy được (khoảng 15) rồi tái sử dụng khi cuộn, gọi lại `setup()`
với dữ liệu mới.

Chênh lệch không nhỏ: 500 node so với 15 node là khác biệt giữa mở túi đồ khựng nửa giây
và mở tức thì.

## Quy tắc

* Code ở đây **không được biết gì về gameplay**. Nó nhận dữ liệu và hiển thị.
* Không viết chữ cứng — dùng `tr()` với key ở `localization/`.
* Đổi `Label.text` chỉ khi giá trị thật sự thay đổi; mỗi lần đổi là một lần dựng lại
  bố cục chữ, và HUD có hàng chục Label.
