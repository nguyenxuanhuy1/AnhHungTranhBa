# scenes/ui/components/ — Mảnh UI dùng lại

Chứa những mẩu giao diện nhỏ được lắp vào nhiều màn hình khác nhau.

```text
components/
├── item_slot.tscn         # Ô vật phẩm: icon, số lượng, viền độ hiếm
├── item_tooltip.tscn      # Bảng chi tiết vật phẩm khi chạm giữ
├── stat_bar.tscn          # Thanh máu/mana/EXP có hoạt ảnh
├── skill_button.tscn      # Nút kỹ năng kèm lớp phủ cooldown
├── name_plate.tscn        # Tên + thanh máu nổi trên đầu nhân vật
├── confirm_dialog.tscn    # Hộp thoại Xác nhận / Hủy
├── loading_spinner.tscn
├── tab_bar.tscn
└── scroll_list.tscn       # Danh sách dài có tái sử dụng ô hiển thị
```

## Tiêu chuẩn một component đạt yêu cầu

1. **Mở riêng bằng F6 vẫn chạy được**, không lỗi, không cần cha nào cụ thể.
2. Nhận dữ liệu qua **một hàm `setup()`**, không tự đi tìm dữ liệu:
   ```gdscript
   func setup(item: ItemData, count: int) -> void:
   ```
3. Báo ra ngoài bằng **Signal**, không gọi ngược lên cha:
   ```gdscript
   signal slot_pressed(index: int)
   signal slot_long_pressed(index: int)
   ```

Nếu một component cần biết nó đang nằm trong túi đồ hay trong cửa hàng, nó đã sai thiết kế.
Cho nó nhận một tham số `mode` hoặc để bên ngoài quyết định xử lý signal.

## `item_slot.tscn` — component quan trọng nhất

Nó xuất hiện ở túi đồ, cửa hàng, kho, hòm thư, giao dịch, phần thưởng nhiệm vụ, bảng ép đồ.
Một ô đồ có thể có **hàng trăm bản** trên màn hình cùng lúc, nên:

* Giữ số node bên trong ở mức tối thiểu (4–5 node, không phải 15).
* Viền độ hiếm dùng `modulate` trên một `NinePatchRect` chung, đừng dùng ảnh riêng
  cho từng cấp độ hiếm.
* Đặt lại nội dung bằng `setup()` khi cuộn danh sách, **đừng tạo/hủy ô liên tục**.

## `name_plate.tscn` — quan trọng cho hiệu năng đại chiến

Lúc đông người có thể có 200 bảng tên trên màn hình. Bắt buộc:

* Chỉ cập nhật khi giá trị thật sự thay đổi.
* Ẩn hẳn khi ngoài màn hình.
* Hỗ trợ chế độ rút gọn "chỉ thanh máu và tên" theo tùy chọn giảm tải trong GDD.
