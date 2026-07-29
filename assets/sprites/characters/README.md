# assets/sprites/characters/ — Sprite nhân vật người chơi

Chứa ảnh của nhân vật do người chơi điều khiển: 5 lớp theo ngũ hành, cùng trang bị,
thời trang, cánh, mount.

```text
characters/
├── kim/     # Hệ Kim  (Lôi/Điện) — đánh nhanh, bạo kích cao
├── moc/     # Hệ Mộc  — độc, DoT, khống chế diện rộng
├── thuy/    # Hệ Thủy — băng, hồi phục, phản sát thương
├── hoa/     # Hệ Hỏa  — bộc phá diện rộng, thiêu đốt
└── tho/     # Hệ Thổ  — thủ dày, choáng, phản đòn
```

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
