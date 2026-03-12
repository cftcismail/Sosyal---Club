'use client';

import { Calendar, MapPin, Link as LinkIcon, Users, Check, X, HelpCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { Event } from '@/types';

interface EventCardProps {
    event: Event;
    onRsvp?: (eventId: string, status: string) => void;
}

export default function EventCard({ event, onRsvp }: EventCardProps) {
    const rsvpButtons = [
        { status: 'attending', label: 'Katılıyorum', icon: Check, color: 'text-green-600 bg-green-50 hover:bg-green-100' },
        { status: 'maybe', label: 'Belki', icon: HelpCircle, color: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' },
        { status: 'declined', label: 'Katılmıyorum', icon: X, color: 'text-red-600 bg-red-50 hover:bg-red-100' },
    ];

    const startDate = new Date(event.start_time);
    const day = startDate.getDate();
    const month = startDate.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
            <div className="flex">
                {/* Date Badge */}
                <div className="w-20 flex-shrink-0 bg-primary-50 flex flex-col items-center justify-center p-3">
                    <span className="text-2xl font-bold text-primary-700">{day}</span>
                    <span className="text-xs font-semibold text-primary-500">{month}</span>
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                    <h3 className="font-bold text-gray-900">{event.title}</h3>
                    {event.club_name && (
                        <p className="text-xs text-primary-600 font-medium mt-0.5">{event.club_name}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>

                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDateTime(event.start_time)}
                        </span>
                        {event.location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {event.location}
                            </span>
                        )}
                        {event.online_link && (
                            <a
                                href={event.online_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary-600 hover:underline"
                            >
                                <LinkIcon className="w-3.5 h-3.5" />
                                Online Katıl
                            </a>
                        )}
                        <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {event.attending_count || 0} katılıyor
                        </span>
                    </div>

                    {/* RSVP */}
                    <div className="flex gap-2 mt-3">
                        {rsvpButtons.map(({ status, label, icon: Icon, color }) => (
                            <button
                                key={status}
                                onClick={() => onRsvp?.(event.id, status)}
                                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition ${color} ${event.my_rsvp === status ? 'ring-2 ring-offset-1 ring-primary-300 font-semibold' : ''
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
