'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import EventCard from '@/components/EventCard';
import type { Event } from '@/types';
import { CalendarDays } from 'lucide-react';

export default function EventsPage() {
    const { status } = useSession();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') { router.push('/login'); return; }
        if (status === 'authenticated') loadEvents();
    }, [status]);

    const loadEvents = async () => {
        const res = await fetch('/api/events?upcoming=true');
        const data = await res.json();
        if (data.success) setEvents(data.data);
        setLoading(false);
    };

    const handleRsvp = async (eventId: string, rsvpStatus: string) => {
        const res = await fetch(`/api/events/${eventId}/rsvp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: rsvpStatus }),
        });
        const data = await res.json();
        if (data.success) {
            loadEvents();
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-primary-600" />
                    Etkinlikler
                </h1>
                <p className="text-gray-500 mt-1">Üye olduğun kulüplerin yaklaşan etkinlikleri.</p>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <CalendarDays className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Yaklaşan etkinlik yok.</p>
                    <p className="text-sm mt-1">Bir kulübe katılarak etkinlikleri görebilirsin.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map((event) => (
                        <EventCard key={event.id} event={event} onRsvp={handleRsvp} />
                    ))}
                </div>
            )}
        </div>
    );
}
