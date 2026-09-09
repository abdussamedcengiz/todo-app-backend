import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { AppError } from "../utils/AppError";

// ISTEK GOVDESI DOGRULAMA
//
// Dogrulanmis veriyi req.body'nin YERINE koyar: controller artik ham
// istemci verisini degil, semadan gecmis, kirpilmis ve donusturulmus
// veriyi gorur. Semada olmayan fazladan alanlar da burada dusurulur.
export function validate<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Ilk mesaj kullaniciya en yakin olani; hepsini birden
      // gostermek bu boyutta bir API icin gereksiz gurultu.
      const message = result.error.issues[0]?.message ?? "Geçersiz istek";
      throw AppError.badRequest(message);
    }

    req.body = result.data;
    next();
  };
}

// ADRES PARAMETRESI DOGRULAMA
//
// Onceden her route "Number(req.params.id)" yaziyordu. "/todos/abc"
// istegi NaN uretiyor, NaN Prisma'ya gidiyor ve orada patliyordu:
// kullanici 400 yerine 500 aliyordu -- ustelik eski hata isleyici
// Prisma'nin mesajini oldugu gibi cevaba yaziyordu.
//
// Artik gecersiz id route'a hic ulasmiyor.
export function validateIdParam(
  req: Request<{ id: string }>,
  _res: Response,
  next: NextFunction,
) {
  const id = Number(req.params.id);

  // Number.isInteger NaN'i da, 1.5 gibi ondalikli degerleri de eler.
  if (!Number.isInteger(id) || id < 1) {
    throw AppError.badRequest("Geçersiz görev kimliği");
  }

  next();
}
