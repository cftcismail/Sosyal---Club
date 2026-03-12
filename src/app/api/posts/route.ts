import { NextResponse } from 'next/server';
import { getMany, query, getOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/posts?club_id=xxx - Gönderileri listele
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const clubId = searchParams.get('club_id');
        const user = await getCurrentUser();

        let sql = `
      SELECT p.*,
        u.name AS author_name,
        u.avatar_url AS author_avatar,
        u.department AS author_department,
        c.name AS club_name,
        c.slug AS club_slug,
        COUNT(DISTINCT l.id) AS like_count,
        COUNT(DISTINCT co.id) AS comment_count
    `;

        const params: any[] = [];

        if (user) {
            params.push(user.id);
            sql += `,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) AS is_liked
      `;
        }

        sql += `
      FROM posts p
      JOIN users u ON u.id = p.user_id
      JOIN clubs c ON c.id = p.club_id
      LEFT JOIN likes l ON l.post_id = p.id
      LEFT JOIN comments co ON co.post_id = p.id
    `;

        if (clubId) {
            params.push(clubId);
            sql += ` WHERE p.club_id = $${params.length}`;
        } else if (user) {
            // Sadece üye olduğu kulüplerin gönderileri
            sql += `
        WHERE p.club_id IN (
          SELECT club_id FROM club_members WHERE user_id = $1 AND membership_status = 'approved'
        )
      `;
        }

        sql += `
      GROUP BY p.id, u.name, u.avatar_url, u.department, c.name, c.slug
      ORDER BY p.is_pinned DESC, p.created_at DESC
      LIMIT 50
    `;

        const posts = await getMany(sql, params);
        return NextResponse.json({ success: true, data: posts });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST /api/posts - Yeni gönderi
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const { club_id, content, is_announcement } = await request.json();
        if (!club_id || !content) {
            return NextResponse.json({ success: false, error: 'Kulüp ve içerik zorunludur.' }, { status: 400 });
        }

        // Üyelik kontrolü
        const membership = await getOne(
            `SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2 AND membership_status = 'approved'`,
            [club_id, user.id]
        );

        if (!membership) {
            return NextResponse.json({ success: false, error: 'Bu kulübe üye değilsiniz.' }, { status: 403 });
        }

        // Duyuru sadece kulüp admini veya sistem admini yapabilir
        const canAnnounce = is_announcement && (membership.role === 'admin' || user.role === 'admin');

        const result = await query(
            `INSERT INTO posts (club_id, user_id, content, is_announcement, is_pinned)
       VALUES ($1, $2, $3, $4, $4)
       RETURNING *`,
            [club_id, user.id, content, canAnnounce || false]
        );

        return NextResponse.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
