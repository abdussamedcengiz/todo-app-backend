import { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client";
import { AppError } from "../utils/AppError";
import { isDevelopment, isTest } from "../config/env";

// TANIMSIZ ADRESLER
//
// Tum route'lardan SONRA baglanir. Olmasaydi Express kendi HTML hata
// sayfasini donerdi -- JSON bekleyen istemcide response.json()
// "Unexpected token <" ile patlardi.
export function notFoundHandler(req: Request, _res: Response) {
  throw AppError.notFound(`${req.method} ${req.originalUrl} bulunamadı`);
}

// Prisma hata kodlarini HTTP karsiliklarina ceviren tek yer.
function fromPrisma(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    // P2002: benzersizlik kisiti -> ayni e-posta zaten kayitli.
    case "P2002":
      return AppError.conflict("Bu kayıt zaten mevcut");

    // P2025: guncellenecek/silinecek satir yok.
    case "P2025":
      return AppError.notFound();

    default:
      return new AppError(500, "Beklenmeyen bir veritabanı hatası oluştu");
  }
}

// MERKEZI HATA ISLEYICI
//
// Express bir middleware'in DORT parametresi varsa onu hata isleyici
// sayar. Imzayi kisaltmak bu middleware'i sessizce devre disi birakir.
//
// Express 5 async handler'lardan donen reddedilmis promise'leri
// kendiliginden buraya yonlendirir.
//
// ONCEKI SURUMUN SORUNU: hata ne olursa olsun "err.message" dogrudan
// istemciye yaziliyordu. Prisma hatalarinin mesaji sorgu metnini,
// tablo ve sutun adlarini icerir; bir veritabani hatasi tarayiciya
// semanin bir bolumunu aktarabilirdi. Ayrica "err.status || 500"
// saldirganin kontrol ettigi bir nesnede status alani varsa
// yaniltici bir kod donmesine yol acabilirdi.
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const appError =
    error instanceof AppError
      ? error
      : error instanceof Prisma.PrismaClientKnownRequestError
        ? fromPrisma(error)
        : // express.json() bozuk JSON aldiginda SyntaxError firlatir.
          error instanceof SyntaxError && "status" in error
          ? AppError.badRequest("İstek gövdesi geçerli bir JSON değil")
          : null;

  if (appError) {
    // Beklenen hatalari loglamiyoruz: 404 ve 400 gunluk hayattir,
    // log'u doldurup gercek sorunlari gorunmez kilarlar.
    res.status(appError.status).json({ error: appError.message });
    return;
  }

  // Beklenmeyen hata: bu bir HATADIR, sunucu logunda mutlaka gorulmeli.
  if (!isTest) {
    console.error("[unhandled]", error);
  }

  res.status(500).json({
    error: "Sunucuda beklenmeyen bir hata oluştu",
    // Ayrinti YALNIZCA gelistirmede. Canlida ve testte ic bilgiler
    // cevaba hic girmez.
    ...(isDevelopment && error instanceof Error
      ? { message: error.message }
      : {}),
  });
}
