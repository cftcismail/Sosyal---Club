import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ success: false, error: 'Yetkiniz yok.' }, { status: 403 });

        const { names } = await request.json();
        if (!Array.isArray(names) || names.length === 0) return NextResponse.json({ success: false, error: 'İsim listesi gerekli.' }, { status: 400 });

        let inserted = 0;
        for (let n of names) {
            const name = String(n || '').trim();
            if (!name) continue;
            await query(`INSERT INTO titles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
            inserted++;
        }

        return NextResponse.json({ success: true, message: `${inserted} unvan işlendi.` });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
