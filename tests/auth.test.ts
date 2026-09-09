import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { prisma } from "../prisma";

// TEST YALITIMI
//
// Iki test dosyasi PARALEL calisir. Onceden ikisi de "@example.com"
// kullaniyor ve afterAll'da "@example.com iceren TUM kullanicilari"
// siliyordu -- yani bir dosyanin temizligi, digerinin calisan
// testlerinin kullanicilarini silebiliyordu.
//
// Her dosyaya kendi alan adini veriyoruz; temizlik de yalnizca
// kendi alan adini hedefliyor.
const DOMAIN = "@auth.test.local";

// Her çalıştırmada benzersiz e-posta
const testEmail = `test-${Date.now()}${DOMAIN}`;
// Kayit kurali en az 8 karakter (schemas.ts). Testler bu kurali
// yansitmali, yoksa kayit 400 doner ve token alinamaz.
const testPassword = "test-sifresi-123";

describe("Kimlik doğrulama", () => {
   beforeAll(async () => {
    await request(app)
      .post("/register")
      .send({ email: testEmail, password: testPassword });
  });

  it("yeni kullanıcı kaydeder ve token döner", async () => {
    const res = await request(app)
      .post("/register")
      .send({ email: `yeni-${Date.now()}${DOMAIN}`, password: testPassword });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  it("geçersiz e-posta ile kaydı reddeder", async () => {
    const res = await request(app)
      .post("/register")
      .send({ email: "bozuk", password: testPassword });

    expect(res.status).toBe(400);
  });

  it("kısa şifreyi reddeder", async () => {
    const res = await request(app)
      .post("/register")
      .send({ email: `test-${Date.now()}${DOMAIN}`, password: "123" });

    expect(res.status).toBe(400);
  });

  it("aynı e-posta ile ikinci kaydı reddeder", async () => {
    // Onceden "once bak, sonra olustur" deseni vardi ve iki es zamanli
    // istek arasinda yaris durumu olusabiliyordu. Artik benzersizlik
    // kisiti (P2002) 409'a ceviriliyor.
    //
    // Test KENDI kullanicisini olusturuyor: paylasilan testEmail'e
    // guvenseydi, baska bir testin temizligi araya girdiginde
    // sebepsiz basarisiz olurdu.
    const email = `tekrar-${Date.now()}${DOMAIN}`;

    const ilk = await request(app)
      .post("/register")
      .send({ email, password: testPassword });
    expect(ilk.status).toBe(201);

    const ikinci = await request(app)
      .post("/register")
      .send({ email, password: testPassword });
    expect(ikinci.status).toBe(409);
  });

  it("e-postayı büyük/küçük harften bağımsız kabul eder", async () => {
    // Kayit lowercase saklıyor; giris de lowercase aramali.
    const res = await request(app)
      .post("/login")
      .send({ email: testEmail.toUpperCase(), password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("doğru bilgilerle giriş yapar", async () => {
    const res = await request(app)
      .post("/login")
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("yanlış şifreyle girişi reddeder", async () => {
    // SEN YAZ: doğru e-posta, yanlış şifre, 401 bekle
    const res = await request(app)
      .post("/login")
      .send({ email: testEmail, password: "yanlis_sifre" });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });
});

// Test bitince oluşturduğumuz kullanıcıyı sil
afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { endsWith: DOMAIN } },
  });
});
