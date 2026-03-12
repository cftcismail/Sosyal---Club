import { NextResponse } from 'next/server';
import { getMany, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Admin CRUD for canonical departments table
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });

        const rows = await getMany(`
            SELECT
                d.id,
                d.name,
                d.created_at,
                (SELECT COUNT(*) FROM users u WHERE u.department = d.name) AS user_count,
                (SELECT COUNT(*) FROM users u WHERE u.department = d.name AND u.role = 'admin') AS admin_count,
                (SELECT COUNT(*) FROM users u WHERE u.department = d.name AND u.role = 'club_admin') AS club_admin_count,
                (SELECT COUNT(*) FROM users u WHERE u.department = d.name AND u.role = 'member') AS member_count
            FROM departments d
            ORDER BY d.name
        `);
        return NextResponse.json({ success: true, data: rows });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });

        const { name } = await request.json();
        if (!name || !name.trim()) return NextResponse.json({ success: false, error: 'Geçerli isim girin.' }, { status: 400 });
        const trimmed = name.trim().slice(0, 100);
        await query(`INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [trimmed]);
        return NextResponse.json({ success: true, message: 'Departman eklendi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });

        const { id, new_name } = await request.json();
        if (!id || !new_name?.trim()) return NextResponse.json({ success: false, error: 'Eksik parametre' }, { status: 400 });
        const trimmed = new_name.trim().slice(0, 100);
        await query(`UPDATE departments SET name = $1 WHERE id = $2`, [trimmed, id]);
        // Optional: update users who had old name? Keep users' department strings unchanged.
        return NextResponse.json({ success: true, message: 'Departman güncellendi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });

        const { id, clear_users, reassign_to } = await request.json();
        if (!id) return NextResponse.json({ success: false, error: 'ID gerekli' }, { status: 400 });

        // If clear_users true, clear matching user.department strings
        const dept = (await query(`SELECT name FROM departments WHERE id = $1`, [id])).rows[0]?.name;
        if (!dept) return NextResponse.json({ success: false, error: 'Departman bulunamadı.' }, { status: 404 });

        if (reassign_to) {
            // reassign_to expected to be a department name (string)
            const target = String(reassign_to).trim();
            if (target === dept) return NextResponse.json({ success: false, error: 'Aynı departmana yeniden atama yapılamaz.' }, { status: 400 });
            // ensure target exists
            const t = (await query(`SELECT name FROM departments WHERE name = $1`, [target])).rows[0]?.name;
            if (!t) return NextResponse.json({ success: false, error: 'Hedef departman bulunamadı.' }, { status: 400 });
            await query(`UPDATE users SET department = $1 WHERE department = $2`, [t, dept]);
        } else if (clear_users) {
            await query(`UPDATE users SET department = NULL WHERE department = $1`, [dept]);
        }

        await query(`DELETE FROM departments WHERE id = $1`, [id]);
        return NextResponse.json({ success: true, message: 'Departman silindi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
