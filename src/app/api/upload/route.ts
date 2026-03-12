import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
    try {
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

        // Generate unique filename
        const ext = path.extname(file.name) || '.bin';
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
