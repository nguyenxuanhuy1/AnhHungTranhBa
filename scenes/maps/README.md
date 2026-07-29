# scenes/maps/ — Bản đồ isometric

Chứa scene bản đồ: phần **địa hình và hình ảnh** của mỗi map.
Phần **nội dung** (quái, NPC, cổng, spawn) nằm ở `data/maps/`.

```text
maps/
├── thanh_chinh/         # Thành chính — khu an toàn
├── da_ngoai_01/         # Dã ngoại cấp thấp
├── ham_nguc_hoa_long/   # Hầm ngục
└── chien_truong_bang/   # Chiến trường bang hội
```

Mỗi map một thư mục: `<ten_map>.tscn` + tileset riêng nếu có.

## Cấu trúc node chuẩn

```text
Node2D (map root)
├── TileMapLayer "ground"       # nền, không va chạm
├── TileMapLayer "decoration"
├── TileMapLayer "collision"    # tường, vách — có Physics Layer
├── YSortContainer              # y_sort_enabled = true
│   └── (cây, nhà, vật thể tĩnh từ assets/sprites/environment/)
├── TileMapLayer "overhead"     # mái nhà, tán cây vẽ đè lên nhân vật
├── NavigationRegion2D          # vùng đi được (cho boss dùng pathfinding)
└── Markers                     # Marker2D đánh dấu vị trí tham chiếu
```

## Cấu hình TileMap isometric

Tile Shape = **Isometric**, Tile Layout = **Diamond Down**, Tile Size = **(64, 32)**
— tỷ lệ 1:2 theo GDD.

## Vì sao map không chứa quái và NPC?

Quái, NPC, cổng dịch chuyển được sinh ra lúc chạy từ `data/maps/<id>.json`:

* Designer đổi vị trí quái mà **không cần mở Godot**.
* **Server đọc được cùng file đó** để kiểm tra — server không mở được `.tscn`.
* Hai người sửa cùng lúc thì JSON merge được; `.tscn` gần như luôn xung đột.

Map scene chỉ chứa thứ **cố định và giống nhau với mọi người chơi**.

## Camera và giới hạn biên

Đặt `Marker2D` hoặc `ReferenceRect` đánh dấu biên map, rồi cấu hình `limit_*` của
`Camera2D` khi vào map. Nếu không, camera sẽ trôi ra ngoài mép bản đồ và lộ khoảng trống.

## Hiệu năng

* Map lớn nên chia **chunk** và chỉ nạp phần quanh người chơi. Một TileMap 500x500 ô
  nạp hết cùng lúc sẽ ăn RAM và làm màn hình loading rất lâu trên điện thoại.
* Vật thể tĩnh ngoài màn hình: `VisibleOnScreenEnabler2D` để tự tắt xử lý.
* Kiểm tra số draw call bằng Debug → Monitors ngay khi dựng xong map đầu tiên,
  đừng đợi tới lúc gần phát hành.
