'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
    Home,
    Users,
    Calendar,
    Bell,
    LogOut,
    Menu,
    X,
    Shield,
    Plus,
    User,
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';

type NotificationItem = {
    id: string;
    type: string;
    title: string;
    message?: string | null;
    link?: string | null;
    is_read: boolean;
    created_at: string;
};

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const notifRef = useRef<HTMLDivElement>(null);
    const user = session?.user as any;

    const navLinks = [
        { href: '/dashboard', label: 'Ana Sayfa', icon: Home },
        { href: '/clubs', label: 'Kulüpler', icon: Users },
        { href: '/events', label: 'Etkinlikler', icon: Calendar },
    ];

    const importantTypes = new Set(['membership', 'club_approval', 'announcement']);
    const importantUnread = notifications.filter((n) => !n.is_read && importantTypes.has(n.type));
    const fallbackUnread = notifications.filter((n) => !n.is_read);
    const shown = (importantUnread.length > 0 ? importantUnread : fallbackUnread).slice(0, 5);

    const loadNotifications = async () => {
        setNotifLoading(true);
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (data.success) setNotifications(data.data || []);
        } catch {
            // ignore
        }
        setNotifLoading(false);
    };

    const toggleNotifications = async () => {
        setNotifOpen((prev) => !prev);
    };

    useEffect(() => {
        if (!session) return;
        if (notifOpen && notifications.length === 0) {
            loadNotifications();
        }
    }, [notifOpen]);

    useEffect(() => {
        if (!session) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (!notifRef.current) return;
            if (notifRef.current.contains(e.target as Node)) return;
            setNotifOpen(false);
        };
        if (notifOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [notifOpen]);

    if (!session) return null;

    return (
        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
            <div className="max-w-[1280px] mx-auto px-3 sm:px-4 lg:px-6">
                <div className="flex justify-between h-14 bg-white px-1">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center shadow-sm">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900 hidden sm:block tracking-tight">
                                Sosyal Kulüp
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition ${pathname === href
                                    ? 'text-primary-700 bg-primary-50'
                                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </Link>
                        ))}
                        {user?.role === 'admin' && (
                            <Link
                                href="/admin"
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition ${pathname?.startsWith('/admin')
                                    ? 'text-orange-700 bg-orange-50'
                                    : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                                    }`}
                            >
                                <Shield className="w-4 h-4" />
                                Admin
                            </Link>
                        )}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/clubs/new"
                            className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
                        >
                            <Plus className="w-4 h-4" />
                            Kulüp Kur
                        </Link>

                        <div className="relative" ref={notifRef}>
                            <button
                                type="button"
                                onClick={toggleNotifications}
                                className="relative p-2 rounded-md text-gray-500 hover:text-primary-600 hover:bg-gray-50 transition"
                                aria-label="Bildirimler"
                            >
                                <Bell className="w-5 h-5" />
                                {fallbackUnread.length > 0 && (
                                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary-600" />
                                )}
                            </button>

                            {notifOpen && (
                                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-soft overflow-hidden animate-slide-up">
                                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                        <p className="text-sm font-semibold text-gray-900">Önemli Bildirimler</p>
                                        <button
                                            type="button"
                                            onClick={loadNotifications}
                                            className="text-xs text-gray-500 hover:text-gray-700"
                                        >
                                            Yenile
                                        </button>
                                    </div>

                                    <div className="max-h-96 overflow-auto">
                                        {notifLoading ? (
                                            <p className="px-4 py-4 text-sm text-gray-500">Yükleniyor...</p>
                                        ) : shown.length === 0 ? (
                                            <p className="px-4 py-4 text-sm text-gray-500">Önemli bildirim yok.</p>
                                        ) : (
                                            shown.map((n) => (
                                                <button
                                                    key={n.id}
                                                    type="button"
                                                    onClick={async () => {
                                                        try {
                                                            await fetch('/api/notifications', {
                                                                method: 'PATCH',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ id: n.id }),
                                                            });
                                                        } catch {
                                                            // ignore
                                                        }
                                                        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
                                                        const href = n.link || '/notifications';
                                                        window.location.href = href;
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                                                >
                                                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{n.title}</p>
                                                    {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                                                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                                                </button>
                                            ))
                                        )}
                                    </div>

                                    <div className="px-4 py-3 border-t border-gray-100">
                                        <Link
                                            href="/notifications"
                                            onClick={() => setNotifOpen(false)}
                                            className="text-sm font-medium text-primary-600 hover:text-primary-700"
                                        >
                                            Tüm Bildirimleri Gör
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Link href="/profile" className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-100 transition">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                                {(user?.avatar_url || user?.image) ? (
                                    <img src={user.avatar_url || user.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-4 h-4 text-primary-600" />
                                )}
                            </div>
                            <span className="hidden lg:block text-sm font-medium text-gray-700">
                                {user?.name}
                            </span>
                        </Link>

                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                            title="Çıkış Yap"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="md:hidden p-2 text-gray-500"
                        >
                            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {menuOpen && (
                    <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-2">
                        {navLinks.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                            >
                                <Icon className="w-5 h-5" />
                                {label}
                            </Link>
                        ))}
                        {user?.role === 'admin' && (
                            <Link
                                href="/admin"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-3 text-orange-600 hover:bg-orange-50 rounded-lg"
                            >
                                <Shield className="w-5 h-5" />
                                Admin Paneli
                            </Link>
                        )}
                        <Link
                            href="/clubs/new"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-3 text-primary-600 hover:bg-primary-50 rounded-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Kulüp Kur
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
