# Auth Service — Đăng nhập Google

Node.js + TypeScript + PostgreSQL. Xác thực người chơi bằng Google, cấp token cho game.

---

## 1. LẤY KEY GOOGLE (phần bạn cần làm)

Bạn chỉ cần lấy **2 giá trị**: `Client ID` và `Client Secret`.

### Bước 1 — Tạo project

Vào <https://console.cloud.google.com> → menu chọn project ở góc trên → **New Project**
→ đặt tên (ví dụ `anh-hung-xung-ba`) → **Create**.

### Bước 2 — Cấu hình màn hình đồng ý

Menu trái → **APIs & Services → OAuth consent screen**
(giao diện mới của Google gọi mục này là **Google Auth Platform**).

* **User Type / Audience:** chọn **External**
* **App name:** `Anh Hùng Xưng Bá` — tên này hiện ra khi người chơi bấm đăng nhập
* **User support email:** email của bạn
* **App logo:** tuỳ chọn, nhưng nên có để trông tin cậy
* **Developer contact:** email của bạn
* **Scopes:** thêm đúng 3 cái, không thêm gì khác:
  * `openid`
  * `.../auth/userinfo.email`
  * `.../auth/userinfo.profile`

> **Tin tốt:** ba scope này thuộc nhóm *non-sensitive*. App của bạn **không phải qua
> quy trình duyệt của Google** (thường mất vài tuần), và người chơi **không thấy
> màn hình cảnh báo "ứng dụng chưa được xác minh"**. Đừng thêm scope nào khác trừ khi
> thực sự cần — thêm một scope nhạy cảm là rơi ngay vào diện phải duyệt.

* **Publishing status:** để **Testing** khi đang làm. Ở chế độ này chỉ tài khoản nào
  bạn thêm vào danh sách **Test users** mới đăng nhập được (tối đa 100).
  Khi phát hành thật thì bấm **Publish app**.

### Bước 3 — Tạo OAuth Client

Menu trái → **APIs & Services → Credentials**
→ **+ Create Credentials** → **OAuth client ID**
→ Application type: chọn **Web application**

> **Chọn "Web application", KHÔNG chọn "Android" hay "iOS".**
> Nghe ngược đời với game mobile, nhưng đúng: ở kiến trúc này Google nói chuyện
> với *server* của bạn, không nói chuyện trực tiếp với app. Client kiểu Android/iOS
> sẽ bắt bạn khai báo SHA-1 keystore, phải làm lại mỗi lần đổi khoá ký, và không
> cấp client secret. Client kiểu Web đơn giản hơn hẳn và an toàn hơn — secret nằm
> trên server, không nằm trong file APK ai cũng giải nén được.

**Authorized redirect URIs** — thêm cả ba dòng sau:

```
http://localhost:8080/auth/google/callback
http://127.0.0.1:8080/auth/google/callback
https://api.tenmiencuaban.com/auth/google/callback
```

Hai dòng đầu để chạy thử ở máy, dòng cuối đổi thành tên miền thật khi lên production.
Google đối chiếu **chính xác từng ký tự** — thừa dấu `/` ở cuối là lỗi
`redirect_uri_mismatch`.

Bỏ trống mục *Authorized JavaScript origins* — kiến trúc này không cần.

### Bước 4 — Điền vào `.env`

Bấm **Create**, Google hiện ra hai giá trị. Copy vào file `.env`:

```bash
GOOGLE_CLIENT_ID=123456789-abcxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

> `GOOGLE_CLIENT_SECRET` là **mật khẩu của cả hệ thống đăng nhập**.
> Nó chỉ được nằm trong `.env` trên server. Không commit lên git, không gửi qua chat,
> không nhét vào game. Lỡ lộ thì vào Credentials bấm **Reset secret** ngay.

---

## 2. CHẠY THỬ

### Cài đặt

```bash
cd server/auth
npm install
cp .env.example .env      # rồi mở .env điền giá trị thật
```

Sinh `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Tạo database rồi chạy migration:

```bash
createdb anhhung
npm run migrate
```

Chạy:

```bash
npm run dev
```

Kiểm tra: mở <http://localhost:8080/health> → phải thấy `{"ok":true,...}`

### Thử luồng đăng nhập

Mở Godot, chạy project (F5). Màn hình đăng nhập hiện ra, bấm nút Google.
Trình duyệt bật lên, chọn tài khoản, thấy trang "Đăng nhập thành công",
quay lại game — game đã vào.

### ⚠️ Test trên điện thoại thật

Đây là chỗ dễ mất vài giờ nếu không biết trước.

Google **chỉ chấp nhận redirect URI là `localhost`/`127.0.0.1` hoặc `https://`**.
Địa chỉ LAN kiểu `http://192.168.1.12:8080` **bị Google từ chối** — không thêm vào
Credentials được.

