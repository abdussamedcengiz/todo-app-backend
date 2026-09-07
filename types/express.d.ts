// DECLARATION MERGING
// Express'in Request tipine kendi alanimizi ekliyoruz.
//
// Bu tanim onceden middleware/auth.ts'in icindeydi. Tip tanimi ile
// calisma zamani mantigini ayni dosyada tutmak, tipin nereden geldigini
// arayan biri icin sasirtici: global bir tip, global bir yerde durmali.
declare global {
  namespace Express {
    interface Request {
      // auth middleware'i doldurur.
      // "?" cunku middleware calismadan once bu alan YOK.
      userId?: number;
    }
  }
}

export {};
