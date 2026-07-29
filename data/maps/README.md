# data/maps/ — Cấu hình bản đồ

Dữ liệu mô tả **nội dung** của mỗi bản đồ, tách khỏi file scene `.tscn` (chỉ chứa
hình ảnh và địa hình).

## Mỗi map một file

```json
{
  "id": "map_thanh_chinh",
  "name_key": "map_thanh_chinh_name",
  "scene_path": "res://scenes/maps/thanh_chinh/thanh_chinh.tscn",
  "type": "safe_zone",
  "bgm": "res://assets/audio/bgm/bgm_thanh_chinh.ogg",
  "pvp_enabled": false,
  "level_range": [1, 999],
  "max_players_per_channel": 200,

  "spawn_points": [
    { "id": "default", "pos": [640, 360] },
    { "id": "from_da_ngoai", "pos": [1200, 800] }
  ],

  "portals": [
    { "pos": [1250, 820], "to_map": "map_da_ngoai_01", "to_spawn": "from_thanh" }
  ],

  "monster_spawns": [
    { "monster_id": "soi_hoang_lv10", "area": [400, 200, 800, 600], "count": 12 }
  ],

  "npcs": [
    { "npc_id": "npc_thuong_nhan", "pos": [700, 400], "dialogue_id": "shop_general" }
  ]
}
```

## Vì sao tách khỏi `.tscn`?

* Đổi vị trí quái, thêm cổng dịch chuyển **không cần mở Godot** — designer sửa JSON là xong.
* **Server đọc được** cùng file này để biết map có gì mà kiểm tra. Server không mở được `.tscn`.
* Hai người sửa cùng lúc thì JSON merge được, `.tscn` thì gần như luôn xung đột.

## Loại map

| `type` | Ý nghĩa |
|---|---|
| `safe_zone` | Thành thị — cấm PK, có NPC dịch vụ |
| `field` | Dã ngoại — cày quái, PK tùy chọn |
| `dungeon` | Hầm ngục — vào theo tổ đội, instance riêng |
| `battlefield` | Chiến trường bang hội — PK tự do, tick-rate ưu tiên |

## Lưu ý về Channel

Theo GDD, một server chia nhiều Channel/Zone. `max_players_per_channel` quyết định khi
nào server tách kênh mới. Map thành thị nên đặt ngưỡng thấp hơn map dã ngoại vì
thành thị tập trung đông người nhất.