Ba cách xử lý:

| Cách | Làm gì | Phù hợp khi |
|---|---|---|
| **Chạy trong editor** | Bấm F5 trong Godot trên máy tính | Phát triển hàng ngày — nhanh nhất |
| **Tunnel HTTPS** | `cloudflared tunnel --url http://localhost:8080` hoặc `ngrok http 8080`, lấy URL https rồi thêm vào Google Credentials **và** đặt `PUBLIC_BASE_URL` | Cần test thật trên điện thoại |
| **Deploy thật** | Đưa lên Railway/Render/VPS có tên miền + HTTPS | Sắp phát hành |

Với cách tunnel, nhớ tạo file `user://api_base_url.txt` trên điện thoại chứa URL đó
(xem `scripts/core/api_config.gd`).

---

## 3. API

| Method | Endpoint | Cần token | Việc |
|---|---|---|---|
| `POST` | `/auth/session` | không | Tạo phiên, trả về `session_id` + `authorize_url` |
| `GET` | `/auth/google/callback` | không | Google gọi về (trình duyệt, không phải game) |
| `POST` | `/auth/session/claim` | không | Game hỏi kết quả, nhận token (một lần duy nhất) |
| `POST` | `/auth/refresh` | không | Xoay refresh token, lấy access token mới |
| `POST` | `/auth/logout` | không | Thu hồi cả phiên |
| `GET` | `/auth/me` | **có** | Thông tin tài khoản |
| `DELETE` | `/auth/account` | **có** | Xoá tài khoản (Google Play bắt buộc có) |
| `GET` | `/health` | không | Kiểm tra sống |

### Luồng đầy đủ

```
GAME                          SERVER                     GOOGLE       TRÌNH DUYỆT
 │                              │                          │              │
 │ 1. POST /auth/session        │                          │              │
 │    { poll_secret_hash }      │                          │              │
 │─────────────────────────────>│  lưu state/nonce/PKCE    │              │
 │<─────────────────────────────│                          │              │
 │    { session_id,             │                          │              │
 │      authorize_url }         │                          │              │
 │                              │                          │              │
 │ 2. OS.shell_open(authorize_url) ───────────────────────────────────────>│
 │                              │                          │<─────────────│
 │                              │                          │  chọn tài khoản
 │                              │<─────────────────────────│              │
 │                              │  3. GET /callback?code   │              │
 │                              │     đổi code -> ID token │              │
 │                              │     xác minh chữ ký+nonce│              │
 │                              │     tạo/tìm tài khoản    │              │
 │                              │     status = completed   │              │
 │                              │──────────────────────────────────────── >│
 │                              │                          │  "Thành công"│
 │ 4. POST /auth/session/claim  │                          │              │
 │    { session_id,             │                          │              │
 │      poll_secret }  (lặp 2.5s)                          │              │
 │─────────────────────────────>│  đối chiếu hash          │              │
 │<─────────────────────────────│  cấp token               │              │
 │    { access_token,           │                          │              │
 │      refresh_token }         │                          │              │
```

**Vì sao game không nhận token thẳng từ trình duyệt?** Vì để trình duyệt gọi ngược
vào app cần deep link, mà deep link trên Android đòi sửa `AndroidManifest.xml` →
phải dựng custom build template. Cách hỏi-lại này chạy y hệt trên mọi nền tảng,
kể cả trong editor, không cần plugin nào.

---

## 4. CÁC LỚP BẢO MẬT ĐÃ CÀI

| # | Cơ chế | Chống được gì |
|---|---|---|
| 1 | ID token xác minh **phía server** qua khoá công khai Google | Client giả mạo danh tính |
| 2 | `state` sinh ở server, đối chiếu khi callback | CSRF |
| 3 | `nonce` nhúng trong ID token, kiểm tra thủ công | Phát lại (replay) token cũ |
| 4 | PKCE S256 | Chặn mã uỷ quyền giữa đường |
| 5 | `poll_secret` chỉ game biết, server chỉ giữ SHA-256 | Cướp phiên qua lịch sử trình duyệt |
| 6 | Access token JWT **15 phút** | Giới hạn thiệt hại khi token bị lộ |
| 7 | Refresh token **xoay vòng mỗi lần dùng** | Token cũ vô dụng ngay sau khi dùng |
| 8 | **Phát hiện tái sử dụng** → thu hồi cả family | Token bị đánh cắp bị chặn tự động |
| 9 | Token lưu DB dưới dạng SHA-256 | Lộ database vẫn không đăng nhập được |
| 10 | Kiểm tra ban **cả lúc refresh**, không chỉ lúc login | Người bị ban chơi tiếp bằng token cũ |
| 11 | Khoá cứng `algorithms: ['HS256']` khi verify JWT | Tấn công đổi thuật toán / `alg: none` |
| 12 | So sánh bí mật bằng `timingSafeEqual` | Dò từng byte qua đo thời gian |
| 13 | Truy vấn tham số hoá 100% | SQL injection |
| 14 | Rate limit theo `session_id` chứ không theo IP | Chặn oan người chơi sau NAT nhà mạng |
| 15 | Body giới hạn 16kb, helmet, tắt `x-powered-by` | Payload khổng lồ, lộ thông tin server |
| 16 | Log tự động che token | Rò rỉ token qua hệ thống log |
| 17 | Thông báo lỗi chung chung, chi tiết chỉ trong log | Dò tìm tài khoản tồn tại |
| 18 | `audit_log` ghi mọi sự kiện xác thực | Không điều tra được khi có tranh chấp |
| 19 | Bắt buộc HTTPS khi `NODE_ENV=production` | OAuth chạy trên HTTP |
| 20 | Chặn khởi động nếu `JWT_SECRET` còn là giá trị mẫu | Quên đổi secret khi lên production |

