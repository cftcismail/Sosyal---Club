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
            `SELECT id, email, name, department, title, avatar_url, avatar_preset, avatar_background, avatar_variant, phone, bio, interests, role, created_at
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

        const validateMax = (value: any, max: number, fieldLabel: string) => {
            if (value === null || value === undefined) return null;
            if (typeof value !== 'string') {
                return `${fieldLabel} geçersiz.`;
            }
            if (value.length > max) {
                return `${fieldLabel} en fazla ${max} karakter olabilir.`;
            }
            return null;
        };

        const nameErr = validateMax(body.name, 150, 'Ad Soyad');
        if (nameErr) return NextResponse.json({ success: false, error: nameErr }, { status: 400 });
        const deptErr = validateMax(body.department, 100, 'Departman');
        if (deptErr) return NextResponse.json({ success: false, error: deptErr }, { status: 400 });
        const titleErr = validateMax(body.title, 100, 'Unvan');
        if (titleErr) return NextResponse.json({ success: false, error: titleErr }, { status: 400 });
        const phoneErr = validateMax(body.phone, 20, 'Telefon');
        if (phoneErr) return NextResponse.json({ success: false, error: phoneErr }, { status: 400 });
        const presetErr = validateMax(body.avatar_preset, 20, 'Avatar tipi');
        if (presetErr) return NextResponse.json({ success: false, error: presetErr }, { status: 400 });
        const bgErr = validateMax(body.avatar_background, 20, 'Avatar arka plan');
        if (bgErr) return NextResponse.json({ success: false, error: bgErr }, { status: 400 });
        if (body.avatar_variant !== undefined && body.avatar_variant !== null) {
            const n = Number(body.avatar_variant);
            if (!Number.isInteger(n) || n < 0 || n > 14) {
                return NextResponse.json({ success: false, error: 'Avatar varyantı geçersiz.' }, { status: 400 });
            }
            body.avatar_variant = n;
        }
        const bioErr = validateMax(body.bio, 2000, 'Hakkımda');
        if (bioErr) return NextResponse.json({ success: false, error: bioErr }, { status: 400 });

        if (body.avatar_url !== undefined && body.avatar_url !== null) {
            if (typeof body.avatar_url !== 'string') {
                return NextResponse.json({ success: false, error: 'Avatar URL geçersiz.' }, { status: 400 });
            }
            if (body.avatar_url.startsWith('data:')) {
                // Hazır avatarlar data URL olarak üretildiğinde DB'ye yazmayalım.
                delete body.avatar_url;
            } else if (body.avatar_url.length > 500) {
                return NextResponse.json({ success: false, error: 'Avatar URL çok uzun.' }, { status: 400 });
            }
        }

        if (body.interests !== undefined && body.interests !== null) {
            if (!Array.isArray(body.interests) || body.interests.some((x: any) => typeof x !== 'string')) {
                return NextResponse.json({ success: false, error: 'İlgi alanları geçersiz.' }, { status: 400 });
            }
        }

        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        const allowed = ['name', 'department', 'title', 'avatar_url', 'avatar_preset', 'avatar_background', 'avatar_variant', 'phone', 'bio'];
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
            `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}
             RETURNING id, email, name, department, title, avatar_url, avatar_preset, avatar_background, avatar_variant, phone, bio, interests, role, created_at`,
            values
        );

        return NextResponse.json({ success: true, data: result.rows[0], message: 'Profil güncellendi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
