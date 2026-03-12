'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FileText, Globe, Lock } from 'lucide-react';

export default function NewClubPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [form, setForm] = useState({ name: '', description: '', is_public: true });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (status === 'unauthenticated') {
        router.push('/login');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await fetch('/api/clubs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        const data = await res.json();
        setLoading(false);

        if (data.success) {
            alert(data.message);
            router.push('/clubs');
        } else {
            setError(data.error);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Yeni Kulüp Kur</h1>
            <p className="text-gray-500 mb-8">
                Yeni bir kulüp başvurusu oluşturun. Admin onayından sonra kulübünüz aktif olacaktır.
            </p>

            {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kulüp Adı</label>
                    <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="ör: Doğa Yürüyüşü Kulübü"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Kulüp hakkında kısa bir açıklama..."
                        rows={4}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Erişim Tipi</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, is_public: true })}
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 transition ${form.is_public
                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                        >
                            <Globe className="w-5 h-5" />
                            <div className="text-left">
                                <p className="font-medium text-sm">Herkese Açık</p>
                                <p className="text-xs opacity-75">Herkes katılabilir</p>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, is_public: false })}
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 transition ${!form.is_public
                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                        >
                            <Lock className="w-5 h-5" />
                            <div className="text-left">
                                <p className="font-medium text-sm">Onay Gerekli</p>
                                <p className="text-xs opacity-75">Başvuru ile katılım</p>
                            </div>
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 font-medium"
                >
                    {loading ? 'Gönderiliyor...' : 'Kulüp Başvurusu Gönder'}
                </button>
            </form>
        </div>
    );
}
