# scenes/vfx/ — Hiệu ứng hình ảnh rời

Chứa scene hiệu ứng **tự chạy rồi tự kết thúc**, không thuộc về entity nào cố định.

```text
vfx/
├── damage_number.tscn    # Số sát thương nhảy lên
├── hit_spark.tscn        # Chớp sáng khi trúng đòn
├── death_effect.tscn     # Hiệu ứng tan biến khi chết
├── level_up.tscn         # Vòng sáng thăng cấp
├── skill_effects/        # Hiệu ứng chiêu thức 5 hệ
├── status_aura/          # Vòng trạng thái: độc, băng, choáng, thiêu đốt
└── screen_shake.gd       # Rung màn hình
```

## Bắt buộc: Object Pooling (GDD mục 3)

`damage_number.tscn` là thứ sinh ra nhiều nhất trong toàn bộ game. Một trận đại chiến
có thể tạo **hàng nghìn** số sát thương mỗi giây. Tạo và hủy node liên tục ở tần suất đó
sẽ gây khựng hình rõ rệt trên điện thoại.

```gdscript
# Đúng
var num := ObjectPool.acquire("damage_number")
num.show_damage(1250, position, DamageType.CRIT)
# tự release sau khi animation xong

# Sai — đừng làm thế này trong code chiến đấu
var num := preload("res://scenes/vfx/damage_number.tscn").instantiate()
```

Cấp phát sẵn pool khi vào map: gợi ý 300 số sát thương, 100 hit spark.

## Số sát thương — thiết kế cho dễ đọc

Trong hỗn chiến, số bay loạn xạ là vô dụng. Quy ước màu và cỡ:

| Loại | Màu | Cỡ |
|---|---|---|
| Sát thương thường mình gây ra | Trắng | Vừa |
| Bạo kích | Vàng | To + rung |
| Khắc hệ (lợi thế ngũ hành) | Màu theo hệ + mũi tên lên | To |
| Bị khắc (bất lợi) | Xám + mũi tên xuống | Nhỏ |
| Mình bị đánh | Đỏ | To |
| Hồi máu | Xanh lá | Vừa |
| Miễn nhiễm / đỡ | Chữ, không phải số | Nhỏ |

**Gộp số**: nếu cùng một mục tiêu nhận nhiều đòn trong 200ms, cộng dồn thành một số
thay vì phun ra 8 số chồng nhau. Vừa dễ đọc vừa nhẹ máy.

**Chỉ hiện số của chính mình** theo mặc định. Số sát thương của 200 người khác là nhiễu
thuần túy — cho bật lại trong Cài đặt nếu ai đó thích.

## Tự tắt khi quá tải

Đặt ngưỡng: nếu FPS xuống dưới 30 hoặc số VFX đang chạy vượt ngưỡng, **bỏ qua** yêu cầu
tạo hiệu ứng mới thay vì xếp hàng. Hiệu ứng bị thiếu vài cái không ai để ý;
tụt xuống 10 FPS thì ai cũng thấy.