### Cơ chế phát hiện trộm token — đọc kỹ phần này

Đây là thứ khiến hệ thống này khác với đa số hướng dẫn trên mạng:

```
1. Kẻ xấu lấy được refresh token R1 từ máy người chơi
2. Kẻ xấu dùng R1  → nhận R2, R1 bị đánh dấu đã thu hồi
3. Người chơi thật mở game, vẫn đang giữ R1, gửi R1 lên
4. Server thấy R1 ĐÃ thu hồi rồi ⇒ chắc chắn có 2 bên cùng giữ token
5. Thu hồi TOÀN BỘ family → cả hai văng ra
6. Người chơi thật đăng nhập lại bằng Google (kẻ xấu không làm được)
```

Không có bước 4–5, kẻ xấu giữ quyền truy cập **vô thời hạn** mà không ai biết.

---

## 5. TRIỂN KHAI PRODUCTION

Checklist bắt buộc:

* [ ] `NODE_ENV=production`
* [ ] `PUBLIC_BASE_URL` là **https** với tên miền thật
* [ ] Thêm URI callback production vào Google Credentials
* [ ] `JWT_SECRET` là chuỗi ngẫu nhiên thật, khác hẳn secret dev
* [ ] `DATABASE_SSL=true` nếu dùng DB cloud
* [ ] `TRUST_PROXY=true` **chỉ khi** thực sự chạy sau reverse proxy
      (bật sai thì kẻ tấn công tự đặt `X-Forwarded-For` để vượt rate limit)
* [ ] Đổi `PROD_BASE_URL` trong `scripts/core/api_config.gd` cho khớp
* [ ] OAuth consent screen chuyển từ *Testing* sang **Published**
* [ ] Có trang Điều khoản và Chính sách bảo mật thật (Google Play yêu cầu)
* [ ] Đặt cron dọn dữ liệu hết hạn (xem cuối file `migrations/001_init_auth.sql`)
* [ ] Backup database tự động

```bash
npm run build
npm run migrate:prod
npm start
```

### Cần làm thêm khi lượng người chơi tăng

* Chuyển JWT sang **RS256** — server game chỉ cần khoá công khai, không cần
  chia sẻ secret. Giảm rủi ro khi mở rộng nhiều dịch vụ.
* Đưa rate limit sang **Redis** — hiện đang lưu trong RAM, chạy nhiều instance
  là mỗi instance đếm riêng.
* Tách job dọn dữ liệu ra khỏi tiến trình API.
* Thêm cảnh báo khi `token.reuse_detected` xuất hiện nhiều bất thường.

---

## 6. LỖI HAY GẶP

| Triệu chứng | Nguyên nhân |
|---|---|
| `redirect_uri_mismatch` | URI trong Google Credentials không khớp **từng ký tự** với `PUBLIC_BASE_URL` + `/auth/google/callback`. Kiểm tra http/https, cổng, dấu `/` thừa |
| `Access blocked: app not verified` | Consent screen còn ở *Testing* và tài khoản bạn dùng chưa nằm trong Test users |
| `invalid_client` | Sai `GOOGLE_CLIENT_ID` hoặc `GOOGLE_CLIENT_SECRET` |
| Game cứ "Đang chờ xác nhận..." mãi | Điện thoại không gọi tới được `PUBLIC_BASE_URL`. Xem mục test trên điện thoại thật |
| `token_reused` ngay lần đầu | Có 2 chỗ cùng dùng một refresh token. Thường do gọi `/auth/refresh` hai lần song song |
| Migration báo `type already exists` | Đã chạy rồi. Migration được thiết kế chạy lại an toàn, cứ bỏ qua |
