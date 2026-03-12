'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
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

export default function Navbar() {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const user = session?.user as any;

    if (!session) return null;

    const navLinks = [
        { href: '/dashboard', label: 'Ana Sayfa', icon: Home },
        { href: '/clubs', label: 'Kulüpler', icon: Users },
        { href: '/events', label: 'Etkinlikler', icon: Calendar },
    ];

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900 hidden sm:block">
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
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </Link>
                        ))}
                        {user?.role === 'admin' && (
                            <Link
                                href="/admin"
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition"
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
                            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                        >
                            <Plus className="w-4 h-4" />
                            Kulüp Kur
                        </Link>

                        <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-primary-600 transition">
                            <Bell className="w-5 h-5" />
                        </Link>

                        <Link href="/profile" className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-primary-600" />
                            </div>
                            <span className="hidden lg:block text-sm font-medium text-gray-700">
                                {user?.name}
                            </span>
                        </Link>

                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="p-2 text-gray-400 hover:text-red-500 transition"
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
