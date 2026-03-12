import { NextResponse } from 'next/server';
import { query, getOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST /api/posts/[id]/like - Beğen / beğeniyi kaldır (toggle)
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const existing = await getOne(
            'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
            [params.id, user.id]
        );

        if (existing) {
            await query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [params.id, user.id]);
            return NextResponse.json({ success: true, liked: false });
        }

        await query(
            'INSERT INTO likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [params.id, user.id]
        );

        return NextResponse.json({ success: true, liked: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
