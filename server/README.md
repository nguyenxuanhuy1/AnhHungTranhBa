# server/ — Server authoritative

## Chỗ này để làm gì?

Chứa mã nguồn **server game**, phần quyết định mọi thứ thật sự xảy ra trong game.
Client Godot chỉ hiển thị và dự đoán; server mới là nguồn sự thật.

Thư mục này có file **`.gdignore`** nên Godot **không import, không build** vào APK/IPA.

## Vì sao để chung repo?

Client và server phải khớp nhau về **giao thức packet** và **bảng số liệu**. Để chung
một repo thì mỗi commit là một cặp client-server tương thích, tránh cảnh client bản mới
nói chuyện với server bản cũ.

Nếu team backend muốn repo riêng, hãy xóa thư mục này và thay bằng git submodule —
nhưng vẫn phải khóa version giao thức.

## Cấu trúc gợi ý

```text
server/
├── src/
│   ├── net/          # TCP/UDP/WebSocket, mã hóa, giải mã packet
│   ├── world/        # Zone/Channel, AOI grid, tick loop
│   ├── combat/       # Tính sát thương, ngũ hành, buff — bản chuẩn
│   ├── persistence/  # Database: nhân vật, kho đồ, bang hội
│   └── anticheat/    # Kiểm tra tốc độ di chuyển, tần suất kỹ năng
├── proto/            # Định nghĩa packet dùng CHUNG với client
├── config/
└── README.md
```

## Yêu cầu kỹ thuật (theo GDD mục 3)

* **Kiến trúc:** 1 server, chia nhiều Zone/Channel để giảm tải map thường.
* **Dynamic tick-rate:** 15Hz bình thường, tự hạ xuống 5–8Hz khi mật độ người chơi cao.
* **Area of Interest:** chỉ đồng bộ thực thể trong bán kính ~15m quanh người chơi.
  Dùng lưới ô vuông (spatial hash), đừng duyệt toàn bộ danh sách người chơi mỗi tick.
* **Packet batching:** gom gói nhỏ trong cửa sổ 100ms thành 1 gói lớn.

## Quy tắc bất di bất dịch

* **Không tin client.** Sát thương, nhặt đồ, tiền tệ, tọa độ đều phải server tính lại.
  Client gửi *ý định* ("tôi muốn dùng skill 3 lên mục tiêu X"), không gửi *kết quả*.
* Định nghĩa packet ở `proto/` là bản chuẩn duy nhất; client sinh code từ đó, không tự chép tay.
* Mọi thay đổi packet phải tăng version giao thức và ghi vào `docs/networking.md`.
