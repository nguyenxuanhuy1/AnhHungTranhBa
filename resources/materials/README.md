# resources/materials/ — Material dùng chung

Chứa `CanvasItemMaterial` và `ShaderMaterial` (`.tres`) dùng lại ở nhiều node.

```text
materials/
├── hit_flash.tres        # Lóe trắng khi trúng đòn
├── outline_target.tres   # Viền sáng quanh mục tiêu đang chọn
├── poison_tint.tres      # Ám xanh khi trúng độc (hệ Mộc)
├── freeze_tint.tres      # Ám xanh băng (hệ Thủy)
├── burn_tint.tres        # Ám đỏ khi thiêu đốt (hệ Hỏa)
├── additive.tres         # Blend cộng — dùng cho hiệu ứng phát sáng
└── grayscale.tres        # Xám khi nhân vật chết
```

## Quan hệ với `assets/shaders/`

* `assets/shaders/*.gdshader` = **code shader**.
* `resources/materials/*.tres` = **shader đó đã gán tham số cụ thể**.

Một shader `tint.gdshader` sinh ra được `poison_tint`, `freeze_tint`, `burn_tint` —
chỉ khác giá trị màu. Đừng viết 3 shader gần giống nhau.

## Điểm mấu chốt về hiệu năng

Godot gộp draw call cho các node **dùng chung một material instance**. Đây là chỗ dễ
mắc lỗi nhất và ảnh hưởng trực tiếp tới FPS lúc đại chiến:

```gdscript
# SAI — 200 quái = 200 material = 200 draw call
sprite.material = load("res://resources/materials/hit_flash.tres").duplicate()

# ĐÚNG — 200 quái dùng chung 1 material = gộp được draw call
sprite.material = preload("res://resources/materials/hit_flash.tres")
```

Chỉ `duplicate()` khi **thật sự** cần mỗi node một giá trị riêng và biến đổi theo thời
gian độc lập. Trường hợp đó, ưu tiên `set_instance_shader_parameter()` — nó cho phép
mỗi node một tham số riêng **mà vẫn dùng chung material**, giữ được batching.

## Blend mode

`CanvasItemMaterial` với **Blend Mode = Add** dùng cho hiệu ứng phát sáng (lửa, sét,
aura). Nhưng blend cộng tốn fill rate; trong đại chiến với hàng trăm hiệu ứng chồng nhau,
đây là nguyên nhân tụt FPS phổ biến trên GPU điện thoại. Giới hạn số hiệu ứng additive
hiển thị đồng thời.
