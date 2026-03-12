'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Pin, Megaphone, Send } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { Post, Comment } from '@/types';

interface PostCardProps {
    post: Post;
    onLike?: (postId: string) => void;
    onComment?: (postId: string, content: string) => void;
}

export default function PostCard({ post, onLike, onComment }: PostCardProps) {
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

    const toggleComments = async () => {
        if (!showComments && comments.length === 0) {
            setLoadingComments(true);
            try {
                const res = await fetch(`/api/posts/${post.id}/comments`);
                const data = await res.json();
                if (data.success) setComments(data.data);
            } catch (e) {
                // ignore
            }
            setLoadingComments(false);
        }
        setShowComments(!showComments);
    };

    const handleComment = async () => {
        if (!newComment.trim()) return;
        try {
            const res = await fetch(`/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });
            const data = await res.json();
            if (data.success) {
                setComments((prev) => [...prev, data.data]);
                setNewComment('');
                onComment?.(post.id, newComment);
            }
        } catch (e) {
            // ignore
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                            {post.author_name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">{post.author_name}</p>
                            <p className="text-xs text-gray-500">
                                {post.author_department} · {timeAgo(post.created_at)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {post.is_pinned && (
                            <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                <Pin className="w-3 h-3" /> Sabitlenmiş
                            </span>
                        )}
                        {post.is_announcement && (
                            <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                <Megaphone className="w-3 h-3" /> Duyuru
                            </span>
                        )}
                    </div>
                </div>

                {post.club_name && (
                    <p className="mt-1 ml-13 text-xs text-primary-600 font-medium">{post.club_name}</p>
                )}
            </div>

            {/* Content */}
            <div className="px-4 py-2">
                <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Actions */}
            <div className="px-4 py-2 flex items-center gap-4 border-t border-gray-50">
                <button
                    onClick={() => onLike?.(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition ${post.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                >
                    <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-red-500' : ''}`} />
                    {Number(post.like_count) > 0 && post.like_count}
                </button>
                <button
                    onClick={toggleComments}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition"
                >
                    <MessageCircle className="w-4 h-4" />
                    {Number(post.comment_count) > 0 && post.comment_count}
                </button>
            </div>

            {/* Comments */}
            {showComments && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                    {loadingComments ? (
                        <p className="text-sm text-gray-500">Yorumlar yükleniyor...</p>
                    ) : (
                        <>
                            {comments.map((c) => (
                                <div key={c.id} className="flex items-start gap-2 mb-3">
                                    <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-semibold mt-0.5">
                                        {c.author_name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 bg-white rounded-lg px-3 py-2">
                                        <p className="text-xs font-semibold text-gray-700">{c.author_name}</p>
                                        <p className="text-sm text-gray-800">{c.content}</p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        <input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                            placeholder="Yorum yaz..."
                            className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                            onClick={handleComment}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
