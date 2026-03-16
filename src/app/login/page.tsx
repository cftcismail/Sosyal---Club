'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Mail, Lock, LogIn } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        if (result?.error) {
            setError('E-posta veya şifre hatalı.');
        } else {
            router.push('/dashboard');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <p className="kicker mb-1">Hoş geldin</p>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sosyal Kulüp</h1>
                    <p className="text-gray-500 mt-1">Şirket içi sosyal platform</p>
                </div>

                {/* Form */}
                <div className="surface p-8 animate-slide-up">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Giriş Yap</h2>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ornek@sirket.com"
                                    className="input pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="input pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-xl hover:bg-primary-700 transition shadow-sm disabled:opacity-50"
                        >
                            <LogIn className="w-4 h-4" />
                            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </form>

                    <div className="text-center mt-4">
                        <Link href="/forgot-password" className="text-sm text-primary-600 font-medium hover:underline">
                            Şifremi Unuttum
                        </Link>
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-4">
                        Hesabınız yok mu?{' '}
                        <Link href="/register" className="text-primary-600 font-medium hover:underline">
                            Kayıt Ol
                        </Link>
                    </p>

                    {/* Demo info */}
                    <div className="mt-6 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2">Demo Hesaplar:</p>
                        <p className="text-xs text-gray-500">Admin: admin@sirket.com / admin123</p>
                        <p className="text-xs text-gray-500">Kullanıcı: ayse.yilmaz@sirket.com / user123</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
