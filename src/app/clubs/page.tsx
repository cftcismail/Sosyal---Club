'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ClubCard from '@/components/ClubCard';
import type { Club } from '@/types';
import { Search, Users, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ClubsPage() {
    const { status } = useSession();
    const router = useRouter();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }
        if (status === 'authenticated') loadClubs();
    }, [status]);

    const loadClubs = async (q?: string) => {
        setLoading(true);
        const params = new URLSearchParams({ status: 'active' });
        if (q) params.set('search', q);

        const res = await fetch(`/api/clubs?${params}`);
        const data = await res.json();
        if (data.success) setClubs(data.data);
        setLoading(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadClubs(search);
    };

    const handleJoin = async (clubId: string) => {
        const res = await fetch(`/api/clubs/${clubId}/join`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            loadClubs(search);
            setToast({ message: data.message || 'Başvurunuz gönderildi, onay bekleniyor.', type: 'success' });
        } else {
            setToast({ message: data.error || data.message || 'Bir hata oluştu.', type: data.message ? 'info' : 'error' });
        }
        setTimeout(() => setToast(null), 4000);
    };

    if (status === 'loading') return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-soft text-sm font-medium transition-all animate-slide-up ${toast.type === 'success' ? 'bg-green-600 text-white' :
                    toast.type === 'error' ? 'bg-red-600 text-white' :
                        'bg-blue-600 text-white'
                    }`}>
                    {toast.message}
                </div>
            )}
            <div className="surface p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary-600" />
                        Kulüpler
                    </h1>
                    <p className="text-gray-500 mt-1">Keşfet, katıl ve etkileşime geç.</p>
                </div>
                <Link
                    href="/clubs/new"
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Kulüp Kur
                </Link>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-8">
                <div className="relative max-w-md surface p-1.5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Kulüp ara..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 outline-none"
                    />
                </div>
            </form>

            {/* Club Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
                </div>
            ) : clubs.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Henüz bir kulüp bulunamadı.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clubs.map((club) => (
                        <ClubCard key={club.id} club={club} onJoin={handleJoin} />
                    ))}
                </div>
            )}
        </div>
    );
}
