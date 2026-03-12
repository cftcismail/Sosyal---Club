export interface User {
    id: string;
    email: string;
    name: string;
    department?: string;
    title?: string;
    avatar_url?: string;
    interests?: string[];
    role: 'member' | 'club_admin' | 'admin';
    is_active: boolean;
    created_at: string;
}

export interface Club {
    id: string;
    name: string;
    slug: string;
    description?: string;
    cover_image?: string;
    is_public: boolean;
    status: 'pending' | 'active' | 'archived';
    created_by: string;
    created_at: string;
    member_count?: number;
    is_member?: boolean;
    creator_name?: string;
}

export interface ClubMember {
    id: string;
    club_id: string;
    user_id: string;
    role: 'member' | 'admin';
    membership_status: 'pending' | 'approved' | 'rejected';
    joined_at: string;
    user_name?: string;
    user_email?: string;
    user_department?: string;
    user_avatar?: string;
}

export interface Post {
    id: string;
    club_id: string;
    user_id: string;
    content: string;
    image_url?: string;
    is_pinned: boolean;
    is_announcement: boolean;
    created_at: string;
    author_name?: string;
    author_avatar?: string;
    author_department?: string;
    like_count?: number;
    comment_count?: number;
    is_liked?: boolean;
    club_name?: string;
    club_slug?: string;
}

export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    author_name?: string;
    author_avatar?: string;
}

export interface Event {
    id: string;
    club_id: string;
    created_by: string;
    title: string;
    description?: string;
    location?: string;
    online_link?: string;
    start_time: string;
    end_time: string;
    created_at: string;
    club_name?: string;
    club_slug?: string;
    creator_name?: string;
    attending_count?: number;
    maybe_count?: number;
    my_rsvp?: string;
}

export interface Notification {
    id: string;
    user_id: string;
    type: 'post' | 'event' | 'membership' | 'announcement' | 'club_approval';
    title: string;
    message?: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
