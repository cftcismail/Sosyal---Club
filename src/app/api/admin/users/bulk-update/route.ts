import { NextResponse } from 'next/server';
import { query, getOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type Row = { email: string; name?: string; department?: string; title?: string };

async function ensureCanonicalTables() {
    await query(`
        CREATE TABLE IF NOT EXISTS departments (
            id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text)::uuid),
            name VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS titles (
            id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text)::uuid),
            name VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `);
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });
        await ensureCanonicalTables();

        const { rows } = await request.json();
        if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ success: false, error: 'Rows required.' }, { status: 400 });

        let updated = 0;
        let insertedDepartments = 0;
        let insertedTitles = 0;

        for (const r of rows as Row[]) {
            const email = String(r.email || '').trim().toLowerCase();
            if (!email) continue;

            const department = r.department?.trim() || null;
            const title = r.title?.trim() || null;

            if (department) {
                await query(`INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [department]);
                insertedDepartments++;
            }
            if (title) {
                await query(`INSERT INTO titles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [title]);
                insertedTitles++;
            }

            const existing = await getOne('SELECT id FROM users WHERE lower(email) = $1', [email]);
            if (!existing) continue;

            const sets: string[] = [];
            const vals: any[] = [];
            let idx = 1;
            if (department !== null) { sets.push(`department = $${idx++}`); vals.push(department); }
            if (title !== null) { sets.push(`title = $${idx++}`); vals.push(title); }
            if (sets.length === 0) continue;
            vals.push(existing.id);
            await query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}`, vals);
            updated++;
        }

        return NextResponse.json({ success: true, message: `Güncellenen kullanıcı: ${updated}. Eklenen/işlenen departman: ${insertedDepartments}, unvan: ${insertedTitles}` });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
