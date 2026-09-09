import rateLimit from "express-rate-limit";
import { isTest } from "../config/env";

// HIZ SINIRLAMA
//
// /login ve /register herkese acik ve sifre dogruluyor. Bir saldirgan
// saniyede yuzlerce istek atip sifre deneyebilir; bcrypt'in yavasligi
// bunu zorlastirir ama engellemez -- ustelik her deneme sunucunun
// CPU'sunu mesgul eder. Ucretsiz Render planinda bu tek basina
// servisi cokertmeye yeter.
//
// Bu middleware'in dogru calismasi app.ts'teki "trust proxy" ayarina
// baglidir: proxy arkasinda o ayar olmadan req.ip herkes icin ayni
// degeri dondurur ve sinir tum ziyaretcileri tek sayacta toplar.

// Testlerde sinir kapali: test dosyalari arka arkaya onlarca istek
// atiyor ve sinira takilsalardi hata mesaji yaniltici olurdu.
const skip = () => isTest;

// Kimlik islemleri: dar sinir.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  limit: 10,
  skip,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin.",
  },
});

// Genel API siniri. Normal bir kullanici dakikada 10-20 istek atar.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  skip,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Çok fazla istek gönderildi. Lütfen biraz bekleyin." },
});

// NOT: sayaclar sunucu belleginde tutulur. Birden fazla sunucu ornegi
// calisirsa her biri kendi sayacini tutar; gercek trafikte cozum
// Redis gibi ortak bir depodur. Bu proje olceginde bellek yeterli.
