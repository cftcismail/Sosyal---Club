-- Club deletion requests table
CREATE TABLE IF NOT EXISTS club_delete_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_club_delete_requests_status ON club_delete_requests(status);
