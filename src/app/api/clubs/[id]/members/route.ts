import { NextResponse } from 'next/server';
import { query, getOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// PATCH /api/clubs/[id]/members - Üyelik durumu güncelle (onayla/reddet)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const { id } = params;
        const { user_id, status } = await request.json();

        if (!user_id || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ success: false, error: 'Geçersiz parametreler.' }, { status: 400 });
        }

        // Yetki: kulüp admini veya sistem admini
        const myMembership = await getOne(
            `SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2 AND membership_status = 'approved'`,
            [id, user.id]
        );

        if (user.role !== 'admin' && myMembership?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
        }

        await query(
            `UPDATE club_members SET membership_status = $1 WHERE club_id = $2 AND user_id = $3`,
            [status, id, user_id]
        );

        return NextResponse.json({
            success: true,
            message: status === 'approved' ? 'Üyelik onaylandı.' : 'Üyelik reddedildi.',
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
