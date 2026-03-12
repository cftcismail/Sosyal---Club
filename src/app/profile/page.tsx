'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Building, Briefcase, Tag, Users, Pencil, Save, X, Camera, Phone, FileText, Heart, Plus } from 'lucide-react';
import { AVATAR_VARIANT_COUNT, buildAvatarDataUrl, cn, getAvatarPalette } from '@/lib/utils';

const avatarPresets = [
    { value: 'female', label: 'Kadın Avatarı' },
    { value: 'male', label: 'Erkek Avatarı' },
] as const;

const avatarColors = [
    { value: 'coral', label: 'Mercan' },
    { value: 'sky', label: 'Gökyüzü' },
    { value: 'mint', label: 'Mint' },
    { value: 'amber', label: 'Amber' },
    { value: 'plum', label: 'Erik' },
    { value: 'slate', label: 'Slate' },
];

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newInterest, setNewInterest] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const randomVariant = () => Math.floor(Math.random() * AVATAR_VARIANT_COUNT);

    const getAvatarSrc = (data: any) => {
        if (data?.avatar_url) return data.avatar_url;
        if (data?.avatar_preset || data?.avatar_background) {
            const preset = data?.avatar_preset || 'female';
            const background = data?.avatar_background || 'sky';
            const variant = typeof data?.avatar_variant === 'number' ? data.avatar_variant : 0;
            return buildAvatarDataUrl(preset, background, variant);
        }
        return null;
    };

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if (status === 'authenticated') loadProfile();
    }, [status]);

    const loadProfile = async () => {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.success) {
            setProfile(data.data);
            setForm(data.data);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const payload: any = {
            name: form.name,
            department: form.department,
            title: form.title,
            phone: form.phone,
            bio: form.bio,
            interests: form.interests || [],
            avatar_preset: form.avatar_preset,
            avatar_background: form.avatar_background,
            avatar_variant: form.avatar_variant,
        };

        // avatar_url sadece upload URL'si olmalı; data URL (hazır avatar) DB'ye yazılmamalı.
        if (form.avatar_url === null) {
            payload.avatar_url = null;
        } else if (typeof form.avatar_url === 'string') {
            if (!form.avatar_url.startsWith('data:') && form.avatar_url.length <= 500) {
                payload.avatar_url = form.avatar_url;
            }
        }

        const res = await fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        setSaving(false);
        if (data.success) {
            setProfile(data.data);
            setEditing(false);
        } else {
            alert(data.error || 'Profil kaydedilemedi.');
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        setUploading(false);
        if (data.success) {
            setForm({ ...form, avatar_url: data.data.url, avatar_preset: null, avatar_background: null });
            // Auto-save avatar
            await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatar_url: data.data.url }),
            });
            setProfile((prev: any) => ({ ...prev, avatar_url: data.data.url, avatar_preset: null, avatar_background: null }));
        } else {
            alert(data.error || 'Avatar yüklenemedi.');
        }
    };

    const handleAvatarPresetChange = (preset: 'female' | 'male') => {
        const background = form.avatar_background || 'sky';
        setForm({
            ...form,
            avatar_preset: preset,
            avatar_background: background,
            avatar_variant: randomVariant(),
            avatar_url: null,
        });
    };

    const handleAvatarBackgroundChange = (background: string) => {
        const preset = form.avatar_preset || 'female';
        setForm({
            ...form,
            avatar_preset: preset,
            avatar_background: background,
            avatar_variant: randomVariant(),
            avatar_url: null,
        });
    };

    if (status === 'loading' || !profile) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Profilim</h1>
                {!editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                        <Pencil className="w-4 h-4" /> Düzenle
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Avatar & Name */}
                <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700 relative">
                    <div className="absolute -bottom-10 left-6">
                        <div className="w-20 h-20 bg-white rounded-full border-4 border-white flex items-center justify-center relative group">
                            {getAvatarSrc(editing ? form : profile) ? (
                                <img
                                    src={getAvatarSrc(editing ? form : profile) as string}
                                    alt=""
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-2xl font-bold">
                                    {profile.name?.charAt(0) || '?'}
                                </div>
                            )}
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            >
                                <Camera className="w-5 h-5 text-white" />
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        </div>
                    </div>
                </div>

                <div className="pt-14 p-6">
                    {uploading && <p className="text-sm text-primary-600 mb-2">Avatar yükleniyor...</p>}

                    {editing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                                <input
                                    value={form.name || ''}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Departman</label>
                                <input
                                    value={form.department || ''}
                                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unvan</label>
                                <input
                                    value={form.title || ''}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                <input
                                    value={form.phone || ''}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hakkımda</label>
                                <textarea
                                    value={form.bio || ''}
                                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">İlgi Alanları</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {(form.interests || []).map((interest: string, index: number) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                                        >
                                            {interest}
                                            <button
                                                type="button"
                                                onClick={() => setForm({
                                                    ...form,
                                                    interests: (form.interests || []).filter((_: string, i: number) => i !== index)
                                                })}
                                                className="ml-1 text-primary-400 hover:text-primary-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={newInterest}
                                        onChange={(e) => setNewInterest(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newInterest.trim()) {
                                                e.preventDefault();
                                                if (!form.interests?.includes(newInterest.trim())) {
                                                    setForm({ ...form, interests: [...(form.interests || []), newInterest.trim()] });
                                                }
                                                setNewInterest('');
                                            }
                                        }}
                                        placeholder="Yeni ilgi alanı ekle..."
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newInterest.trim() && !form.interests?.includes(newInterest.trim())) {
                                                setForm({ ...form, interests: [...(form.interests || []), newInterest.trim()] });
                                                setNewInterest('');
                                            }
                                        }}
                                        className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Enter tuşu ile veya + butonuyla ilgi alanı ekleyin</p>
                            </div>
                            <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Hazır Avatar Seç</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {avatarPresets.map((preset) => (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                onClick={() => handleAvatarPresetChange(preset.value)}
                                                className={cn(
                                                    'rounded-xl border px-3 py-3 text-left transition',
                                                    form.avatar_preset === preset.value
                                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                        : 'border-gray-200 bg-white hover:border-primary-200'
                                                )}
                                            >
                                                <span className="block text-sm font-medium">{preset.label}</span>
                                                <span className="block mt-1 text-xs text-gray-500">Tek tıkla profil resmi oluştur.</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Arka Plan Rengi</p>
                                    <div className="flex flex-wrap gap-2">
                                        {avatarColors.map((color) => {
                                            const palette = getAvatarPalette(color.value);
                                            return (
                                                <button
                                                    key={color.value}
                                                    type="button"
                                                    onClick={() => handleAvatarBackgroundChange(color.value)}
                                                    className={cn(
                                                        'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                                                        form.avatar_background === color.value
                                                            ? 'border-gray-900 text-gray-900'
                                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                    )}
                                                >
                                                    <span className="h-4 w-4 rounded-full border border-white/70" style={{ backgroundColor: palette.background }} />
                                                    {color.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">İsterseniz hazır avatar seçebilir, isterseniz yine kendi fotoğrafınızı yükleyebilirsiniz.</p>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                                <button
                                    onClick={() => { setEditing(false); setForm(profile); }}
                                    className="flex items-center gap-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                                >
                                    <X className="w-4 h-4" /> İptal
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                            {profile.bio && <p className="text-sm text-gray-500 mt-1">{profile.bio}</p>}

                            <div className="mt-4 space-y-3">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">{profile.email}</span>
                                </div>
                                {profile.department && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Building className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">{profile.department}</span>
                                    </div>
                                )}
                                {profile.title && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Briefcase className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">{profile.title}</span>
                                    </div>
                                )}
                                {profile.phone && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">{profile.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Tag className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm capitalize">
                                        {profile.role === 'admin' ? 'Sistem Yöneticisi' : 'Standart Üye'}
                                    </span>
                                </div>
                            </div>

                            {/* İlgi Alanları */}
                            {profile.interests && profile.interests.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Heart className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-700">İlgi Alanları</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.interests.map((interest: string, index: number) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                                            >
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <Link
                                    href="/clubs"
                                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                                >
                                    <Users className="w-4 h-4" />
                                    Kulüplerimi Gör
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
