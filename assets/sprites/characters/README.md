# assets/sprites/characters/ — Sprite nhân vật người chơi

Chứa ảnh của nhân vật do người chơi điều khiển: 5 lớp theo ngũ hành, cùng trang bị,
thời trang, cánh, mount.

```text
characters/
├── default/ # Nhân vật mặc định, CHƯA chọn hệ / chưa lên đồ — dùng ở màn Tạo Nhân Vật
│   ├── male/    # idle/run/attack/jump/strafe/additional.png (strip nhiều frame, xem bảng dưới)
│   └── female/  # cùng bộ file như male/
├── kim/     # Hệ Kim  (Lôi/Điện) — đánh nhanh, bạo kích cao
├── moc/     # Hệ Mộc  — độc, DoT, khống chế diện rộng
├── thuy/    # Hệ Thủy — băng, hồi phục, phản sát thương
├── hoa/     # Hệ Hỏa  — bộc phá diện rộng, thiêu đốt
└── tho/     # Hệ Thổ  — thủ dày, choáng, phản đòn
```

`default/male/` và `default/female/` chứa sprite của nhân vật tân thủ, tách từ file gộp
`action.png` (đứng yên/nhìn nghiêng, chưa lên hệ, chưa trang bị). Mỗi file là một **strip
ngang** (các frame nối cạnh nhau, khoảng cách đều), dùng `hframes` trong Godot
(`Sprite2D`/`AnimatedSprite2D`) bằng đúng số frame ghi ở bảng dưới, `vframes = 1`:

| File | Số frame | Nội dung |
|---|---|---|
| `idle.png` | 4 | Đứng yên |
| `run.png` | 6 | Chạy |
| `attack.png` | 3 | Đánh thường |
| `jump.png` | 5 | Nhảy |
| `strafe.png` | 3 | Di chuyển ngang |
| `additional.png` | 1 | Tư thế thủ bổ sung |

Chân dung tĩnh (dùng cho khung hội thoại/preview) nằm ở `assets/ui/portraits/default_male.png`
và `default_female.png`, không phải trong thư mục này.

Lưu ý: nền phía sau nhân vật trong các file này **chưa phải nền trong suốt thật** — ảnh
gốc `action.png` là ảnh mockup đã làm phẳng (flatten), nền ca-rô chỉ là quy ước hiển thị
vùng trong suốt của công cụ vẽ, không phải alpha thật, và màu của nó trùng gần với màu
quần áo tối của nhân vật nên không thể tự động tách nền mà không làm thủng đồ. Cần tách
nền thủ công (Photoshop/GIMP/remove.bg) hoặc xin lại file nguồn có alpha thật trước khi
đưa vào game thật; hiện tại dùng tạm được cho luồng tạo nhân vật vì khung UI đã có nền
riêng che phía sau.

Khi vào game thật, nhân vật sẽ dùng sprite theo hệ đã chọn ở `kim/`, `moc/`, `thuy/`,
`hoa/`, `tho/` như mô tả bên dưới.

## Bộ animation tối thiểu cho mỗi nhân vật

| Animation | Số frame gợi ý | Ghi chú |
|---|---|---|
| `idle` | 4 | Lặp |
| `walk` | 8 | Lặp |
| `attack` | 6 | Đánh dấu frame gây sát thương |
| `skill` | 8–12 | Có thể riêng cho từng chiêu |
| `hurt` | 2 | Ngắn, không chặn thao tác |
| `die` | 8 | Không lặp |

Nhân đủ **8 hướng** cho mỗi animation.

## Đặt tên

```text
kim_kiem_khach_walk_down_left.png
hoa_phap_su_skill_up.png
```

## Trang bị hiển thị lên người (paper doll)

Nếu muốn mặc giáp là thấy đổi ngoại hình, phải tách sprite thành nhiều lớp
(thân, giáp, vũ khí, mũ) và chồng lên nhau. Quyết định điều này **ngay từ đầu** —
vẽ xong 5 nhân vật rồi mới đổi sang paper doll là phải vẽ lại toàn bộ.

Nếu chỉ đổi ngoại hình theo bộ (không trộn lẫn), vẽ nguyên con từng bộ sẽ đơn giản
và nhẹ hơn nhiều.
