<div align="center">

# 🍇 Crosswave

### Ajanslar için white-label sosyal medya büyüme takip platformu

Birden fazla müşteri kanalını **tek panelden** izle, büyümeyi takip et ve
tek tıkla **markalı PDF raporlar** üret — tablolarla uğraşmadan.

[![CI](https://github.com/Yavuz0707/Crosswave/actions/workflows/ci.yml/badge.svg)](https://github.com/Yavuz0707/Crosswave/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-722F37.svg)](LICENSE)
![Python](https://img.shields.io/badge/Python-3.14-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-async-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)

</div>

---

## 📖 İçindekiler

- [Crosswave Nedir?](#-crosswave-nedir)
- [Ekran Görüntüleri](#-ekran-görüntüleri)
- [Öne Çıkan Özellikler](#-öne-çıkan-özellikler)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Mimari](#-mimari)
- [Proje Yapısı](#-proje-yapısı)
- [Kurulum](#-kurulum)
- [API Uç Noktaları](#-api-uç-noktaları)
- [Veritabanı Şeması](#-veritabanı-şeması)
- [Testler](#-testler)
- [Otomatik Senkronizasyon](#-otomatik-senkronizasyon)
- [PDF Rapor Üretimi](#-pdf-rapor-üretimi)
- [Yol Haritası](#-yol-haritası)
- [Lisans](#-lisans)

---

## 🎯 Crosswave Nedir?

Crosswave, ajansların ve freelancer'ların yönettikleri **birden çok müşterinin
sosyal medya kanallarını** tek bir sade panelde takip etmesini sağlayan bir
SaaS uygulamasıdır. Her müşteri için abone/görüntülenme büyümesi izlenir, en iyi
performans gösteren içerikler listelenir ve müşteriye sunulabilecek **profesyonel,
markalı PDF raporlar** otomatik üretilir.

Veri modeli **platform-agnostik** tasarlandı: bugün **YouTube** (Data API v3, herkese
açık veri, API key ile — OAuth gerektirmez) entegredir; Instagram ve TikTok ileride
**şema değişmeden** aynı yapıya eklenebilir.

> Bu depo hem **backend** (FastAPI) hem de **frontend** (React + Vite) uygulamasını
> içerir.

---

## 📸 Ekran Görüntüleri

### Giriş ekranı
Sade, iki panelli giriş akışı — sol tarafta marka, sağ tarafta form.

![Giriş ekranı](AppGallery/Screenshot%202026-06-23%20000339.png)

### Dashboard — Genel Bakış
Seçili müşterinin özet kartları (abone, görüntülenme, 30 günlük büyüme) ve
abone/görüntülenme büyüme grafiği. Sağ üstte **Sync**, **PDF İndir** ve
**Generate report** aksiyonları.

![Dashboard genel bakış](AppGallery/Screenshot%202026-06-23%20000456.png)

### Son içerikler
Kanaldan senkronize edilen son videolar; küçük resim, görüntülenme, beğeni,
yorum ve yayın tarihiyle birlikte.

![Son içerikler tablosu](AppGallery/Screenshot%202026-06-23%20000513.png)

### İçerik sekmesi
Tüm içeriklerin kart görünümü ve durum filtreleri (All / Published / Scheduled / Drafts).

![İçerik sekmesi](AppGallery/Screenshot%202026-06-23%20000528.png)

### Üretilen PDF raporu
Tek tıkla oluşturulan, Türkçe ve markalı (bordo/krem) PDF: özet kartlar, büyüme
grafiği ve en iyi performans gösteren videolar tablosu.

![PDF raporu](AppGallery/Screenshot%202026-06-23%20000600.png)

### Ayarlar
Ajans profili, plan & faturalandırma, bildirimler ve ekip bölümleri.

![Ayarlar ekranı](AppGallery/Screenshot%202026-06-23%20000630.png)

---

## ✨ Öne Çıkan Özellikler

| Alan | Özellik |
|------|---------|
| 🔐 **Kimlik doğrulama** | JWT tabanlı kayıt/giriş, bcrypt ile parola hash'leme |
| 🏢 **Çok kiracılı (multi-tenant)** | Her istek `agency_id`'ye göre izole; bir ajans diğerinin verisini göremez |
| 👥 **Müşteri yönetimi** | Müşteri (client) CRUD işlemleri |
| 📺 **YouTube entegrasyonu** | @handle / kanal ID / URL ile herkese açık kanal bağlama (Data API v3) |
| 🔄 **Senkronizasyon** | Kanal istatistikleri + son videoları çekip veritabanına yazar (idempotent upsert) |
| 📊 **Dashboard** | Özet kartlar, büyüme grafiği (Framer Motion animasyonları), içerik tablosu/kartları |
| 📄 **PDF rapor** | reportlab + matplotlib ile markalı, Türkçe rapor üretimi (bellekten stream) |
| ⏰ **Otomatik sync** | APScheduler ile her gece 02:00'de tüm aktif hesapları otomatik senkronize eder |
| 🧑‍💼 **Kullanıcı & kanal silme** | Ajans içi kullanıcı silme (rol korumalı) ve bağlı kanal silme |
| 🧪 **Testler** | 33 pytest entegrasyon testi (YouTube çağrıları mock'lu), CI'da otomatik koşar |

---

## 🛠 Teknoloji Yığını

### Backend
- **Python 3.14** · **FastAPI** (async)
- **SQLAlchemy 2.0** (async) + **Alembic** (migration)
- **PostgreSQL** (asyncpg sürücüsü)
- **PyJWT** + **bcrypt** (kimlik doğrulama)
- **httpx** (YouTube Data API v3 istemcisi)
- **reportlab** + **matplotlib** + **Pillow** (PDF rapor)
- **APScheduler** (zamanlanmış görevler)

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **React Router** (yönlendirme)
- **axios** (API katmanı, JWT interceptor)
- **Framer Motion** (animasyonlar: sayfa geçişleri, sayaç, grafik çizimi, toast)

---

## 🏗 Mimari

Birden fazla dosyaya yayılan, "büyük resim" niteliğindeki kararlar:

- **Platform-agnostik çekirdek.** Yeni platform eklemek = `platforms` tablosuna satır +
  `connected_accounts` kaydı; şema değişmez. Platforma özgü tek kod
  `app/services/youtube/` altında — Instagram/TikTok eklemek bir kardeş servis
  yazmak demektir.
- **Kodda zorlanan çok kiracılılık.** Her istek `current_user.agency_id`'ye scope'lanır.
  `app/api/deps.py` içindeki `get_owned_client` / `get_owned_account` tek geçiş
  noktasıdır ve ajans dışındaki her şeye 404 döner.
- **Async oturum yaşam döngüsü.** `get_db` istek başına tek bir `AsyncSession` verir,
  başarıda commit, hatada rollback yapar; handler'lar mid-request PK için `flush` kullanır.
- **Senkronizasyon akışı.** `POST /accounts/{id}/sync` → `sync_youtube_account()` kanal
  istatistiklerini ve son videoları çekip PostgreSQL `INSERT ... ON CONFLICT DO UPDATE`
  ile yazar (`account_metrics_daily` günde tek satır, `content_items` kanal+video bazında tekil).
- **Kimlik doğrulama.** JWT; frontend token'ı `localStorage`'da tutar, axios interceptor
  ile ekler, 401'de `cw:unauthorized` olayıyla oturumu düşürür.
- **Otomatik sync.** APScheduler `AsyncIOScheduler` uygulama lifespan'inde başlar; gece
  02:00 cron'u tüm aktif hesapları (hesap başına commit ile) senkronize eder.

---

## 📁 Proje Yapısı

```
Crosswave/
├── app/                        # Backend (FastAPI)
│   ├── main.py                 # uygulama girişi + lifespan (scheduler başlatma)
│   ├── scheduler.py            # APScheduler: gece sync + dev seed
│   ├── core/                   # config, async database, security (JWT + bcrypt)
│   ├── models/                 # SQLAlchemy modelleri (10 tablo)
│   ├── schemas/                # Pydantic şemaları
│   ├── api/
│   │   ├── deps.py             # ortak bağımlılıklar (auth, db, sahiplik kontrolü)
│   │   └── v1/                 # auth, users, clients, accounts, metrics, reports, admin
│   └── services/
│       ├── youtube/            # Data API v3 istemcisi + senkronizasyon
│       └── report/             # PDF üretimi (builder, chart, styles)
├── alembic/                    # migration ortamı + ilk migration
├── tests/                      # 33 pytest entegrasyon testi
├── frontend/                   # React + Vite + TS uygulaması
│   └── src/
│       ├── api/                # axios istemci + uç nokta sarmalayıcıları
│       ├── auth/               # AuthContext + korumalı route'lar
│       ├── components/         # ortak UI + dashboard bileşenleri
│       └── pages/              # Login, Signup, Dashboard, Settings
├── AppGallery/                 # ekran görüntüleri (bu README'de kullanılır)
├── requirements.txt            # backend bağımlılıkları
├── requirements-dev.txt        # + test bağımlılıkları
└── .env.example                # ortam değişkeni şablonu (gerçek .env git'e girmez)
```

---

## 🚀 Kurulum

> **Gereksinimler:** Python 3.12+ (3.14 önerilir), Node.js 20+, çalışan bir PostgreSQL.

### 1) Backend

```bash
# Sanal ortam oluştur ve etkinleştir
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # Windows PowerShell
# source .venv/bin/activate          # macOS / Linux

# Bağımlılıkları kur (test dahil)
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt

# Ortam değişkenlerini ayarla
copy .env.example .env               # Windows  (cp .env.example .env  — Unix)
# .env içindeki DATABASE_URL, JWT_SECRET, YOUTUBE_API_KEY değerlerini doldur

# Veritabanını oluştur (PostgreSQL çalışıyor olmalı) ve migration'ları uygula
.\.venv\Scripts\python.exe -m alembic upgrade head

# API'yi çalıştır
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Backend: **http://localhost:8000** · İnteraktif dokümanlar (Swagger): **http://localhost:8000/docs**

> 🔑 **Ortam değişkenleri** yalnızca `.env.example` üzerinden belgelenir; gerçek
> `.env` dosyası gizlidir ve sürüm kontrolüne **dahil edilmez**. `JWT_SECRET` için
> güçlü bir değer üret: `python -c "import secrets; print(secrets.token_urlsafe(48))"`

### 2) Frontend

```bash
cd frontend
npm install
copy .env.example .env               # VITE_API_BASE_URL gerekiyorsa düzenle
npm run dev
```

Frontend: **http://localhost:5173** (backend'in çalışıyor olması gerekir).

---

## 🔌 API Uç Noktaları

Tüm korumalı uç noktalar `Authorization: Bearer <token>` başlığı bekler.
Taban yol: `/api/v1`

| Metot | Yol | Açıklama |
|-------|-----|----------|
| `GET` | `/health` | Sağlık kontrolü |
| `POST` | `/auth/register` | Ajans + ilk kullanıcı oluştur, token döner |
| `POST` | `/auth/login` | Giriş yap, JWT token al |
| `GET` | `/auth/me` | Mevcut kullanıcı bilgisi |
| `GET` | `/users` | Ajanstaki kullanıcıları listele |
| `DELETE` | `/users/{id}` | Kullanıcı sil (owner/admin, kendini silemez) |
| `GET/POST` | `/clients` | Müşterileri listele / oluştur |
| `GET/PATCH/DELETE` | `/clients/{id}` | Müşteri getir / güncelle / sil |
| `POST` | `/accounts` | Müşteriye YouTube kanalı bağla |
| `GET` | `/accounts` | Bağlı hesapları listele (client_id ile filtrelenebilir) |
| `GET/DELETE` | `/accounts/{id}` | Hesap getir / sil (**kanal silme**) |
| `POST` | `/accounts/{id}/sync` | Kanalın güncel verisini YouTube'dan çek |
| `GET` | `/accounts/{id}/metrics` | Günlük metrikler |
| `GET` | `/accounts/{id}/content` | İçerikler + son metrikleri |
| `POST` | `/reports/generate` | PDF rapor üret (stream) |
| `POST` | `/admin/sync-all` | Tüm aktif hesapları hemen senkronize et (yalnızca dev) |

---

## 🗄 Veritabanı Şeması

PostgreSQL üzerinde 10 tablo (UUID birincil anahtarlar, `gen_random_uuid()` sunucu
varsayılanları, `ON CONFLICT` upsert'ler — bu yüzden SQLite **desteklenmez**):

`agencies` · `users` · `clients` · `platforms` · `connected_accounts` ·
`account_metrics_daily` · `content_items` · `content_metrics` · `goals` · `reports`

Şema platform-agnostiktir; yeni platform eklemek için migration gerekmez.

---

## 🧪 Testler

Testler ayrı bir `crosswave_test` veritabanı kullanır (otomatik oluşturulur) ve tüm
YouTube çağrıları mock'lanır — **ağ/kota tüketmez**.

```bash
# Tüm test paketi
.\.venv\Scripts\python.exe -m pytest tests/ -v

# Tek test
.\.venv\Scripts\python.exe -m pytest tests/test_auth.py::test_login_success

# Kapsam raporu ile
.\.venv\Scripts\python.exe -m pytest tests/ --cov=app --cov-report=term-missing
```

**33 test** kapsar: kimlik doğrulama, müşteri CRUD + çok kiracılı izolasyon, kanal
bağlama/silme, senkronizasyon, PDF rapor üretimi, otomatik sync ve kullanıcı yönetimi.
Her push/PR'da [GitHub Actions CI](.github/workflows/ci.yml) backend testlerini ve
frontend derlemesini çalıştırır.

---

## ⏰ Otomatik Senkronizasyon

`app/scheduler.py` içindeki **APScheduler** her gece **02:00**'de `status='active'`
tüm hesapları sırayla senkronize eder (her hesap kendi transaction'ında commit edilir,
biri başarısız olsa diğerleri etkilenmez).

Geliştirme ortamında elle test için:

```
POST /api/v1/admin/sync-all      # yalnızca APP_ENV=development; prod'da 403
```

Ayrıca dev ortamında uygulama başlangıcında, kendi geçmiş verisi 2'den az olan her
hesaba grafiklerin anında dolması için 30 günlük gerçekçi örnek veri seed edilir
(mevcut gerçek satırlar korunur).

---

## 📄 PDF Rapor Üretimi

`POST /api/v1/reports/generate` bir hesap ve dönem için **bellekte** PDF üretir ve
`StreamingResponse` ile döner (diske/S3'e yazmaz). Rapor şunları içerir:

1. **Kapak sayfası** — ajans, müşteri, kanal, dönem, oluşturulma tarihi
2. **Özet kartlar** — toplam abone, toplam görüntülenme, dönem büyümesi
3. **Büyüme grafiği** — matplotlib ile çizilen abone grafiği (PNG olarak gömülür)
4. **En iyi videolar tablosu** — görüntülenmeye göre ilk 10
5. **Hedef vs gerçekleşen KPI** — `goals` tablosunda kayıt varsa

> Türkçe karakter desteği için reportlab'a, matplotlib ile zaten gelen **DejaVuSans**
> fontu register edilir (ekstra kurulum gerektirmez).

---

## 🗺 Yol Haritası

- [x] YouTube entegrasyonu (Sprint 1)
- [x] PDF rapor üretimi
- [x] Otomatik gece senkronizasyonu (APScheduler)
- [x] Kullanıcı & kanal silme
- [ ] Instagram / TikTok entegrasyonu (veri modeli hazır)
- [ ] Rapor geçmişi & dosya saklama (S3)
- [ ] Faturalandırma / abonelik
- [ ] Hedef (goal) yönetimi için arayüz

---

## 📜 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.

<div align="center">

🤖 _Claude Code ile geliştirildi._

</div>
