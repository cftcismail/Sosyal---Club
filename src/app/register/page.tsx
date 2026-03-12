'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Mail, Lock, User, Building, Briefcase, UserPlus } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: '', email: '', password: '', department: '', title: '' });
    const [availableDepts, setAvailableDepts] = useState<{ id: string; name: string }[]>([]);
    const [availableTitles, setAvailableTitles] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const [dRes, tRes] = await Promise.all([fetch('/api/departments'), fetch('/api/titles')]);
                const dData = await dRes.json();
                const tData = await tRes.json();
                if (dData.success) setAvailableDepts(dData.data);
                if (tData.success) setAvailableTitles(tData.data);
            } catch { }
        })();
    }, []);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (!data.success) {
                setError(data.error);
            } else {
                router.push('/login');
            }
        } catch {
            setError('Bir hata oluştu.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4 py-8">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Kayıt Ol</h1>
                    <p className="text-gray-500 mt-1">Sosyal Kulüp platformuna katılın</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {[
                            { key: 'name', label: 'Ad Soyad', icon: User, type: 'text', required: true },
                            { key: 'email', label: 'E-posta', icon: Mail, type: 'email', required: true },
                            { key: 'password', label: 'Şifre', icon: Lock, type: 'password', required: true },
                            { key: 'department', label: 'Departman', icon: Building, type: 'select', required: false },
                            { key: 'title', label: 'Unvan', icon: Briefcase, type: 'select', required: false },
                        ].map(({ key, label, icon: Icon, type, required }) => (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                <div className="relative">
                                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    {type === 'select' ? (
                                        <select
                                            value={(form as any)[key]}
                                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        >
                                            <option value="">Seçiniz</option>
                                            {key === 'department' ? availableDepts.map(d => <option key={d.id} value={d.name}>{d.name}</option>) : availableTitles.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type={type}
                                            value={(form as any)[key]}
                                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                            required={required}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                        >
                            <UserPlus className="w-4 h-4" />
                            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Zaten hesabınız var mı?{' '}
                        <Link href="/login" className="text-primary-600 font-medium hover:underline">
                            Giriş Yap
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
