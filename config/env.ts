import "dotenv/config";
import { z } from "zod";

// ORTAM DEGISKENLERI TEK YERDEN OKUNUR VE DOGRULANIR.
//
// Onceden degiskenler koda dagilmis "!" ile okunuyordu:
//   jwt.sign(payload, process.env.JWT_SECRET!)
//
// "!" TypeScript'e "merak etme, bu deger var" demektir -- ama
// CALISMA ZAMANINDA hicbir sey dogrulamaz. JWT_SECRET tanimsizsa
// sunucu sorunsuz acilir ve hata ilk giris denemesinde, alakasiz
// bir yerde ortaya cikardi.
//
// Burasi tek giris noktasi: eksik veya hatali bir deger varsa
// sunucu ILK SANIYEDE, nedenini soyleyerek durur.
const schema = z.object({
  // VARSAYILAN "production" -- ve bu bilincli bir tercih.
  //
  // Alistigimiz varsayilan "development"tir, ama burada tehlikeli
  // olurdu: bu servis Render'da render.yaml olmadan, panelden
  // kuruldu. NODE_ENV panelde tanimlanmamissa varsayilan devreye
  // girer ve "development" secseydik CANLI ortam hata mesajlarini
  // (Prisma sorgulari, dosya yollari) istemciye gondermeye baslardi.
  //
  // Guvenli varsayilan, unutulan bir ayari acik bir yaraya
  // cevirmeyen varsayilandir. Gelistirmede NODE_ENV=development
  // .env dosyasindan geliyor (bkz. .env.example).
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("production"),

  // Render PORT'u kendisi atar. Yerelde 5000.
  // coerce: process.env'den gelen her sey metindir.
  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL tanimli degil. .env dosyasini kontrol et."),

  // 32 karakter alt siniri kasitli: kisa bir anahtar kaba kuvvetle
  // kirilabilir ve JWT imzasi anlamini yitirir.
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET en az 32 karakter olmali. Uretmek icin: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""),

  // CORS'un izin verecegi adresler, virgulle ayrilmis.
  //
  // Onceden bu liste app.ts'in icine yazilmisti. Yeni bir onizleme
  // adresi eklemek KOD DEGISIKLIGI ve yeniden deploy gerektiriyordu.
  // Artik panelden degistirilebilir.
  //
  // Tanimsizsa gelistirme varsayilani kullanilir.
  // Production'da ZORUNLU -- asagidaki superRefine'a bak.
  CORS_ORIGINS: z.string().optional(),
})
  .superRefine((data, ctx) => {
    // CANLIDA SESSIZCE LOCALHOST'A DUSMESIN.
    //
    // Bu deger onceden app.ts icine yazili bir listeydi ve canli arayuzun
    // adresi de oradaydi. Ortam degiskenine tasindiginda varsayilan
    // "http://localhost:5173" oldu: degisken panelde girilmezse sunucu
    // sorunsuz aciliyor, saglik kontrolunden geciyor, ama canli arayuzun
    // her istegi tarayicida CORS'a takiliyor. Sunucu tarafinda hicbir
    // hata gorunmedigi icin sebebini bulmak zor.
    //
    // Eksik yapilandirma sessiz bir kirilma degil, acik bir hata olmali.
    if (data.NODE_ENV === "production" && !data.CORS_ORIGINS) {
      ctx.addIssue({
        code: "custom",
        path: ["CORS_ORIGINS"],
        message:
          "NODE_ENV=production iken CORS_ORIGINS zorunlu. Arayuzun adresini yaz (birden fazlaysa virgulle ayir), ornek: https://todo-app-frontend-puce-nine.vercel.app",
      });
    }
  })
  .transform((data) => ({
    ...data,
    // Gelistirme varsayilani: yerelde Vite bu portta calisiyor.
    // Production'da bu dala hic dusulmez, yukarida zorunlu tutuluyor.
    CORS_ORIGINS: (data.CORS_ORIGINS ?? "http://localhost:5173")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  }));

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map(
    (issue) => `  - ${issue.path.join(".")}: ${issue.message}`,
  );

  console.error("Ortam degiskenleri gecersiz:\n" + lines.join("\n"));

  // Yanlis yapilandirmayla acilan bir sunucu, hic acilmayandan kotudur.
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
