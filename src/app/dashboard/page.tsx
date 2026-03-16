'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PostCard from '@/components/PostCard';
import EventCard from '@/components/EventCard';
import type { Post, Event } from '@/types';
import { Newspaper, CalendarDays, TrendingUp, Sparkles, Users, Clock3 } from 'lucide-react';

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }
        if (status === 'authenticated') {
            loadData();
        }
    }, [status]);

    const loadData = async () => {
        try {
            const [postsRes, eventsRes] = await Promise.all([
                fetch('/api/posts'),
                fetch('/api/events?upcoming=true'),
            ]);
            const postsData = await postsRes.json();
            const eventsData = await eventsRes.json();

            if (postsData.success) setPosts(postsData.data);
            if (eventsData.success) setEvents(eventsData.data.slice(0, 5));
        } catch (e) {
            // ignore
        }
        setLoading(false);
    };

    const handleLike = async (postId: string) => {
        const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === postId
                        ? {
                            ...p,
                            is_liked: data.liked,
                            like_count: data.liked
                                ? (Number(p.like_count) + 1).toString()
                                : (Number(p.like_count) - 1).toString(),
                        } as any
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
            setEvents((prev) =>
                prev.map((e) =>
                    e.id === eventId
                        ? {
                            ...e,
                            my_rsvp: data.data?.my_rsvp || rsvpStatus,
                            attending_count: data.data?.attending_count ?? e.attending_count,
                            maybe_count: data.data?.maybe_count ?? e.maybe_count,
                            attendees: data.data?.attendees || e.attendees,
                        }
                        : e
                )
            );
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    const user = session?.user as any;
    const firstName = user?.name?.split(' ')[0] || 'Üye';
    const feedMembers = posts
        .map((post) => ({
            id: post.user_id,
            name: post.user_name,
            avatar_url: post.user_avatar_url,
        }))
        .filter((member, index, array) =>
            member.id && array.findIndex((item) => item.id === member.id) === index
        )
        .slice(0, 10);

    return (
        <div className="max-w-[1280px] mx-auto px-3 sm:px-4 lg:px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-24">
                    <div className="surface p-4">
                        <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">Profil</p>
                        <div className="mt-3 flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full overflow-hidden bg-primary-100">
                                {(user?.avatar_url || user?.image) ? (
                                    <img src={user.avatar_url || user.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-primary-700 font-semibold">
                                        {firstName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-500">Topluluk üyesi</p>
                            </div>
                        </div>
                    </div>

                    <div className="surface p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">Blog</p>
                            <Newspaper className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="mt-3 space-y-3">
                            {posts.slice(0, 5).map((post) => (
                                <div key={post.id} className="flex items-start gap-2">
                                    <div className="w-8 h-8 rounded-md bg-primary-50 flex items-center justify-center text-primary-600">
                                        <Clock3 className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-gray-800 line-clamp-2">{post.content}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{new Date(post.created_at).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="surface p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">Takip ettiklerim</p>
                            <Users className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {feedMembers.length === 0 ? (
                                <p className="text-xs text-gray-500">Henüz görüntülenecek üye yok.</p>
                            ) : (
                                feedMembers.map((member) => (
                                    <div key={member.id} className="w-9 h-9 rounded-full overflow-hidden bg-primary-50 ring-2 ring-white shadow-sm" title={member.name}>
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} alt={member.name || ''} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[11px] font-semibold text-primary-700">
                                                {(member.name || '?').charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>

                <main className="lg:col-span-6 space-y-4">
                    <div className="surface p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold tracking-wide text-primary-600 uppercase">Activity Feed</p>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">Hoş geldin, {firstName}</h1>
                                <p className="text-sm text-gray-500 mt-1">Topluluğundaki son güncellemeler burada.</p>
                            </div>
                            <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-100 px-3 py-1.5 text-primary-700 text-xs font-semibold">
                                <Sparkles className="w-4 h-4" />
                                Online
                            </div>
                        </div>
                    </div>

                    <div className="surface p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Newspaper className="w-4 h-4 text-primary-600" />
                            <h2 className="text-sm font-semibold text-gray-900">Tüm Güncellemeler</h2>
                        </div>
                        <div className="space-y-3">
                            {posts.length === 0 ? (
                                <div className="surface-muted p-6 text-center text-gray-500">
                                    <TrendingUp className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">Henüz gönderi yok. Bir kulübe katılarak başlayabilirsin!</p>
                                </div>
                            ) : (
                                posts.map((post) => (
                                    <PostCard key={post.id} post={post} onLike={handleLike} />
                                ))
                            )}
                        </div>
                    </div>
                </main>

                <aside className="lg:col-span-3 space-y-4">
                    <div className="surface p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <CalendarDays className="w-4 h-4 text-primary-600" />
                            <h2 className="text-sm font-semibold text-gray-900">Latest Updates</h2>
                        </div>
                        {events.length === 0 ? (
                            <p className="text-sm text-gray-500">Yaklaşan etkinlik yok.</p>
                        ) : (
                            <div className="space-y-2">
                                {events.map((event) => (
                                    <EventCard key={event.id} event={event} onRsvp={handleRsvp} compact />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="surface p-4">
                        <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase mb-3">Özet</p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2">
                                <span className="text-sm text-gray-600">Gönderiler</span>
                                <span className="text-sm font-semibold text-gray-900">{posts.length}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2">
                                <span className="text-sm text-gray-600">Etkinlikler</span>
                                <span className="text-sm font-semibold text-gray-900">{events.length}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2">
                                <span className="text-sm text-gray-600">Takip edilen üyeler</span>
                                <span className="text-sm font-semibold text-gray-900">{feedMembers.length}</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
