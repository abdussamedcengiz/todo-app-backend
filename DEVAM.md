# Proje durumu — To-Do App

## Tamamlananlar ✅

### Temel
- React + TypeScript + Tailwind frontend (Vite)
- Node + Express + Prisma backend (TypeScript, tsx)
- PostgreSQL veritabanı (Neon)
- Tam CRUD: ekle, listele, düzenle, sil, tamamla
- Filtreleme (Tümü / Aktif / Tamamlanan), kalan sayacı, tamamlananları temizle
- Yükleniyor / hata durumları
- Custom hook (`useTodos`), API katmanı (`api.ts`)
- React Router: `/`, `/about`, `/login`

### Kullanıcı girişi
- `User` modeli + `Todo.userId` ilişkisi
- `POST /register` — bcrypt ile şifre hash'leme
- `POST /login` — şifre doğrulama, JWT üretimi
- `auth` middleware — token doğrulama, `req.userId`
- Tüm todo route'ları kullanıcıya bağlı (herkes sadece kendi görevlerini görür)
- Frontend: `LoginPage`, `localStorage`'da token, `RequireAuth` korumalı rota, çıkış butonu

### Yayın
- Frontend: Vercel
- Backend: Render
- Veritabanı: Neon
- Git: iki ayrı repo, push edince otomatik deploy

## Yapılabilecekler

1. **LoginPage'e Tailwind stilleri** — şu an çıplak görünüyor
2. **401 yakalama** — token süresi dolunca otomatik giriş sayfasına yönlendirme
3. **Ayrı geliştirme veritabanı** — şu an yerel ve canlı aynı Neon veritabanını kullanıyor
   (Neon'da ikinci proje aç, yerel `.env`'e onun adresini yaz)
4. **Yeni alanlar** — son tarih, öncelik (şema + migration pratiği)
5. **Sıralama / arama**
6. **Karanlık mod** (`dark:` öneki ile Tailwind'de kolay)

## Öğrenilen dersler (tekrar için)

- `res.json()` cevabı gönderir ama fonksiyonu **durdurmaz** → hata dönüşlerinde `return` kullan
- Yetkilendirme **her sorguya** gömülmeli (`where: { id, userId }`)
- `findUnique` sadece benzersiz alanlarla çalışır → çok koşullu arama için `findFirst`
- Hook'lar sadece bileşen/custom hook **içinde** çağrılır
- Süslü parantezler kapsamı belirler → kodun fonksiyon içinde mi dışında mı olduğuna dikkat
- `fetch` hata kodlarında hata fırlatmaz → `if (!res.ok)` kontrolü şart
- Şifreler ve anahtarlar koda değil **ortam değişkenine** yazılır
- `.gitignore` sadece henüz takip edilmeyen dosyalar için çalışır

## Çalıştırma

```bash
# Terminal 1 — backend
cd C:\Users\cengiz\OneDrive\Desktop\todo-app-backend\backend
npm run dev

# Terminal 2 — frontend
cd C:\Users\cengiz\OneDrive\Desktop\todo-app\frontend
npm run dev

# Veritabanını görüntüle (backend klasöründe)
npx prisma studio
```

Şema değişince: `npx prisma migrate dev --name <ad>` + `npx prisma generate`
