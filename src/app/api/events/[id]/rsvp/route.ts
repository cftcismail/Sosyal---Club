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

        const labels: Record<string, string> = {
            attending: 'Katılıyorum',
            declined: 'Katılmıyorum',
            maybe: 'Belki',
        };

        return NextResponse.json({
            success: true,
            message: `Yanıtınız: ${labels[status]}`,
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
