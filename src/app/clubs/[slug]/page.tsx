'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import PostCard from '@/components/PostCard';
import EventCard from '@/components/EventCard';
import PollCard from '@/components/PollCard';
import type { Club, Post, Event, ClubMember, Poll } from '@/types';
import {
    Users,
    Calendar,
    Send,
    LogOut,
    UserPlus,
    Settings,
    Megaphone,
    Globe,
    Lock,
    Camera,
    ImagePlus,
    ShieldCheck,
    UserMinus,
    Plus,
    X,
    Paperclip,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ClubDetailPage() {
    const { slug } = useParams();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [club, setClub] = useState<Club & { members: ClubMember[]; my_role?: string; pending_members?: ClubMember[] } | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [polls, setPolls] = useState<Poll[]>([]);
    const [newPost, setNewPost] = useState('');
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [attachments, setAttachments] = useState<{ url: string; name: string; type: string }[]>([]);
    const [uploading, setUploading] = useState(false);
    const [tab, setTab] = useState<'feed' | 'events' | 'members' | 'polls'>('feed');
    const [loading, setLoading] = useState(true);
    const [showEventForm, setShowEventForm] = useState(false);
    const [eventForm, setEventForm] = useState({ title: '', description: '', location: '', online_link: '', start_time: '', end_time: '' });
    const [showPollForm, setShowPollForm] = useState(false);
    const [pollForm, setPollForm] = useState({ question: '', options: ['', ''], is_multiple_choice: false });
    const [showSettings, setShowSettings] = useState(false);
    const logoRef = useRef<HTMLInputElement>(null);
    const coverRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (status === 'unauthenticated') { router.push('/login'); return; }
        if (status === 'authenticated') loadClub();
    }, [status, slug]);

    const loadClub = async () => {
        setLoading(true);
        const res = await fetch(`/api/clubs/${slug}`);
        const data = await res.json();
        if (!data.success) { router.push('/clubs'); return; }
        setClub(data.data);

        const [postsRes, eventsRes, pollsRes] = await Promise.all([
            fetch(`/api/posts?club_id=${data.data.id}`),
            fetch(`/api/events?club_id=${data.data.id}&upcoming=true`),
            fetch(`/api/polls?club_id=${data.data.id}`),
        ]);
        const postsData = await postsRes.json();
        const eventsData = await eventsRes.json();
        const pollsData = await pollsRes.json();
        if (postsData.success) setPosts(postsData.data);
        if (eventsData.success) setEvents(eventsData.data);
        if (pollsData.success) setPolls(pollsData.data);
        setLoading(false);
    };

    const handlePost = async () => {
        if (!newPost.trim() || !club) return;
        const res = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                club_id: club.id,
                content: newPost,
                is_announcement: isAnnouncement,
                attachments,
            }),
        });
        const data = await res.json();
        if (data.success) {
            setNewPost('');
            setIsAnnouncement(false);
            setAttachments([]);
            loadClub();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        setUploading(false);
        if (data.success) {
            setAttachments(prev => [...prev, { url: data.data.url, name: data.data.name, type: data.data.type }]);
        }
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleLike = async (postId: string) => {
        const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === postId
                        ? { ...p, is_liked: data.liked, like_count: data.liked ? Number(p.like_count) + 1 : Number(p.like_count) - 1 } as any
                        : p
                )
            );
        }
    };

    const handleRsvp = async (eventId: string, rsvpStatus: string) => {
        const res = await fetch(`/api/events/${eventId}/rsvp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: rsvpStatus }),
        });
        const data = await res.json();
        if (data.success) {
            setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, my_rsvp: rsvpStatus } : e)));
        }
    };

    const handleJoin = async () => {
        if (!club) return;
        const res = await fetch(`/api/clubs/${club.id}/join`, { method: 'POST' });
        const data = await res.json();
        alert(data.message || data.error);
        if (data.success) loadClub();
    };

    const handleLeave = async () => {
        if (!club || !confirm('Kulüpten ayrılmak istediğinize emin misiniz?')) return;
        const res = await fetch(`/api/clubs/${club.id}/join`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) loadClub();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'cover_image') => {
        const file = e.target.files?.[0];
        if (!file || !club) return;
        const fd = new FormData();
        fd.append('file', file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) return;

        const res = await fetch(`/api/clubs/${club.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: uploadData.data.url }),
        });
        const data = await res.json();
        if (data.success) loadClub();
    };

    const handleMemberAction = async (userId: string, action: 'approve' | 'reject' | 'kick' | 'promote' | 'demote') => {
        if (!club) return;
        if (action === 'kick') {
            if (!confirm('Bu üyeyi kulüpten çıkarmak istediğinize emin misiniz?')) return;
            const res = await fetch(`/api/clubs/${club.id}/members`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });
            const data = await res.json();
            if (data.success) loadClub();
        } else if (action === 'promote' || action === 'demote') {
            const res = await fetch(`/api/clubs/${club.id}/members`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, role: action === 'promote' ? 'admin' : 'member' }),
            });
            const data = await res.json();
            if (data.success) loadClub();
        } else {
            const membershipStatus = action === 'approve' ? 'approved' : 'rejected';
            const res = await fetch(`/api/clubs/${club.id}/members`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, status: membershipStatus }),
            });
            const data = await res.json();
            if (data.success) loadClub();
        }
    };

    const handleCreateEvent = async () => {
        if (!club || !eventForm.title || !eventForm.start_time || !eventForm.end_time) return;
        const res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ club_id: club.id, ...eventForm }),
        });
        const data = await res.json();
        if (data.success) {
            setShowEventForm(false);
            setEventForm({ title: '', description: '', location: '', online_link: '', start_time: '', end_time: '' });
            loadClub();
        }
    };

    const handleCreatePoll = async () => {
        if (!club || !pollForm.question || pollForm.options.filter(o => o.trim()).length < 2) return;
        const res = await fetch('/api/polls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                club_id: club.id,
                question: pollForm.question,
                options: pollForm.options.filter(o => o.trim()),
                is_multiple_choice: pollForm.is_multiple_choice,
            }),
        });
        const data = await res.json();
        if (data.success) {
            setShowPollForm(false);
            setPollForm({ question: '', options: ['', ''], is_multiple_choice: false });
            loadClub();
        }
    };

    const handlePollVote = async (pollId: string, optionIds: string[]) => {
        const res = await fetch(`/api/polls/${pollId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ option_ids: optionIds }),
        });
        const data = await res.json();
        if (data.success) loadClub();
    };

    if (loading || !club) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    const user = session?.user as any;
    const isClubAdmin = club.my_role === 'admin' || user?.role === 'admin';
    const pendingMembers = club.pending_members || [];

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* Club Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-700 relative group">
                    {club.cover_image && (
                        <img src={club.cover_image} alt="" className="w-full h-full object-cover" />
                    )}
                    {isClubAdmin && (
                        <>
                            <button
                                onClick={() => coverRef.current?.click()}
                                className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
                                title="Kapak fotoğrafı değiştir"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                            <input ref={coverRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover_image')} className="hidden" />
                        </>
                    )}
                    {/* Logo */}
                    <div className="absolute -bottom-8 left-6">
                        <div className="w-16 h-16 bg-white rounded-xl border-4 border-white shadow-md flex items-center justify-center relative group/logo overflow-hidden">
                            {club.logo_url ? (
                                <img src={club.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <Users className="w-6 h-6 text-primary-500" />
                            )}
                            {isClubAdmin && (
                                <button
                                    onClick={() => logoRef.current?.click()}
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition cursor-pointer"
                                >
                                    <ImagePlus className="w-4 h-4 text-white" />
                                </button>
                            )}
                            <input ref={logoRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_url')} className="hidden" />
                        </div>
                    </div>
                </div>
                <div className="p-6 pt-12">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">{club.name}</h1>
                                {club.is_public ? (
                                    <Globe className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Lock className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                            <p className="text-gray-500 mt-1">{club.description}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" /> {club.member_count} üye
                                </span>
                                <span>Kurucu: {club.creator_name}</span>
                                <span>{formatDate(club.created_at)}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {club.is_member ? (
                                <button
                                    onClick={handleLeave}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                >
                                    <LogOut className="w-4 h-4" /> Ayrıl
                                </button>
                            ) : (
                                <button
                                    onClick={handleJoin}
                                    className="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                                >
                                    <UserPlus className="w-4 h-4" /> Katıl
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-100 mb-6">
                {(['feed', 'events', 'polls', 'members'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition ${tab === t ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {t === 'feed' ? 'Haber Akışı' : t === 'events' ? 'Etkinlikler' : t === 'polls' ? 'Anketler' : `Üyeler${pendingMembers.length > 0 && isClubAdmin ? ` (${pendingMembers.length})` : ''}`}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === 'feed' && (
                <div className="space-y-4">
                    {/* New Post */}
                    {club.is_member && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <textarea
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                                placeholder="Bir şeyler paylaş..."
                                rows={3}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                            />
                            {/* Attachments preview */}
                            {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {attachments.map((att, i) => (
                                        <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 text-xs text-gray-600">
                                            <Paperclip className="w-3 h-3" />
                                            {att.name}
                                            <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 ml-1">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-3">
                                    {isClubAdmin && (
                                        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isAnnouncement}
                                                onChange={(e) => setIsAnnouncement(e.target.checked)}
                                                className="rounded text-primary-600"
                                            />
                                            <Megaphone className="w-4 h-4" />
                                            Duyuru
                                        </label>
                                    )}
                                    <button
                                        onClick={() => fileRef.current?.click()}
                                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 transition"
                                        disabled={uploading}
                                    >
                                        <Paperclip className="w-4 h-4" />
                                        {uploading ? 'Yükleniyor...' : 'Dosya Ekle'}
                                    </button>
                                    <input ref={fileRef} type="file" onChange={handleFileUpload} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" />
                                </div>
                                <button
                                    onClick={handlePost}
                                    disabled={!newPost.trim()}
                                    className="flex items-center gap-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" /> Paylaş
                                </button>
                            </div>
                        </div>
                    )}

                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} onLike={handleLike} />
                    ))}

                    {posts.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            Henüz gönderi yok. İlk paylaşımı siz yapın!
                        </div>
                    )}
                </div>
            )}

            {tab === 'events' && (
                <div className="space-y-4">
                    {isClubAdmin && (
                        <div>
                            {!showEventForm ? (
                                <button
                                    onClick={() => setShowEventForm(true)}
                                    className="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
                                >
                                    <Plus className="w-4 h-4" /> Yeni Etkinlik Oluştur
                                </button>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
                                    <h3 className="font-bold text-gray-900">Yeni Etkinlik</h3>
                                    <input
                                        value={eventForm.title}
                                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                        placeholder="Etkinlik Adı *"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                                    />
                                    <textarea
                                        value={eventForm.description}
                                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                        placeholder="Açıklama"
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none text-sm"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            value={eventForm.location}
                                            onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                                            placeholder="Konum"
                                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                                        />
                                        <input
                                            value={eventForm.online_link}
                                            onChange={(e) => setEventForm({ ...eventForm, online_link: e.target.value })}
                                            placeholder="Online Link"
                                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500">Başlangıç *</label>
                                            <input
                                                type="datetime-local"
                                                value={eventForm.start_time}
                                                onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Bitiş *</label>
                                            <input
                                                type="datetime-local"
                                                value={eventForm.end_time}
                                                onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCreateEvent}
                                            disabled={!eventForm.title || !eventForm.start_time || !eventForm.end_time}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm disabled:opacity-50"
                                        >
                                            Oluştur
                                        </button>
                                        <button
                                            onClick={() => setShowEventForm(false)}
                                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm"
                                        >
                                            İptal
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {events.map((event) => (
                        <EventCard key={event.id} event={event} onRsvp={handleRsvp} />
                    ))}
                    {events.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            Yaklaşan etkinlik yok.
                        </div>
                    )}
                </div>
            )}

            {tab === 'polls' && (
                <div className="space-y-4">
                    {club.is_member && (
                        <div>
                            {!showPollForm ? (
                                <button
                                    onClick={() => setShowPollForm(true)}
                                    className="flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                                >
                                    <Plus className="w-4 h-4" /> Anket Oluştur
                                </button>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
                                    <h3 className="font-bold text-gray-900">Yeni Anket</h3>
                                    <input
                                        value={pollForm.question}
                                        onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })}
                                        placeholder="Anket sorusu *"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                                    />
                                    <div className="space-y-2">
                                        {pollForm.options.map((opt, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOpts = [...pollForm.options];
                                                        newOpts[i] = e.target.value;
                                                        setPollForm({ ...pollForm, options: newOpts });
                                                    }}
                                                    placeholder={`Seçenek ${i + 1}`}
                                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                                                />
                                                {pollForm.options.length > 2 && (
                                                    <button
                                                        onClick={() => setPollForm({ ...pollForm, options: pollForm.options.filter((_, j) => j !== i) })}
                                                        className="p-2 text-red-400 hover:text-red-600"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ''] })}
                                            className="text-sm text-purple-600 hover:text-purple-700"
                                        >
                                            + Seçenek Ekle
                                        </button>
                                    </div>
                                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={pollForm.is_multiple_choice}
                                            onChange={(e) => setPollForm({ ...pollForm, is_multiple_choice: e.target.checked })}
                                            className="rounded text-purple-600"
                                        />
                                        Çoklu seçime izin ver
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCreatePoll}
                                            disabled={!pollForm.question || pollForm.options.filter(o => o.trim()).length < 2}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm disabled:opacity-50"
                                        >
                                            Oluştur
                                        </button>
                                        <button
                                            onClick={() => setShowPollForm(false)}
                                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm"
                                        >
                                            İptal
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {polls.map((poll) => (
                        <PollCard key={poll.id} poll={poll} onVote={handlePollVote} />
                    ))}
                    {polls.length === 0 && !showPollForm && (
                        <div className="text-center py-12 text-gray-500">
                            Henüz anket yok.
                        </div>
                    )}
                </div>
            )}

            {tab === 'members' && (
                <div className="space-y-4">
                    {/* Pending Members */}
                    {isClubAdmin && pendingMembers.length > 0 && (
                        <div className="bg-yellow-50 rounded-xl border border-yellow-200">
                            <div className="p-4 border-b border-yellow-200">
                                <h3 className="font-bold text-yellow-800">Onay Bekleyen Başvurular ({pendingMembers.length})</h3>
                            </div>
                            <div className="divide-y divide-yellow-100">
                                {pendingMembers.map((member) => (
                                    <div key={member.id} className="flex items-center gap-3 p-4">
                                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-semibold text-sm">
                                            {member.user_name?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{member.user_name}</p>
                                            <p className="text-xs text-gray-500">{member.user_email}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleMemberAction(member.user_id, 'approve')}
                                                className="px-3 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition"
                                            >
                                                Onayla
                                            </button>
                                            <button
                                                onClick={() => handleMemberAction(member.user_id, 'reject')}
                                                className="px-3 py-1 text-xs bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition"
                                            >
                                                Reddet
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Approved Members */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                        {club.members?.map((member) => (
                            <div key={member.id} className="flex items-center gap-3 p-4">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm overflow-hidden">
                                    {member.user_avatar ? (
                                        <img src={member.user_avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        member.user_name?.charAt(0) || '?'
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{member.user_name}</p>
                                    <p className="text-xs text-gray-500">{member.user_department} {member.user_email && `· ${member.user_email}`}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {member.role === 'admin' && (
                                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                            Yönetici
                                        </span>
                                    )}
                                    {isClubAdmin && member.user_id !== user?.id && (
                                        <div className="flex gap-1">
                                            {member.role !== 'admin' ? (
                                                <button
                                                    onClick={() => handleMemberAction(member.user_id, 'promote')}
                                                    className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                                                    title="Yönetici yap"
                                                >
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleMemberAction(member.user_id, 'demote')}
                                                    className="p-1.5 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                                                    title="Yetkiyi kaldır"
                                                >
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleMemberAction(member.user_id, 'kick')}
                                                className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                                title="Kulüpten çıkar"
                                            >
                                                <UserMinus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
