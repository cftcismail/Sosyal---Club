import { NextResponse } from 'next/server';
import { getMany } from '@/lib/db';

export async function GET() {
    try {
        const rows = await getMany(`SELECT id, name FROM departments ORDER BY name`);
        return NextResponse.json({ success: true, data: rows });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
