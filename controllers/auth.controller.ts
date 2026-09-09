import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import type { LoginInput, RegisterInput } from "../schemas";

// CONTROLLER KATMANI
//
// Bu dosya vardi ama BOSTU: "katmanlara ayirma" commit'inde
// olusturulmus, icerigi ise route dosyasinda kalmisti. README'nin
// tarif ettigi yapiyla gercek yapi ayrisiyordu.
//
// Mantik artik burada; route dosyasi yalnizca "hangi adres hangi
// fonksiyona gidiyor" sorusunu cevapliyor.

const SALT_ROUNDS = 10;

// SAHTE HASH -- ZAMANLAMA SALDIRISINA KARSI.
//
// Kullanici bulunamadiginda bcrypt.compare hic calismiyordu: var
// olmayan bir e-posta ~1ms'te, var olan ~100ms'te cevap donuyordu.
// Saldirgan cevabin ICERIGINE degil, SURESINE bakarak hangi
// e-postalarin kayitli oldugunu ogrenebilirdi.
//
// Bu hash gecerli bir bcrypt ciktisi; karsilastirma her zaman
// basarisiz olur ama AYNI SUREYI alir.
const DUMMY_HASH = bcrypt.hashSync("zamanlama-saldirisina-karsi", SALT_ROUNDS);

function signToken(userId: number): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "7d" });
}

export async function register(req: Request, res: Response) {
  const { email, password } = req.body as RegisterInput;

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // E-postanin varligini ONCEDEN KONTROL ETMIYORUZ.
  //
  // Eski kod once findUnique ile bakip sonra create ediyordu. Iki
  // sorgu arasinda baska bir istek ayni e-postayi kaydedebilir
  // (yaris durumu) ve create beklenmedik bir hatayla patlardi.
  //
  // @unique kisiti zaten atomik: Prisma P2002 firlatir, merkezi
  // hata isleyici onu 409'a cevirir. Tek sorgu, yaris yok.
  let user;
  try {
    user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });
  } catch (error) {
    // Mesaji burada ozellestiriyoruz: genel "Bu kayıt zaten mevcut"
    // yerine kullanicinin ne yapacagini bilecegi bir cumle.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw AppError.conflict("Bu e-posta zaten kayıtlı");
    }
    throw error;
  }

  res.status(201).json({ token: signToken(user.id) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });

  // Kullanici yoksa sahte hash ile karsilastiriyoruz: sonuc her
  // durumda false, ama gecen sure ayni.
  const isPasswordValid = await bcrypt.compare(
    password,
    user?.password ?? DUMMY_HASH,
  );

  // Iki basarisizlik durumunu (kullanici yok / sifre yanlis) AYIRT
  // ETMIYORUZ: saldirgan hangi e-postalarin kayitli oldugunu
  // ogrenmesin (user enumeration).
  if (!user || !isPasswordValid) {
    throw AppError.unauthorized("E-posta veya şifre hatalı");
  }

  res.status(200).json({ token: signToken(user.id) });
}
