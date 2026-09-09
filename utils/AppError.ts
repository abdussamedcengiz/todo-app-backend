// BEKLENEN HATALAR ICIN TEK TIP.
//
// Onceden route'lar hatayi dogrudan cevaba yaziyordu:
//   return res.status(404).json({ error: "Görev bulunamadı" })
//
// Bu kalip her endpoint'te tekrar ediyordu ve "return" unutulursa
// istek iki kez cevaplanmaya calisiliyordu.
//
// Artik route "bu istek 404" der ve hatayi FIRLATIR; cevabin nasil
// yazilacagina merkezi hata isleyici karar verir.
export class AppError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }

  static badRequest(message: string) {
    return new AppError(400, message);
  }

  static unauthorized(message = "Yetkisiz istek") {
    return new AppError(401, message);
  }

  static notFound(message = "Kayıt bulunamadı") {
    return new AppError(404, message);
  }

  static conflict(message: string) {
    return new AppError(409, message);
  }
}
