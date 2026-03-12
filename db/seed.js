// db/seed.js
// Kullanım: node db/seed.js
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://clubadmin:ClubSecure2026!@localhost:5432/sosyal_club',
});

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Admin kullanıcı
        const adminPass = await bcrypt.hash('admin123', 12);
        const adminResult = await client.query(
            `INSERT INTO users (email, password_hash, name, department, title, role, interests)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
            ['admin@sirket.com', adminPass, 'Sistem Yöneticisi', 'IT', 'Platform Admin', 'admin', '{teknoloji,yönetim}']
        );

        // Demo kullanıcılar
        const userPass = await bcrypt.hash('user123', 12);
        const users = [
            ['ayse.yilmaz@sirket.com', 'Ayşe Yılmaz', 'Pazarlama', 'Pazarlama Uzmanı', '{kitap,yoga,doğa}'],
            ['mehmet.demir@sirket.com', 'Mehmet Demir', 'Mühendislik', 'Yazılım Geliştirici', '{espor,teknoloji,kodlama}'],
            ['zeynep.kaya@sirket.com', 'Zeynep Kaya', 'İnsan Kaynakları', 'IK Uzmanı', '{fotoğrafçılık,yemek,seyahat}'],
            ['ali.ozturk@sirket.com', 'Ali Öztürk', 'Finans', 'Finans Analisti', '{koşu,bisiklet,doğa}'],
            ['fatma.celik@sirket.com', 'Fatma Çelik', 'Tasarım', 'UI/UX Tasarımcı', '{sanat,müzik,sinema}'],
        ];

        const userIds = [];
        for (const [email, name, dept, title, interests] of users) {
            const res = await client.query(
                `INSERT INTO users (email, password_hash, name, department, title, interests)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
                [email, userPass, name, dept, title, interests]
            );
            if (res.rows[0]) userIds.push(res.rows[0].id);
        }

        const adminId = adminResult.rows[0]?.id || (await client.query("SELECT id FROM users WHERE email='admin@sirket.com'")).rows[0].id;

        // Kulüpler
        const clubs = [
            ['Doğa Yürüyüşü Kulübü', 'doga-yuruyusu-kulubu', 'Hafta sonları şehir dışına çıkarak doğa yürüyüşleri yapıyoruz. Herkes davetlidir!', true],
            ['Kitap Kulübü', 'kitap-kulubu', 'Her ay bir kitap seçip birlikte okuyor, tartışıyoruz. Okuma severlerin buluşma noktası.', true],
            ['E-Spor Kulübü', 'espor-kulubu', 'Valorant, League of Legends ve daha fazlası. Turnuvalara katılıyoruz!', true],
            ['Fotoğrafçılık Kulübü', 'fotografcilik-kulubu', 'Fotoğraf çekmeyi sevenler için. Aylık foto-safari gezileri düzenliyoruz.', true],
            ['Koşu ve Bisiklet Kulübü', 'kosu-bisiklet-kulubu', 'Sağlıklı yaşam için birlikte koşuyor ve pedal çeviriyoruz.', false],
        ];

        const clubIds = [];
        for (const [name, slug, desc, isPublic] of clubs) {
            const res = await client.query(
                `INSERT INTO clubs (name, slug, description, is_public, status, created_by)
         VALUES ($1, $2, $3, $4, 'active', $5)
         ON CONFLICT (slug) DO NOTHING
         RETURNING id`,
                [name, slug, desc, isPublic, userIds[0] || adminId]
            );
            if (res.rows[0]) clubIds.push(res.rows[0].id);
        }

        // Üyelikler
        if (clubIds.length > 0 && userIds.length > 0) {
            // İlk kulübe herkesi ekle
            for (let i = 0; i < userIds.length; i++) {
                await client.query(
                    `INSERT INTO club_members (club_id, user_id, role, membership_status)
           VALUES ($1, $2, $3, 'approved')
           ON CONFLICT DO NOTHING`,
                    [clubIds[0], userIds[i], i === 0 ? 'admin' : 'member']
                );
            }

            // Diğer kulüplere rastgele üyelik
            for (let c = 1; c < clubIds.length; c++) {
                for (let u = 0; u < Math.min(3, userIds.length); u++) {
                    await client.query(
                        `INSERT INTO club_members (club_id, user_id, role, membership_status)
             VALUES ($1, $2, $3, 'approved')
             ON CONFLICT DO NOTHING`,
                        [clubIds[c], userIds[u], u === 0 ? 'admin' : 'member']
                    );
                }
            }

            // Örnek Gönderiler
            const posts = [
                [clubIds[0], userIds[0], 'Bu hafta sonu Uludağ eteklerinde harika bir yürüyüş rotası keşfettik! 🏔️ Fotoğraflar yakında gelecek.'],
                [clubIds[0], userIds[1], 'Bir sonraki yürüyüş için önerilerinizi bekliyorum. Bolu mu Abant mı?'],
                [clubIds[1], userIds[0], 'Bu ayın kitabı: "Simyacı" - Paulo Coelho. Tartışma toplantımız Cuma günü olacak.', true],
                [clubIds[2], userIds[1], 'Valorant turnuva kayıtları başladı! Son başvuru bu Çarşamba. 🎮'],
            ];

            for (const [clubId, userId, content, isAnnouncement] of posts) {
                await client.query(
                    `INSERT INTO posts (club_id, user_id, content, is_pinned, is_announcement)
           VALUES ($1, $2, $3, $4, $4)`,
                    [clubId, userId, content, isAnnouncement || false]
                );
            }

            // Örnek Etkinlikler
            const events = [
                [clubIds[0], userIds[0], 'Hafta Sonu Doğa Yürüyüşü', 'Abant Gölü çevresinde yürüyüş yapacağız.', 'Abant Gölü, Bolu', null, '2026-03-21 09:00', '2026-03-21 17:00'],
                [clubIds[1], userIds[0], 'Aylık Kitap Tartışması', 'Simyacı kitabını tartışıyoruz.', 'Toplantı Odası 3', 'https://meet.google.com/abc-defg-hij', '2026-03-20 18:00', '2026-03-20 19:30'],
                [clubIds[2], userIds[1], 'Valorant Turnuvası', '5v5 şirket içi Valorant turnuvası!', null, 'https://discord.gg/espor-kulubu', '2026-03-28 20:00', '2026-03-28 23:00'],
            ];

            for (const [clubId, userId, title, desc, loc, link, start, end] of events) {
                await client.query(
                    `INSERT INTO events (club_id, created_by, title, description, location, online_link, start_time, end_time)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [clubId, userId, title, desc, loc, link, start, end]
                );
            }
        }

        await client.query('COMMIT');
        console.log('✅ Seed verileri başarıyla eklendi!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seed hatası:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
