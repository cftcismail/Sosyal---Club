import { NextResponse } from 'next/server';
import { getMany, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/admin/clubs - List all clubs with member count
export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const status = searchParams.get('status');

        let sql = `
            SELECT c.*, u.name AS creator_name,
                COUNT(DISTINCT cm.id) FILTER (WHERE cm.membership_status = 'approved') AS member_count
            FROM clubs c
            LEFT JOIN users u ON u.id = c.created_by
            LEFT JOIN club_members cm ON cm.club_id = c.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (c.name ILIKE $${params.length} OR c.description ILIKE $${params.length})`;
        }
        if (status) {
            params.push(status);
            sql += ` AND c.status = $${params.length}`;
        }

        sql += ` GROUP BY c.id, u.name ORDER BY c.created_at DESC`;

        const clubs = await getMany(sql, params);
        return NextResponse.json({ success: true, data: clubs });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/clubs?id=xxx - Delete a club
export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const clubId = searchParams.get('id');
        if (!clubId) {
            return NextResponse.json({ success: false, error: 'Club ID gerekli.' }, { status: 400 });
        }

        await query('DELETE FROM clubs WHERE id = $1', [clubId]);
        return NextResponse.json({ success: true, message: 'Kulüp silindi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
