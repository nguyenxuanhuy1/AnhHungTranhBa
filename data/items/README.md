# data/items/ — Dữ liệu vật phẩm

Định nghĩa mọi vật phẩm trong game: trang bị, tiêu hao, nguyên liệu, đồ nhiệm vụ.

```text
items/
├── equipment/   # Vũ khí, giáp, mũ, giày, nhẫn, dây chuyền
├── consumable/  # Thuốc hồi máu, bùa buff, cuộn dịch chuyển
├── material/    # Nguyên liệu cường hóa, ép đồ, đá quý
└── quest/       # Đồ nhiệm vụ (không bán, không vứt được)
```

## Cấu trúc một vật phẩm

```gdscript
# scripts/core/item_data.gd
class_name ItemData extends Resource

@export var id: String            # "sword_thanh_long_01" — trùng tên file icon
@export var name_key: String      # key dịch, KHÔNG viết tên tiếng Việt trực tiếp
@export var desc_key: String
@export var rarity: int           # 0=thường 1=tốt 2=hiếm 3=sử thi 4=truyền thuyết
@export var element: int          # Element.KIM / MOC / THUY / HOA / THO / NONE
@export var required_level: int
@export var stats: Dictionary     # {"atk": 120, "hp": 500, "crit_rate": 0.05}
@export var stack_size: int       # 1 = không xếp chồng
@export var sell_price: int
@export var tradeable: bool
```

## Quy tắc

* `id` phải **trùng tên file icon** tại `assets/sprites/items/icons/<id>.png`, để code
  suy ra đường dẫn thay vì khai báo tay.
* Tên và mô tả dùng **key dịch**, chữ thật nằm ở `localization/items.csv`.
* **Server phải có bản sao dữ liệu này** và tự kiểm tra chỉ số. Nếu chỉ client biết,
  người chơi sửa file là tự tạo được kiếm 99999 sát thương.
* Đã phát hành: **không đổi `id`**, không tái dùng `id` cũ cho vật phẩm khác.
  Kho đồ của người chơi lưu theo `id`.
* Đổi chỉ số vật phẩm đã phát hành thì cân nhắc kỹ và ghi vào `docs/changelog.md`.
