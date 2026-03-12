import { NextResponse } from 'next/server';
import { getMany, getOne, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        let sql = `
            SELECT p.id, p.content, p.is_announcement, p.is_pinned, p.created_at,
                   u.name AS author_name, c.name AS club_name,
                   COUNT(DISTINCT l.id) AS like_count,
                   COUNT(DISTINCT co.id) AS comment_count
            FROM posts p
            JOIN users u ON u.id = p.user_id
            JOIN clubs c ON c.id = p.club_id
            LEFT JOIN likes l ON l.post_id = p.id
            LEFT JOIN comments co ON co.post_id = p.id
            WHERE 1 = 1
        `;
        const params: any[] = [];

        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (p.content ILIKE $${params.length} OR u.name ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
        }

        sql += ` GROUP BY p.id, u.name, c.name ORDER BY p.created_at DESC LIMIT 100`;
        const posts = await getMany(sql, params);
        return NextResponse.json({ success: true, data: posts });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { post_id } = await request.json();
        if (!post_id) {
            return NextResponse.json({ success: false, error: 'Gönderi ID gerekli.' }, { status: 400 });
        }

        const existing = await getOne('SELECT id FROM posts WHERE id = $1', [post_id]);
        if (!existing) {
            return NextResponse.json({ success: false, error: 'Gönderi bulunamadı.' }, { status: 404 });
        }

        await query('DELETE FROM posts WHERE id = $1', [post_id]);
        return NextResponse.json({ success: true, message: 'Gönderi silindi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}