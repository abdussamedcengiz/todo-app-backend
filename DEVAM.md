# Kaldığımız yer — Kullanıcı girişi (login)

## Tamamlananlar ✅

- **Şema**: `User` modeli eklendi, `Todo`'ya `userId` ilişkisi kuruldu
- **Migration**: `migrate reset` + `add-users` çalıştırıldı (veritabanı temiz)
- **Paketler**: `bcryptjs`, `jsonwebtoken` (+ types) kuruldu
- **`.env`**: `JWT_SECRET` eklendi
- **`POST /register`**: çalışıyor — şifreyi hash'ler, kullanıcı oluşturur, token döner
- **`POST /login`**: yazıldı — son düzeltmeler yapılıyordu

## Son düzeltme (yarım kalan)

`server.ts` içindeki `/login` route'unda:

1. `if (!valid)` bloğuna **`return`** ekle (şu an yanlış şifreyle token dönebiliyor — güvenlik açığı)
2. Hata mesajını diğeriyle aynı yap: `"E-posta veya şifre hatalı"` (bilgi sızdırmasın)
3. Son satırdaki `res.status(201)` → `res.json({ token })` (201 sadece oluşturma içindir)

Sonra test:

```bash
# kayıt
curl -X POST http://localhost:5000/register -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"123456\"}"

# giriş (doğru şifre → token dönmeli)
curl -X POST http://localhost:5000/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"123456\"}"

# giriş (yanlış şifre → 401, token DÖNMEMELİ)
curl -X POST http://localhost:5000/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"yanlis\"}"
```

## Sıradaki adımlar

1. **Auth middleware** — gelen istekteki token'ı doğrulayıp `req.userId`'yi dolduran ara katman
2. **Todo route'larını kullanıcıya bağlama** — herkes sadece kendi görevlerini görsün
   (`findMany({ where: { userId } })`, `create({ data: { text, userId } })` vb.)
3. **Frontend**: Giriş/kayıt sayfaları, token'ı `localStorage`'da saklama,
   her istekte `Authorization: Bearer <token>` header'ı gönderme
4. **Korumalı rotalar** — giriş yapmamış kullanıcıyı login sayfasına yönlendirme

## Hatırlatmalar

- `res.json()` cevabı gönderir ama **fonksiyonu durdurmaz** → hata dönüşlerinde hep `return` kullan
- `schema.prisma` değişince: `npx prisma migrate dev` + `npx prisma generate`
- Backend: `npm run dev` (tsx watch — kaydedince otomatik yeniden başlar)
- Frontend: `npm run dev`
- Canlı adresler: Vercel (frontend), Render (backend), Neon (veritabanı)
