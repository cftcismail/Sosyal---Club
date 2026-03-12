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
        const status = searchParams.get('status');

        let sql = `
            SELECT c.id, c.name, c.slug, c.description, c.status, c.is_public, c.created_at,
                   c.created_by, u.name AS creator_name,
                   COUNT(DISTINCT cm.id) FILTER (WHERE cm.membership_status = 'approved') AS member_count,
                   dr.id AS deletion_request_id,
                   dr.status AS deletion_request_status,
                   dr.reason AS deletion_request_reason,
                   ru.name AS deletion_requester_name,
                   dr.created_at AS deletion_requested_at
            FROM clubs c
            JOIN users u ON u.id = c.created_by
            LEFT JOIN club_members cm ON cm.club_id = c.id
            LEFT JOIN LATERAL (
                SELECT cdr.*
                FROM club_deletion_requests cdr
                WHERE cdr.club_id = c.id
                ORDER BY cdr.created_at DESC
                LIMIT 1
            ) dr ON true
            LEFT JOIN users ru ON ru.id = dr.requested_by
            WHERE 1 = 1
        `;
        const params: any[] = [];

        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (c.name ILIKE $${params.length} OR c.description ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
        }

        if (status) {
            params.push(status);
            sql += ` AND c.status = $${params.length}`;
        }

        sql += `
            GROUP BY c.id, u.name, dr.id, dr.status, dr.reason, dr.created_at, ru.name
            ORDER BY c.created_at DESC
        `;
        const clubs = await getMany(sql, params);
        return NextResponse.json({ success: true, data: clubs });
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

        const { club_id } = await request.json();
        if (!club_id) {
            return NextResponse.json({ success: false, error: 'Kulüp ID gerekli.' }, { status: 400 });
        }

        const existing = await getOne('SELECT id FROM clubs WHERE id = $1', [club_id]);
        if (!existing) {
            return NextResponse.json({ success: false, error: 'Kulüp bulunamadı.' }, { status: 404 });
        }

        await query('DELETE FROM clubs WHERE id = $1', [club_id]);
        return NextResponse.json({ success: true, message: 'Kulüp silindi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}