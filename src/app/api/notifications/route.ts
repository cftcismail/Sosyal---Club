import { NextResponse } from 'next/server';
import { getMany, getOne, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/notifications
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const notifications = await getMany(
            `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
            [user.id]
        );

        return NextResponse.json({ success: true, data: notifications });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PATCH /api/notifications - Okundu olarak işaretle
export async function PATCH(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const { id } = await request.json();

        if (id) {
            await query(
                'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
                [id, user.id]
            );
        } else {
            await query(
                'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
                [user.id]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
