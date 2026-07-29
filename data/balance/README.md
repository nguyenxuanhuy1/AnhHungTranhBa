# data/balance/ — Bảng cân bằng game

Chứa các bảng số ảnh hưởng tới **toàn bộ** game, không thuộc riêng vật phẩm hay quái nào.

```text
balance/
├── elemental_table.json    # Ngũ hành tương khắc — hệ số sát thương
├── exp_table.json          # EXP cần cho mỗi cấp
├── stat_growth.json        # Chỉ số tăng theo cấp của từng hệ
├── damage_formula.json     # Hằng số trong công thức sát thương
├── monster_curve.json      # Đường cong chỉ số quái theo cấp
└── economy.json            # Giá bán, phí sửa đồ, thuế giao dịch
```

## Bảng ngũ hành (cốt lõi của gameplay)

Vòng tương khắc theo GDD: **Kim > Mộc > Thổ > Thủy > Hỏa > Kim**

```json
{
  "advantage_multiplier": 1.30,
  "disadvantage_multiplier": 0.75,
  "neutral_multiplier": 1.00,
  "counters": {
    "KIM":  "MOC",
    "MOC":  "THO",
    "THO":  "THUY",
    "THUY": "HOA",
    "HOA":  "KIM"
  }
}
```

Đọc là: Kim khắc Mộc → Kim đánh Mộc nhân `1.30`, Mộc đánh Kim nhân `0.75`.

## Quy tắc

* **Đây là file nhạy cảm nhất dự án.** Sửa một con số ở đây là thay đổi trải nghiệm của
  toàn bộ người chơi. Mọi thay đổi phải ghi vào `docs/changelog.md` kèm lý do.
* **Server và client dùng chung đúng file này** — dùng JSON, đừng dùng `.tres`.
  Hai bên lệch bảng ngũ hành là số sát thương hiển thị khác số thật, người chơi mất niềm tin ngay.
* Ràng buộc quan trọng: **hệ số lợi thế không nên vượt 1.5**. Cao hơn thì PK biến thành
  "ai đúng hệ khắc thì thắng", kỹ năng người chơi mất ý nghĩa và meta sẽ chết cứng.
* Bảng ở đây phải có **test tự động** ở `tests/unit/test_elemental_table.gd`:
  kiểm tra vòng khắc khép kín, không hệ nào tự khắc chính mình, mọi hệ đều có đúng
  1 hệ khắc và 1 hệ bị khắc.
