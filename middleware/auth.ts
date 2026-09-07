import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

// JWT DOGRULAMA
//
// Basarisizsa zinciri KESER; basariliysa req.userId'yi doldurup
// devam eder. express.json() req.body'yi dolduruyordu, bu da
// req.userId'yi dolduruyor -- ayni fikir, farkli veri.
export function auth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  // Onceden yalnizca "header var mi?" kontrol ediliyor ve
  // header.split(" ")[1] aliniyordu. "Bearer" onekini dogrulamak
  // niyeti acik kilar ve bicimi bozuk bir basligi erken eler.
  if (!header?.startsWith("Bearer ")) {
    throw AppError.unauthorized("Token yok");
  }

  // "Bearer " tam 7 karakter.
  const token = header.slice(7);

  try {
    // JWT_SECRET artik "!" ile degil, dogrulanmis yapilandirmadan
    // geliyor (config/env.ts). Tanimsiz olamayacagi acilista garanti.
    const payload = jwt.verify(token, env.JWT_SECRET);

    // "as { userId: number }" ile gecistirmiyoruz.
    //
    // jwt.verify'in donus tipi "string | JwtPayload" -- icinde ne
    // oldugunu TypeScript bilemez. Dogrudan "as" yazmak derleyiciye
    // yalan soylemek olurdu: imza gecerli ama payload beklenen
    // bicimde degilse (eski format token) hata calisma zamaninda,
    // alakasiz bir yerde patlardi.
    if (typeof payload === "string" || typeof payload.userId !== "number") {
      throw AppError.unauthorized("Geçersiz token");
    }

    req.userId = payload.userId;
    next();
  } catch (error) {
    // AppError'i oldugu gibi gecir; jwt'nin kendi hatalarini
    // (imza gecersiz, suresi dolmus) tek bir 401'e indir.
    // Hangisi oldugunu istemciye SOYLEMIYORUZ.
    if (error instanceof AppError) {
      throw error;
    }

    throw AppError.unauthorized("Geçersiz token");
  }
}

export default auth;
