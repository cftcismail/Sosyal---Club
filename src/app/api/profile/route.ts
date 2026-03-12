import { NextResponse } from 'next/server';
import { getOne, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/profile - Kullanıcı profili
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const profile = await getOne(
            `SELECT id, email, name, department, title, avatar_url, avatar_preset, avatar_background, phone, bio, interests, role, created_at
             FROM users WHERE id = $1`,
            [user.id]
        );

        return NextResponse.json({ success: true, data: profile });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PATCH /api/profile - Profil güncelle
export async function PATCH(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const body = await request.json();
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        const allowed = ['name', 'department', 'title', 'avatar_url', 'avatar_preset', 'avatar_background', 'phone', 'bio'];
        for (const key of allowed) {
            if (body[key] !== undefined) {
                fields.push(`${key} = $${paramIndex++}`);
                values.push(body[key]);
            }
        }

        if (body.interests !== undefined) {
            fields.push(`interests = $${paramIndex++}`);
            values.push(body.interests);
        }

        if (fields.length === 0) {
            return NextResponse.json({ success: false, error: 'Güncellenecek alan yok.' }, { status: 400 });
        }

        values.push(user.id);
        const result = await query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
             RETURNING id, email, name, department, title, avatar_url, avatar_preset, avatar_background, phone, bio, interests, role, created_at`,
            values
        );

        return NextResponse.json({ success: true, data: result.rows[0], message: 'Profil güncellendi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
