import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getOne, query } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { email, password, name, department, title } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json(
                { success: false, error: 'E-posta, şifre ve isim zorunludur.' },
                { status: 400 }
            );
        }

        const existing = await getOne('SELECT id FROM users WHERE email = $1', [email]);
        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Bu e-posta adresi zaten kayıtlı.' },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const result = await query(
            `INSERT INTO users (email, password_hash, name, department, title)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name`,
            [email, passwordHash, name, department || null, title || null]
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
            message: 'Kayıt başarılı!',
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Kayıt sırasında bir hata oluştu.' },
            { status: 500 }
        );
    }
}
