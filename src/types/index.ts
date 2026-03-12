export interface User {
    id: string;
    email: string;
    name: string;
    department?: string;
    title?: string;
    avatar_url?: string;
    avatar_preset?: 'female' | 'male' | null;
    avatar_background?: string | null;
    avatar_variant?: number | null;
    phone?: string;
    bio?: string;
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
    logo_url?: string;
    is_public: boolean;
    status: 'pending' | 'active' | 'archived';
    created_by: string;
    created_at: string;
    member_count?: number;
    is_member?: boolean;
    my_membership_status?: 'pending' | 'approved' | 'rejected';
    creator_name?: string;
    deletion_request_id?: string | null;
    deletion_request_status?: 'pending' | 'approved' | 'rejected' | null;
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
    user_title?: string;
    user_avatar?: string;
    user_avatar_preset?: 'female' | 'male' | null;
    user_avatar_background?: string | null;
    user_avatar_variant?: number | null;
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
    author_avatar_preset?: 'female' | 'male' | null;
    author_avatar_background?: string | null;
    author_avatar_variant?: number | null;
    author_department?: string;
    like_count?: number;
    comment_count?: number;
    is_liked?: boolean;
    club_name?: string;
    club_slug?: string;
    attachments?: PostAttachment[];
}

export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    author_name?: string;
    author_avatar?: string;
    author_avatar_preset?: 'female' | 'male' | null;
    author_avatar_background?: string | null;
    author_avatar_variant?: number | null;
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
    attendees?: EventAttendee[];
}

export interface EventAttendee {
    id?: string;
    user_id: string;
    user_name: string;
    user_avatar?: string;
    user_department?: string;
    status: 'attending' | 'declined' | 'maybe';
    responded_at?: string;
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

export interface PostAttachment {
    id: string;
    post_id: string;
    file_url: string;
    file_name: string;
    file_type?: string;
    file_size?: number;
    created_at: string;
}

export interface Poll {
    id: string;
    club_id: string;
    user_id: string;
    question: string;
    is_multiple_choice: boolean;
    ends_at?: string;
    created_at: string;
    author_name?: string;
    options: PollOption[];
    my_votes?: string[];
}

export interface PollOption {
    id: string;
    poll_id: string;
    option_text: string;
    sort_order: number;
    vote_count?: number;
    voters?: { user_id: string; user_name: string }[];
}

export interface ClubDeletionRequest {
    id: string;
    club_id: string;
    requested_by: string;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    created_at: string;
    club_name?: string;
    club_slug?: string;
    requester_name?: string;
    reviewer_name?: string | null;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
