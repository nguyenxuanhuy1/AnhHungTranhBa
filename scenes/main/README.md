# scenes/main/ — Khởi động và điều phối

## Chỗ này để làm gì?

Chứa các scene ở **tầng cao nhất** — thứ chạy đầu tiên và tồn tại xuyên suốt phiên chơi.

```text
main/
├── main.tscn        # Scene khởi động (đặt làm Main Scene trong Project Settings)
├── main.gd
├── splash.tscn      # Logo studio, kiểm tra phiên bản, tải cấu hình
├── login.tscn       # Đăng nhập, kết nối server
├── character_select.tscn
├── loading.tscn     # Màn hình chờ giữa các map
└── world.tscn       # Khung chứa thế giới game — map + entity + HUD
```

## `main.tscn` làm gì?

Là node gốc tồn tại suốt game. Nó **không chứa gameplay**, chỉ:

1. Chờ Autoload sẵn sàng (config, dữ liệu game, kết nối mạng).
2. Chứa một node `CurrentScene` để nạp/gỡ các màn hình con.
3. Giữ các lớp phủ toàn cục: thông báo lỗi, hộp thoại xác nhận, chỉ báo mất kết nối.

## `world.tscn` — điểm mấu chốt

Khi đã vào game, **không dùng `change_scene_to_file()` nữa**. `world.tscn` đứng yên,
còn map bên trong thì nạp và gỡ động:

```text
world.tscn
├── MapContainer      # add_child(map) / map.queue_free() khi đổi bản đồ
├── EntityContainer   # y_sort_enabled = true — player, quái, npc
├── ProjectileLayer
├── VfxLayer
└── HudLayer (CanvasLayer)
```

Lý do: đổi scene sẽ **hủy toàn bộ cây node**, làm mất trạng thái UI, buộc dựng lại HUD,
và dễ làm đứt kết nối socket đang chạy. Với game online, giữ nguyên khung và chỉ thay
ruột là cách duy nhất chuyển map mà không gián đoạn.

## Thứ tự khởi động khuyến nghị

```text
splash → kiểm tra bản cập nhật → nạp data/ → login → chọn nhân vật
      → loading (kết nối zone) → world
```

Mỗi bước phải xử lý được **trường hợp thất bại**: mất mạng, server bảo trì, tài khoản
bị khóa, phiên bản cũ. Đây là phần hay bị bỏ quên nhất và cũng là thứ người chơi gặp
đầu tiên — hỏng ở đây là họ không vào được game.
