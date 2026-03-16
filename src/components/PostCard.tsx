'use client';

import { useRef, useState } from 'react';
import { Heart, MessageCircle, Pin, Megaphone, Send, FileText, Paperclip, Smile, X } from 'lucide-react';
import { timeAgo, buildAvatarDataUrl } from '@/lib/utils';
import type { Post, Comment, PostAttachment } from '@/types';

interface PostCardProps {
    post: Post;
    onLike?: (postId: string) => void;
    onComment?: (postId: string, content: string) => void;
}

function getAvatarSrc(data: { avatar?: string | null; avatar_preset?: string | null; avatar_background?: string | null; avatar_variant?: number | null }) {
    if (data.avatar) return data.avatar;
    if (data.avatar_preset) {
        return buildAvatarDataUrl(
            data.avatar_preset as 'female' | 'male',
            data.avatar_background || 'sky',
            typeof data.avatar_variant === 'number' ? data.avatar_variant : 0
        );
    }
    return null;
}

export default function PostCard({ post, onLike, onComment }: PostCardProps) {
    const commentImageInputRef = useRef<HTMLInputElement | null>(null);
    const emojiList = ['😀', '😂', '😍', '🔥', '🎉', '👏', '🙏', '👍'];
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [uploadingCommentImage, setUploadingCommentImage] = useState(false);
    const [commentImage, setCommentImage] = useState<{ url: string; name: string; type?: string } | null>(null);
    const [commentError, setCommentError] = useState('');

    // Internal state for real-time updates
    const [likeCount, setLikeCount] = useState(Number(post.like_count) || 0);
    const [isLiked, setIsLiked] = useState(post.is_liked || false);
    const [commentCount, setCommentCount] = useState(Number(post.comment_count) || 0);

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

    const handleLike = async () => {
        // Optimistic update
        const wasLiked = isLiked;
        setIsLiked(!wasLiked);
        setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

        try {
            const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setIsLiked(data.liked);
                onLike?.(post.id);
            } else {
                // Revert on error
                setIsLiked(wasLiked);
                setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
            }
        } catch (e) {
            // Revert on error
            setIsLiked(wasLiked);
            setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
        }
    };

    const handleComment = async () => {
        if ((!newComment.trim() && !commentImage) || submittingComment) return;
        setCommentError('');
        setSubmittingComment(true);
        try {
            const res = await fetch(`/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment, image: commentImage }),
            });
            const data = await res.json();
            if (data.success) {
                setComments((prev) => [...prev, data.data]);
                setCommentCount(prev => prev + 1);
                setNewComment('');
                setCommentImage(null);
                setShowEmojiPicker(false);
                onComment?.(post.id, newComment);
            } else {
                setCommentError(data.error || 'Yorum gönderilemedi.');
            }
        } catch (e) {
            setCommentError('Yorum gönderilemedi. Lütfen tekrar dene.');
        }
        setSubmittingComment(false);
    };

    const handleCommentImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;

        setUploadingCommentImage(true);
        setCommentError('');
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.success) {
                setCommentImage({
                    url: data.data.url,
                    name: data.data.name,
                    type: data.data.type,
                });
            } else {
                setCommentError(data.error || 'Fotoğraf yüklenemedi.');
            }
        } catch (e) {
            setCommentError('Fotoğraf yüklenemedi. Lütfen tekrar dene.');
        }
        setUploadingCommentImage(false);
        if (commentImageInputRef.current) {
            commentImageInputRef.current.value = '';
        }
    };

    return (
        <div className="card interactive-lift animate-fade-in">
            {/* Header */}
            <div className="p-4 pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm overflow-hidden bg-primary-100">
                            {getAvatarSrc({
                                avatar: post.author_avatar,
                                avatar_preset: post.author_avatar_preset,
                                avatar_background: post.author_avatar_background,
                                avatar_variant: post.author_avatar_variant
                            }) ? (
                                <img
                                    src={getAvatarSrc({
                                        avatar: post.author_avatar,
                                        avatar_preset: post.author_avatar_preset,
                                        avatar_background: post.author_avatar_background,
                                        avatar_variant: post.author_avatar_variant
                                    })!}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                post.author_name?.charAt(0) || '?'
                            )}
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

            {/* Attachments */}
            {post.attachments && post.attachments.length > 0 && (
                <div className="px-4 py-2">
                    <div className="grid gap-2">
                        {post.attachments.map((att: any) => {
                            if (att.file_type?.startsWith('image/')) {
                                return (
                                    <img key={att.id} src={att.file_url} alt={att.file_name} className="rounded-lg max-h-96 w-full object-cover" />
                                );
                            }
                            if (att.file_type?.startsWith('video/')) {
                                return (
                                    <video key={att.id} src={att.file_url} controls className="rounded-lg max-h-96 w-full" />
                                );
                            }
                            return (
                                <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm text-primary-600 hover:bg-gray-100 transition">
                                    <FileText className="w-4 h-4" />
                                    {att.file_name}
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="px-4 py-2 flex items-center gap-4 border-t border-gray-100 bg-white/70">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 text-sm transition ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
                    {likeCount > 0 && likeCount}
                </button>
                <button
                    onClick={toggleComments}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition"
                >
                    <MessageCircle className="w-4 h-4" />
                    {commentCount > 0 && commentCount}
                </button>
            </div>

            {/* Comments */}
            {showComments && (
                <div className="border-t border-gray-100 bg-gray-50/85 p-4 animate-slide-up">
                    {loadingComments ? (
                        <p className="text-sm text-gray-500">Yorumlar yükleniyor...</p>
                    ) : (
                        <>
                            {comments.map((c) => (
                                <div key={c.id} className="flex items-start gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-gray-600 text-xs font-semibold mt-0.5 overflow-hidden bg-gray-200">
                                        {getAvatarSrc({
                                            avatar: c.author_avatar,
                                            avatar_preset: c.author_avatar_preset,
                                            avatar_background: c.author_avatar_background,
                                            avatar_variant: c.author_avatar_variant
                                        }) ? (
                                            <img
                                                src={getAvatarSrc({
                                                    avatar: c.author_avatar,
                                                    avatar_preset: c.author_avatar_preset,
                                                    avatar_background: c.author_avatar_background,
                                                    avatar_variant: c.author_avatar_variant
                                                })!}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            c.author_name?.charAt(0) || '?'
                                        )}
                                    </div>
                                    <div className="flex-1 bg-white rounded-lg px-3 py-2">
                                        <p className="text-xs font-semibold text-gray-700">{c.author_name}</p>
                                        {c.content && <p className="text-sm text-gray-800">{c.content}</p>}
                                        {c.image_url && (
                                            <img
                                                src={c.image_url}
                                                alt={c.image_name || 'Yorum görseli'}
                                                className="mt-2 rounded-lg max-h-56 w-full object-cover border border-gray-100"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                    <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker((prev) => !prev)}
                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-white rounded-lg transition"
                                title="Emoji ekle"
                            >
                                <Smile className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => commentImageInputRef.current?.click()}
                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-white rounded-lg transition"
                                title="Fotoğraf ekle"
                                disabled={uploadingCommentImage}
                            >
                                <Paperclip className="w-4 h-4" />
                            </button>
                            <input
                                ref={commentImageInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleCommentImageChange}
                            />
                            {uploadingCommentImage && (
                                <span className="text-xs text-gray-500">Fotoğraf yükleniyor...</span>
                            )}
                        </div>

                        {showEmojiPicker && (
                            <div className="flex flex-wrap gap-1 bg-white border border-gray-200 rounded-lg p-2">
                                {emojiList.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => setNewComment((prev) => prev + emoji)}
                                        className="text-lg leading-none hover:bg-gray-100 rounded px-1.5 py-1 transition"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}

                        {commentImage && (
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-white">
                                <img src={commentImage.url} alt={commentImage.name} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setCommentImage(null)}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-gray-700 flex items-center justify-center"
                                    title="Fotoğrafı kaldır"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {commentError && (
                            <p className="text-xs text-red-600">{commentError}</p>
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
                                placeholder="Yorum yaz..."
                                disabled={submittingComment}
                                className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                            />
                            <button
                                onClick={handleComment}
                                disabled={submittingComment || (!newComment.trim() && !commentImage)}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
