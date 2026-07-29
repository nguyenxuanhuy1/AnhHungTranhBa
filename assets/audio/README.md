# assets/audio/ — Âm thanh

```text
audio/
├── bgm/    # Nhạc nền: thành thị, dã ngoại, boss, chiến trường, đăng nhập
└── sfx/    # Hiệu ứng: chém, trúng đòn, chết, nhặt đồ, click nút, thăng cấp
```

## Định dạng và import

| Loại | Định dạng | Import setting |
|---|---|---|
| Nhạc nền (dài) | `.ogg` | Bật **Loop**, chỉnh **Loop Offset** cho khớp nhịp |
| Hiệu ứng (ngắn) | `.wav` | Tắt Loop, bật **Force → 8 Bit / Mono** nếu được để giảm dung lượng |

Đừng dùng `.mp3` — có khoảng lặng ở đầu file nên lặp nhạc bị ngắt quãng.
Đừng dùng `.wav` cho nhạc nền dài — file phình to, ăn RAM.

## Quy ước đặt tên

```text
bgm_thanh_chinh.ogg
bgm_boss_hoa_long.ogg
sfx_kiem_chem_01.wav      # đánh số biến thể để chống nhàm tai
sfx_kiem_chem_02.wav
sfx_ui_click.wav
sfx_level_up.wav
```

Một tiếng đánh lặp y hệt hàng nghìn lần rất chói tai — làm 3–4 biến thể rồi bốc ngẫu nhiên.

## Lưu ý cho game đông người

Lúc đại chiến có thể có hàng trăm âm thanh muốn phát cùng lúc. Bắt buộc phải:

* Giới hạn số `AudioStreamPlayer` phát đồng thời (gợi ý: tối đa 16–24 giọng cho SFX).
* Gộp âm trùng: cùng một loại tiếng trong khung 50ms thì chỉ phát 1 lần, tăng âm lượng nhẹ.
* Ưu tiên âm thanh của **chính người chơi** hơn của người khác.

Logic này nằm ở `scripts/managers/audio_manager.gd`.

## Audio Bus

Khai báo bus tại `default_bus_layout.tres`: `Master → Music`, `SFX`, `UI`, `Voice`.
Người chơi chỉnh âm lượng từng bus riêng trong màn hình Cài đặt.
