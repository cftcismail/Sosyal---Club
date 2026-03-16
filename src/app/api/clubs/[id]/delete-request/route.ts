import { NextResponse } from 'next/server';
import { getOne, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const { reason } = await request.json();
        const club = await getOne(
            `SELECT c.id, c.created_by, cm.role AS membership_role
             FROM clubs c
             LEFT JOIN club_members cm ON cm.club_id = c.id AND cm.user_id = $2 AND cm.membership_status = 'approved'
             WHERE c.id = $1`,
            [params.id, user.id]
        );

        if (!club) {
            return NextResponse.json({ success: false, error: 'Kulüp bulunamadı.' }, { status: 404 });
        }

        const isCreator = club.created_by === user.id;
        if (!isCreator) {
            return NextResponse.json({ success: false, error: 'Silme talebi oluşturmak için yetkiniz yok.' }, { status: 403 });
        }

        const existing = await getOne(
            `SELECT id FROM club_deletion_requests WHERE club_id = $1 AND status = 'pending'`,
            [params.id]
        );

        if (existing) {
            return NextResponse.json({ success: false, error: 'Bu kulüp için zaten bekleyen bir silme talebi var.' }, { status: 409 });
        }

        const result = await query(
            `INSERT INTO club_deletion_requests (club_id, requested_by, reason)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [params.id, user.id, reason || null]
        );

        return NextResponse.json({ success: true, data: result.rows[0], message: 'Silme talebi admin onayına gönderildi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}