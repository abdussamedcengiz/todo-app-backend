# To-Do App — Backend

![Testler](https://github.com/abdussamedcengiz/todo-app-backend/actions/workflows/test.yml/badge.svg)

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

## Özellikler

- Kayıt / giriş, şifreler bcrypt ile hash'lenir
- JWT tabanlı kimlik doğrulama (7 gün geçerli)
- Görev CRUD işlemleri, kullanıcı bazlı yetkilendirme
- Görevlerde öncelik (düşük / normal / yüksek) ve son tarih
- Akıllı sıralama: tamamlanmamışlar önce, ardından yaklaşan son tarihe göre
- Zod ile istek doğrulama, her endpoint için ayrı şema
- Katmanlı mimari (routes / middleware / schemas)
- Merkezi hata yönetimi
- Otomatik testler (Vitest + Supertest), her push'ta CI üzerinde çalışır

## Kurulum

```bash
npm install
```

Kök dizinde `.env` dosyası oluştur:

```
DATABASE_URL="postgresql://kullanici:sifre@host/veritabani?sslmode=require"
JWT_SECRET="rastgele-uzun-bir-metin"
```

Veritabanını hazırla ve sunucuyu başlat:

```bash
npx prisma migrate dev
npm run dev
```

Sunucu `http://localhost:5000` adresinde çalışır.

## API

Kimlik doğrulama gerektiren istekler `Authorization: Bearer <token>` başlığı ister.

| Metod | Adres | Açıklama | Auth |
|---|---|---|---|
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
| `password` | En az 6 karakter (kayıtta) |
| `text` | 1–200 karakter |
| `priority` | `LOW` \| `NORMAL` \| `HIGH` |
| `dueDate` | ISO 8601 tarih metni, opsiyonel |

Girişte doğrulama daha gevşektir (sadece alanların dolu olması aranır) —
kuralların sonradan sıkılaştırılması eski kullanıcıları kilitlemesin diye.

## Testler

```bash
npm test
```

Vitest + Supertest ile 10 test:

| Dosya | Kapsam |
|---|---|
| `tests/auth.test.ts` | Kayıt, giriş, doğrulama kuralları, yanlış şifre reddi |
| `tests/todos.test.ts` | Token kontrolü, kullanıcı izolasyonu, yetkisiz silme denemesi |

Testler her push'ta GitHub Actions üzerinde, izole bir PostgreSQL konteynerinde
otomatik olarak çalışır (bkz. `.github/workflows/test.yml`).

## Proje yapısı

```
backend/
├── server.ts           # Sunucuyu başlatır
├── app.ts              # Express kurulumu (test edilebilir)
├── prisma.ts           # PrismaClient (singleton)
├── schemas.ts          # Zod doğrulama şemaları
├── middleware/
│   ├── auth.ts         # JWT doğrulama
│   ├── validate.ts     # İstek gövdesi doğrulama
│   └── errorHandler.ts # Merkezi hata yakalama
├── routes/
│   ├── auth.routes.ts  # /register, /login
│   └── todo.routes.ts  # /todos
├── tests/
│   ├── auth.test.ts
│   └── todos.test.ts
├── prisma/
│   └── schema.prisma   # Veritabanı şeması
└── .github/workflows/
    └── test.yml        # CI yapılandırması
```

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
| `npx prisma studio` | Veritabanı görüntüleyici |
