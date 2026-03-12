import { NextResponse } from 'next/server';
import { getMany, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/admin/departments - Departmanları listele
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const departments = await getMany(`
            SELECT
                department AS name,
                COUNT(*) AS user_count,
                COUNT(*) FILTER (WHERE role = 'admin') AS admin_count,
                COUNT(*) FILTER (WHERE role = 'club_admin') AS club_admin_count,
                COUNT(*) FILTER (WHERE role = 'member') AS member_count
            FROM users
            WHERE department IS NOT NULL AND department <> ''
            GROUP BY department
            ORDER BY department
        `);

        return NextResponse.json({ success: true, data: departments });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PATCH /api/admin/departments - Departmanı yeniden adlandır
export async function PATCH(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { old_name, new_name } = await request.json();

        if (!old_name || !new_name?.trim()) {
            return NextResponse.json({ success: false, error: 'Geçerli bir departman adı giriniz.' }, { status: 400 });
        }

        const trimmed = new_name.trim();
        if (trimmed.length > 100) {
            return NextResponse.json({ success: false, error: 'Departman adı en fazla 100 karakter olabilir.' }, { status: 400 });
        }

        await query(
            `UPDATE users SET department = $1 WHERE department = $2`,
            [trimmed, old_name]
        );

        return NextResponse.json({ success: true, message: `"${old_name}" → "${trimmed}" olarak güncellendi.` });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/departments - Departmanı kaldır (kullanıcıların departmanını null yap)
export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        }

        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ success: false, error: 'Departman adı gerekli.' }, { status: 400 });
        }

        await query(`UPDATE users SET department = NULL WHERE department = $1`, [name]);

        return NextResponse.json({ success: true, message: `"${name}" departmanı kaldırıldı.` });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
