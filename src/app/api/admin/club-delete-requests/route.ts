import { NextResponse } from 'next/server';
import { getMany, query, getOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/admin/club-delete-requests - List pending deletion requests (admin only)
export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const requests = await getMany(
            `SELECT cdr.*, c.name AS club_name, c.description AS club_description,
                u.name AS requester_name, u.email AS requester_email
             FROM club_delete_requests cdr
             JOIN clubs c ON c.id = cdr.club_id
             JOIN users u ON u.id = cdr.requested_by
             WHERE cdr.status = 'pending'
             ORDER BY cdr.created_at DESC`
        );

        return NextResponse.json({ success: true, data: requests });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST /api/admin/club-delete-requests - Create a deletion request (club admin)
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const { club_id, reason } = await request.json();
        if (!club_id) {
            return NextResponse.json({ success: false, error: 'Kulüp ID gerekli.' }, { status: 400 });
        }

        // Check if user is club admin or creator
        const membership = await getOne(
            `SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2 AND membership_status = 'approved'`,
            [club_id, user.id]
        );
        const club = await getOne('SELECT created_by FROM clubs WHERE id = $1', [club_id]);

        if (membership?.role !== 'admin' && club?.created_by !== user.id && user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
        }

        // Check for existing pending request
        const existing = await getOne(
            `SELECT id FROM club_delete_requests WHERE club_id = $1 AND status = 'pending'`,
            [club_id]
        );
        if (existing) {
            return NextResponse.json({ success: false, error: 'Bu kulüp için zaten bir silme talebi mevcut.' }, { status: 409 });
        }

        await query(
            `INSERT INTO club_delete_requests (club_id, requested_by, reason) VALUES ($1, $2, $3)`,
            [club_id, user.id, reason || null]
        );

        return NextResponse.json({ success: true, message: 'Silme talebi gönderildi. Admin onayı bekleniyor.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PATCH /api/admin/club-delete-requests - Approve or reject a deletion request
export async function PATCH(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { request_id, action } = await request.json();
        if (!request_id || !['approved', 'rejected'].includes(action)) {
            return NextResponse.json({ success: false, error: 'Geçersiz istek.' }, { status: 400 });
        }

        const req = await getOne(
            `SELECT * FROM club_delete_requests WHERE id = $1 AND status = 'pending'`,
            [request_id]
        );
        if (!req) {
            return NextResponse.json({ success: false, error: 'Talep bulunamadı.' }, { status: 404 });
        }

        // Update request status
        await query(
            `UPDATE club_delete_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3`,
            [action, user.id, request_id]
        );

        // If approved, delete the club
        if (action === 'approved') {
            await query('DELETE FROM clubs WHERE id = $1', [req.club_id]);
        }

        return NextResponse.json({
            success: true,
            message: action === 'approved' ? 'Kulüp silindi.' : 'Silme talebi reddedildi.',
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
