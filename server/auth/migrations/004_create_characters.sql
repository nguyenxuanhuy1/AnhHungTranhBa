-- ============================================================
--  004_create_characters.sql
--  Bảng cho Nhân vật, Trang bị đang mặc và Túi đồ Balo.
-- ============================================================

-- Bảng Nhân Vật
CREATE TABLE IF NOT EXISTS characters (
    id            uuid PRIMARY KEY DEFAULT gen_uuid_v7(),
    account_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name          varchar(32) NOT NULL UNIQUE,         -- Tên nhân vật (Độc nhất)
    element       varchar(16) NOT NULL,                -- 5 Hệ Ngũ hành: 'kim', 'moc', 'thuy', 'hoa', 'tho'
    gender        varchar(8)  NOT NULL DEFAULT 'male', -- Giới tính: 'male', 'female'
    hair_style    int NOT NULL DEFAULT 1,              -- Kiểu tóc: 1, 2, 3, 4...
    level         int NOT NULL DEFAULT 1,              -- Cấp độ
    exp           bigint NOT NULL DEFAULT 0,           -- Điểm kinh nghiệm
    hp            int NOT NULL DEFAULT 100,            -- Máu hiện tại
    mp            int NOT NULL DEFAULT 50,             -- Mana hiện tại
    map_id        varchar(64) NOT NULL DEFAULT 'thanh_khoi_nguyen', -- Map đang đứng
    position_x    float NOT NULL DEFAULT 0.0,          -- Tọa độ X trên map
    position_y    float NOT NULL DEFAULT 0.0,          -- Tọa độ Y trên map
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_characters_account ON characters (account_id);
CREATE INDEX IF NOT EXISTS idx_characters_name    ON characters (name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_lower_name ON characters (LOWER(name));

-- Bảng Trang Bị Đang Mặc Trên Người
CREATE TABLE IF NOT EXISTS character_equipment (
    character_id    uuid PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
    weapon_id       varchar(64),   -- Vũ khí
    weapon_enhance  int NOT NULL DEFAULT 0,
    armor_id        varchar(64),   -- Áo giáp
    armor_enhance   int NOT NULL DEFAULT 0,
    helmet_id       varchar(64),   -- Nón / Mũ
    helmet_enhance  int NOT NULL DEFAULT 0,
    ring_id         varchar(64),   -- Nhẫn
    ring_enhance    int NOT NULL DEFAULT 0,
    pendant_id      varchar(64),   -- Ngọc bội / Dây chuyền
    pendant_enhance int NOT NULL DEFAULT 0,
    shoes_id        varchar(64),   -- Giày
    shoes_enhance   int NOT NULL DEFAULT 0,
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Bảng Balo / Túi Đồ
CREATE TABLE IF NOT EXISTS character_inventory (
    id            uuid PRIMARY KEY DEFAULT gen_uuid_v7(),
    character_id  uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    slot_index    int NOT NULL,                       -- Vị trí ô trong balo (0 đến 47)
    item_id       varchar(64) NOT NULL,               -- Mã vật phẩm
    quantity      int NOT NULL DEFAULT 1,             -- Số lượng dồn (stack)
    enhance_level int NOT NULL DEFAULT 0,             -- Cấp cường hóa (+0 đến +12)
    is_locked     boolean NOT NULL DEFAULT false,     -- Khóa giao dịch
    created_at    timestamptz NOT NULL DEFAULT now(),
    
    CONSTRAINT uq_char_slot UNIQUE (character_id, slot_index)
);

CREATE INDEX IF NOT EXISTS idx_inventory_char ON character_inventory (character_id);
