'use client';

import { useState } from 'react';
import { Calendar, MapPin, Link as LinkIcon, Users, Check, X, HelpCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { Event } from '@/types';

interface EventCardProps {
    event: Event;
    onRsvp?: (eventId: string, status: string) => void;
    compact?: boolean;
}

export default function EventCard({ event, onRsvp, compact = false }: EventCardProps) {
    const [activeStatusPopup, setActiveStatusPopup] = useState<'attending' | 'maybe' | 'declined' | null>(null);
    const rsvpButtons = [
        { status: 'attending', label: 'Katılıyorum', icon: Check, color: 'text-green-600 bg-green-50 hover:bg-green-100' },
        { status: 'maybe', label: 'Belki', icon: HelpCircle, color: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' },
        { status: 'declined', label: 'Katılmıyorum', icon: X, color: 'text-red-600 bg-red-50 hover:bg-red-100' },
    ];

    const startDate = new Date(event.start_time);
    const day = startDate.getDate();
    const month = startDate.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase();
    const attending = event.attendees?.filter((attendee) => attendee.status === 'attending') || [];
    const maybe = event.attendees?.filter((attendee) => attendee.status === 'maybe') || [];
    const declined = event.attendees?.filter((attendee) => attendee.status === 'declined') || [];
    const statusGroups = [
        { key: 'attending', label: 'Katılıyorum', short: 'Katılıyor', users: attending, text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
        { key: 'maybe', label: 'Belki', short: 'Belki', users: maybe, text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
        { key: 'declined', label: 'Katılmıyorum', short: 'Katılmıyor', users: declined, text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
    ];
    const selectedGroup = activeStatusPopup
        ? statusGroups.find((group) => group.key === activeStatusPopup)
        : null;

    return (
        <div className="card interactive-lift animate-fade-in">
            <div className="flex">
                {/* Date Badge */}
                <div className={`${compact ? 'w-14 p-2.5' : 'w-20 p-3'} flex-shrink-0 bg-gradient-to-b from-primary-50 to-primary-100/60 flex flex-col items-center justify-center`}>
                    <span className={`${compact ? 'text-xl' : 'text-2xl'} font-bold text-primary-700`}>{day}</span>
                    <span className="text-xs font-semibold text-primary-500">{month}</span>
                </div>

                {/* Content */}
                <div className={`${compact ? 'p-3' : 'p-4'} flex-1 min-w-0`}>
                    <h3 className="font-bold text-gray-900">{event.title}</h3>
                    {event.club_name && (
                        <p className="text-xs text-primary-600 font-medium mt-0.5">{event.club_name}</p>
                    )}
                    <p className={`text-sm text-gray-500 mt-1 ${compact ? 'line-clamp-1' : 'line-clamp-2'}`}>{event.description}</p>

                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDateTime(event.start_time)}
                        </span>
                        {event.location && (
                            <span className="flex items-center gap-1 break-words">
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
                    <div className="flex flex-wrap gap-2 mt-3">
                        {rsvpButtons.map(({ status, label, icon: Icon, color }) => (
                            <button
                                key={status}
                                onClick={() => onRsvp?.(event.id, status)}
                                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition ${compact ? 'flex-1 justify-center min-w-[95px]' : ''} ${color} ${event.my_rsvp === status ? 'ring-2 ring-offset-1 ring-primary-300 font-semibold' : ''
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {compact ? (
                        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/80 p-2.5 text-xs text-gray-600">
                            <p className="font-semibold text-gray-700 mb-2">Katılım Durumları</p>
                            <div className="grid grid-cols-3 gap-1.5">
                                {statusGroups.map((group) => (
                                    <button
                                        key={group.key}
                                        type="button"
                                        onClick={() => setActiveStatusPopup(group.key as 'attending' | 'maybe' | 'declined')}
                                        className={`rounded-lg border px-2 py-1 text-center transition hover:shadow-sm hover:-translate-y-0.5 ${group.bg} ${group.border}`}
                                    >
                                        <p className={`text-[10px] leading-4 font-medium ${group.text}`}>{group.short}</p>
                                        <p className={`text-sm font-semibold ${group.text}`}>{group.users.length}</p>
                                    </button>
                                ))}
                            </div>
                            <p className="mt-2 text-[10px] text-gray-500">Detay için kutulara tıkla.</p>
                        </div>
                    ) : (
                        <div className={`mt-4 rounded-xl border border-gray-100 bg-gray-50/80 text-xs text-gray-600 p-3`}>
                            <p className="font-semibold text-gray-700 mb-2">Katılım Durumları</p>
                            <div className="space-y-2">
                                <div className="break-words">
                                    <span className="font-medium text-green-700">Katılıyorum:</span>{' '}
                                    {attending.length > 0 ? attending.map((attendee) => attendee.user_name).join(', ') : 'Henüz yok'}
                                </div>
                                <div className="break-words">
                                    <span className="font-medium text-yellow-700">Belki:</span>{' '}
                                    {maybe.length > 0 ? maybe.map((attendee) => attendee.user_name).join(', ') : 'Henüz yok'}
                                </div>
                                <div className="break-words">
                                    <span className="font-medium text-red-700">Katılmıyorum:</span>{' '}
                                    {declined.length > 0 ? declined.map((attendee) => attendee.user_name).join(', ') : 'Henüz yok'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in" onClick={() => setActiveStatusPopup(null)}>
                    <div className="w-full max-w-sm rounded-2xl bg-white border border-gray-200 shadow-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900">{selectedGroup.label} ({selectedGroup.users.length})</p>
                            <button
                                type="button"
                                onClick={() => setActiveStatusPopup(null)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                Kapat
                            </button>
                        </div>
                        <div className="max-h-64 overflow-auto p-4 space-y-2">
                            {selectedGroup.users.length === 0 ? (
                                <p className="text-sm text-gray-500">Bu grupta henüz katılımcı yok.</p>
                            ) : (
                                selectedGroup.users.map((attendee) => (
                                    <div key={attendee.user_id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                                        <p className="text-sm font-medium text-gray-800">{attendee.user_name}</p>
                                        <p className="text-xs text-gray-500 break-all">{attendee.user_email || 'E-posta yok'}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
