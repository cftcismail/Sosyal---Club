import { NextResponse } from 'next/server';
import { getMany, query, getOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET /api/clubs - Tüm kulüpleri listele
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'active';
        const search = searchParams.get('search');
        const user = await getCurrentUser();

        let sql = `
      SELECT c.*,
        COUNT(DISTINCT cm.id) FILTER (WHERE cm.membership_status = 'approved') AS member_count,
        u.name AS creator_name
    `;

        if (user) {
            sql += `,
        EXISTS(
          SELECT 1 FROM club_members WHERE club_id = c.id AND user_id = $2 AND membership_status = 'approved'
        ) AS is_member,
        EXISTS(
          SELECT 1 FROM club_members WHERE club_id = c.id AND user_id = $2 AND membership_status = 'pending'
        ) AS is_pending
      `;
        }

        sql += `
      FROM clubs c
      LEFT JOIN club_members cm ON cm.club_id = c.id
      LEFT JOIN users u ON u.id = c.created_by
      WHERE c.status = $1
    `;

        const params: any[] = [status];
        if (user) params.push(user.id);

        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (c.name ILIKE $${params.length} OR c.description ILIKE $${params.length})`;
        }

        sql += ` GROUP BY c.id, u.name ORDER BY c.created_at DESC`;

        const clubs = await getMany(sql, params);
        return NextResponse.json({ success: true, data: clubs });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST /api/clubs - Yeni kulüp oluştur
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const { name, description, is_public } = await request.json();
        if (!name) {
            return NextResponse.json({ success: false, error: 'Kulüp adı zorunludur.' }, { status: 400 });
        }

        const slug = slugify(name);
        const existing = await getOne('SELECT id FROM clubs WHERE slug = $1', [slug]);
        if (existing) {
            return NextResponse.json({ success: false, error: 'Bu isimde bir kulüp zaten mevcut.' }, { status: 409 });
        }

        // Admin ise direkt aktif, değilse onay bekliyor
        const status = user.role === 'admin' ? 'active' : 'pending';

        const result = await query(
            `INSERT INTO clubs (name, slug, description, is_public, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [name, slug, description || null, is_public !== false, status, user.id]
        );

        const club = result.rows[0];

        // Kurucu kişiyi otomatik olarak kulüp admini yap
        await query(
            `INSERT INTO club_members (club_id, user_id, role, membership_status)
       VALUES ($1, $2, 'admin', 'approved')`,
            [club.id, user.id]
        );

        return NextResponse.json({
            success: true,
            data: club,
            message: status === 'active' ? 'Kulüp oluşturuldu!' : 'Kulüp başvurunuz onay bekliyor.',
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
