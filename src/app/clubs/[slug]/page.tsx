'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import PostCard from '@/components/PostCard';
import EventCard from '@/components/EventCard';
import type { Club, Post, Event, ClubMember } from '@/types';
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
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ClubDetailPage() {
    const { slug } = useParams();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [club, setClub] = useState<Club & { members: ClubMember[]; my_role?: string } | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [newPost, setNewPost] = useState('');
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [tab, setTab] = useState<'feed' | 'events' | 'members'>('feed');
    const [loading, setLoading] = useState(true);

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

        const [postsRes, eventsRes] = await Promise.all([
            fetch(`/api/posts?club_id=${data.data.id}`),
            fetch(`/api/events?club_id=${data.data.id}&upcoming=true`),
        ]);
        const postsData = await postsRes.json();
        const eventsData = await eventsRes.json();
        if (postsData.success) setPosts(postsData.data);
        if (eventsData.success) setEvents(eventsData.data);
        setLoading(false);
    };

    const handlePost = async () => {
        if (!newPost.trim() || !club) return;
        const res = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ club_id: club.id, content: newPost, is_announcement: isAnnouncement }),
        });
        const data = await res.json();
        if (data.success) {
            setNewPost('');
            setIsAnnouncement(false);
            loadClub();
        }
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

    if (loading || !club) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    const user = session?.user as any;
    const isClubAdmin = club.my_role === 'admin' || user?.role === 'admin';

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* Club Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-700 relative">
                    {club.cover_image && (
                        <img src={club.cover_image} alt="" className="w-full h-full object-cover" />
                    )}
                </div>
                <div className="p-6">
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
                                <>
                                    <button
                                        onClick={handleLeave}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                    >
                                        <LogOut className="w-4 h-4" /> Ayrıl
                                    </button>
                                </>
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
                {(['feed', 'events', 'members'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition ${tab === t ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {t === 'feed' ? 'Haber Akışı' : t === 'events' ? 'Etkinlikler' : 'Üyeler'}
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
                            <div className="flex items-center justify-between mt-3">
                                <div>
                                    {isClubAdmin && (
                                        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isAnnouncement}
                                                onChange={(e) => setIsAnnouncement(e.target.checked)}
                                                className="rounded text-primary-600"
                                            />
                                            <Megaphone className="w-4 h-4" />
                                            Duyuru olarak paylaş
                                        </label>
                                    )}
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

            {tab === 'members' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                    {club.members?.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-4">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                                {member.user_name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{member.user_name}</p>
                                <p className="text-xs text-gray-500">{member.user_department}</p>
                            </div>
                            {member.role === 'admin' && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                    Yönetici
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
