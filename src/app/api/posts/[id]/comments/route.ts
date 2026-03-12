import { NextResponse } from 'next/server';
import { query, getMany } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/posts/[id]/comments
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const comments = await getMany(
            `SELECT co.*, 
                u.name AS author_name, 
                u.avatar_url AS author_avatar,
                u.avatar_preset AS author_avatar_preset,
                u.avatar_background AS author_avatar_background,
                u.avatar_variant AS author_avatar_variant
       FROM comments co
       JOIN users u ON u.id = co.user_id
       WHERE co.post_id = $1
       ORDER BY co.created_at ASC`,
            [params.id]
        );
        return NextResponse.json({ success: true, data: comments });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST /api/posts/[id]/comments
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const { content } = await request.json();
        if (!content) {
            return NextResponse.json({ success: false, error: 'Yorum içeriği zorunludur.' }, { status: 400 });
        }

        const result = await query(
            `INSERT INTO comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [params.id, user.id, content]
        );

        // Return full comment with author info for real-time display
        const comment = {
            ...result.rows[0],
            author_name: user.name,
            author_avatar: user.avatar_url,
            author_avatar_preset: user.avatar_preset,
            author_avatar_background: user.avatar_background,
            author_avatar_variant: user.avatar_variant,
        };

        return NextResponse.json({ success: true, data: comment });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
