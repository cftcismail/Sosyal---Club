-- =============================================
-- Sosyal Kulüp Platformu - Admin ve Avatar Güncellemeleri
-- Migration 003
-- =============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_preset VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_background VARCHAR(20);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS club_deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    status request_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_delete_requests_club ON club_deletion_requests(club_id);
CREATE INDEX IF NOT EXISTS idx_club_delete_requests_status ON club_deletion_requests(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_club_delete_requests_pending_unique
    ON club_deletion_requests(club_id)
    WHERE status = 'pending';