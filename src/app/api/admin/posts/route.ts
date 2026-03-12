import { NextResponse } from 'next/server';
import { getMany, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/admin/posts - List all posts
export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const clubId = searchParams.get('club_id');

        let sql = `
            SELECT p.id, p.content, p.is_announcement, p.created_at,
                u.name AS author_name, u.email AS author_email,
                c.name AS club_name, c.slug AS club_slug,
                COUNT(DISTINCT l.id) AS like_count,
                COUNT(DISTINCT co.id) AS comment_count
            FROM posts p
            JOIN users u ON u.id = p.user_id
            JOIN clubs c ON c.id = p.club_id
            LEFT JOIN likes l ON l.post_id = p.id
            LEFT JOIN comments co ON co.post_id = p.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (p.content ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
        }
        if (clubId) {
            params.push(clubId);
            sql += ` AND p.club_id = $${params.length}`;
        }

        sql += ` GROUP BY p.id, u.name, u.email, c.name, c.slug ORDER BY p.created_at DESC LIMIT 100`;

        const posts = await getMany(sql, params);
        return NextResponse.json({ success: true, data: posts });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/posts?id=xxx - Delete a post
export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const postId = searchParams.get('id');
        if (!postId) {
            return NextResponse.json({ success: false, error: 'Post ID gerekli.' }, { status: 400 });
        }

        await query('DELETE FROM posts WHERE id = $1', [postId]);
        return NextResponse.json({ success: true, message: 'Gönderi silindi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
