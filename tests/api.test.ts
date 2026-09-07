import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { prisma } from "../prisma";

// Uygulama genelindeki davranislar: hata bicimi, guvenlik basliklari,
// adres parametresi dogrulama. Bunlar tek bir endpoint'e degil,
// app.ts'teki kuruluma ait.

const DOMAIN = "@api.test.local";
const password = "test-sifresi-123";

// Korumali endpoint'leri denemek icin gecerli bir token uretir.
async function tokenAl(): Promise<string> {
  const res = await request(app)
    .post("/register")
    .send({ email: `api-${Date.now()}${DOMAIN}`, password });

  return res.body.token as string;
}

describe("Uygulama davranisi", () => {
  it("saglik kontrolu calisiyor", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("tanimsiz adres HTML degil JSON 404 doner", async () => {
    const res = await request(app).get("/boyle-bir-adres-yok");

    // Onceden hicbir 404 isleyicisi yoktu ve Express'in varsayilan
    // HTML sayfasi donuyordu; istemcideki response.json() patlardi.
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.error).toEqual(expect.any(String));
  });

  it("bozuk JSON govdesi 400 doner", async () => {
    const res = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send("{ bu gecerli json degil");

    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/json/);
  });

  it("guvenlik basliklari gonderiliyor (helmet)", async () => {
    const res = await request(app).get("/health");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    // helmet Express'in "beni bu framework uretti" imzasini kaldirir.
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("Adres parametresi dogrulama", () => {
  it("sayisal olmayan id 500 degil 400 doner", async () => {
    const token = await tokenAl();

    // Onceden Number("abc") -> NaN dogruca Prisma'ya gidiyor,
    // orada patliyor ve kullanici 500 aliyordu. Ustelik eski hata
    // isleyici Prisma'nin mesajini oldugu gibi cevaba yaziyordu.
    const res = await request(app)
      .delete("/todos/abc")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it("negatif id reddedilir", async () => {
    const token = await tokenAl();

    const res = await request(app)
      .put("/todos/-5")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe("Kimlik dogrulama basligi", () => {
  it("Bearer oneki olmayan basligi reddeder", async () => {
    const res = await request(app)
      .get("/todos")
      .set("Authorization", "sadece-token-degeri");

    expect(res.status).toBe(401);
  });

  it("bozuk token reddedilir", async () => {
    const res = await request(app)
      .get("/todos")
      .set("Authorization", "Bearer bozuk.token.degeri");

    expect(res.status).toBe(401);
  });
});

// Bu dosyanin olusturdugu kullanicilari temizle.
// Yalnizca kendi alan adini hedefliyor; paralel calisan diger
// test dosyalarina dokunmaz.
afterAll(async () => {
  await prisma.todo.deleteMany({
    where: { user: { email: { endsWith: DOMAIN } } },
  });
  await prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });
});
