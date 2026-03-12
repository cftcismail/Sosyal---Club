import { NextResponse } from 'next/server';
import { getOne, query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ success: false, error: 'E-posta gereklidir.' }, { status: 400 });
        }

        const user = await getOne<{ id: string; email: string; name: string }>(
            'SELECT id, email, name FROM users WHERE email = $1 AND is_active = true',
            [email]
        );

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({
                success: true,
                message: 'E-posta adresinize şifre sıfırlama bağlantısı gönderildi.',
            });
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Delete old tokens for this user
        await query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

        // Insert new token
        await query(
            'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (gen_random_uuid(), $1, $2, $3)',
            [user.id, token, expiresAt.toISOString()]
        );

        // In production, send email with: /reset-password?token=<token>
        // For development/demo, return the token in response
        const resetUrl = `/reset-password?token=${token}`;

        console.log(`[Password Reset] User: ${user.email}, URL: ${resetUrl}`);

        return NextResponse.json({
            success: true,
            message: 'E-posta adresinize şifre sıfırlama bağlantısı gönderildi.',
            // DEV ONLY: Remove in production
            dev_reset_url: resetUrl,
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ success: false, error: 'Sunucu hatası.' }, { status: 500 });
    }
}
