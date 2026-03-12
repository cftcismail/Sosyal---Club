'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Shield,
    Users,
    FileText,
    Calendar,
    UserCheck,
    Check,
    X,
    Clock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Stats {
    total_users: number;
    total_clubs: number;
    total_posts: number;
    upcoming_events: number;
    pending_clubs: any[];
}

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') { router.push('/login'); return; }
        if (status === 'authenticated') {
            const user = session?.user as any;
            if (user?.role !== 'admin') { router.push('/dashboard'); return; }
            loadStats();
        }
    }, [status]);

    const loadStats = async () => {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.success) setStats(data.data);
        setLoading(false);
    };

    const handleClubAction = async (clubId: string, action: 'active' | 'archived') => {
        const res = await fetch(`/api/clubs/${clubId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: action }),
        });
        const data = await res.json();
        if (data.success) loadStats();
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!stats) return null;

    const statCards = [
        { label: 'Toplam Kullanıcı', value: stats.total_users, icon: Users, color: 'bg-blue-500' },
        { label: 'Aktif Kulüp', value: stats.total_clubs, icon: UserCheck, color: 'bg-green-500' },
        { label: 'Toplam Gönderi', value: stats.total_posts, icon: FileText, color: 'bg-purple-500' },
        { label: 'Yaklaşan Etkinlik', value: stats.upcoming_events, icon: Calendar, color: 'bg-orange-500' },
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-orange-500" />
                    Admin Paneli
                </h1>
                <p className="text-gray-500 mt-1">Platform istatistikleri ve yönetim.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{value}</p>
                                <p className="text-xs text-gray-500">{label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pending Clubs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-bold text-gray-900">Onay Bekleyen Kulüpler</h2>
                    <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {stats.pending_clubs.length}
                    </span>
                </div>

                {stats.pending_clubs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Onay bekleyen kulüp yok.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {stats.pending_clubs.map((club: any) => (
                            <div key={club.id} className="p-5 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{club.name}</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">{club.description}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Başvuran: {club.creator_name} · {formatDate(club.created_at)}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleClubAction(club.id, 'active')}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition"
                                    >
                                        <Check className="w-4 h-4" /> Onayla
                                    </button>
                                    <button
                                        onClick={() => handleClubAction(club.id, 'archived')}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                                    >
                                        <X className="w-4 h-4" /> Reddet
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
