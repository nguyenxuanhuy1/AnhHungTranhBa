# assets/audio/sfx/ — Hiệu ứng âm thanh

Chứa âm thanh ngắn: đánh, trúng đòn, kỹ năng, nhặt đồ, thao tác giao diện.

* Định dạng: **`.wav`**, tắt Loop.
* Đặt tên: `sfx_<đối_tượng>_<hành_động>_<số>.wav` → `sfx_kiem_chem_01.wav`, `sfx_ui_click.wav`.
* Làm **3–4 biến thể** cho tiếng lặp nhiều (đánh thường, bước chân) rồi bốc ngẫu nhiên.
* Bus: `SFX` cho âm trong game, `UI` cho âm giao diện.
* Phát qua `AudioManager` để được giới hạn số giọng và gộp âm trùng — đừng
  `AudioStreamPlayer.play()` trực tiếp trong code chiến đấu.
