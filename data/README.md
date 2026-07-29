# data/ — Dữ liệu cấu hình game

## Chỗ này để làm gì?

Chứa **số liệu game tách khỏi code**: chỉ số item, kỹ năng, quái, bảng rơi đồ, bảng
kinh nghiệm, hệ số ngũ hành. Sửa cân bằng game = sửa file ở đây, **không phải sửa code**.

```text
data/
├── items/      # Trang bị, tiêu hao, nguyên liệu, đồ nhiệm vụ
├── skills/     # Kỹ năng 5 hệ Kim/Mộc/Thủy/Hỏa/Thổ
├── monsters/   # Chỉ số quái thường, tinh anh, boss
├── maps/       # Cấu hình bản đồ: điểm spawn, cổng dịch chuyển, vùng an toàn
└── balance/    # Bảng EXP, ngũ hành tương khắc, hệ số công thức
```

## Dùng định dạng nào?

Chọn **một** trong hai và giữ nhất quán:

* **`.tres` (Godot Resource)** — khuyến nghị cho item/skill/monster. Có kiểu dữ liệu
  rõ ràng, sửa bằng Inspector, báo lỗi ngay lúc editor, hỗ trợ tham chiếu tới scene/texture.
* **`.json`** — khuyến nghị cho bảng lớn (drop table, EXP) và cho dữ liệu **server
  cũng phải đọc**. Server không chạy Godot nên không parse được `.tres`.

Nguyên tắc thực dụng: cái gì **server cần biết để chống hack** thì để JSON dùng chung
cho cả hai bên; cái gì chỉ client hiển thị thì để `.tres`.

## Nguyên tắc bắt buộc

* **Server là nguồn sự thật.** Dữ liệu ở đây client dùng để *hiển thị và dự đoán*.
  Không bao giờ tin kết quả tính sát thương do client tự tính.
* Mỗi bản ghi có `id` dạng chuỗi ổn định (`sword_thanh_long_01`), **không dùng số thứ tự**
  — thêm/xóa giữa chừng sẽ làm lệch toàn bộ save và database.
* Đã phát hành thì **không đổi `id`, không tái sử dụng `id` cũ** cho vật phẩm khác.
* Số liệu ở đây phải khớp với công thức mô tả trong `docs/combat_formula.md`.
