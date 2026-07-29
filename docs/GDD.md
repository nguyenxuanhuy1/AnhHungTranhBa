# GAME DESIGN DOCUMENT (GDD) - ANH HÙNG XƯNG BÁ MOBILE

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)

* **Tên dự án:** Anh Hùng Xưng Bá Mobile
* **Thể loại:** MMORPG 2.5D Isometric, Cày cuốc cổ điển (phong cách Khí Phách Anh Hùng / Võ Lâm / MU Online).
* **Nền tảng:** Mobile (Android & iOS).
* **Game Engine:** Godot Engine 4.7.1-stable.
* **Độ phân giải chuẩn:** 1280x720 (Aspect: Expand, Mode: canvas_items).
* **Phong cách đồ họa:** Pixel / Sprite 2.5D Isometric, góc nhìn 45 độ.

---

## 2. HỆ THỐNG NGŨ HÀNH & LỚP NHÂN VẬT (ELEMENTAL SYSTEM)

Hệ thống tương sinh tương khắc là xương sống của Gameplay
(Tương khắc: **Kim > Mộc > Thổ > Thủy > Hỏa > Kim**):

1. **Hệ Kim (Đại diện: Lôi / Điện):**
   * *Đặc điểm:* Sát thương bạo kích cao, tốc độ đánh nhanh, đòn đánh dồn dập.
   * *Hiệu ứng đặc trưng:* Tê liệt, làm chậm tốc độ đánh của đối thủ.
2. **Hệ Mộc:**
   * *Đặc điểm:* Độc tố, rút máu theo thời gian (DoT), khống chế phạm vi rộng.
3. **Hệ Thủy:**
   * *Đặc điểm:* Băng giá, đóng băng, hồi phục máu/giáp, phản sát thương.
4. **Hệ Hỏa:**
   * *Đặc điểm:* Bộc phá sát thương diện rộng, thiêu đốt giảm giáp.
5. **Hệ Thổ:**
   * *Đặc điểm:* Phòng thủ kiên cố, máu dày, choáng (Stun), phản đòn.

> Số liệu thực thi: `data/balance/elemental_table.json`
> Code áp dụng: `scripts/gameplay/elemental_system.gd`
> Bản có thẩm quyền (server): `server/src/combat/`

---

## 3. KIẾN TRÚC MẠNG & XỬ LÝ SERVER (NETWORKING & SCALABILITY)

Dự án hướng tới hàng nghìn người chơi đồng thời, đặc biệt là các sự kiện "Đại Chiến":

* **Mô hình Server:** 1 Server duy nhất phân chia thành nhiều Khu Vực (Channel/Zone)
  để giảm tải cho các bản đồ thường.
* **Xử lý Đại Chiến (Đông người / PK Bang Chiến / Boss Thế Giới):**
  * **Dynamic Tick-rate (Server):** Tự động hạ tần số gửi dữ liệu từ 15Hz xuống 5–8Hz
    khi mật độ người chơi quá đông.
  * **Area of Interest (AOI):** Server chỉ đồng bộ dữ liệu của các thực thể trong phạm vi
    màn hình (15m) của người chơi.
  * **Packet Batching:** Gom nhiều gói tin nhỏ trong 100ms thành 1 gói tin lớn để gửi về Client.
* **Tối ưu phía Client (Godot):**
  * Tùy chọn chế độ **"Ẩn người chơi khác"** / **"Chỉ hiện thanh máu và tên"**.
  * Tắt/giảm hiệu ứng kỹ năng (VFX) của người ngoài Bang hội.
  * Áp dụng **Object Pooling** cho số sát thương nhảy (Damage Numbers), hiệu ứng đòn đánh
    và đạn/chiêu thức.

> Client: `scripts/network/` — nội suy, dự đoán, hòa giải, AOI
> Giảm tải tự động: `scripts/managers/performance_manager.gd`
> Object pool: `scripts/gameplay/object_pool.gd`

---

## 4. CƠ CHẾ CHUYỂN ĐỘNG & ĐIỀU KHIỂN (CONTROLS & MOVEMENT)

* **Góc nhìn:** Isometric 2.5D (Tỷ lệ trục Y/X theo góc nhìn Isometric chuẩn 1:2).
* **Di chuyển:** 8 hướng (Up, Down, Left, Right, Up-Left, Up-Right, Down-Left, Down-Right).
* **Điều khiển trên Mobile:** Virtual Joystick (Cần gạt ảo) kết hợp nút Auto-Attack và Touch-to-Target.
* **Cấu trúc Node chính (Godot):**
  * `CharacterBody2D` (Player)
    * `Sprite2D` / `AnimatedSprite2D` (Hiển thị nhân vật)
    * `CollisionShape2D` (Xử lý va chạm)
    * `Camera2D` (Đi theo Player)

