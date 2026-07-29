# scenes/ui/screens/ — Màn hình chức năng

Chứa các cửa sổ **mở ra rồi đóng lại**, không hiện thường trực.

```text
screens/
├── inventory.tscn       # Túi đồ, trang bị, so sánh chỉ số
├── skill_tree.tscn      # Cây kỹ năng, nâng cấp, gán vào thanh kỹ năng
├── character_info.tscn  # Chi tiết chỉ số, kháng ngũ hành
├── shop.tscn            # Cửa hàng NPC
├── blacksmith.tscn      # Cường hóa, ép đồ, khảm đá
├── warehouse.tscn       # Kho chung tài khoản
├── quest_log.tscn       # Nhật ký nhiệm vụ
├── guild.tscn           # Bang hội: thành viên, cấp bậc, kho bang
├── party.tscn           # Tổ đội, tìm đội
├── friend_list.tscn     # Bạn bè, chặn
├── ranking.tscn         # Bảng xếp hạng
├── mail.tscn            # Hòm thư
└── settings.tscn        # Cài đặt: âm thanh, đồ họa, điều khiển, hiệu năng
```

## Quản lý bằng ngăn xếp (stack)

Nhiều màn hình chồng lên nhau (túi đồ → chi tiết vật phẩm → xác nhận bán).
Dùng một `UIManager` giữ ngăn xếp, để nút Back của Android **luôn đóng đúng lớp trên cùng**:

```gdscript
UIManager.push("inventory")
UIManager.pop()        # đóng lớp trên cùng
UIManager.pop_all()    # về thẳng gameplay
```

Nút Back trên Android bị xử lý sai là lỗi bị đánh giá 1 sao rất phổ biến — người chơi
bấm Back muốn đóng túi đồ nhưng game lại thoát ra ngoài.

## Nạp lười (lazy load)

Đừng `instantiate()` cả 13 màn hình lúc vào game. Tạo khi mở lần đầu, sau đó giữ lại
trong bộ nhớ (`hide()` thay vì `queue_free()`) vì người chơi sẽ mở lại nhiều lần.

Riêng màn hình nặng (bảng xếp hạng, kho bang) thì giải phóng hẳn khi đóng.

## Dữ liệu phải lấy từ server

Túi đồ, kho, tiền, bang hội — tất cả **do server nắm giữ**. Client mở màn hình là gửi
yêu cầu và hiển thị thứ server trả về. Không tự tin vào bản sao trong bộ nhớ, vì:

* Người chơi có thể đăng nhập trên máy khác.
* Giao dịch, quà, thư có thể thay đổi túi đồ bất cứ lúc nào.

Thao tác (bán, cường hóa, gửi kho) là **gửi yêu cầu → chờ xác nhận → cập nhật giao diện**.
Đừng cập nhật giao diện trước rồi hoàn tác nếu server từ chối — với thao tác liên quan
tới tiền và vật phẩm, người chơi thà chờ 200ms còn hơn thấy số tiền nhảy qua nhảy lại.

## Lưu ý mobile

* Màn hình dày đặc thông tin cần **cuộn được**, đừng nhồi hết vào 1280x720.
* Nút đóng đặt ở vị trí ngón cái với tới, kèm vuốt xuống để đóng.
* Danh sách dài phải tái sử dụng ô hiển thị, đừng tạo 500 node cùng lúc.
