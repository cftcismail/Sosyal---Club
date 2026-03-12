import { NextResponse } from 'next/server';
import { getMany, query, getOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/admin/users - Kullanıcıları listele
export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const department = searchParams.get('department');
        const role = searchParams.get('role');

        let sql = `
            SELECT u.id, u.email, u.name, u.department, u.title, u.role, u.is_active, u.avatar_url, u.created_at,
                COUNT(DISTINCT cm.id) FILTER (WHERE cm.membership_status = 'approved') AS club_count,
                COUNT(DISTINCT p.id) AS post_count
            FROM users u
            LEFT JOIN club_members cm ON cm.user_id = u.id
            LEFT JOIN posts p ON p.user_id = u.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.department ILIKE $${params.length})`;
        }

        if (department) {
            params.push(department);
            sql += ` AND u.department = $${params.length}`;
        }

        if (role) {
            params.push(role);
            sql += ` AND u.role = $${params.length}`;
        }

        sql += ` GROUP BY u.id ORDER BY u.created_at DESC`;

        const users = await getMany(sql, params);

        // Departman listesi
        const departments = await getMany(`SELECT DISTINCT department FROM users WHERE department IS NOT NULL ORDER BY department`);

        return NextResponse.json({
            success: true,
            data: { users, departments: departments.map(d => d.department) },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PATCH /api/admin/users - Kullanıcı güncelle (şifre, rol, aktiflik)
export async function PATCH(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { user_id, password, role, is_active } = await request.json();

        if (!user_id) {
            return NextResponse.json({ success: false, error: 'Kullanıcı ID gerekli.' }, { status: 400 });
        }

        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (password) {
            const hash = await bcrypt.hash(password, 12);
            fields.push(`password_hash = $${paramIndex++}`);
            values.push(hash);
        }

        if (role !== undefined) {
            fields.push(`role = $${paramIndex++}`);
            values.push(role);
        }

        if (is_active !== undefined) {
            fields.push(`is_active = $${paramIndex++}`);
            values.push(is_active);
        }

        if (fields.length === 0) {
            return NextResponse.json({ success: false, error: 'Güncellenecek alan yok.' }, { status: 400 });
        }

        values.push(user_id);
        await query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
            values
        );

        return NextResponse.json({ success: true, message: 'Kullanıcı güncellendi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/users?id=xxx - Delete a user
export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Kullanıcı ID gerekli.' }, { status: 400 });
        }

        if (userId === user.id) {
            return NextResponse.json({ success: false, error: 'Kendinizi silemezsiniz.' }, { status: 400 });
        }

        await query('DELETE FROM users WHERE id = $1', [userId]);
        return NextResponse.json({ success: true, message: 'Kullanıcı silindi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
