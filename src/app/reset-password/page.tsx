'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Users, Lock, ArrowLeft, CheckCircle } from 'lucide-react';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        setLoading(true);
        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
        });
        const data = await res.json();
        setLoading(false);

        if (data.success) {
            setSuccess(true);
        } else {
            setError(data.error || 'Bir hata oluştu.');
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-10">
                <div className="surface p-8 max-w-md w-full text-center animate-fade-in">
                    <p className="text-gray-500 mb-4">Geçersiz bağlantı. Lütfen tekrar şifre sıfırlama talebinde bulunun.</p>
                    <Link href="/forgot-password" className="text-primary-600 font-medium hover:underline">
                        Şifremi Unuttum
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <div className="text-center mb-8 animate-fade-in">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <p className="kicker mb-1">Şifre yenileme</p>
                    <h1 className="text-3xl font-bold text-gray-900">Yeni Şifre</h1>
                    <p className="text-gray-500 mt-1">Yeni şifrenizi belirleyin.</p>
                </div>

                <div className="surface p-8 animate-slide-up">
                    {success ? (
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 mb-2">Şifre Değiştirildi</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Şifreniz başarıyla güncellendi. Artık giriş yapabilirsiniz.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 w-full bg-primary-600 text-white py-2.5 rounded-xl hover:bg-primary-700 transition shadow-sm"
                            >
                                Giriş Yap
                            </Link>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Şifre</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="En az 6 karakter"
                                            className="input pl-10"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Şifre Tekrar</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Şifrenizi tekrar girin"
                                            className="input pl-10"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-xl hover:bg-primary-700 transition shadow-sm disabled:opacity-50"
                                >
                                    {loading ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
                                </button>
                            </form>

                            <p className="text-center text-sm text-gray-500 mt-6">
                                <Link href="/login" className="text-primary-600 font-medium hover:underline flex items-center justify-center gap-1">
                                    <ArrowLeft className="w-4 h-4" /> Giriş sayfasına dön
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
