# assets/fonts/ — Font chữ

Chứa font dùng cho toàn bộ giao diện và chữ nổi trong game.

```text
fonts/
├── main_ui.ttf         # Font chính: menu, mô tả, chat
├── title.ttf           # Font tiêu đề, tên boss, banner sự kiện
└── damage_number.ttf   # Font số sát thương nhảy (nét dày, dễ đọc khi nhỏ)
```

## Yêu cầu bắt buộc

* **Phải hỗ trợ đầy đủ dấu tiếng Việt.** Rất nhiều font miễn phí thiếu `ệ ữ ỡ ẵ ọ` —
  kiểm tra bằng chuỗi thử: `Anh Hùng Xưng Bá — Ngũ Hành Tương Khắc: Kim Mộc Thủy Hỏa Thổ`.
* Nếu định phát hành thị trường Trung Quốc, cần font có chữ Hán (Noto Sans SC) —
  font này rất nặng, cân nhắc dùng riêng cho gói ngôn ngữ đó.
* **Kiểm tra giấy phép** trước khi dùng. Font thương mại dùng lậu trong game phát hành
  là rủi ro pháp lý thật, không phải chuyện nhỏ.

## Import

* Pixel font (bitmap): tắt **Antialiasing**, bật **Multichannel Signed Distance Field = off**,
  và chỉ dùng đúng cỡ chữ gốc (hoặc bội số nguyên) — nếu không sẽ méo.
* Font vector thường: bật **MSDF** để phóng to thu nhỏ vẫn nét, hợp với UI co giãn theo
  nhiều kích thước màn hình điện thoại.

Cấu hình font tập trung tại Theme trong `resources/themes/`, đừng gán font lẻ tẻ từng Label.
