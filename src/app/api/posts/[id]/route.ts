import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOne, query } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const post = await getOne('SELECT id, user_id, club_id FROM posts WHERE id = $1', [params.id]);
        if (!post) {
            return NextResponse.json({ success: false, error: 'Gönderi bulunamadı.' }, { status: 404 });
        }

        const clubMembership = await getOne(
            `SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2 AND membership_status = 'approved'`,
            [post.club_id, user.id]
        );

        const canDelete = user.role === 'admin' || post.user_id === user.id || clubMembership?.role === 'admin';
        if (!canDelete) {
            return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
        }

        await query('DELETE FROM posts WHERE id = $1', [params.id]);
        return NextResponse.json({ success: true, message: 'Gönderi silindi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}