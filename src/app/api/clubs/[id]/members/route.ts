import { NextResponse } from 'next/server';
import { query, getOne, getMany } from '@/lib/db';
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

// PUT /api/clubs/[id]/members - Üye rolünü güncelle
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const { id } = params;
        const { user_id, role } = await request.json();

        if (!user_id || !['member', 'admin'].includes(role)) {
            return NextResponse.json({ success: false, error: 'Geçersiz parametreler.' }, { status: 400 });
        }

        const myMembership = await getOne(
            `SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2 AND membership_status = 'approved'`,
            [id, user.id]
        );

        if (user.role !== 'admin' && myMembership?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
        }

        await query(
            `UPDATE club_members SET role = $1 WHERE club_id = $2 AND user_id = $3 AND membership_status = 'approved'`,
            [role, id, user_id]
        );

        return NextResponse.json({
            success: true,
            message: role === 'admin' ? 'Kullanıcı yönetici yapıldı.' : 'Yetki kaldırıldı.',
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE /api/clubs/[id]/members - Üyeyi kulüpten çıkar
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const { id } = params;
        const { user_id } = await request.json();

        if (!user_id) {
            return NextResponse.json({ success: false, error: 'Kullanıcı ID gerekli.' }, { status: 400 });
        }

        const myMembership = await getOne(
            `SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2 AND membership_status = 'approved'`,
            [id, user.id]
        );

        if (user.role !== 'admin' && myMembership?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
        }

        await query(
            `DELETE FROM club_members WHERE club_id = $1 AND user_id = $2`,
            [id, user_id]
        );

        return NextResponse.json({ success: true, message: 'Üye kulüpten çıkarıldı.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
