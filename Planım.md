# Şirket İçi Sosyal Kulüp Platformu (Proje Taslağı)

## 1. Proje Özeti
Bu proje, çalışanların şirket içindeki sosyal kulüplere (örn: Doğa Yürüyüşü Kulübü, Kitap Kulübü, E-Spor Kulübü) katılabileceği, kulüp içi etkinlikleri takip edebileceği ve diğer çalışanlarla etkileşime girebileceği, "Facebook Grupları" mantığında çalışan izole ve güvenli bir iç iletişim platformudur.

## 2. Temel Özellikler (MVP - Minimum Uygulanabilir Ürün)

### A. Kullanıcı ve Profil Yönetimi
* **SSO Entegrasyonu:** Çalışanların mevcut şirket hesaplarıyla (Google Workspace, Microsoft Entra ID / Active Directory vb.) tek tıkla giriş yapabilmesi.
* **Kullanıcı Profilleri:** İsim, departman, unvan, ilgi alanları ve üye olunan kulüplerin listelendiği profil sayfaları.

### B. Kulüp Modülü (Sosyal Gruplar)
* **Kulüp Keşfi:** Mevcut tüm kulüplerin listelendiği, filtrelenebilir ana sayfa.
* **Kulüp Sayfaları:** Her kulübün kendine ait bir kapağı, açıklaması, üye listesi ve haber akışı (feed) olması.
* **Başvuru Sistemi:** * Yeni bir kulüp kurma başvurusu (Sistem yöneticisi onayına düşer).
    * Mevcut bir kulübe katılma başvurusu (Kulüp yöneticisi onayına düşer veya herkese açık olabilir).

### C. Etkileşim ve Haber Akışı
* **Gönderi Paylaşımı:** Kulüp içinde metin, fotoğraf, anket ve dosya paylaşımı.
* **Etkileşim:** Gönderilere yorum yapma, beğenme/ifade bırakma.
* **Duyurular:** Kulüp yöneticilerinin başa tutturulmuş duyurular yapabilmesi.

### D. Etkinlik Takibi (Takvim)
* **Etkinlik Oluşturma:** Tarih, saat, konum (fiziksel veya online toplantı linki) ve açıklama ile etkinlik planlama.
* **LCV (RSVP) Sistemi:** Üyelerin etkinliğe "Katılıyorum", "Katılmıyorum" veya "Belki" şeklinde yanıt vermesi.
* **Takvim Görünümü:** Kişisel pano üzerinde sadece üye olunan kulüplerin etkinliklerinin görülebildiği aylık/haftalık takvim.

### E. Bildirimler
* Uygulama içi bildirimler (Yeni gönderi, etkinlik hatırlatıcısı, başvuru onayı).
* E-posta entegrasyonu ile önemli duyuruların mail olarak iletilmesi.

---

## 3. Kullanıcı Rolleri ve Yetkiler

1.  **Standart Üye (Çalışan):** Kulüpleri görüntüler, üye olur, gönderi paylaşır ve etkinliklere katılır.
2.  **Kulüp Yöneticisi:** Kendi kulübünün ayarlarını düzenler, üyelik başvurularını onaylar, etkinlik oluşturur ve moderasyon (gönderi/yorum silme) yapar.
3.  **Sistem Yöneticisi (Admin):** Yeni kulüp taleplerini onaylar, platform genelindeki kuralları belirler, istatistikleri (aktif kullanıcı sayısı vs.) görüntüler ve tüm platformun moderasyonunu sağlar.

---

## 4. Önerilen Teknoloji Yığını (Tech Stack)

Bu platformu modern, hızlı ve ölçeklenebilir bir yapıda kurmak için aşağıdaki teknolojiler tercih edilebilir:

* **Frontend (Kullanıcı Arayüzü):** React.js, Next.js  (Tasarım için: Tailwind CSS, Shadcn UI veya Material UI)
* **Backend (Sunucu ve Mantık):** Node.js (Express/NestJS)
* **Veritabanı:** PostgreSQL (İlişkisel veriler için)
* **Depolama (Dosya/Fotoğraf):** Şirket içi çalışacak onprem bilmiyorum.

---

## 5. Veritabanı Modelleri (Taslak)

* **User:** `id`, `name`, `email`, `department`, `role`
* **Club:** `id`, `name`, `description`, `cover_image`, `created_by`, `status (pending/active)`
* **Club_Members:** `club_id`, `user_id`, `role (member/admin)`, `joined_at`
* **Post:** `id`, `club_id`, `user_id`, `content`, `created_at`
* **Event:** `id`, `club_id`, `title`, `description`, `start_time`, `end_time`, `location`
* **Event_Attendees:** `event_id`, `user_id`, `status (attending/declined/maybe)`

---

## 6. Geliştirme Fazları (Yol Haritası)

* **Faz 1:** Tasarım ve UI/UX prototiplerinin çıkarılması (Figma vb. ile).
* **Faz 2:** Veritabanı mimarisinin kurulması ve SSO entegrasyonu.
* **Faz 3:** Kulüp oluşturma, başvuru ve üyelik sistemlerinin kodlanması.
* **Faz 4:** Haber akışı (feed) ve etkinlik takvimi modüllerinin eklenmesi.
* **Faz 5:** Şirket içi beta testi ve geri bildirimlerin toplanması.
* **Faz 6:** Canlıya alım (Launch) ve şirket geneli duyuru.