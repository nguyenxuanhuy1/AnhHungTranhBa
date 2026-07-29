# scenes/ — Màn hình và bản đồ

## Chỗ này để làm gì?

Chứa scene **là một nơi chốn hoặc một màn hình**, tức là thứ người chơi *đang ở trong*
chứ không phải thứ *di chuyển quanh*. Phân biệt với `entities/`: Player là entity,
còn cái map mà Player chạy trong đó là scene.

```text
scenes/
├── main/      # Điểm khởi động game, màn hình loading, bootstrap
├── maps/      # Bản đồ isometric: thành, dã ngoại, hầm ngục, chiến trường bang hội
├── ui/        # Toàn bộ giao diện: HUD, popup, màn hình chức năng
└── vfx/       # Hiệu ứng hình ảnh rời: nổ, số sát thương nhảy, aura buff
```

## Luồng scene của game

```text
main.tscn  (Autoload đã sẵn sàng)
   └─> login.tscn        → nhập tài khoản, kết nối server
        └─> character_select.tscn
             └─> loading.tscn   → tải map, chờ server xác nhận vào zone
                  └─> world.tscn
                       ├── map hiện tại (nạp động từ scenes/maps/)
                       ├── entities (player, quái, npc — server điều phối)
                       └── hud.tscn
```

Chỉ có **một** scene được `change_scene_to_file()` là `world.tscn`; bản đồ bên trong
world thì **nạp/gỡ động** bằng `add_child()` / `queue_free()` để không mất kết nối socket
và không phải dựng lại UI mỗi lần đổi map.

## Quy tắc

* Scene chỉ **lắp ráp và trình bày**; công thức, tính toán, luật chơi để ở `scripts/`.
* UI **không được** gọi thẳng vào entity (`get_node("../../Player")`). Đi qua Signal
  hoặc qua Autoload `EventBus` — nếu không, đổi cây node là UI vỡ hàng loạt.
* Scene lớn nên tách thành scene con và dùng lại, đừng dựng 1 file `.tscn` khổng lồ.
