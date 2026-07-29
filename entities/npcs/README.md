# entities/npcs/ — NPC

Chứa các nhân vật không chiến đấu mà người chơi tương tác: thương nhân, thợ rèn,
người giao nhiệm vụ, sư phụ môn phái, lính gác, NPC sự kiện.

```text
npcs/
├── base_npc.tscn      # Scene gốc dùng chung
├── base_npc.gd
└── special/           # NPC có hành vi riêng (di chuyển, mini-game, cốt truyện)
```

## Cấu trúc node

```text
StaticBody2D / Area2D (base_npc.gd)
├── AnimatedSprite2D        # thường chỉ cần animation "idle"
├── CollisionShape2D        # chặn người chơi đi xuyên qua
├── InteractionArea (Area2D) # vùng chạm để hiện nút "Nói chuyện"
└── NamePlate               # tên + biểu tượng chức năng (túi tiền, búa, dấu chấm than)
```

## Một scene gốc, cấu hình bằng dữ liệu

Giống quái: **một** `base_npc.tscn` cho tất cả, nạp cấu hình từ `data/maps/`
(mảng `npcs`). NPC khác nhau ở sprite, thoại, và **dịch vụ** mà nó cung cấp:

```gdscript
enum NpcService { DIALOGUE, SHOP, BLACKSMITH, WAREHOUSE, TELEPORT, GUILD, QUEST }
```

## Biểu tượng trên đầu NPC

Người chơi cày cuốc quét mắt rất nhanh — biểu tượng phải đọc được tức thì:

* **Dấu chấm than vàng** — có nhiệm vụ mới nhận được
* **Dấu hỏi vàng** — nhiệm vụ đã hoàn thành, tới trả
* **Dấu hỏi xám** — nhiệm vụ đang làm, chưa xong
* **Túi tiền / búa / rương** — dịch vụ cửa hàng, rèn, kho

Trạng thái này phụ thuộc tiến độ **của từng người chơi**, nên phải cập nhật khi nhật ký
nhiệm vụ thay đổi — nghe Signal từ `QuestManager`, đừng kiểm tra lại mỗi frame.

## Lưu ý

* NPC **không cần đồng bộ qua server** — chúng đứng yên và giống nhau với mọi người.
  Client tự dựng từ `data/maps/`. Tiết kiệm được kha khá băng thông.
* Nhưng **kết quả giao dịch phải qua server**: mua đồ, gửi kho, nhận nhiệm vụ đều là
  yêu cầu gửi lên server và chờ xác nhận.
* Thoại NPC dùng key dịch ở `localization/dialogue.csv`.
