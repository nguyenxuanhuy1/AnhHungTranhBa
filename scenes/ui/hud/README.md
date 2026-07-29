# scenes/ui/hud/ — Giao diện luôn hiển thị khi chơi

Chứa những thứ **hiện suốt** trong lúc chơi, không mở/đóng.

```text
hud/
├── hud.tscn              # Khung chứa toàn bộ HUD
├── player_status.tscn    # Ảnh đại diện, thanh máu/mana/EXP, cấp độ
├── virtual_joystick.tscn # Cần gạt ảo di chuyển
├── skill_bar.tscn        # Các nút kỹ năng + nút auto-attack
├── target_info.tscn      # Thông tin mục tiêu đang chọn (tên, máu, hệ)
├── minimap.tscn          # Bản đồ thu nhỏ
├── chat_box.tscn         # Khung chat: thế giới / bang hội / tổ đội / riêng
├── quick_menu.tscn       # Nút mở túi đồ, kỹ năng, bang hội, cài đặt
└── notification.tscn     # Thông báo trôi: nhận đồ, thăng cấp, nhiệm vụ xong
```

## Virtual Joystick — làm cho đúng

Đây là thứ người chơi chạm nhiều nhất trong hàng trăm giờ. Làm ẩu là hỏng cả game.

* **Floating joystick**: đế xuất hiện tại nơi ngón tay chạm xuống, không cố định một chỗ.
  Người chơi không phải nhìn xuống để tìm cần gạt.
* Vùng nhận chạm cho joystick nên là **cả nửa trái màn hình**, không chỉ hình tròn nhỏ.
* Có **dead zone** ~15% để ngón tay run không làm nhân vật lắc.
* Joystick phát Signal `direction_changed(vec: Vector2)` — **không** gọi thẳng vào player.

## Nút kỹ năng

* Hiện **cooldown bằng lớp phủ hình quạt** + số giây, đọc được trong lúc hỗn chiến.
* Làm mờ khi không đủ mana hoặc ngoài tầm.
* Cho phép **kéo thả sắp xếp lại** — người chơi cày cuốc rất coi trọng việc này.
* Nút **auto-attack** phải to và dễ bấm, đây là nút dùng nhiều nhất của thể loại này.

## Chế độ giảm tải khi đông người (GDD mục 3)

HUD phải có công tắc nhanh, đặt ở nơi bấm được **giữa lúc đại chiến**:

* Ẩn người chơi khác
* Chỉ hiện thanh máu và tên
* Tắt VFX của người ngoài bang hội

Đừng chôn chúng trong menu Cài đặt 3 lớp — lúc cần dùng là lúc đang lag, không ai
đi tìm menu.

## Lưu ý

* HUD nằm trên `CanvasLayer` để không bị camera kéo theo.
* Cho phép người chơi **tùy chỉnh độ trong suốt** và **ẩn bớt** thành phần HUD —
  màn hình điện thoại nhỏ, che hết là không thấy gì để đánh.
