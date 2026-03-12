import { NextResponse } from 'next/server';
import { getMany } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/admin/stats - Admin istatistikleri
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const [users, clubs, posts, events, pending] = await Promise.all([
            getMany('SELECT COUNT(*) AS count FROM users WHERE is_active = true'),
            getMany('SELECT COUNT(*) AS count FROM clubs WHERE status = $1', ['active']),
            getMany('SELECT COUNT(*) AS count FROM posts'),
            getMany('SELECT COUNT(*) AS count FROM events WHERE start_time >= NOW()'),
            getMany("SELECT c.*, u.name AS creator_name FROM clubs c JOIN users u ON u.id = c.created_by WHERE c.status = 'pending' ORDER BY c.created_at DESC"),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                total_users: parseInt(users[0]?.count || '0'),
                total_clubs: parseInt(clubs[0]?.count || '0'),
                total_posts: parseInt(posts[0]?.count || '0'),
                upcoming_events: parseInt(events[0]?.count || '0'),
                pending_clubs: pending,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
