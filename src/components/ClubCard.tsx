'use client';

import Link from 'next/link';
import { Users, Lock, Globe } from 'lucide-react';
import type { Club } from '@/types';

interface ClubCardProps {
    club: Club;
    onJoin?: (clubId: string) => void;
}

export default function ClubCard({ club, onJoin }: ClubCardProps) {
    const isPending = club.my_membership_status === 'pending';

    return (
        <div className="card interactive-lift group animate-fade-in">
            {/* Cover */}
            <div className="h-32 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-700 relative">
                {club.cover_image && (
                    <img src={club.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                )}
                <div className="absolute top-3 right-3">
                    {club.is_public ? (
                        <span className="flex items-center gap-1 text-xs bg-white/90 text-green-700 px-2.5 py-1 rounded-full shadow-sm">
                            <Globe className="w-3 h-3" /> Herkese Açık
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs bg-white/90 text-gray-600 px-2.5 py-1 rounded-full shadow-sm">
                            <Lock className="w-3 h-3" /> Onay Gerekli
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <Link href={`/clubs/${club.slug}`}>
                    <h3 className="font-bold text-gray-900 group-hover:text-primary-700 transition">
                        {club.name}
                    </h3>
                </Link>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[2.5rem]">{club.description}</p>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{club.member_count || 0} üye</span>
                    </div>

                    {club.is_member ? (
                        <Link
                            href={`/clubs/${club.slug}`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                            Kulübe Git →
                        </Link>
                    ) : isPending ? (
                        <button
                            disabled
                            className="text-sm font-medium bg-amber-100 text-amber-700 px-4 py-1.5 rounded-lg cursor-not-allowed"
                        >
                            Başvuruda Bekliyor
                        </button>
                    ) : (
                        <button
                            onClick={() => onJoin?.(club.id)}
                            className="text-sm font-medium bg-primary-600 text-white px-4 py-1.5 rounded-xl hover:bg-primary-700 transition shadow-sm"
                        >
                            Katıl
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
