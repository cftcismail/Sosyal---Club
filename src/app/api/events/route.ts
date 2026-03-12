import { NextResponse } from 'next/server';
import { getMany, query, getOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/events - Etkinlikleri listele
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const clubId = searchParams.get('club_id');
        const upcoming = searchParams.get('upcoming') !== 'false';
        const user = await getCurrentUser();

        let sql = `
      SELECT e.*,
        c.name AS club_name,
        c.slug AS club_slug,
        u.name AS creator_name,
        COUNT(DISTINCT ea.id) FILTER (WHERE ea.status = 'attending') AS attending_count,
        COUNT(DISTINCT ea.id) FILTER (WHERE ea.status = 'maybe') AS maybe_count
    `;

        const params: any[] = [];

        if (user) {
            params.push(user.id);
            sql += `,
        (SELECT status FROM event_attendees WHERE event_id = e.id AND user_id = $1) AS my_rsvp
      `;
        }

        sql += `
      FROM events e
      JOIN clubs c ON c.id = e.club_id
      JOIN users u ON u.id = e.created_by
      LEFT JOIN event_attendees ea ON ea.event_id = e.id
    `;

        const conditions: string[] = [];

        if (clubId) {
            params.push(clubId);
            conditions.push(`e.club_id = $${params.length}`);
        } else if (user) {
            // Sadece üye olduğu kulüplerin etkinlikleri
            conditions.push(`e.club_id IN (
        SELECT club_id FROM club_members WHERE user_id = $1 AND membership_status = 'approved'
      )`);
        }

        if (upcoming) {
            conditions.push(`e.start_time >= NOW()`);
        }

        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        sql += `
      GROUP BY e.id, c.name, c.slug, u.name
      ORDER BY e.start_time ASC
      LIMIT 50
    `;

        const events = await getMany(sql, params);

        if (events.length > 0) {
            const eventIds = events.map((event) => event.id);
            const placeholders = eventIds.map((_, index) => `$${index + 1}`).join(',');
            const attendees = await getMany(
                `SELECT ea.event_id, ea.user_id, ea.status, ea.responded_at,
                        u.name AS user_name, u.avatar_url AS user_avatar, u.department AS user_department
                 FROM event_attendees ea
                 JOIN users u ON u.id = ea.user_id
                 WHERE ea.event_id IN (${placeholders})
                 ORDER BY ea.responded_at DESC`,
                eventIds
            );

            const attendeeMap = new Map<string, any[]>();
            for (const attendee of attendees) {
                if (!attendeeMap.has(attendee.event_id)) attendeeMap.set(attendee.event_id, []);
                attendeeMap.get(attendee.event_id)!.push(attendee);
            }

            for (const event of events) {
                (event as any).attendees = attendeeMap.get(event.id) || [];
            }
        }

        return NextResponse.json({ success: true, data: events });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST /api/events - Yeni etkinlik oluştur
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const { club_id, title, description, location, online_link, start_time, end_time } = await request.json();

        if (!club_id || !title || !start_time || !end_time) {
            return NextResponse.json({ success: false, error: 'Zorunlu alanlar eksik.' }, { status: 400 });
        }

        // Yetki: kulüp admini veya sistem admini
        const membership = await getOne(
            `SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2 AND membership_status = 'approved'`,
            [club_id, user.id]
        );

        if (user.role !== 'admin' && membership?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Etkinlik oluşturmak için kulüp yöneticisi olmalısınız.' }, { status: 403 });
        }

        const result = await query(
            `INSERT INTO events (club_id, created_by, title, description, location, online_link, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [club_id, user.id, title, description || null, location || null, online_link || null, start_time, end_time]
        );

        return NextResponse.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
