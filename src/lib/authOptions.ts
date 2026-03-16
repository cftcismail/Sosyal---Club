import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getOne } from '@/lib/db';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'E-posta', type: 'email' },
                password: { label: 'Şifre', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await getOne<{
                    id: string;
                    email: string;
                    name: string;
                    password_hash: string;
                    role: string;
                    department: string;
                    avatar_url: string;
                }>(
                    'SELECT id, email, name, password_hash, role, department, avatar_url FROM users WHERE email = $1 AND is_active = true',
                    [credentials.email]
                );

                if (!user) return null;

                const isValid = await bcrypt.compare(credentials.password, user.password_hash);
                if (!isValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    department: user.department,
                    image: user.avatar_url,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.department = (user as any).department;
                token.image = (user as any).image || null;
                (token as any).avatar_url = (user as any).image || null;
            }

            if (trigger === 'update' && session) {
                if ((session as any).department !== undefined) {
                    token.department = (session as any).department;
                }
                if ((session as any).avatar_url !== undefined) {
                    (token as any).avatar_url = (session as any).avatar_url;
                    token.image = (session as any).avatar_url;
                }
                if ((session as any).image !== undefined) {
                    token.image = (session as any).image;
                    (token as any).avatar_url = (session as any).image;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).department = token.department;
                (session.user as any).avatar_url = (token as any).avatar_url || token.image || null;
                session.user.image = ((token as any).avatar_url || token.image || null) as string | null;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
};
