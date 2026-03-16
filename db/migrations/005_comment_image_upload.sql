-- =============================================
-- Comment image attachments
-- Migration 005
-- =============================================

ALTER TABLE comments ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS image_name VARCHAR(300);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS image_type VARCHAR(100);
