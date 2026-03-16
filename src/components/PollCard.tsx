'use client';

import { useState } from 'react';
import { BarChart3, Check, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { Poll } from '@/types';

interface PollCardProps {
    poll: Poll;
    onVote?: (pollId: string, optionIds: string[]) => void;
}

export default function PollCard({ poll, onVote }: PollCardProps) {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [expandedOption, setExpandedOption] = useState<string | null>(null);

    const hasVoted = poll.my_votes && poll.my_votes.length > 0;
    const totalVotes = poll.options.reduce((sum, opt) => sum + Number(opt.vote_count || 0), 0);

    const handleSelect = (optionId: string) => {
        if (hasVoted) return;
        if (poll.is_multiple_choice) {
            setSelectedOptions(prev =>
                prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
            );
        } else {
            setSelectedOptions([optionId]);
        }
    };

    const handleConfirmVote = () => {
        if (selectedOptions.length === 0) return;
        onVote?.(poll.id, selectedOptions);
        setShowConfirm(false);
        setSelectedOptions([]);
    };

    return (
        <div className="card interactive-lift animate-fade-in">
            {/* Header */}
            <div className="p-4 pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-700">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">{poll.author_name}</p>
                            <p className="text-xs text-gray-500">{timeAgo(poll.created_at)}</p>
                        </div>
                    </div>
                    {poll.is_multiple_choice && (
                        <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full border border-purple-100">Çoklu Seçim</span>
                    )}
                </div>
            </div>

            {/* Question */}
            <div className="px-4 py-2">
                <p className="font-medium text-gray-900">{poll.question}</p>
            </div>

            {/* Options */}
            <div className="px-4 py-2 space-y-2">
                {poll.options.map((opt) => {
                    const pct = totalVotes > 0 ? Math.round((Number(opt.vote_count || 0) / totalVotes) * 100) : 0;
                    const isSelected = selectedOptions.includes(opt.id);
                    const isMyVote = poll.my_votes?.includes(opt.id);

                    return (
                        <div key={opt.id}>
                            <button
                                onClick={() => handleSelect(opt.id)}
                                disabled={!!hasVoted}
                                className={`w-full text-left rounded-xl border transition relative overflow-hidden ${isMyVote
                                    ? 'border-purple-300 bg-purple-50'
                                    : isSelected
                                        ? 'border-primary-400 bg-primary-50'
                                        : 'border-gray-200 hover:border-primary-200 hover:bg-primary-50/40'
                                    } ${hasVoted ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                {hasVoted && (
                                    <div
                                        className="absolute inset-y-0 left-0 bg-purple-100 transition-all"
                                        style={{ width: `${pct}%` }}
                                    />
                                )}
                                <div className="relative px-3 py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {!hasVoted && (
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                                                }`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        )}
                                        {isMyVote && <Check className="w-4 h-4 text-purple-600" />}
                                        <span className="text-sm text-gray-800">{opt.option_text}</span>
                                    </div>
                                    {hasVoted && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{opt.vote_count} oy</span>
                                            <span className="text-xs font-semibold text-purple-700">{pct}%</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                            {/* Voters */}
                            {hasVoted && opt.voters && opt.voters.length > 0 && (
                                <div className="mt-1">
                                    <button
                                        onClick={() => setExpandedOption(expandedOption === opt.id ? null : opt.id)}
                                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 ml-3 mt-1"
                                    >
                                        <Users className="w-3 h-3" />
                                        {opt.voters.length} kişi
                                        {expandedOption === opt.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                    {expandedOption === opt.id && (
                                        <div className="ml-3 mt-1 flex flex-wrap gap-1">
                                            {opt.voters.map((v) => (
                                                <span key={v.user_id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-200">
                                                    {v.user_name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Vote Button */}
            {!hasVoted && selectedOptions.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60">
                    {!showConfirm ? (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="w-full py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition shadow-sm"
                        >
                            Oy Ver
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600 text-center">Oyunuzu onaylıyor musunuz?</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleConfirmVote}
                                    className="flex-1 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition"
                                >
                                    Evet, Onayla
                                </button>
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-100 transition"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Total votes */}
            <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500 bg-white/70">
                Toplam {totalVotes} oy
            </div>
        </div>
    );
}
