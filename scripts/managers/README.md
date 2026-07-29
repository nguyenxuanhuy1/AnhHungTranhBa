# scripts/managers/ — Điều phối hệ thống

## Chỗ này để làm gì?

Chứa các class **điều phối** một hệ thống con: chúng không tự chơi game, mà sắp xếp cho
các phần khác phối hợp với nhau.

```text
managers/
├── audio_manager.gd        # Phát nhạc/SFX, giới hạn số giọng, fade
├── scene_loader.gd         # Chuyển scene, nạp nền, màn hình loading
├── ui_manager.gd           # Ngăn xếp màn hình, nút Back Android
├── input_manager.gd        # Gom input joystick/chạm/bàn phím thành ý định
├── save_manager.gd         # Lưu cài đặt cục bộ (KHÔNG lưu tiến độ game)
├── quest_manager.gd        # Theo dõi tiến độ nhiệm vụ
├── performance_manager.gd  # Tự hạ chất lượng khi FPS thấp
└── map_manager.gd          # Nạp/gỡ map, chuyển vùng
```

Nhiều file ở đây được khai báo làm Autoload — script đặt tại `scripts/autoload/` hoặc ở
đây tùy quy ước; **chọn một chỗ và giữ nhất quán**, đừng để lẫn lộn hai nơi.

## `performance_manager.gd` — cần cho GDD mục 3

Tự động giảm tải khi máy không kham nổi, theo bậc:

```text
Bậc 0 (bình thường)  → hiển thị đầy đủ
Bậc 1 (FPS < 45)     → tắt VFX của người ngoài bang hội
Bậc 2 (FPS < 35)     → chỉ hiện thanh máu và tên người chơi khác
Bậc 3 (FPS < 25)     → ẩn hẳn người chơi khác, chỉ giữ tổ đội và bang hội
```

Hai điều quan trọng:

* **Hạ bậc nhanh, nâng bậc chậm.** Nâng lại ngay khi FPS vừa hồi sẽ gây dao động
  liên tục giữa hai bậc, còn khó chịu hơn là cứ để mức thấp.
* **Báo cho người chơi biết** đang ở chế độ giảm tải, và cho phép khóa cứng một bậc
  trong Cài đặt. Người chơi tự tắt hiển thị trước khi vào đại chiến còn tốt hơn để
  game tự đoán.

## `save_manager.gd` — cảnh báo

Đây là game online. **Tiến độ nhân vật nằm trên server**, không lưu ở máy.
`save_manager` chỉ lưu:

* Cài đặt: âm lượng, ngôn ngữ, mức đồ họa, mức giảm tải
* Bố cục UI người chơi tự sắp
* Tài khoản đã đăng nhập gần nhất (token, **không lưu mật khẩu thô**)

Nếu bạn thấy mình đang lưu số vàng vào file cục bộ, dừng lại — đó là lỗ hổng, không phải
tính năng.

## `audio_manager.gd`

Lúc đại chiến, hàng trăm âm thanh muốn phát cùng lúc sẽ vừa chói tai vừa tốn CPU:

* Giới hạn **16–24 giọng** đồng thời cho SFX.
* Gộp âm trùng: cùng loại tiếng trong khung 50ms chỉ phát 1 lần.
* Ưu tiên âm của **chính người chơi** hơn của người khác.
* Fade nhạc khi đổi map, không cắt đột ngột.

## Quy tắc chung

* Manager **điều phối**, không chứa luật chơi. Công thức sát thương thuộc về `gameplay/`.
* Manager không được giữ tham chiếu tới node cụ thể trong scene — scene bị hủy là
  tham chiếu thành rác.
* Mỗi manager lo đúng một hệ thống. Nếu một file phình ra 800 dòng và làm 5 việc,
  nó cần được tách.
