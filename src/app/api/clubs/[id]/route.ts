import { NextResponse } from 'next/server';
import { getOne, getMany, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/clubs/[id] - Kulüp detayı
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        const { id } = params;

        // Slug veya UUID ile ara
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const whereClause = isUuid ? 'c.id = $1' : 'c.slug = $1';

        let sql = `
      SELECT c.*,
        COUNT(DISTINCT cm.id) FILTER (WHERE cm.membership_status = 'approved') AS member_count,
        u.name AS creator_name
    `;

        const queryParams: any[] = [id];

        if (user) {
            queryParams.push(user.id);
            sql += `,
        EXISTS(
          SELECT 1 FROM club_members WHERE club_id = c.id AND user_id = $2 AND membership_status = 'approved'
        ) AS is_member,
                (SELECT role FROM club_members WHERE club_id = c.id AND user_id = $2 AND membership_status = 'approved') AS my_role,
                (SELECT membership_status FROM club_members WHERE club_id = c.id AND user_id = $2) AS my_membership_status
      `;
        }

        sql += `
      FROM clubs c
      LEFT JOIN club_members cm ON cm.club_id = c.id
      LEFT JOIN users u ON u.id = c.created_by
      WHERE ${whereClause}
      GROUP BY c.id, u.name
    `;

        const club = await getOne(sql, queryParams);
        if (!club) {
            return NextResponse.json({ success: false, error: 'Kulüp bulunamadı.' }, { status: 404 });
        }

        const deletionRequest = await getOne(
            `SELECT id, status FROM club_deletion_requests
             WHERE club_id = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [club.id]
        );

        // Üyeleri getir
        const members = await getMany(
            `SELECT cm.*, 
                u.name AS user_name, 
                u.email AS user_email, 
                u.department AS user_department, 
                u.title AS user_title,
                u.avatar_url AS user_avatar,
                u.avatar_preset AS user_avatar_preset,
                u.avatar_background AS user_avatar_background,
                u.avatar_variant AS user_avatar_variant
       FROM club_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.club_id = $1 AND cm.membership_status = 'approved'
       ORDER BY cm.role DESC, cm.joined_at`,
            [club.id]
        );

        // Bekleyen üyeleri getir
        const pending_members = await getMany(
            `SELECT cm.*, 
                u.name AS user_name, 
                u.email AS user_email, 
                u.department AS user_department,
                u.avatar_url AS user_avatar,
                u.avatar_preset AS user_avatar_preset,
                u.avatar_background AS user_avatar_background,
                u.avatar_variant AS user_avatar_variant
       FROM club_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.club_id = $1 AND cm.membership_status = 'pending'
       ORDER BY cm.joined_at`,
            [club.id]
        );

        return NextResponse.json({
            success: true,
            data: {
                ...club,
                members,
                pending_members,
                deletion_request_id: deletionRequest?.id || null,
                deletion_request_status: deletionRequest?.status || null,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE /api/clubs/[id] - Kulübü sil
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
        }

        const { id } = params;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const existing = await getOne(
            `SELECT id, name FROM clubs WHERE ${isUuid ? 'id = $1' : 'slug = $1'}`,
            [id]
        );

        if (!existing) {
            return NextResponse.json({ success: false, error: 'Kulüp bulunamadı.' }, { status: 404 });
        }

        await query('DELETE FROM clubs WHERE id = $1', [existing.id]);
        return NextResponse.json({ success: true, message: 'Kulüp silindi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PATCH /api/clubs/[id] - Kulüp güncelle
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();

        // Yetki kontrolü: kulüp admini veya sistem admini
        const membership = await getOne(
            `SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2 AND membership_status = 'approved'`,
            [id, user.id]
        );

        if (user.role !== 'admin' && membership?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
        }

        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (body.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(body.name); }
        if (body.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(body.description); }
        if (body.is_public !== undefined) { fields.push(`is_public = $${paramIndex++}`); values.push(body.is_public); }
        if (body.logo_url !== undefined) { fields.push(`logo_url = $${paramIndex++}`); values.push(body.logo_url); }
        if (body.cover_image !== undefined) { fields.push(`cover_image = $${paramIndex++}`); values.push(body.cover_image); }
        if (body.status !== undefined && user.role === 'admin') {
            fields.push(`status = $${paramIndex++}`); values.push(body.status);
        }

        if (fields.length === 0) {
            return NextResponse.json({ success: false, error: 'Güncellenecek alan yok.' }, { status: 400 });
        }

        values.push(id);
        const result = await query(
            `UPDATE clubs SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        return NextResponse.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
