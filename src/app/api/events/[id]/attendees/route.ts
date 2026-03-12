import { NextResponse } from 'next/server';
import { getMany } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/events/[id]/attendees - List attendees for an event
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const attendees = await getMany(
            `SELECT ea.status, ea.responded_at,
                u.id AS user_id, u.name, u.avatar_url, u.department
             FROM event_attendees ea
             JOIN users u ON u.id = ea.user_id
             WHERE ea.event_id = $1
             ORDER BY ea.status, u.name`,
            [params.id]
        );

        return NextResponse.json({ success: true, data: attendees });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
