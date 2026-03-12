import { NextResponse } from 'next/server';
import { getMany, query, getOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/polls?club_id=xxx - Anketleri listele
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const clubId = searchParams.get('club_id');
        const user = await getCurrentUser();

        if (!clubId) {
            return NextResponse.json({ success: false, error: 'club_id gerekli.' }, { status: 400 });
        }

        const polls = await getMany(
            `SELECT p.*, u.name AS author_name
             FROM polls p
             JOIN users u ON u.id = p.user_id
             WHERE p.club_id = $1
             ORDER BY p.created_at DESC`,
            [clubId]
        );

        // Her anket için seçenekler ve oyları getir
        for (const poll of polls) {
            const options = await getMany(
                `SELECT po.*,
                    COUNT(pv.id) AS vote_count
                 FROM poll_options po
                 LEFT JOIN poll_votes pv ON pv.option_id = po.id
                 WHERE po.poll_id = $1
                 GROUP BY po.id
                 ORDER BY po.sort_order`,
                [poll.id]
            );

            // Her seçenek için oy verenleri getir
            for (const opt of options) {
                const voters = await getMany(
                    `SELECT pv.user_id, u.name AS user_name
                     FROM poll_votes pv
                     JOIN users u ON u.id = pv.user_id
                     WHERE pv.option_id = $1`,
                    [opt.id]
                );
                (opt as any).voters = voters;
            }

            (poll as any).options = options;

            // Kullanıcının oyları
            if (user) {
                const myVotes = await getMany(
                    `SELECT option_id FROM poll_votes WHERE poll_id = $1 AND user_id = $2`,
                    [poll.id, user.id]
                );
                (poll as any).my_votes = myVotes.map(v => v.option_id);
            }
        }

        return NextResponse.json({ success: true, data: polls });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST /api/polls - Yeni anket oluştur
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Giriş yapmalısınız.' }, { status: 401 });
        }

        const { club_id, question, options, is_multiple_choice, ends_at } = await request.json();

        if (!club_id || !question || !options || options.length < 2) {
            return NextResponse.json({ success: false, error: 'Soru ve en az 2 seçenek gerekli.' }, { status: 400 });
        }

        // Üyelik kontrolü
        const membership = await getOne(
            `SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2 AND membership_status = 'approved'`,
            [club_id, user.id]
        );

        if (!membership && user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Bu kulübe üye değilsiniz.' }, { status: 403 });
        }

        const result = await query(
            `INSERT INTO polls (club_id, user_id, question, is_multiple_choice, ends_at)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [club_id, user.id, question, is_multiple_choice || false, ends_at || null]
        );

        const poll = result.rows[0];

        // Seçenekleri ekle
        for (let i = 0; i < options.length; i++) {
            await query(
                `INSERT INTO poll_options (poll_id, option_text, sort_order)
                 VALUES ($1, $2, $3)`,
                [poll.id, options[i], i]
            );
        }

        return NextResponse.json({ success: true, data: poll, message: 'Anket oluşturuldu!' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
