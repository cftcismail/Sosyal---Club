'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PostCard from '@/components/PostCard';
import EventCard from '@/components/EventCard';
import type { Post, Event } from '@/types';
import { Newspaper, CalendarDays, TrendingUp } from 'lucide-react';

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
                prev.map((e) => (e.id === eventId ? { ...e, my_rsvp: rsvpStatus } : e))
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

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    Hoş geldin, {user?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-gray-500 mt-1">Kulüplerindeki son gelişmelere göz at.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Feed */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Newspaper className="w-5 h-5 text-primary-600" />
                        <h2 className="text-lg font-bold text-gray-900">Haber Akışı</h2>
                    </div>
                    {posts.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-100">
                            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Henüz gönderi yok. Bir kulübe katılarak başlayabilirsin!</p>
                        </div>
                    ) : (
                        posts.map((post) => (
                            <PostCard key={post.id} post={post} onLike={handleLike} />
                        ))
                    )}
                </div>

                {/* Sidebar - Upcoming Events */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarDays className="w-5 h-5 text-primary-600" />
                        <h2 className="text-lg font-bold text-gray-900">Yaklaşan Etkinlikler</h2>
                    </div>
                    {events.length === 0 ? (
                        <div className="bg-white rounded-xl p-6 text-center text-gray-500 border border-gray-100">
                            <p className="text-sm">Yaklaşan etkinlik yok.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {events.map((event) => (
                                <EventCard key={event.id} event={event} onRsvp={handleRsvp} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
