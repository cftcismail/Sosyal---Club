import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST /api/events/[id]/rsvp - Etkinliğe RSVP
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const { status } = await request.json();
        if (!['attending', 'declined', 'maybe'].includes(status)) {
            return NextResponse.json({ success: false, error: 'Geçersiz durum.' }, { status: 400 });
        }

        await query(
            `INSERT INTO event_attendees (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET status = $3, responded_at = NOW()`,
            [params.id, user.id, status]
        );

        const statsResult = await query(
            `SELECT
                COUNT(*) FILTER (WHERE status = 'attending') AS attending_count,
                COUNT(*) FILTER (WHERE status = 'maybe') AS maybe_count,
                COUNT(*) FILTER (WHERE status = 'declined') AS declined_count
             FROM event_attendees
             WHERE event_id = $1`,
            [params.id]
        );

        const attendeesResult = await query(
            `SELECT ea.user_id, ea.status, ea.responded_at,
                    u.name AS user_name, u.email AS user_email, u.avatar_url AS user_avatar, u.department AS user_department
             FROM event_attendees ea
             JOIN users u ON u.id = ea.user_id
             WHERE ea.event_id = $1
             ORDER BY ea.responded_at DESC`,
            [params.id]
        );

        const labels: Record<string, string> = {
            attending: 'Katılıyorum',
            declined: 'Katılmıyorum',
            maybe: 'Belki',
        };

        return NextResponse.json({
            success: true,
            message: `Yanıtınız: ${labels[status]}`,
            data: {
                my_rsvp: status,
                attending_count: Number(statsResult.rows[0]?.attending_count || 0),
                maybe_count: Number(statsResult.rows[0]?.maybe_count || 0),
                declined_count: Number(statsResult.rows[0]?.declined_count || 0),
                attendees: attendeesResult.rows,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
