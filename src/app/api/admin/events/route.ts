import { NextResponse } from 'next/server';
import { getMany, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/admin/events - List all events
export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        let sql = `
            SELECT e.id, e.title, e.description, e.location, e.start_time, e.end_time, e.created_at,
                u.name AS creator_name,
                c.name AS club_name,
                COUNT(DISTINCT ea.id) FILTER (WHERE ea.status = 'attending') AS attending_count,
                COUNT(DISTINCT ea.id) FILTER (WHERE ea.status = 'maybe') AS maybe_count
            FROM events e
            JOIN users u ON u.id = e.created_by
            JOIN clubs c ON c.id = e.club_id
            LEFT JOIN event_attendees ea ON ea.event_id = e.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (e.title ILIKE $${params.length} OR e.description ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
        }

        sql += ` GROUP BY e.id, u.name, c.name ORDER BY e.start_time DESC LIMIT 100`;

        const events = await getMany(sql, params);
        return NextResponse.json({ success: true, data: events });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/events?id=xxx - Delete an event
export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('id');
        if (!eventId) {
            return NextResponse.json({ success: false, error: 'Event ID gerekli.' }, { status: 400 });
        }

        await query('DELETE FROM events WHERE id = $1', [eventId]);
        return NextResponse.json({ success: true, message: 'Etkinlik silindi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
