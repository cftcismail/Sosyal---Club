'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Building, Briefcase, Tag, Users } from 'lucide-react';

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
    }, [status]);

    if (status === 'loading') return null;

    const user = session?.user as any;

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Profilim</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Avatar & Name */}
                <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700 relative">
                    <div className="absolute -bottom-10 left-6">
                        <div className="w-20 h-20 bg-white rounded-full border-4 border-white flex items-center justify-center">
                            <div className="w-full h-full bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-2xl font-bold">
                                {user?.name?.charAt(0) || '?'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-14 p-6">
                    <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>

                    <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-3 text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{user?.email}</span>
                        </div>
                        {user?.department && (
                            <div className="flex items-center gap-3 text-gray-600">
                                <Building className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{user?.department}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-gray-600">
                            <Tag className="w-4 h-4 text-gray-400" />
                            <span className="text-sm capitalize">
                                {user?.role === 'admin' ? 'Sistem Yöneticisi' : 'Standart Üye'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <Link
                            href="/clubs"
                            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                            <Users className="w-4 h-4" />
                            Kulüplerimi Gör
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
