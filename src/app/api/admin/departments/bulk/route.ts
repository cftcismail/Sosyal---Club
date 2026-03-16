import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

async function ensureDepartmentsTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS departments (
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
        await ensureDepartmentsTable();

        const { names } = await request.json();
        if (!Array.isArray(names) || names.length === 0) return NextResponse.json({ success: false, error: 'İsim listesi gerekli.' }, { status: 400 });

        let inserted = 0;
        for (let n of names) {
            const name = String(n || '').trim();
            if (!name) continue;
            await query(`INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
            inserted++;
        }

        return NextResponse.json({ success: true, message: `${inserted} departman işlendi.` });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
