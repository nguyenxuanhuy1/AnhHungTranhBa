# assets/tilesets/ — Tileset isometric

Chứa **ảnh nguồn** để dựng TileSet cho các bản đồ isometric.

```text
tilesets/
├── thanh_thi/    # Nền gạch, đường lát, sàn nhà
├── da_ngoai/     # Cỏ, đất, cát, nước, đá
├── ham_nguc/     # Sàn hầm, tường đá, dung nham
└── chien_truong/ # Bản đồ PK bang hội
```

## Chuẩn isometric

* Tỷ lệ **1:2** theo GDD → tile chuẩn **64x32** px (hình thoi).
* Trong Godot: TileSet → **Tile Shape = Isometric**, **Tile Layout = Diamond Down**,
  **Tile Size = (64, 32)**.
* Tile cao hơn mặt đất (tường, bậc thang) vẽ trong ô lớn hơn theo chiều dọc,
  rồi chỉnh **Texture Origin** để phần đáy khớp vào ô thoi.

## Autotile / Terrain

Dùng **Terrain Sets** (Godot 4) để vẽ đường bo góc tự động giữa cỏ và đất, giữa đất và
nước. Cấu hình một lần, tiết kiệm hàng giờ vẽ tay từng góc chuyển tiếp.

## Layer khuyến nghị cho mỗi map

```text
TileMapLayer "ground"      # Mặt đất, không va chạm
TileMapLayer "decoration"  # Trang trí đè lên đất (vũng nước, vết nứt)
TileMapLayer "collision"   # Vật cản: tường, vách đá — có Physics Layer
TileMapLayer "overhead"    # Vẽ đè lên nhân vật: mái nhà, tán cây, cầu
```

Bật **Y-Sort** cho layer có vật thể cao để nhân vật đi trước/sau đúng chiều sâu.

## Lưu ý

* TileSet đã cấu hình xong lưu thành `.tres` trong `resources/` hoặc ngay cạnh map —
  thư mục này chỉ giữ **ảnh nguồn**.
* Chừa **1px viền lặp** quanh mỗi tile trong atlas nếu thấy có đường kẻ đen giữa các ô
  (texture bleeding), hoặc bật *Filter: Nearest* + tắt mipmaps để tránh hẳn.
* Đừng làm map bằng một ảnh khổng lồ thay cho tileset — không xoay, không tái dùng,
  và nuốt sạch VRAM.
