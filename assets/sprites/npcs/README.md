# assets/sprites/npcs/ — Sprite NPC

Chứa ảnh các nhân vật không chiến đấu: thương nhân, thợ rèn, người giao nhiệm vụ,
lính gác thành, sư phụ môn phái, NPC sự kiện.

## Bộ animation tối thiểu

Chỉ cần **`idle`** (4 frame, lặp) là đủ cho hầu hết NPC — họ đứng yên một chỗ.
Thêm `talk` nếu muốn NPC sinh động lúc hội thoại.

Số hướng: thường chỉ cần **1 hướng** (`down`, quay mặt về phía người chơi).
Không đáng công vẽ 8 hướng cho người đứng im.

## Đặt tên

```text
npc_thuong_nhan_idle.png
npc_tho_ren_idle.png
npc_su_phu_kim_idle.png
```

## Ảnh chân dung hội thoại

Ảnh chân dung lớn hiện trong khung thoại **không để ở đây** — để tại
`assets/ui/portraits/` vì nó thuộc về giao diện, kích thước và cách import khác hẳn
sprite trên map.

## Liên quan

Hành vi, thoại và cửa hàng của NPC cấu hình tại `data/maps/` và `entities/npcs/`,
không nằm trong tên file ảnh.
