# To-Do App — Backend

[![Testler](https://github.com/abdussamedcengiz/todo-app-backend/actions/workflows/test.yml/badge.svg)](https://github.com/abdussamedcengiz/todo-app-backend/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Kullanıcı girişli bir yapılacaklar uygulamasının REST API'si.
Her kullanıcı yalnızca kendi görevlerini görebilir.

**Canlı API:** https://todo-app-backend-caori.onrender.com
**Frontend repo:** https://github.com/abdussamedcengiz/todo-app-frontend
**Canlı uygulama:** https://todo-app-frontend-puce-nine.vercel.app

> Not: Ücretsiz sunucu planı nedeniyle API hareketsizken uykuya geçer.
> İlk istek 30–60 saniye sürebilir.

## Teknolojiler

- Node.js + Express 5
- TypeScript
- Prisma ORM + PostgreSQL (Neon)
- JWT (jsonwebtoken) + bcryptjs
- Zod (veri doğrulama)
- Helmet (güvenlik başlıkları) + express-rate-limit (hız sınırlama)
- Vitest + Supertest (testler), Docker Compose (yerel test veritabanı)

## Özellikler

- Kayıt / giriş, şifreler bcrypt ile hash'lenir
- JWT tabanlı kimlik doğrulama (7 gün geçerli)
- Görev CRUD işlemleri, kullanıcı bazlı yetkilendirme
- Görevlerde öncelik (düşük / normal / yüksek) ve son tarih
- Akıllı sıralama: tamamlanmamışlar önce, ardından yaklaşan son tarihe göre
- Zod ile istek doğrulama, her endpoint için ayrı şema
- Katmanlı mimari (routes / controllers / middleware / schemas)
- Merkezi hata yönetimi — tüm hatalar JSON, iç ayrıntılar sızmaz
- Hız sınırlama: kimlik işlemlerinde 10 istek / 15 dk, genel API'de 300 / dk
- Açılışta ortam değişkeni doğrulama — eksik yapılandırmayla sunucu başlamaz
- Düzgün kapanma (graceful shutdown)
- Otomatik testler (Vitest + Supertest), her push'ta CI üzerinde çalışır

## Kurulum

```bash
npm install
```

`.env.example` dosyasını kopyalayıp `.env` yap ve değerleri doldur:

```bash
cp .env.example .env        # Windows: copy .env.example .env
```

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `DATABASE_URL` | ✔ | PostgreSQL bağlantı adresi |
| `JWT_SECRET` | ✔ | **En az 32 karakter.** Kısaysa sunucu başlamaz. |
| `PORT` | – | Varsayılan `5000` |
| `NODE_ENV` | – | `development` \| `test` \| `production` |
| `CORS_ORIGINS` | – | İzin verilen adresler, virgülle ayrılmış |

`JWT_SECRET` üretmek için:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Veritabanını hazırla ve sunucuyu başlat:

```bash
npx prisma migrate dev
npm run dev
```

Sunucu `http://localhost:5000` adresinde çalışır.
`GET /health` ile ayakta olduğunu doğrulayabilirsin.

## API

Kimlik doğrulama gerektiren istekler `Authorization: Bearer <token>` başlığı ister.

| Metod | Adres | Açıklama | Auth |
|---|---|---|---|
| GET | `/health` | Servis ayakta mı | – |
| POST | `/register` | Kayıt ol, token döner | – |
| POST | `/login` | Giriş yap, token döner | – |
| GET | `/todos` | Görevleri listele | ✔ |
| POST | `/todos` | Görev ekle | ✔ |
| PUT | `/todos/:id` | Tamamlandı durumunu değiştir | ✔ |
| PUT | `/todos/:id/text` | Görev metnini güncelle | ✔ |
| PUT | `/todos/:id/priority` | Görev önceliğini güncelle | ✔ |
| DELETE | `/todos/:id` | Görevi sil | ✔ |
| DELETE | `/todos/completed/all` | Tamamlananları sil | ✔ |

Yetkisiz erişim `404` döner (`403` değil) — kaynağın varlığı sızdırılmaz.

### Örnek istekler

```bash
# Kayıt
curl -X POST https://todo-app-backend-caori.onrender.com/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ornek@mail.com","password":"123456"}'

# Görevleri listele
curl https://todo-app-backend-caori.onrender.com/todos \
  -H "Authorization: Bearer <TOKEN>"

# Öncelikli, son tarihli görev ekle
curl -X POST https://todo-app-backend-caori.onrender.com/todos \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"text":"Rapor teslimi","priority":"HIGH","dueDate":"2026-09-01T00:00:00.000Z"}'
```

### Doğrulama kuralları

| Alan | Kural |
|---|---|
| `email` | Geçerli e-posta formatı (kayıtta) |
| `password` | En az 8 karakter (kayıtta) |
| `text` | 1–200 karakter |
| `priority` | `LOW` \| `NORMAL` \| `HIGH` |
| `dueDate` | ISO 8601 tarih metni, opsiyonel |
| `:id` | Pozitif tam sayı; değilse `400` döner |

Girişte doğrulama daha gevşektir (sadece alanların dolu olması aranır) —
kuralların sonradan sıkılaştırılması eski kullanıcıları kilitlemesin diye.
Şifre alt sınırı 6'dan 8'e çıkarıldı; bu yalnızca **yeni kayıtları**
etkiler, mevcut kullanıcılar giriş yapmaya devam eder.

E-posta hem kayıtta hem girişte kırpılır ve küçük harfe çevrilir:
`Ali@X.com` ile `ali@x.com` aynı hesaptır.

### Hata cevapları

Tüm hatalar JSON döner:

```json
{ "error": "Görev bulunamadı" }
```

| Kod | Ne zaman |
|---|---|
| `400` | Doğrulama hatası, geçersiz `:id`, bozuk JSON gövdesi |
| `401` | Token yok, bozuk, süresi dolmuş; yanlış e-posta/şifre |
| `404` | Kayıt yok **veya başkasına ait** (varlık sızdırılmaz) |
| `409` | E-posta zaten kayıtlı |
| `429` | Hız sınırı aşıldı |
| `500` | Beklenmeyen hata — iç ayrıntılar cevaba **eklenmez** |

## Güvenlik

- **Şifreler** bcrypt (cost 10) ile hash'lenir, cevaplarda asla yer almaz.
- **Kullanıcı izolasyonu**: her görev sorgusu `userId` ile sınırlı. Başkasının
  görevine erişim `403` değil `404` döner — `403`, kaydın var olduğunu ele verirdi.
- **Kullanıcı sayımına karşı**, e-posta bulunamadığında da sahte bir hash ile
  karşılaştırma yapılır; cevap süresi her iki durumda da aynıdır.
- **Kayıtta yarış durumu yok**: "önce bak, sonra oluştur" yerine benzersizlik
  kısıtına güveniliyor (`P2002` → `409`).
- **Hız sınırlama** ve `trust proxy` ile gerçek istemci IP'sine göre sayım.
- **Güvenlik başlıkları** helmet ile eklenir.
- **Hata ayrıntıları** yalnızca `NODE_ENV=development` iken cevaba eklenir;
  canlıda Prisma mesajları veya yığın izi istemciye gitmez.
- **Secret yok**: tüm gizli değerler ortam değişkenlerinden gelir ve açılışta
  doğrulanır.

## Testler

Testler **gerçek bir PostgreSQL** ister (mock değil, gerçek sorgular).
Yerelde tek komutla ayağa kaldırılır:

```bash
npm run db:up                 # test veritabanını başlat (Docker, port 5434)
npx prisma migrate deploy     # tabloları oluştur
npm test                      # 20 test
npm run db:down               # bitince durdur ve verileri sil
```

`.env` içindeki `DATABASE_URL` bu veritabanını göstermeli:
`postgresql://postgres:postgres@localhost:5434/testdb`

Vitest + Supertest ile 20 test:

| Dosya | Kapsam |
|---|---|
| `tests/auth.test.ts` | Kayıt, giriş, doğrulama kuralları, yanlış şifre, tekrar kayıt (`409`), büyük/küçük harf |
| `tests/todos.test.ts` | Token kontrolü, kullanıcı izolasyonu, yetkisiz silme denemesi |
| `tests/api.test.ts` | Sağlık kontrolü, JSON `404`, bozuk JSON, helmet başlıkları, geçersiz `:id`, bozuk `Authorization` |

Her test dosyası kendi e-posta alan adını kullanır (`@auth.test.local` gibi);
dosyalar paralel çalıştığı için ortak bir alan adı kullanmak, bir dosyanın
temizliğinin diğerinin kullanıcılarını silmesine yol açıyordu.

Testler her push'ta GitHub Actions üzerinde, izole bir PostgreSQL konteynerinde
otomatik olarak çalışır (bkz. `.github/workflows/test.yml`).

## Proje yapısı

```
backend/
├── server.ts               # Sunucuyu başlatır + düzgün kapanma
├── app.ts                  # Express kurulumu (test edilebilir)
├── prisma.ts               # PrismaClient (singleton)
├── schemas.ts              # Zod doğrulama şemaları
├── config/
│   └── env.ts              # Ortam değişkeni doğrulama (tek giriş noktası)
├── controllers/
│   ├── auth.controller.ts  # Kayıt / giriş mantığı
│   └── todo.controller.ts  # Görev CRUD mantığı
├── middleware/
│   ├── auth.ts             # JWT doğrulama
│   ├── validate.ts         # Gövde ve :id doğrulama
│   ├── rateLimiter.ts      # Hız sınırlama
│   └── errorHandler.ts     # Merkezi hata yakalama + 404
├── routes/
│   ├── auth.routes.ts      # /register, /login
│   └── todo.routes.ts      # /todos
├── utils/
│   └── AppError.ts         # Beklenen hatalar için tek tip
├── types/
│   └── express.d.ts        # Request.userId tip genişletmesi
├── tests/
│   ├── auth.test.ts
│   ├── todos.test.ts
│   └── api.test.ts
├── prisma/
│   └── schema.prisma       # Veritabanı şeması
├── docker-compose.yml      # Yerel test veritabanı
└── .github/workflows/
    └── test.yml            # CI yapılandırması
```

`controllers/` klasörü daha önce vardı ama **boştu** — iş mantığı route
dosyalarının içinde duruyordu. Artık gerçekten kullanılıyor: route'lar
yalnızca adres eşlemesi ve middleware zincirini tarif ediyor.

## Veri modeli

```prisma
enum Priority {
  LOW
  NORMAL
  HIGH
}

model User {
  id       Int    @id @default(autoincrement())
  email    String @unique
  password String
  todos    Todo[]
}

model Todo {
  id       Int       @id @default(autoincrement())
  text     String
  done     Boolean   @default(false)
  priority Priority  @default(NORMAL)
  dueDate  DateTime?
  userId   Int
  user     User      @relation(fields: [userId], references: [id])
}
```

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu (otomatik yeniden başlatma) |
| `npm run build` | Prisma istemcisi üret + migration uygula |
| `npm start` | Üretim sunucusu |
| `npm run typecheck` | TypeScript tip kontrolü (tüm proje) |
| `npm test` | Testleri bir kez çalıştırır |
| `npm run test:watch` | Testleri izleme modunda çalıştırır |
| `npm run db:up` / `db:down` | Yerel test veritabanını başlatır / siler |
| `npx prisma studio` | Veritabanı görüntüleyici |

## Lisans

MIT — ayrıntılar için [LICENSE](LICENSE) dosyasına bak.
