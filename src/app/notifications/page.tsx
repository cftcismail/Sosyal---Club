'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { Notification } from '@/types';

export default function NotificationsPage() {
    const { status } = useSession();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') { router.push('/login'); return; }
        if (status === 'authenticated') loadNotifications();
    }, [status]);

    const loadNotifications = async () => {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (data.success) setNotifications(data.data);
        setLoading(false);
    };

    const markAllRead = async () => {
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    };

    if (status === 'loading' || loading) return null;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="w-6 h-6 text-primary-600" />
                    Bildirimler
                </h1>
                {notifications.some((n) => !n.is_read) && (
                    <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                    >
                        <CheckCheck className="w-4 h-4" /> Tümünü Okundu İşaretle
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Henüz bildiriminiz yok.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`p-4 flex items-start gap-3 ${!n.is_read ? 'bg-primary-50/50' : ''}`}
                        >
                            <div
                                className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.is_read ? 'bg-gray-300' : 'bg-primary-500'
                                    }`}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900">{n.title}</p>
                                {n.message && <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>}
                                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
