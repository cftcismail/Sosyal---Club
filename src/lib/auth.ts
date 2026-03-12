import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function getSession() {
    return getServerSession(authOptions);
}

export async function getCurrentUser() {
    const session = await getSession();
    if (!session?.user) return null;
    return session.user as {
        id: string;
        email: string;
        name: string;
        role: string;
        department: string;
        image?: string;
    };
}
