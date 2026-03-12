import { NextResponse } from 'next/server';
import { getMany, getOne, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const requests = await getMany(
            `SELECT cdr.*, c.name AS club_name, c.slug AS club_slug,
                    u.name AS requester_name, reviewer.name AS reviewer_name
             FROM club_deletion_requests cdr
             JOIN clubs c ON c.id = cdr.club_id
             JOIN users u ON u.id = cdr.requested_by
             LEFT JOIN users reviewer ON reviewer.id = cdr.reviewed_by
             ORDER BY cdr.created_at DESC`
        );

        return NextResponse.json({ success: true, data: requests });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { request_id, status } = await request.json();
        if (!request_id || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ success: false, error: 'Geçersiz istek.' }, { status: 400 });
        }

        const existing = await getOne(
            `SELECT id, club_id, status FROM club_deletion_requests WHERE id = $1`,
            [request_id]
        );
        if (!existing) {
            return NextResponse.json({ success: false, error: 'Talep bulunamadı.' }, { status: 404 });
        }

        await query(
            `UPDATE club_deletion_requests
             SET status = $1, reviewed_by = $2, reviewed_at = NOW()
             WHERE id = $3`,
            [status, user.id, request_id]
        );

        if (status === 'approved') {
            await query('DELETE FROM clubs WHERE id = $1', [existing.club_id]);
            return NextResponse.json({ success: true, message: 'Talep onaylandı ve kulüp silindi.' });
        }

        return NextResponse.json({ success: true, message: 'Silme talebi reddedildi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}