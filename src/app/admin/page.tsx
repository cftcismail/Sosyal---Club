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
    Search,
    Filter,
    Key,
    Download,
    ChevronDown,
    ChevronUp,
    MoreVertical,
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
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'clubs'>('dashboard');
    const [users, setUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [userDeptFilter, setUserDeptFilter] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [passwordModal, setPasswordModal] = useState<{ userId: string; userName: string } | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);

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

    const loadUsers = async () => {
        setLoadingUsers(true);
        const params = new URLSearchParams();
        if (userSearch) params.set('search', userSearch);
        if (userDeptFilter) params.set('department', userDeptFilter);
        if (userRoleFilter) params.set('role', userRoleFilter);

        const res = await fetch(`/api/admin/users?${params}`);
        const data = await res.json();
        if (data.success) {
            setUsers(data.data.users);
            setDepartments(data.data.departments);
        }
        setLoadingUsers(false);
    };

    useEffect(() => {
        if (activeTab === 'users') loadUsers();
    }, [activeTab, userDeptFilter, userRoleFilter]);

    const handleClubAction = async (clubId: string, action: 'active' | 'archived') => {
        const res = await fetch(`/api/clubs/${clubId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: action }),
        });
        const data = await res.json();
        if (data.success) loadStats();
    };

    const handleSetPassword = async () => {
        if (!passwordModal || !newPassword || newPassword.length < 6) return;
        setSavingPassword(true);
        const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: passwordModal.userId, password: newPassword }),
        });
        const data = await res.json();
        setSavingPassword(false);
        if (data.success) {
            alert('Şifre başarıyla değiştirildi.');
            setPasswordModal(null);
            setNewPassword('');
        }
    };

    const handleToggleActive = async (userId: string, currentActive: boolean) => {
        const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, is_active: !currentActive }),
        });
        const data = await res.json();
        if (data.success) loadUsers();
    };

    const handleUserSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadUsers();
    };

    const exportCSV = () => {
        const header = 'Ad,E-posta,Departman,Rol,Kulüp Sayısı,Gönderi Sayısı,Kayıt Tarihi\n';
        const rows = users.map(u =>
            `"${u.name}","${u.email}","${u.department || ''}","${u.role}",${u.club_count},${u.post_count},"${formatDate(u.created_at)}"`
        ).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kullanici-raporu.csv';
        a.click();
        URL.revokeObjectURL(url);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-orange-500" />
                    Admin Paneli
                </h1>
                <p className="text-gray-500 mt-1">Platform istatistikleri ve yönetim.</p>
            </div>

            {/* Admin Tabs */}
            <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-100 mb-6">
                {([
                    { key: 'dashboard', label: 'Dashboard' },
                    { key: 'users', label: 'Kullanıcılar' },
                    { key: 'clubs', label: 'Kulüp Onayları' },
                ] as const).map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition ${activeTab === key ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <form onSubmit={handleUserSearch} className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    placeholder="İsim, e-posta veya departman ara..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                                />
                            </form>
                            <select
                                value={userDeptFilter}
                                onChange={(e) => setUserDeptFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="">Tüm Departmanlar</option>
                                {departments.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <select
                                value={userRoleFilter}
                                onChange={(e) => setUserRoleFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="">Tüm Roller</option>
                                <option value="admin">Admin</option>
                                <option value="member">Üye</option>
                            </select>
                            <button
                                onClick={exportCSV}
                                className="flex items-center gap-1 px-3 py-2 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition"
                            >
                                <Download className="w-4 h-4" /> CSV
                            </button>
                        </div>
                    </div>

                    {/* User List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kullanıcı</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Departman</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rol</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Kulüp</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Gönderi</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Durum</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loadingUsers ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Yükleniyor...</td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Kullanıcı bulunamadı.</td>
                                        </tr>
                                    ) : users.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-xs overflow-hidden">
                                                        {u.avatar_url ? (
                                                            <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            u.name?.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{u.name}</p>
                                                        <p className="text-xs text-gray-500">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{u.department || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {u.role === 'admin' ? 'Admin' : 'Üye'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center text-gray-600">{u.club_count}</td>
                                            <td className="px-4 py-3 text-sm text-center text-gray-600">{u.post_count}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleToggleActive(u.id, u.is_active)}
                                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
                                                >
                                                    {u.is_active ? 'Aktif' : 'Pasif'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => setPasswordModal({ userId: u.id, userName: u.name })}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                                                >
                                                    <Key className="w-3 h-3" /> Şifre
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500">
                            Toplam {users.length} kullanıcı
                        </div>
                    </div>
                </div>
            )}

            {/* Clubs Tab */}
            {activeTab === 'clubs' && (
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
            )}

            {/* Password Modal */}
            {passwordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Şifre Değiştir</h3>
                        <p className="text-sm text-gray-500 mb-4">{passwordModal.userName}</p>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Yeni şifre (min 6 karakter)"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm mb-4"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSetPassword}
                                disabled={savingPassword || newPassword.length < 6}
                                className="flex-1 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                            >
                                {savingPassword ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                            <button
                                onClick={() => { setPasswordModal(null); setNewPassword(''); }}
                                className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
