import { NextResponse } from 'next/server';
import { query, getMany } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

async function ensureCommentImageColumns() {
    await query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)`);
    await query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS image_name VARCHAR(300)`);
    await query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS image_type VARCHAR(100)`);
}

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

        const { content, image } = await request.json();
        const trimmedContent = typeof content === 'string' ? content.trim() : '';
        const imageUrl = image?.url || null;
        const imageName = image?.name || null;
        const imageType = image?.type || null;

        if (!trimmedContent && !imageUrl) {
            return NextResponse.json({ success: false, error: 'Yorum metni veya görsel zorunludur.' }, { status: 400 });
        }

        await ensureCommentImageColumns();

        const result = await query(
            `INSERT INTO comments (post_id, user_id, content, image_url, image_name, image_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [params.id, user.id, trimmedContent, imageUrl, imageName, imageType]
        );

        // Return full comment with author info for real-time display
        const u: any = user;
        const comment = {
            ...result.rows[0],
            author_name: u.name,
            author_avatar: u.avatar_url || u.image || null,
            author_avatar_preset: u.avatar_preset || null,
            author_avatar_background: u.avatar_background || null,
            author_avatar_variant: u.avatar_variant ?? null,
        };

        return NextResponse.json({ success: true, data: comment });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
