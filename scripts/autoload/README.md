# scripts/autoload/ — Singleton toàn cục

## Chỗ này để làm gì?

Chứa script được khai báo tại **Project Settings → Autoload**. Chúng tồn tại suốt phiên
chơi, truy cập ở bất kỳ đâu bằng tên, không cần tham chiếu node.

## Danh sách Autoload đề xuất (theo đúng thứ tự khai báo)

| Tên | File | Việc nó lo |
|---|---|---|
| `Config` | `config.gd` | Cài đặt người chơi: âm lượng, đồ họa, ngôn ngữ, mức giảm tải |
| `GameData` | `game_data.gd` | Nạp toàn bộ `data/` một lần lúc khởi động, tra cứu theo id |
| `EventBus` | `event_bus.gd` | Signal toàn cục — nơi các hệ thống nói chuyện với nhau |
| `Net` | `net.gd` | Kết nối server, gửi/nhận packet |
| `PlayerState` | `player_state.gd` | Trạng thái nhân vật hiện tại (bản sao từ server) |
| `SceneLoader` | `scene_loader.gd` | Chuyển scene, màn hình loading |
| `AudioManager` | `audio_manager.gd` | Phát nhạc/hiệu ứng, giới hạn số giọng |
| `UIManager` | `ui_manager.gd` | Ngăn xếp màn hình, nút Back của Android |
| `ObjectPool` | `object_pool.gd` | Pool đạn, hiệu ứng, số sát thương |

**Thứ tự quan trọng**: Autoload nạp theo đúng thứ tự trong danh sách. `GameData` phải
nạp trước `Net`, vì packet nhận về cần tra cứu dữ liệu để hiển thị.

## `EventBus` — dùng đúng liều lượng

EventBus giải quyết vấn đề thật: HUD cần biết máu người chơi thay đổi, nhưng HUD không
nên đi tìm node Player trong cây.

```gdscript
# event_bus.gd
signal player_health_changed(current: int, max_value: int)
signal player_level_up(new_level: int)
signal item_acquired(item_id: String, count: int)
signal map_changed(map_id: String)
signal network_disconnected(reason: String)
```

Nhưng đừng cho mọi thứ đi qua EventBus. Nếu hai node là **cha–con hoặc anh em gần**,
nối signal trực tiếp thì dễ đọc và dễ debug hơn nhiều. EventBus chỉ dành cho giao tiếp
giữa **hai nhánh xa nhau** trong cây.

Dấu hiệu lạm dụng: bạn không còn tìm được ai đang nghe một signal nào đó.

## Cảnh báo chung về Autoload

Autoload rất tiện nên rất dễ bị lạm dụng, và cái giá phải trả là thật:

* Code phụ thuộc vào Autoload thì **không test riêng được** — mọi test đều phải dựng cả
  hệ thống lên.
* Trạng thái toàn cục sửa được từ khắp nơi là nguồn bug khó truy nhất.
* Quá nhiều Autoload làm thời gian khởi động game dài ra.

Nguyên tắc: **9–10 Autoload là đủ cho một MMORPG**. Nếu con số vượt 15, phần lớn trong
đó nên là class thường được truyền vào chỗ cần dùng.

## Quy tắc

* Autoload **không giữ tham chiếu tới node trong scene**. Scene bị hủy là tham chiếu
  thành rác, và lỗi sẽ hiện ra ở chỗ khác hẳn.
* Không đặt logic gameplay vào Autoload. Chúng **điều phối**, không **chơi game**.
* `PlayerState` là **bản sao đọc từ server**, không phải nguồn sự thật. Đừng bao giờ
  sửa vàng hay chỉ số trong đó rồi coi là xong.
