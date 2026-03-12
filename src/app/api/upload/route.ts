import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getRequestIp, rateLimit } from '@/lib/rateLimit';

const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const EXT_BY_MIME: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

function hasMagic(buffer: Buffer, magic: number[], offset = 0) {
    if (buffer.length < offset + magic.length) return false;
    for (let i = 0; i < magic.length; i++) {
        if (buffer[offset + i] !== magic[i]) return false;
    }
    return true;
}

function isLikelyValidContent(buffer: Buffer, mime: string) {
    if (mime === 'image/png') return hasMagic(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (mime === 'image/jpeg') return hasMagic(buffer, [0xff, 0xd8, 0xff]);
    if (mime === 'image/gif') return hasMagic(buffer, [0x47, 0x49, 0x46, 0x38]);
    if (mime === 'image/webp') return hasMagic(buffer, [0x52, 0x49, 0x46, 0x46]) && hasMagic(buffer, [0x57, 0x45, 0x42, 0x50], 8);
    if (mime === 'application/pdf') return hasMagic(buffer, [0x25, 0x50, 0x44, 0x46]);
    // For other types (video/doc), skip strict magic validation for now.
    return true;
}

export async function POST(request: Request) {
    try {
        const ip = getRequestIp(request);
        const rl = rateLimit(`upload:${ip}`, { windowMs: 10 * 60 * 1000, max: 60 });
        if (!rl.ok) {
            return NextResponse.json({ success: false, error: 'Çok fazla yükleme denemesi. Lütfen sonra tekrar deneyin.' }, { status: 429 });
        }

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: 'Dosya seçilmedi.' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ success: false, error: 'Desteklenmeyen dosya tipi.' }, { status: 400 });
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json({ success: false, error: 'Dosya boyutu 10MB\'ı aşamaz.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (!isLikelyValidContent(buffer, file.type)) {
            return NextResponse.json({ success: false, error: 'Dosya içeriği doğrulanamadı.' }, { status: 400 });
        }

        // Generate unique filename
        const ext = EXT_BY_MIME[file.type] || '.bin';
        const safeName = crypto.randomBytes(16).toString('hex') + ext;

        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, safeName);
        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${safeName}`;

        return NextResponse.json({
            success: true,
            data: {
                url: fileUrl,
                name: file.name,
                type: file.type,
                size: file.size,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Dosya yüklenirken hata oluştu.' }, { status: 500 });
    }
}
