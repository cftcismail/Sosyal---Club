import { NextResponse } from 'next/server';
import { getMany, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        const rows = await getMany(`SELECT id, name, created_at FROM titles ORDER BY name`);
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
        await query(`INSERT INTO titles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [trimmed]);
        return NextResponse.json({ success: true, message: 'Unvan eklendi.' });
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
        await query(`UPDATE titles SET name = $1 WHERE id = $2`, [trimmed, id]);
        return NextResponse.json({ success: true, message: 'Unvan güncellendi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        const { id, clear_users } = await request.json();
        if (!id) return NextResponse.json({ success: false, error: 'ID gerekli' }, { status: 400 });
        if (clear_users) {
            const title = (await query(`SELECT name FROM titles WHERE id = $1`, [id])).rows[0]?.name;
            if (title) await query(`UPDATE users SET title = NULL WHERE title = $1`, [title]);
        }
        await query(`DELETE FROM titles WHERE id = $1`, [id]);
        return NextResponse.json({ success: true, message: 'Unvan silindi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
