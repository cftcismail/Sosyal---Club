import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export function formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function timeAgo(date: string | Date): string {
    const now = new Date();
    const d = new Date(date);
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (seconds < 60) return 'az önce';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} gün önce`;
    return formatDate(date);
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

const avatarPalette: Record<string, { background: string; foreground: string }> = {
    coral: { background: '#F97360', foreground: '#FFF7ED' },
    sky: { background: '#38BDF8', foreground: '#F0F9FF' },
    mint: { background: '#34D399', foreground: '#ECFDF5' },
    amber: { background: '#F59E0B', foreground: '#FFFBEB' },
    plum: { background: '#A855F7', foreground: '#FAF5FF' },
    slate: { background: '#64748B', foreground: '#F8FAFC' },
};

export function getAvatarPalette(color?: string | null) {
    return avatarPalette[color || 'sky'] || avatarPalette.sky;
}

export function buildAvatarDataUrl(
    preset?: 'female' | 'male' | null,
    color?: string | null
) {
    if (!preset) return null;

    const palette = getAvatarPalette(color);
    const hair = preset === 'female' ? '#6B3F2C' : '#2F2A28';
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="Avatar">
            <rect width="120" height="120" rx="32" fill="${palette.background}" />
            <circle cx="60" cy="46" r="22" fill="#F5C9A5" />
            ${preset === 'female'
            ? `<path d="M32 42c3-20 19-30 28-30s25 10 28 30c-3-6-8-10-14-12-5 8-15 13-27 13-6 0-11-1-15-4z" fill="${hair}" />
                   <path d="M30 44c2 23 10 35 18 39V55c-8-1-14-5-18-11z" fill="${hair}" opacity="0.95" />
                   <path d="M90 44c-2 23-10 35-18 39V55c8-1 14-5 18-11z" fill="${hair}" opacity="0.95" />`
            : `<path d="M34 37c2-15 15-25 26-25 12 0 25 10 26 25-7-5-17-8-26-8s-19 3-26 8z" fill="${hair}" />
                   <rect x="36" y="26" width="48" height="14" rx="7" fill="${hair}" />`}
            <circle cx="52" cy="46" r="2.5" fill="#2B2B2B" />
            <circle cx="68" cy="46" r="2.5" fill="#2B2B2B" />
            <path d="M53 58c4 4 10 4 14 0" stroke="#8A4B39" stroke-width="3" stroke-linecap="round" fill="none" />
            <path d="M32 112c4-23 17-34 28-34s24 11 28 34" fill="${palette.foreground}" />
            <path d="M44 82c4 5 10 8 16 8s12-3 16-8v30H44z" fill="#1F2937" opacity="0.88" />
        </svg>
    `;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}
