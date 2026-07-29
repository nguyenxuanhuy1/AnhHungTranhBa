# addons/ — Plugin Editor

## Chỗ này để làm gì?

Nơi Godot tìm **Editor Plugin**. Mỗi plugin là 1 thư mục con chứa `plugin.cfg`.
Bật/tắt tại Project Settings → Plugins.

```text
addons/
└── ten_plugin/
    ├── plugin.cfg
    └── plugin.gd
```

## Chứa gì

* Plugin bên thứ ba tải từ Asset Library (ví dụ: GUT để test, Dialogic, Phantom Camera).
* Plugin tự viết để tăng tốc làm game: import hàng loạt sprite, sinh file `data/`,
  vẽ lưới isometric trong editor...

## Không chứa gì

* Script `@tool` chạy một lần, không phải plugin → để ở `tools/`.
* Code gameplay.

## Lưu ý

* Plugin tải về **nên commit vào git** để cả team cùng version, tránh lệch.
* Nếu plugin bị tắt mà scene vẫn tham chiếu tới node của nó, scene sẽ lỗi khi mở —
  ghi lại danh sách plugin bắt buộc trong `docs/architecture.md`.
