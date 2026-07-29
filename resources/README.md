# resources/ — Godot Resource dùng chung

## Chỗ này để làm gì?

Chứa file `.tres` / `.res` **kỹ thuật, dùng lại ở nhiều nơi**: Theme giao diện,
Material, Curve, Gradient, PhysicsMaterial, InputEventAction preset.

```text
resources/
├── themes/      # Theme cho Control: font, màu, style nút, panel
└── materials/   # CanvasItemMaterial / ShaderMaterial dùng chung
```

## Phân biệt với `data/`

| | `resources/` | `data/` |
|---|---|---|
| Bản chất | Tài nguyên **kỹ thuật** của engine | **Số liệu cân bằng** game |
| Ai sửa | Lập trình viên / UI designer | Game designer |
| Ví dụ | `main_theme.tres`, `flash_white.tres` | `sword_01.tres`, `exp_table.json` |

Nếu bạn phân vân: hỏi "sửa file này để đổi *cảm giác chơi* hay đổi *hình thức hiển thị*?"
Đổi cảm giác chơi → `data/`. Đổi hiển thị → `resources/`.

## Lưu ý

* Theme dùng chung giúp đổi giao diện toàn game bằng 1 file, thay vì sửa từng nút.
  Gán Theme ở node Control gốc, các node con tự kế thừa.
* Material dùng chung được nhiều node **chia sẻ cùng 1 instance** → tiết kiệm draw call.
  Nếu cần mỗi node một giá trị khác nhau, phải `duplicate()` ra bản riêng.
* Shader dùng chung nằm ở `assets/shaders/`; `.tres` ở đây chỉ là bản cấu hình tham số
  cho shader đó.
