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
    const backgroundHex = palette.background.replace('#', '');
    const style = preset === 'female' ? 'lorelei-neutral' : 'adventurer-neutral';
    const seed = `${preset}-${color || 'sky'}-${normalizedVariant}`;

    return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${backgroundHex}&radius=50&size=128`;
}
