# localization/ — Đa ngôn ngữ

## Chỗ này để làm gì?

Chứa file dịch để game hiển thị được nhiều ngôn ngữ. Ngôn ngữ gốc của dự án là **Tiếng Việt**.

```text
localization/
├── ui.csv         # Chữ trên giao diện: nút, tiêu đề, thông báo lỗi
├── items.csv      # Tên và mô tả vật phẩm
├── skills.csv     # Tên và mô tả kỹ năng
├── dialogue.csv   # Thoại NPC, nội dung nhiệm vụ
└── system.csv     # Thông báo hệ thống, log chat
```

## Định dạng CSV

```csv
keys,vi,en,zh
ui_login_button,"Đăng nhập","Log in","登录"
skill_kim_thunder_name,"Lôi Đình Kích","Thunder Strike","雷霆击"
```

Godot tự import `.csv` thành `.translation`. Khai báo tại
Project Settings → Localization → Translations.

## Cách dùng trong code

```gdscript
label.text = tr("ui_login_button")
# Có tham số:
label.text = tr("ui_damage_dealt").format({"amount": 1250})
```

## Quy tắc

* **Không viết chữ cứng trong scene hoặc script.** Luôn dùng key rồi `tr()`.
* Key theo dạng `<nhóm>_<ngữ cảnh>_<tên>`: `ui_shop_buy_confirm`, `item_sword_01_desc`.
* Key đã phát hành thì **không đổi tên** — bản dịch sẽ đứt hết.
* Chừa chỗ cho chữ dài: tiếng Anh và tiếng Trung dài/ngắn khác tiếng Việt rất nhiều,
  UI cần co giãn được chứ đừng cố định chiều rộng.
* Font phải có đủ ký tự: dấu tiếng Việt + chữ Hán nếu hỗ trợ tiếng Trung — xem `assets/fonts/`.
