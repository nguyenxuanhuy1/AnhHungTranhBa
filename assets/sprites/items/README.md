# assets/sprites/items/ — Icon và ảnh vật phẩm

```text
items/
├── icons/     # Icon vuông hiển thị trong túi đồ, cửa hàng, ô kỹ năng
└── drops/     # Ảnh vật phẩm nằm dưới đất trên map, chờ nhặt
```

## Kích thước chuẩn

* **Icon**: `64x64` px, nền trong suốt, vật thể canh giữa, chừa lề ~4px.
  Cùng một kích thước cho **mọi** icon — kiếm, thuốc, nguyên liệu đều `64x64`.
  Lệch kích thước là túi đồ trông lộn xộn ngay.
* **Drop**: `32x32` px, nhìn từ góc isometric giống các vật thể khác trên map.

## Đặt tên — khớp với `id` trong `data/items/`

```text
icons/sword_thanh_long_01.png
drops/sword_thanh_long_01.png
```

Tên file **phải trùng `id`** trong `data/items/`, để code nạp icon bằng đường dẫn suy ra
từ id thay vì phải khai báo tay từng cái:

```gdscript
var icon := load("res://assets/sprites/items/icons/%s.png" % item.id)
```

Nhờ vậy thêm 200 vật phẩm mới không phải sửa một dòng code nào.

## Viền theo độ hiếm

Đừng vẽ viền màu (trắng/lục/lam/tím/cam) trực tiếp vào từng icon — sẽ phải vẽ lại toàn
bộ nếu đổi bảng màu. Vẽ viền bằng **khung riêng ở `assets/ui/`** rồi chồng lên icon lúc
chạy, dựa theo trường `rarity` trong `data/items/`.

## Gộp atlas

Icon nhiều và nhỏ — gộp hết vào một vài atlas lớn (`items_atlas_01.png`) thay vì hàng
trăm file `.png` rời. Túi đồ mở ra sẽ nhanh hơn hẳn.
