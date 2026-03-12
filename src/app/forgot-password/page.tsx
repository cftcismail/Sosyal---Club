'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Mail, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [devUrl, setDevUrl] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setLoading(false);

        if (data.success) {
            setSent(true);
            if (data.dev_reset_url) setDevUrl(data.dev_reset_url);
        } else {
            setError(data.error || 'Bir hata oluştu.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Şifremi Unuttum</h1>
                    <p className="text-gray-500 mt-1">Kayıtlı e-posta adresinizi girin.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {sent ? (
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="w-6 h-6 text-green-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 mb-2">Bağlantı Gönderildi</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.
                                Lütfen gelen kutunuzu kontrol edin.
                            </p>

                            {devUrl && (
                                <div className="mb-6 p-3 bg-yellow-50 rounded-lg">
                                    <p className="text-xs font-medium text-yellow-700 mb-1">Geliştirme Modu:</p>
                                    <Link
                                        href={devUrl}
                                        className="text-xs text-primary-600 hover:underline break-all"
                                    >
                                        {devUrl}
                                    </Link>
                                </div>
                            )}

                            <Link
                                href="/login"
                                className="inline-flex items-center gap-1 text-sm text-primary-600 font-medium hover:underline"
                            >
                                <ArrowLeft className="w-4 h-4" /> Giriş sayfasına dön
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="ornek@sirket.com"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                    {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
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