> Hàm đổi tọa độ isometric: `scripts/core/iso_utils.gd`
> Scene nhân vật: `entities/player/`
> Joystick: `scenes/ui/hud/virtual_joystick.tscn`

---

## 5. CẤU TRÚC THƯ MỤC PROJECT (GODOT DIRECTORY)

```text
res://
├── addons/          # Plugin bên thứ ba / plugin tự viết cho Editor
├── assets/          # Tài nguyên thô: sprite, tileset, audio, font, shader
│   ├── audio/       #   bgm/ sfx/
│   ├── fonts/
│   ├── shaders/
│   ├── sprites/     #   characters/ monsters/ npcs/ effects/ items/ environment/
│   ├── tilesets/
│   └── ui/
├── data/            # Dữ liệu cấu hình game, tách khỏi code
│   ├── items/
│   ├── skills/      #   kim/ moc/ thuy/ hoa/ tho/
│   ├── monsters/
│   ├── maps/
│   └── balance/     #   elemental_table.json, exp_table.json...
├── docs/            # Tài liệu: GDD, kiến trúc, công thức, quy ước
├── entities/        # Thực thể sống trong thế giới
│   ├── player/      #   player.tscn + remote_player.tscn
│   ├── monsters/
│   ├── npcs/
│   ├── projectiles/
│   └── components/  #   HealthComponent, HitboxComponent, StateMachine...
├── localization/    # File dịch đa ngôn ngữ (.csv)
├── resources/       # Godot Resource dùng chung
│   ├── themes/
│   └── materials/
├── scenes/          # Màn hình và bản đồ
│   ├── main/        #   main, login, character_select, loading, world
│   ├── maps/
│   ├── ui/          #   hud/ screens/ components/
│   └── vfx/
├── scripts/         # GDScript logic không gắn scene
│   ├── autoload/    #   Singleton toàn cục
│   ├── core/        #   enums, constants, data class, iso_utils
│   ├── gameplay/    #   damage, elemental, status, loot, object_pool
│   ├── network/     #   socket, packet, AOI, prediction
│   ├── managers/    #   audio, scene, ui, performance
│   ├── ui/          #   base_screen, formatter, virtual_list
│   └── debug/       #   overlay, console, stress test
├── server/          # Mã nguồn server (có .gdignore — Godot bỏ qua)
├── tests/           # Unit / integration test (GUT)
├── tools/           # Script @tool tiện ích cho Editor
├── icon.svg
└── project.godot
```

Mỗi thư mục có `README.md` riêng mô tả chi tiết những gì được phép đặt vào đó,
quy ước đặt tên, và các lưu ý về hiệu năng.

### Bốn ranh giới quan trọng nhất

1. **`assets/` chỉ chứa file thô** — không `.tscn`, không `.gd`.
2. **`entities/` là thứ di chuyển, `scenes/` là nơi chốn.** Player là entity;
   bản đồ Player chạy trong đó là scene.
3. **`data/` là số liệu cân bằng, `resources/` là tài nguyên kỹ thuật.**
   Designer sửa `data/`, lập trình viên sửa `resources/`.
4. **Script gắn chặt 1 scene thì để cạnh scene đó**, chỉ code dùng chung mới vào `scripts/`.

---

## 6. CHECKLIST CẤU HÌNH PROJECT

Những mục sau cần chỉnh trong Project Settings trước khi bắt đầu làm nội dung:

* [ ] `display/window/size/viewport_width = 1280`, `viewport_height = 720`
* [ ] `display/window/stretch/mode = canvas_items`, `aspect = expand`
* [ ] Renderer đổi từ **Forward Plus** sang **Mobile** (bắt buộc để build Android/iOS)
* [ ] `display/window/handheld/orientation = landscape`
* [ ] Import Default cho Texture2D: **Filter = Nearest**, **Mipmaps = off** (pixel art)
* [ ] Đặt tên 2D Physics Layers: `player`, `monster`, `npc`, `projectile`,
      `world_collision`, `hitbox`, `hurtbox`, `interaction`
* [ ] Khai báo Input Map: 8 hướng di chuyển, phím kỹ năng, auto-attack
* [ ] Khai báo Autoload theo đúng thứ tự (xem `scripts/autoload/README.md`)
* [ ] Export Preset: loại trừ `tests/*`, `tools/*`, `scripts/debug/*`, `docs/*`
