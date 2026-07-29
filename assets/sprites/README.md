# assets/sprites/ — Ảnh nhân vật, quái, vật thể

```text
sprites/
├── characters/    # Nhân vật người chơi: 5 hệ, trang bị, thời trang, mount
├── monsters/      # Quái thường, tinh anh, boss
├── npcs/          # NPC thị trấn, thương nhân, người giao nhiệm vụ
├── effects/       # Hiệu ứng kỹ năng, vụ nổ, aura, vệt chém
├── items/         # Icon vật phẩm trong túi đồ và ảnh rơi dưới đất
└── environment/   # Cây, đá, nhà cửa, vật trang trí đặt rời trên map
```

## Chuẩn kỹ thuật cho isometric 2.5D

* Tỷ lệ trục isometric **1:2** (theo GDD) — một ô tile `64x32` px.
* Nhân vật vẽ theo **8 hướng**: `down`, `down_left`, `left`, `up_left`, `up`,
  `up_right`, `right`, `down_right`.
  Mẹo tiết kiệm một nửa công vẽ: chỉ vẽ 5 hướng rồi **lật ngang** để có 3 hướng còn lại
  (`left` lật thành `right`, v.v.). Chỉ làm được nếu thiết kế nhân vật đối xứng —
  đeo kiếm một bên hông thì lật sẽ sai.
* **Điểm neo (pivot)** đặt ở **giữa hai bàn chân**, không phải giữa ảnh. Sai điểm neo là
  nhân vật sẽ lơ lửng hoặc lún xuống đất khi Y-sort.
* Kích thước ô sprite thống nhất trong cả một bộ animation, đừng crop sát từng frame.

## Spritesheet hay từng file rời?

Dùng **spritesheet** (một ảnh chứa nhiều frame), rồi cắt bằng `AtlasTexture` hoặc
`SpriteFrames`. Lý do: mỗi texture riêng là một draw call; lúc đại chiến có hàng trăm
nhân vật thì gộp texture giúp Godot vẽ theo lô (batching) và tăng FPS rõ rệt.

Sắp xếp spritesheet: **mỗi hàng là một hướng, mỗi cột là một frame**.

## Import setting bắt buộc

**Filter: Nearest**, **Mipmaps: off**. Nếu để Linear, pixel art sẽ bị nhòe nhoẹt.
Đặt một lần làm mặc định: Import → Preset → *Set as Default for Texture2D*.

## Ngân sách kích thước (mobile)

Điện thoại tầm trung có VRAM hạn chế. Giữ mỗi atlas **không quá 2048x2048**, và tổng
texture nạp cùng lúc ở một map nên dưới ~150MB. Vượt ngưỡng là máy yếu bị crash,
không phải chỉ giật.
