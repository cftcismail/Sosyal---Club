import { NextResponse } from 'next/server';
import { getOne, query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ success: false, error: 'Token ve şifre gereklidir.' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ success: false, error: 'Şifre en az 6 karakter olmalıdır.' }, { status: 400 });
        }

        // Find valid token
        const resetToken = await getOne<{ id: string; user_id: string; expires_at: string }>(
            'SELECT id, user_id, expires_at FROM password_reset_tokens WHERE token = $1 AND used = false',
            [token]
        );

        if (!resetToken) {
            return NextResponse.json({ success: false, error: 'Geçersiz veya kullanılmış bağlantı.' }, { status: 400 });
        }

        // Check expiration
        if (new Date(resetToken.expires_at) < new Date()) {
            return NextResponse.json({ success: false, error: 'Bağlantı süresi dolmuş. Lütfen tekrar deneyin.' }, { status: 400 });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 12);

        // Update password
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, resetToken.user_id]);

        // Mark token as used
        await query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [resetToken.id]);

        return NextResponse.json({
            success: true,
            message: 'Şifreniz başarıyla değiştirildi. Giriş yapabilirsiniz.',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ success: false, error: 'Sunucu hatası.' }, { status: 500 });
    }
}
