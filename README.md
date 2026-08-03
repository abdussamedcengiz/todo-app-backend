# To-Do App — Backend

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
- Zod ile istek doğrulama
- Katmanlı mimari (routes / middleware / schemas)
- Merkezi hata yönetimi

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
| DELETE | `/todos/:id` | Görevi sil | ✔ |
| DELETE | `/todos/completed/all` | Tamamlananları sil | ✔ |

### Örnek istekler

```bash
# Kayıt
curl -X POST https://todo-app-backend-caori.onrender.com/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ornek@mail.com","password":"123456"}'

# Görevleri listele
curl https://todo-app-backend-caori.onrender.com/todos \
  -H "Authorization: Bearer <TOKEN>"
```

### Doğrulama kuralları

| Alan | Kural |
|---|---|
| `email` | Geçerli e-posta formatı |
| `password` | En az 6 karakter |
| `text` | 1–200 karakter |

## Proje yapısı

```
backend/
├── server.ts           # Express kurulumu ve başlatma
├── prisma.ts           # PrismaClient (singleton)
├── schemas.ts          # Zod doğrulama şemaları
├── middleware/
│   ├── auth.ts         # JWT doğrulama
│   ├── validate.ts     # İstek gövdesi doğrulama
│   └── errorHandler.ts # Merkezi hata yakalama
├── routes/
│   ├── auth.routes.ts  # /register, /login
│   └── todo.routes.ts  # /todos
└── prisma/
    └── schema.prisma   # Veritabanı şeması
```

## Veri modeli

```prisma
model User {
  id       Int    @id @default(autoincrement())
  email    String @unique
  password String
  todos    Todo[]
}

model Todo {
  id     Int     @id @default(autoincrement())
  text   String
  done   Boolean @default(false)
  userId Int
  user   User    @relation(fields: [userId], references: [id])
}
```

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu (otomatik yeniden başlatma) |
| `npm run build` | Prisma istemcisi üret + migration uygula |
| `npm start` | Üretim sunucusu |
| `npx prisma studio` | Veritabanı görüntüleyici |
