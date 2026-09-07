import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import todoRoutes from "./routes/todo.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { env, isProduction } from "./config/env";

// Bu dosya sunucuyu BASLATMAZ, yalnizca uygulamayi TANIMLAR.
// Ayrim testler icin sart: test dosyalari app'i alip supertest'e
// verir, gercek bir port dinlemeye gerek kalmaz.
const app = express();

// --- PROXY GUVENI ---
//
// Render istegi bize kendi uzerinden iletir. Bu ayar olmadan req.ip
// TUM ziyaretciler icin proxy'nin adresini dondurur; hiz sinirlayici
// herkesi tek sayacta toplar, bir kisi siniri doldurunca butun site
// engellenir ve gercek saldirgan hic ayirt edilemez.
//
// Deger 1: "onumde TEK proxy var". "true" yazmak zincirin tamamina
// guvenmek olur ve istemci basligi taklit ederek siniri asabilir.
if (isProduction) {
  app.set("trust proxy", 1);
}

// 1) GUVENLIK BASLIKLARI
// Yalnizca JSON donen bir API oldugu icin contentSecurityPolicy
// kapali; arayuz ayri bir serviste calisiyor ve bu API'yi
// okuyabilmeli, o yuzden kaynak politikasi gevsetildi.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// 2) CORS
//
// Izin verilen adresler ARTIK KODDA DEGIL, ortam degiskeninde
// (CORS_ORIGINS). Yeni bir onizleme adresi eklemek icin kod
// degistirip yeniden deploy etmek gerekmiyor.
app.use(cors({ origin: env.CORS_ORIGINS }));

// 3) Govde ayristirma. limit varsayilan zaten 100kb; acikca yazmak
// niyeti belli eder ve bir gorev metni icin fazlasiyla yeterli.
app.use(express.json({ limit: "100kb" }));

// --- SAGLIK KONTROLU ---
// Ucretsiz planda servis uykuya daldigi icin, arayuzun "sunucu
// uyaniyor" diyebilmesi adina ucuz bir uyandirma adresi.
app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 4) Genel hiz siniri. Kimlik islemlerinin kendi dar siniri
//    auth.routes icinde ayrica bagli.
app.use(apiLimiter);

app.use("/", authRoutes);
app.use("/todos", todoRoutes);

// --- HATA ISLEYICILER ---
// EN SONA baglanir: hicbir route eslesmezse notFoundHandler,
// herhangi bir yerde firlatilan hata errorHandler devreye girer.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
