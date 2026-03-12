import { NextResponse } from 'next/server';
import { query, getOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST /api/clubs/[id]/join - Kulübe katıl
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const { id } = params;

        const club = await getOne('SELECT id, is_public FROM clubs WHERE id = $1 AND status = $2', [id, 'active']);
        if (!club) {
            return NextResponse.json({ success: false, error: 'Kulüp bulunamadı.' }, { status: 404 });
        }

        const existing = await getOne(
            'SELECT id, membership_status FROM club_members WHERE club_id = $1 AND user_id = $2',
            [id, user.id]
        );

        if (existing) {
            if (existing.membership_status === 'approved') {
                return NextResponse.json({ success: false, error: 'Zaten üyesiniz.' }, { status: 409 });
            }
            if (existing.membership_status === 'pending') {
                return NextResponse.json({ success: false, error: 'Başvurunuz zaten beklemede.' }, { status: 409 });
            }
        }

        const membershipStatus = club.is_public ? 'approved' : 'pending';

        await query(
            `INSERT INTO club_members (club_id, user_id, role, membership_status)
       VALUES ($1, $2, 'member', $3)
       ON CONFLICT (club_id, user_id) DO UPDATE SET membership_status = $3`,
            [id, user.id, membershipStatus]
        );

        return NextResponse.json({
            success: true,
            message: club.is_public ? 'Kulübe katıldınız!' : 'Başvurunuz gönderildi, onay bekleniyor.',
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE /api/clubs/[id]/join - Kulüpten ayrıl
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        await query(
            'DELETE FROM club_members WHERE club_id = $1 AND user_id = $2',
            [params.id, user.id]
        );

        return NextResponse.json({ success: true, message: 'Kulüpten ayrıldınız.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
