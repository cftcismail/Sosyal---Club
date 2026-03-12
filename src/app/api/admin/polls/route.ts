import { NextResponse } from 'next/server';
import { getMany, getOne, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        let sql = `
            SELECT p.id, p.question, p.is_multiple_choice, p.ends_at, p.created_at,
                   c.name AS club_name, u.name AS author_name,
                   COUNT(DISTINCT po.id) AS option_count,
                   COUNT(DISTINCT pv.id) AS vote_count
            FROM polls p
            JOIN clubs c ON c.id = p.club_id
            JOIN users u ON u.id = p.user_id
            LEFT JOIN poll_options po ON po.poll_id = p.id
            LEFT JOIN poll_votes pv ON pv.poll_id = p.id
            WHERE 1 = 1
        `;
        const params: any[] = [];

        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (p.question ILIKE $${params.length} OR c.name ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
        }

        sql += ` GROUP BY p.id, c.name, u.name ORDER BY p.created_at DESC LIMIT 100`;
        const polls = await getMany(sql, params);
        return NextResponse.json({ success: true, data: polls });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { poll_id } = await request.json();
        if (!poll_id) {
            return NextResponse.json({ success: false, error: 'Anket ID gerekli.' }, { status: 400 });
        }

        const existing = await getOne('SELECT id FROM polls WHERE id = $1', [poll_id]);
        if (!existing) {
            return NextResponse.json({ success: false, error: 'Anket bulunamadı.' }, { status: 404 });
        }

        await query('DELETE FROM polls WHERE id = $1', [poll_id]);
        return NextResponse.json({ success: true, message: 'Anket silindi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}