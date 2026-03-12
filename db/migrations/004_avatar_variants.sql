-- =============================================
-- Sosyal Kulüp Platformu - Avatar Varyantları
-- Migration 004
-- =============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_variant SMALLINT;

-- Default value for existing rows
UPDATE users SET avatar_variant = 0 WHERE avatar_variant IS NULL;

-- Keep values in range [0, 14]
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_avatar_variant_range'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_avatar_variant_range
            CHECK (avatar_variant >= 0 AND avatar_variant <= 14);
    END IF;
END
$$;
