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

export const AVATAR_VARIANT_COUNT = 15;

export function buildAvatarDataUrl(
    preset?: 'female' | 'male' | null,
    color?: string | null,
    variant?: number | null
) {
    if (!preset) return null;

    const normalizedVariant = typeof variant === 'number' && Number.isFinite(variant)
        ? ((variant % AVATAR_VARIANT_COUNT) + AVATAR_VARIANT_COUNT) % AVATAR_VARIANT_COUNT
        : 0;

    const palette = getAvatarPalette(color);
    const hair = preset === 'female' ? '#6B3F2C' : '#2F2A28';

    // 15 farklı tarz = 5 saç stili × 3 aksesuar kombinasyonu
    const hairIndex = normalizedVariant % 5;
    const accIndex = Math.floor(normalizedVariant / 5) % 3;

    const femaleHair: string[] = [
        `<path d="M32 42c3-20 19-30 28-30s25 10 28 30c-3-6-8-10-14-12-5 8-15 13-27 13-6 0-11-1-15-4z" fill="${hair}" />
         <path d="M30 44c2 23 10 35 18 39V55c-8-1-14-5-18-11z" fill="${hair}" opacity="0.95" />
         <path d="M90 44c-2 23-10 35-18 39V55c8-1 14-5 18-11z" fill="${hair}" opacity="0.95" />`,
        `<path d="M28 46c2-24 18-34 32-34s30 10 32 34c-8-10-18-14-32-14s-24 4-32 14z" fill="${hair}" />
         <path d="M26 52c4 22 12 33 22 37V58c-9-1-17-4-22-6z" fill="${hair}" opacity="0.92" />
         <path d="M94 52c-4 22-12 33-22 37V58c9-1 17-4 22-6z" fill="${hair}" opacity="0.92" />`,
        `<path d="M34 38c4-18 16-28 26-28 11 0 23 10 26 28-6-4-13-6-26-6s-20 2-26 6z" fill="${hair}" />
         <path d="M36 30c3 3 7 6 24 6s21-3 24-6v10H36z" fill="${hair}" opacity="0.9" />`,
        `<path d="M30 40c5-22 22-30 30-30 9 0 25 8 30 30-7-7-16-11-30-11s-23 4-30 11z" fill="${hair}" />
         <path d="M34 46c2 10 6 17 14 22V56c-5-2-10-5-14-10z" fill="${hair}" opacity="0.9" />
         <path d="M86 46c-2 10-6 17-14 22V56c5-2 10-5 14-10z" fill="${hair}" opacity="0.9" />`,
        `<path d="M26 44c2-26 22-34 34-34s32 8 34 34c-9-9-20-12-34-12S35 35 26 44z" fill="${hair}" />
         <path d="M34 34c5 7 12 10 26 10s21-3 26-10v12H34z" fill="${hair}" opacity="0.88" />`,
    ];

    const maleHair: string[] = [
        `<path d="M34 37c2-15 15-25 26-25 12 0 25 10 26 25-7-5-17-8-26-8s-19 3-26 8z" fill="${hair}" />
         <rect x="36" y="26" width="48" height="14" rx="7" fill="${hair}" />`,
        `<path d="M32 38c3-18 16-26 28-26 13 0 26 8 28 26-8-4-16-6-28-6s-20 2-28 6z" fill="${hair}" />
         <path d="M38 24h44c2 0 4 2 4 4v8H34v-8c0-2 2-4 4-4z" fill="${hair}" opacity="0.95" />`,
        `<path d="M30 40c4-20 20-28 30-28 11 0 26 8 30 28-7-6-16-9-30-9s-23 3-30 9z" fill="${hair}" />
         <path d="M40 26c6 6 12 8 20 8s14-2 20-8v12H40z" fill="${hair}" opacity="0.9" />`,
        `<path d="M34 36c2-14 14-24 26-24 13 0 24 10 26 24-10-4-18-5-26-5s-16 1-26 5z" fill="${hair}" />
         <path d="M36 28h48v10H36z" fill="${hair}" opacity="0.9" />`,
        `<path d="M28 40c5-22 22-28 32-28s27 6 32 28c-9-5-20-7-32-7s-23 2-32 7z" fill="${hair}" />
         <path d="M36 24c2 2 6 6 24 6s22-4 24-6v12H36z" fill="${hair}" opacity="0.88" />`,
    ];

    const accessoriesFemale: string[] = [
        '',
        `<path d="M44 48h12" stroke="#2B2B2B" stroke-width="2" stroke-linecap="round" />
         <path d="M64 48h12" stroke="#2B2B2B" stroke-width="2" stroke-linecap="round" />
         <rect x="40" y="44" width="20" height="10" rx="5" fill="none" stroke="#2B2B2B" stroke-width="2" />
         <rect x="60" y="44" width="20" height="10" rx="5" fill="none" stroke="#2B2B2B" stroke-width="2" />`,
        `<circle cx="40" cy="56" r="3" fill="#FBBF24" />
         <circle cx="80" cy="56" r="3" fill="#FBBF24" />`,
    ];

    const accessoriesMale: string[] = [
        '',
        `<path d="M44 48h12" stroke="#2B2B2B" stroke-width="2" stroke-linecap="round" />
         <path d="M64 48h12" stroke="#2B2B2B" stroke-width="2" stroke-linecap="round" />
         <rect x="40" y="44" width="20" height="10" rx="5" fill="none" stroke="#2B2B2B" stroke-width="2" />
         <rect x="60" y="44" width="20" height="10" rx="5" fill="none" stroke="#2B2B2B" stroke-width="2" />`,
        `<path d="M46 62c4 4 8 6 14 6s10-2 14-6" stroke="#2F2A28" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.9" />`,
    ];

    const hairSvg = preset === 'female' ? femaleHair[hairIndex] : maleHair[hairIndex];
    const accessory = preset === 'female' ? accessoriesFemale[accIndex] : accessoriesMale[accIndex];
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="Avatar">
            <rect width="120" height="120" rx="32" fill="${palette.background}" />
            <circle cx="60" cy="46" r="22" fill="#F5C9A5" />
            ${hairSvg}
            <circle cx="52" cy="46" r="2.5" fill="#2B2B2B" />
            <circle cx="68" cy="46" r="2.5" fill="#2B2B2B" />
            ${accessory}
            <path d="M53 58c4 4 10 4 14 0" stroke="#8A4B39" stroke-width="3" stroke-linecap="round" fill="none" />
            <path d="M32 112c4-23 17-34 28-34s24 11 28 34" fill="${palette.foreground}" />
            <path d="M44 82c4 5 10 8 16 8s12-3 16-8v30H44z" fill="#1F2937" opacity="0.88" />
        </svg>
    `;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}
