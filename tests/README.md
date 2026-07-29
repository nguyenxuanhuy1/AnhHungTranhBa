# tests/ — Kiểm thử tự động

## Chỗ này để làm gì?

Chứa test tự động, chủ yếu cho phần **logic thuần** — nơi mà bug âm thầm nhất và
đắt nhất: công thức sát thương, bảng ngũ hành tương khắc, tính EXP, đóng/mở gói tin,
điều kiện rơi đồ.

Dùng **GUT** (Godot Unit Test) — cài từ Asset Library vào `addons/gut/`.

```text
tests/
├── unit/           # Test hàm thuần, không cần scene
│   ├── test_damage_formula.gd
│   ├── test_elemental_table.gd
│   └── test_packet_codec.gd
└── integration/    # Test có dựng scene, nhiều hệ thống phối hợp
    └── test_player_takes_damage.gd
```

## Quy ước

* File test đặt tên bắt đầu bằng `test_`, class kế thừa `GutTest`.
* Mỗi hàm test bắt đầu bằng `test_`, kiểm tra **đúng một** hành vi.
* Tên hàm mô tả kỳ vọng: `test_kim_gay_them_sat_thuong_len_moc()`.

## Nên test cái gì trước

Ưu tiên theo mức thiệt hại nếu sai:

1. **Công thức chiến đấu và ngũ hành** — sai là hỏng cân bằng toàn game, người chơi phát hiện ngay.
2. **Mã hóa/giải mã packet** — sai là desync, cực khó debug lúc chạy thật.
3. **Kinh tế: tiền, EXP, rơi đồ** — sai là lạm phát hoặc mất đồ của người chơi, không sửa ngược được.
4. UI và hiệu ứng — để sau, test tay nhanh hơn.

## Chạy test

Mở panel GUT trong Godot editor, hoặc chạy dòng lệnh:

```bash
godot --headless -s addons/gut/gut_cmdln.gd -gdir=res://tests -gexit
```

Thư mục này **không được đưa vào bản export** — loại trừ nó trong Export Preset
(Resources → Filters to exclude: `tests/*`).
