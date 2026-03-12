import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });

        const { ids, reassign_to, clear_users } = await request.json();
        if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ success: false, error: 'ID listesi gerekli.' }, { status: 400 });

        let deleted = 0;
        for (const id of ids) {
            const deptRow = (await query(`SELECT name FROM departments WHERE id = $1`, [id])).rows[0];
            if (!deptRow) continue;
            const dept = deptRow.name;
            if (reassign_to) {
                const t = (await query(`SELECT name FROM departments WHERE name = $1`, [String(reassign_to).trim()])).rows[0]?.name;
                if (t) await query(`UPDATE users SET department = $1 WHERE department = $2`, [t, dept]);
            } else if (clear_users) {
                await query(`UPDATE users SET department = NULL WHERE department = $1`, [dept]);
            }
            await query(`DELETE FROM departments WHERE id = $1`, [id]);
            deleted++;
        }

        return NextResponse.json({ success: true, message: `${deleted} departman silindi.` });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
