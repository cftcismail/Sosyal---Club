# 🏢 Sosyal Kulüp - Şirket İçi Sosyal Platform

Çalışanların şirket içindeki sosyal kulüplere katılabileceği, etkinlikleri takip edebileceği ve etkileşime girebileceği modern bir iç iletişim platformu.

## 🛠️ Teknoloji Yığını

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend:** Next.js API Routes (Node.js)
- **Veritabanı:** PostgreSQL 16 (Docker üzerinde)
- **ORM:** Yok - Doğrudan `pg` (node-postgres) ile raw SQL
- **Auth:** NextAuth.js (Credentials Provider)
- **UI:** Tailwind CSS + Lucide React Icons

## 📋 Ön Gereksinimler

- [Node.js](https://nodejs.org/) 18+ kurulu olmalı
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) kurulu ve çalışıyor olmalı

## 🚀 Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. PostgreSQL Veritabanını Başlat (Docker)
```bash
docker compose up -d
```
Bu komut:
- PostgreSQL 16 Alpine container'ını başlatır
- `sosyal_club` veritabanını oluşturur
- `db/migrations/001_initial.sql` dosyasındaki tabloları otomatik oluşturur

### 3. Seed Verilerini Yükle
```bash
npm run db:seed
```
Bu komut demo kullanıcılar, kulüpler, gönderiler ve etkinlikler ekler.

### 4. Uygulamayı Başlat
```bash
npm run dev
```
Uygulama http://localhost:3000 adresinde çalışır.

## 🔑 Demo Hesaplar

| Rol | E-posta | Şifre |
|-----|---------|-------|
| **Admin** | admin@sirket.com | admin123 |
| **Kullanıcı** | ayse.yilmaz@sirket.com | user123 |
| **Kullanıcı** | mehmet.demir@sirket.com | user123 |
| **Kullanıcı** | zeynep.kaya@sirket.com | user123 |
| **Kullanıcı** | ali.ozturk@sirket.com | user123 |
| **Kullanıcı** | fatma.celik@sirket.com | user123 |

## 📁 Proje Yapısı

```
├── docker-compose.yml          # PostgreSQL container tanımı
├── db/
│   ├── migrations/
│   │   └── 001_initial.sql     # Veritabanı şeması
│   └── seed.js                 # Demo veri ekleme script'i
├── src/
│   ├── app/                    # Next.js App Router sayfaları
│   │   ├── api/                # Backend API routes
│   │   │   ├── auth/           # Giriş, kayıt, NextAuth
│   │   │   ├── clubs/          # Kulüp CRUD, katılım, üyeler
│   │   │   ├── posts/          # Gönderi, yorum, beğeni
│   │   │   ├── events/         # Etkinlik, RSVP
│   │   │   ├── notifications/  # Bildirimler
│   │   │   └── admin/          # Admin istatistikleri
│   │   ├── login/              # Giriş sayfası
│   │   ├── register/           # Kayıt sayfası
│   │   ├── dashboard/          # Ana sayfa (feed + etkinlikler)
│   │   ├── clubs/              # Kulüp listesi, detay, yeni kulüp
│   │   ├── events/             # Etkinlik listesi
│   │   ├── profile/            # Profil sayfası
│   │   ├── notifications/      # Bildirimler sayfası
│   │   └── admin/              # Admin paneli
│   ├── components/             # Paylaşılan UI bileşenleri
│   │   ├── Navbar.tsx
│   │   ├── PostCard.tsx
│   │   ├── ClubCard.tsx
│   │   ├── EventCard.tsx
│   │   └── Providers.tsx
│   ├── lib/                    # Yardımcı modüller
│   │   ├── db.ts               # PostgreSQL bağlantı (pg pool)
│   │   ├── auth.ts             # Session yardımcıları
│   │   └── utils.ts            # Tarih, slug, cn fonksiyonları
│   └── types/
│       └── index.ts            # TypeScript tipleri
└── package.json
```

## 🔧 Kullanışlı Komutlar

```bash
npm run dev          # Geliştirme sunucusu
npm run build        # Production build
npm run db:up        # PostgreSQL başlat
npm run db:down      # PostgreSQL durdur
npm run db:reset     # Veritabanını sıfırla (veriler silinir!)
npm run db:seed      # Demo veri ekle
```

## ✅ Özellikler

- [x] Kullanıcı kayıt ve giriş (Credentials)
- [x] Kulüp keşfi, oluşturma başvurusu
- [x] Kulübe katılma (herkese açık / onay gerekli)
- [x] Gönderi paylaşma, beğenme, yorum yapma
- [x] Duyuru sabitleme (kulüp yöneticisi)
- [x] Etkinlik oluşturma ve RSVP (Katılıyorum/Belki/Katılmıyorum)
- [x] Bildirim sistemi
- [x] Admin paneli (istatistikler, kulüp onaylama)
- [x] Mobil uyumlu (responsive) tasarım
- [x] Rol bazlı yetkilendirme (Üye / Kulüp Admini / Sistem Admini)
