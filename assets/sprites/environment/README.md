# assets/sprites/environment/ — Vật thể cảnh quan

Chứa vật thể trang trí **đặt rời trên map**: cây, đá, nhà cửa, cổng thành, đèn lồng,
thùng gỗ, bia đá.

## Phân biệt với `assets/tilesets/`

| | `tilesets/` | `environment/` |
|---|---|---|
| Vẽ bằng | TileMap, lát kín mặt đất | Sprite2D đặt tay từng cái |
| Ví dụ | Nền cỏ, nền đá, đường mòn, tường lát | Cây to, nhà, tượng, thùng |
| Đặc điểm | Lặp liền mạch, cùng kích thước ô | Kích thước tùy ý, thường cao hơn tile |

Quy tắc thực dụng: cái gì **lát liền nhau thành mặt phẳng** → tileset.
Cái gì **đứng nhô lên và nhân vật đi khuất phía sau** → environment.

## Yêu cầu quan trọng: Y-sort

Vật thể ở đây phải để nhân vật đi được phía trước và phía sau đúng chiều sâu:

* Đặt trong node có `y_sort_enabled = true`.
* **Điểm neo đặt ở chân vật thể** (đáy gốc cây, chân tường), không đặt giữa ảnh.
  Sai điểm neo là nhân vật đứng sau gốc cây lại bị vẽ đè lên ngọn cây.
* Vật cản đi lại thì thêm `CollisionShape2D` khớp với **phần chân**, không khớp toàn bộ ảnh —
  người chơi phải đi được sát gốc cây, không bị chặn bởi tán lá.

## Đặt tên

```text
env_cay_thong_lon.png
env_nha_tranh_01.png
env_cong_thanh_dong.png
```

## Hiệu năng

Cảnh vật tĩnh nên gộp chung atlas và dùng chung material. Với rừng cây dày đặc, cân nhắc
dùng `MultiMeshInstance2D` hoặc gộp thành tileset lớp trên (TileMap layer) để giảm số node —
hàng nghìn `Sprite2D` rời là gánh nặng thật cho CPU khi Godot phải sắp xếp Y-sort mỗi frame.
