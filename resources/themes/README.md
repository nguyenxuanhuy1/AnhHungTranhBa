# resources/themes/ — Theme giao diện

Chứa file `.tres` kiểu `Theme` — nơi định nghĩa **hình thức của toàn bộ UI** ở một chỗ:
font, cỡ chữ, màu chữ, style nút, khung panel, khoảng cách.

```text
themes/
├── main_theme.tres       # Theme chính, gán ở node Control gốc
├── styles/               # StyleBoxFlat / StyleBoxTexture cho nút, panel, ô nhập
└── fonts/                # FontVariation (font + cỡ + khoảng cách) dùng lại
```

## Cách dùng cho đúng

Gán `main_theme.tres` vào **node Control gốc** của mỗi màn hình. Mọi node con
tự kế thừa. Đổi màu nút trong Theme là 200 cái nút trong game đổi theo.

```text
Control (theme = main_theme.tres)
├── Panel        ← tự lấy style panel từ theme
├── Button       ← tự lấy style button từ theme
└── Label        ← tự lấy font và màu từ theme
```

**Đừng** chỉnh `Theme Overrides` trên từng node. Mỗi override là một chỗ Theme không
với tới được, và khi cần đổi giao diện toàn game bạn sẽ phải đi tìm từng cái một.

Chỉ dùng override cho **ngoại lệ thật sự** — ví dụ một nhãn cảnh báo màu đỏ duy nhất.
Nếu một kiểu hiển thị xuất hiện từ 3 lần trở lên, hãy làm **Theme Type Variation**:

```text
Button/normal              # nút thường
Button/DangerButton        # biến thể nút nguy hiểm (bán đồ, xóa nhân vật)
```

Rồi đặt `theme_type_variation = "DangerButton"` trên node.

## Bảng màu nên khai báo tập trung

Màu độ hiếm vật phẩm, màu 5 hệ ngũ hành nên nằm trong theme hoặc trong
`scripts/core/constants.gd`, không rải rác trong scene:

```gdscript
const RARITY_COLORS := [Color.WHITE, Color("4ade80"), Color("60a5fa"),
                        Color("a78bfa"), Color("fb923c")]
const ELEMENT_COLORS := {
    "KIM": Color("fde047"), "MOC": Color("4ade80"), "THUY": Color("38bdf8"),
    "HOA": Color("f87171"), "THO": Color("d6a76a"),
}
```

## Lưu ý mobile

* Cỡ chữ tối thiểu **16px** ở độ phân giải 1280x720 — nhỏ hơn là không đọc nổi trên
  màn hình 6 inch cầm cách mắt 30cm.
* Đặt `content_margin` trong StyleBox của nút để **vùng chạm lớn hơn phần nhìn thấy**,
  đạt tối thiểu 48x48.
* Nếu định làm giao diện sáng/tối hoặc theo mùa lễ hội, làm **nhiều file theme** và
  hoán đổi lúc chạy — rẻ hơn nhiều so với sửa từng scene.
