-- ============================================================
--  001_init_auth.sql
--  Bảng cho hệ thống tài khoản + đăng nhập Google.
--  Nguyên tắc: KHÔNG lưu token dạng thô. Chỉ lưu SHA-256 của token.
--  Nếu database bị lộ, kẻ tấn công vẫn không đăng nhập được.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- Tài khoản. Một người chơi = một dòng ở đây.
-- Tách khỏi auth_identities để sau này gắn thêm Apple/Facebook
-- vào cùng một tài khoản mà không mất nhân vật.
-- ------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('active', 'suspended', 'banned', 'deleted');
    CREATE TYPE account_role AS ENUM ('player', 'gm', 'admin', 'developer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Hàm trợ giúp UUIDv7: Ưu tiên dùng native uuidv7() trên Postgres 17/18
CREATE OR REPLACE FUNCTION gen_uuid_v7() RETURNS uuid AS $$
BEGIN
    RETURN uuidv7();
EXCEPTION WHEN undefined_function THEN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE TABLE IF NOT EXISTS accounts (
    id              uuid PRIMARY KEY DEFAULT gen_uuid_v7(),
    display_name    text NOT NULL,
    status          account_status NOT NULL DEFAULT 'active',
    role            account_role NOT NULL DEFAULT 'player',
    ban_reason      text,
    ban_expires_at  timestamptz,              -- NULL = ban vĩnh viễn
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    last_login_at   timestamptz,
    deleted_at      timestamptz               -- xóa mềm, xem ghi chú cuối file
);

CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts (status);
CREATE INDEX IF NOT EXISTS idx_accounts_role   ON accounts (role);

-- ------------------------------------------------------------
-- Liên kết tới nhà cung cấp đăng nhập bên ngoài.
-- Khóa định danh là (provider, provider_user_id) — với Google
-- provider_user_id chính là trường "sub" trong ID token.
--
-- QUAN TRỌNG: định danh theo "sub", KHÔNG theo email.
-- Người dùng có thể đổi email Google; "sub" thì không bao giờ đổi.
-- Định danh theo email là lỗ hổng chiếm tài khoản kinh điển.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_identities (
    id                uuid PRIMARY KEY DEFAULT gen_uuid_v7(),
    account_id        uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    provider          text NOT NULL,          -- 'google'
    provider_user_id  text NOT NULL,          -- Google 'sub'
    email             text,                   -- lưu chữ thường, chỉ để hỗ trợ CSKH
    email_verified    boolean NOT NULL DEFAULT false,
    picture_url       text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    last_login_at     timestamptz,
    CONSTRAINT uq_provider_user UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_identities_account ON auth_identities (account_id);
CREATE INDEX IF NOT EXISTS idx_identities_email   ON auth_identities (email);

-- ------------------------------------------------------------
-- Refresh token.
--
-- Cơ chế: xoay vòng (rotation) + phát hiện tái sử dụng (reuse detection).
--   - Mỗi lần dùng refresh token, nó bị thu hồi và cấp cái mới.
--   - Cả chuỗi token thuộc cùng một lần đăng nhập chia sẻ 'family_id'.
--   - Nếu một token ĐÃ bị thu hồi lại được dùng lần nữa => token đã bị
--     đánh cắp. Thu hồi TOÀN BỘ family, buộc đăng nhập lại.
--
-- Đây là cách chuẩn để giới hạn thiệt hại khi máy người chơi bị nhiễm mã độc.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              uuid PRIMARY KEY DEFAULT gen_uuid_v7(),
    account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    family_id       uuid NOT NULL,
    token_hash      bytea NOT NULL UNIQUE,    -- SHA-256(token), KHÔNG phải token thô
    issued_at       timestamptz NOT NULL DEFAULT now(),
    expires_at      timestamptz NOT NULL,
    revoked_at      timestamptz,
    revoked_reason  text,
    replaced_by     uuid REFERENCES refresh_tokens(id) ON DELETE SET NULL,
    ip              inet,
    user_agent      text
);

CREATE INDEX IF NOT EXISTS idx_refresh_account ON refresh_tokens (account_id);
CREATE INDEX IF NOT EXISTS idx_refresh_family  ON refresh_tokens (family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_expires ON refresh_tokens (expires_at);

-- ------------------------------------------------------------
-- Phiên đăng nhập tạm (bắt tay giữa game và trình duyệt).
--
-- Game không mở được cửa sổ Google bên trong app (Google chặn webview
-- nhúng vì lý do bảo mật), nên luồng là:
--   1. Game gọi POST /auth/session  -> nhận session_id + authorize_url
--   2. Game mở authorize_url bằng TRÌNH DUYỆT HỆ THỐNG
--   3. Người chơi chọn tài khoản Google
--   4. Google gọi về /auth/google/callback -> server đánh dấu 'completed'
--   5. Game hỏi POST /auth/session/claim -> nhận token
--
-- state / nonce / code_verifier nằm Ở ĐÂY, phía server.
-- Client không bao giờ thấy chúng => không giả mạo được.
-- ------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE login_session_status AS ENUM ('pending', 'completed', 'claimed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS login_sessions (
    id                uuid PRIMARY KEY DEFAULT gen_uuid_v7(),

    -- SHA-256 của bí mật mà CHỈ game giữ. Trình duyệt không bao giờ thấy nó.
    -- Nhờ vậy dù ai đó đọc được lịch sử trình duyệt cũng không đổi được token.
    poll_secret_hash  bytea NOT NULL,

    state             text NOT NULL UNIQUE,   -- chống CSRF, khớp khi Google gọi về
    nonce             text NOT NULL,          -- chống phát lại (replay) ID token
    code_verifier     text NOT NULL,          -- PKCE

    status            login_session_status NOT NULL DEFAULT 'pending',
    account_id        uuid REFERENCES accounts(id) ON DELETE CASCADE,
    error_code        text,

    created_at        timestamptz NOT NULL DEFAULT now(),
    expires_at        timestamptz NOT NULL,
    completed_at      timestamptz,
    claimed_at        timestamptz,
    create_ip         inet
);

CREATE INDEX IF NOT EXISTS idx_login_sessions_expires ON login_sessions (expires_at);

-- ------------------------------------------------------------
-- Nhật ký kiểm toán.
-- Khi có tranh chấp "tài khoản tôi bị hack", đây là thứ duy nhất
-- cho biết chuyện gì đã thực sự xảy ra. Đừng bỏ qua nó.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id          bigserial PRIMARY KEY,
    account_id  uuid REFERENCES accounts(id) ON DELETE SET NULL,
    event       text NOT NULL,
    ip          inet,
    user_agent  text,
    meta        jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_account ON audit_log (account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event   ON audit_log (event, created_at DESC);

-- ------------------------------------------------------------
-- Tự cập nhật updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_accounts_updated_at ON accounts;
CREATE TRIGGER trg_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- GHI CHÚ VẬN HÀNH
--
-- 1. Dọn rác định kỳ (chạy bằng cron mỗi giờ):
--      DELETE FROM login_sessions WHERE expires_at < now() - interval '1 day';
--      DELETE FROM refresh_tokens WHERE expires_at < now() - interval '30 days';
--
-- 2. Xóa tài khoản:
--    Google Play BẮT BUỘC app có đăng ký tài khoản phải cho phép xóa tài khoản.
--    Luồng đúng: đặt status='deleted' + deleted_at=now(), thu hồi hết refresh
--    token, gỡ auth_identities (để email đó đăng ký lại được), rồi xóa hẳn
--    dữ liệu sau 30 ngày ân hạn bằng job nền.
--
-- 3. Email là dữ liệu cá nhân. Theo Nghị định 13/2023/NĐ-CP, chỉ thu thập
--    những gì thật sự cần. Game này chỉ cần 'sub' để định danh; email giữ
--    lại thuần túy để hỗ trợ người chơi khi mất tài khoản.
-- ============================================================
