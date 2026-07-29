# scripts/debug/ — Công cụ gỡ lỗi

## Chỗ này để làm gì?

Chứa công cụ dành cho **người phát triển**, không dành cho người chơi: bảng thông số,
console lệnh, hiển thị hitbox, giả lập độ trễ mạng.

```text
debug/
├── debug_overlay.gd      # FPS, ping, số draw call, số entity, RAM
├── debug_console.gd      # Gõ lệnh: /tp, /give, /spawn, /setlevel
├── network_debugger.gd   # Xem gói tin vào/ra, giả lập lag và mất gói
├── hitbox_visualizer.gd  # Vẽ hitbox/hurtbox lên màn hình
└── stress_test.gd        # Sinh 200 nhân vật giả để test đại chiến
```

## `debug_overlay.gd` — nên làm sớm

Cần theo dõi thường trực khi phát triển:

| Chỉ số | Ngưỡng cảnh báo |
|---|---|
| FPS | < 45 |
| Ping | > 150ms |
| Draw calls | > 200 |
| Số entity hiển thị | > 150 |
| Bộ nhớ | > 400MB |
| Gói tin nhận/giây | > 60 |

Bật/tắt bằng một phím tắt hoặc chạm 5 lần vào góc màn hình (trên điện thoại).

## `stress_test.gd` — quan trọng nhất trong thư mục này

GDD nhắm tới hàng nghìn người chơi và các sự kiện đại chiến. **Không thể đợi tới lúc
phát hành mới biết game có chịu nổi không.** Từ rất sớm, hãy có công cụ:

```gdscript
StressTest.spawn_fake_players(200)   # 200 nhân vật giả di chuyển ngẫu nhiên
StressTest.spawn_fake_vfx(50)        # 50 hiệu ứng kỹ năng cùng lúc
StressTest.simulate_tick_rate(5)     # giả lập server hạ xuống 5Hz
```

Rồi chạy trên **điện thoại tầm trung thật**, không phải máy dev. Con số FPS trên PC
không nói lên điều gì về trải nghiệm của người chơi trên máy 3 triệu đồng.

## `network_debugger.gd`

Giả lập điều kiện mạng xấu ngay trên bàn làm việc:

```gdscript
NetworkDebugger.set_artificial_latency(250)   # ms
NetworkDebugger.set_packet_loss(0.05)         # 5%
NetworkDebugger.set_jitter(80)                # ms
```

Nếu game chỉ được test trên WiFi văn phòng, nó sẽ chơi được trên WiFi văn phòng và
không chơi được ở nơi nào khác. Mạng 4G Việt Nam lúc di chuyển có ping dao động rất mạnh.

## Bảo mật — bắt buộc

**Loại trừ toàn bộ thư mục này khỏi bản phát hành.** Console lệnh có `/give` mà lọt vào
bản release là người chơi tự tạo được vật phẩm.

Hai lớp bảo vệ, làm cả hai:

1. Trong Export Preset: **Resources → Filters to exclude** thêm `scripts/debug/*`.
2. Trong code, bọc bằng kiểm tra build:
   ```gdscript
   if OS.is_debug_build():
       add_child(DebugOverlay.new())
   ```

Và quan trọng nhất: **lệnh debug vẫn phải bị server từ chối**. Nếu `/give` gửi một packet
mà server chấp nhận, thì việc ẩn nút bấm đi không giải quyết được gì cả — server phải
kiểm tra quyền tài khoản, không tin mã lệnh gửi lên.
