# scripts/ — Logic dùng chung

## Chỗ này để làm gì?

Chứa GDScript **không gắn liền với một scene cụ thể nào**: singleton toàn cục, class
dữ liệu, tiện ích, tầng mạng, các manager. Script chỉ phục vụ đúng 1 scene thì để cạnh
scene đó (trong `entities/` hoặc `scenes/`), không để ở đây.

```text
scripts/
├── autoload/    # Singleton toàn cục (khai báo ở Project Settings → Autoload)
├── core/        # Nền móng: enum, hằng số, class cơ sở, hàm tiện ích
├── gameplay/    # Luật chơi: sát thương, ngũ hành, buff, loot, object pool
├── managers/    # Điều phối theo hệ thống: audio, scene, save, input
├── network/     # Kết nối server: socket, packet, AOI, nội suy, dự đoán
├── ui/          # Class UI tái dùng, ViewModel, formatter hiển thị
└── debug/       # Console, overlay FPS/ping, lệnh cheat (chỉ build dev)
```

## Thứ tự phụ thuộc (không được phép đi ngược)

```text
core  ←  gameplay  ←  managers  ←  autoload
core  ←  network   ←  managers
core  ←  ui
```

`core/` **không được** import bất cứ thứ gì từ các thư mục kia. Nếu bạn thấy mình cần
`core` gọi ngược lên `gameplay`, nghĩa là file đó đặt sai chỗ.

## Quy tắc

* Có `class_name` cho mọi class dùng lại được → gọi trực tiếp, không cần `preload`.
* Ưu tiên `static func` cho hàm tính toán thuần (không đụng node) → dễ viết test.
* Không dùng `get_node("../..")` xuyên cây. Dùng Signal đi lên, gọi hàm đi xuống,
  hoặc `EventBus` cho giao tiếp giữa hai nhánh xa nhau.
* Mọi giá trị số dùng để cân bằng game phải đọc từ `data/`, **không hardcode trong script**.
