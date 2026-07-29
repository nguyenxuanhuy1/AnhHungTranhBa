# docs/ — Tài liệu dự án

## Chỗ này để làm gì?

Chứa **toàn bộ tài liệu chữ** của dự án: thiết kế game, kiến trúc kỹ thuật, quy ước
code, bảng cân bằng dạng mô tả. Đây là nơi duy nhất để tra "tại sao lại làm như vậy".

Godot không import file `.md`, nên thư mục này không ảnh hưởng tới build.

## Nên có những file gì

| File | Nội dung |
|---|---|
| `GDD.md` | Game Design Document — tài liệu gốc, bản chuẩn |
| `architecture.md` | Sơ đồ luồng scene, danh sách Autoload, vòng đời game |
| `networking.md` | Giao thức packet, AOI, tick-rate, cơ chế reconciliation |
| `combat_formula.md` | Công thức sát thương, ngũ hành tương khắc, crit, kháng |
| `coding_style.md` | Quy ước đặt tên, cách viết signal, cấm/khuyến nghị |
| `art_spec.md` | Kích thước sprite chuẩn, số frame animation, palette màu |
| `changelog.md` | Nhật ký thay đổi theo version |

## Quy tắc

* Tài liệu thay đổi thì **sửa file, không tạo bản `_v2`** — dùng git để xem lịch sử.
* Số liệu cân bằng thực tế (giá trị chạy được) nằm ở `data/balance/`, `docs/` chỉ
  giải thích công thức và lý do. Tránh chép số ra 2 nơi rồi lệch nhau.
* Ảnh minh họa cho tài liệu đặt tại `docs/images/`.
