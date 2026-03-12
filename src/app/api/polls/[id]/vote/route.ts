import { NextResponse } from 'next/server';
import { query, getOne, getMany } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST /api/polls/[id]/vote - Ankete oy ver
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const { option_ids } = await request.json();
        const pollId = params.id;

        if (!option_ids || !Array.isArray(option_ids) || option_ids.length === 0) {
            return NextResponse.json({ success: false, error: 'En az bir seçenek seçmelisiniz.' }, { status: 400 });
        }

        const poll = await getOne('SELECT * FROM polls WHERE id = $1', [pollId]);
        if (!poll) {
            return NextResponse.json({ success: false, error: 'Anket bulunamadı.' }, { status: 404 });
        }

        // Süre kontrolü
        if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
            return NextResponse.json({ success: false, error: 'Anket süresi dolmuş.' }, { status: 400 });
        }

        // Çoklu seçim kontrolü
        if (!poll.is_multiple_choice && option_ids.length > 1) {
            return NextResponse.json({ success: false, error: 'Bu ankette sadece bir seçenek seçebilirsiniz.' }, { status: 400 });
        }

        // Mevcut oyları sil ve yeni oyları ekle
        await query('DELETE FROM poll_votes WHERE poll_id = $1 AND user_id = $2', [pollId, user.id]);

        for (const optionId of option_ids) {
            // Seçeneğin bu ankete ait olduğunu doğrula
            const option = await getOne('SELECT id FROM poll_options WHERE id = $1 AND poll_id = $2', [optionId, pollId]);
            if (option) {
                await query(
                    `INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES ($1, $2, $3)
                     ON CONFLICT (poll_id, option_id, user_id) DO NOTHING`,
                    [pollId, optionId, user.id]
                );
            }
        }

        return NextResponse.json({ success: true, message: 'Oyunuz kaydedildi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
