# assets/audio/bgm/ — Nhạc nền

Chứa nhạc nền dài, phát lặp theo bối cảnh.

* Định dạng: **`.ogg`**, bật **Loop** trong tab Import.
* Đặt tên: `bgm_<bối_cảnh>.ogg` → `bgm_thanh_chinh.ogg`, `bgm_boss_hoa_long.ogg`.
* Mỗi map khai báo bài nhạc của mình trong `data/maps/`, không hardcode trong scene map.
* Chuyển nhạc phải **fade** (~1s), cắt đột ngột nghe rất thô.
* Bus: `Music`.
