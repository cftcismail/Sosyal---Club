import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOne, query } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const event = await getOne('SELECT id, club_id, created_by FROM events WHERE id = $1', [params.id]);
        if (!event) {
            return NextResponse.json({ success: false, error: 'Etkinlik bulunamadı.' }, { status: 404 });
        }

        const clubMembership = await getOne(
            `SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2 AND membership_status = 'approved'`,
            [event.club_id, user.id]
        );

        const canDelete = user.role === 'admin' || event.created_by === user.id || clubMembership?.role === 'admin';
        if (!canDelete) {
            return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
        }

        await query('DELETE FROM events WHERE id = $1', [params.id]);
        return NextResponse.json({ success: true, message: 'Etkinlik silindi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}