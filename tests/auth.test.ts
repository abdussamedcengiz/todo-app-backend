import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { prisma } from "../prisma";

// Her çalıştırmada benzersiz e-posta
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = "123456";

describe("Kimlik doğrulama", () => {
   beforeAll(async () => {
    await request(app)
      .post("/register")
      .send({ email: testEmail, password: testPassword });
  });

  it("yeni kullanıcı kaydeder ve token döner", async () => {
    const res = await request(app)
      .post("/register")
      .send({ email: `yeni-${Date.now()}@example.com`, password: testPassword });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  it("geçersiz e-posta ile kaydı reddeder", async () => {
    const res = await request(app)
      .post("/register")
      .send({ email: "bozuk", password: "123456" });

    expect(res.status).toBe(400);
  });

  it("kısa şifreyi reddeder", async () => {
    const res = await request(app).post("/register").send({ email: `test-${Date.now()}@example.com`, password: "123" });

    expect(res.status).toBe(400);
  });

  it("doğru bilgilerle giriş yapar", async () => {
    const res = await request(app)
      .post("/login")
      .send({ email: testEmail, password: "123456" });

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
    where: { email: { contains: "@example.com" } },
  });
});
