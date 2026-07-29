# scripts/network/ — Tầng mạng

## Chỗ này để làm gì?

Chứa toàn bộ code nói chuyện với server: kết nối, đóng/mở gói tin, đồng bộ thực thể,
dự đoán chuyển động, xử lý mất kết nối.

```text
network/
├── net_client.gd          # Kết nối, gửi/nhận, tự kết nối lại
├── packet_codec.gd        # Đóng/mở gói tin — phải khớp 100% với server/proto/
├── packet_types.gd        # Enum mã lệnh, sinh từ server/proto/
├── entity_sync.gd         # Nội suy vị trí thực thể từ server
├── client_prediction.gd   # Dự đoán chuyển động của chính mình
├── reconciliation.gd      # Hòa giải khi client lệch server
├── aoi_handler.gd         # Xử lý thực thể vào/ra tầm nhìn
├── packet_batcher.gd      # Gom gói tin gửi lên
└── latency_monitor.gd     # Đo ping, phát hiện mất gói
```

## Nguyên tắc nền tảng

**Server là nguồn sự thật. Client là cái màn hình biết đoán trước.**

Client gửi **ý định**, không gửi **kết quả**:

```gdscript
# ĐÚNG
Net.send(PacketType.USE_SKILL, {"skill_id": "kim_loi_dinh", "target_id": 4821})

# SAI — người chơi sửa code là gây sát thương tùy ý
Net.send(PacketType.DEAL_DAMAGE, {"target_id": 4821, "damage": 999999})
```

## Nội suy — vì sao bắt buộc

Server gửi vị trí ở 15Hz (và hạ xuống 5–8Hz khi đông người, theo GDD). Màn hình chạy
60Hz. Nếu đặt thẳng vị trí nhận được, nhân vật khác sẽ **nhảy giật** rất khó chịu.

Cách xử lý: giữ một **bộ đệm trễ ~100ms**, và vẽ nhân vật ở vị trí nội suy giữa hai
mốc server đã gửi. Đổi lại là thấy người khác trễ 100ms — hoàn toàn chấp nhận được, và
tốt hơn nhiều so với giật hình.

Tick-rate càng thấp thì bộ đệm càng phải dài. Khi server hạ xuống 5Hz (200ms/gói),
bộ đệm cần khoảng 250–300ms. `entity_sync.gd` phải **tự điều chỉnh** theo tick-rate thực tế,
đừng viết cứng 100ms.

## Dự đoán và hòa giải cho nhân vật của mình

Nếu chờ server xác nhận mới di chuyển, người chơi sẽ cảm nhận độ trễ ở **mọi bước chân** —
không chơi được.

1. Bấm di chuyển → client **di chuyển ngay**, ghi lại input kèm số thứ tự.
2. Gửi input lên server.
3. Server trả về vị trí đã xác nhận + số thứ tự input cuối cùng nó xử lý.
4. Client bỏ các input cũ hơn, **chạy lại** các input chưa được xác nhận từ vị trí server.
5. Nếu lệch nhỏ: kéo về dần trong ~100ms. Lệch lớn: đặt thẳng (có thể do teleport hoặc hack).

Đừng bao giờ dịch chuyển tức thì vì lệch nhỏ — người chơi sẽ thấy nhân vật rung liên tục.

## AOI — Area of Interest (GDD: bán kính 15m)

Server chỉ gửi thực thể trong tầm nhìn. Client phải xử lý gọn ghẽ hai sự kiện:

* **Vào tầm** → lấy đối tượng từ pool, đặt vị trí, hiện ra (nên fade in nhẹ).
* **Ra khỏi tầm** → trả về pool. **Không `queue_free()`** — người chơi đi qua đi lại
  ranh giới AOI liên tục, tạo/hủy mỗi lần là khựng hình.

Cẩn thận trường hợp thực thể ra rồi vào ngay: giữ lại ~1 giây trước khi trả pool để
tránh nhấp nháy.

## Batching (GDD: gom trong 100ms)

Server gom gói gửi xuống. Client cũng nên gom input gửi lên — trừ những thao tác cần
phản hồi tức thì (dùng kỹ năng) thì gửi ngay.

## Xử lý mất kết nối — đừng để tới sau cùng

Mạng di động rớt liên tục: chuyển từ WiFi sang 4G, vào thang máy, khóa màn hình.
Bắt buộc phải có:

* Phát hiện mất kết nối bằng heartbeat, **không** đợi TCP timeout (có thể mất 30 giây).
* Tự kết nối lại có **backoff tăng dần**, kèm giao diện "Đang kết nối lại..." rõ ràng.
* Khôi phục phiên: đăng nhập lại vào **đúng nhân vật, đúng vị trí**, không bắt chọn lại từ đầu.
* Xử lý app bị đưa xuống nền (`NOTIFICATION_APPLICATION_PAUSED`) — Android sẽ ngắt socket.

Đây là phần quyết định game có chơi được trên xe buýt hay không, và là thứ bị bỏ quên
nhiều nhất trong game mobile online.
