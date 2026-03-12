import { NextResponse } from 'next/server';
import { getMany, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/admin/polls - List all polls
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
                u.name AS author_name,
                c.name AS club_name,
                COUNT(DISTINCT pv.id) AS total_votes
            FROM polls p
            JOIN users u ON u.id = p.user_id
            JOIN clubs c ON c.id = p.club_id
            LEFT JOIN poll_votes pv ON pv.poll_id = p.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (p.question ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
        }

        sql += ` GROUP BY p.id, u.name, c.name ORDER BY p.created_at DESC LIMIT 100`;

        const polls = await getMany(sql, params);
        return NextResponse.json({ success: true, data: polls });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/polls?id=xxx - Delete a poll
export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const pollId = searchParams.get('id');
        if (!pollId) {
            return NextResponse.json({ success: false, error: 'Poll ID gerekli.' }, { status: 400 });
        }

        await query('DELETE FROM polls WHERE id = $1', [pollId]);
        return NextResponse.json({ success: true, message: 'Anket silindi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
