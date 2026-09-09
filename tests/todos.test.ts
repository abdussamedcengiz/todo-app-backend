import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { prisma } from "../prisma";

// Bu dosyanin kendi alan adi: temizligi auth testlerine dokunmasin.
// (Ayrintili gerekce tests/auth.test.ts basinda.)
const DOMAIN = "@todos.test.local";

const userA = `a-${Date.now()}${DOMAIN}`;
const userB = `b-${Date.now()}${DOMAIN}`;
// Kayit kurali en az 8 karakter (schemas.ts).
const password = "test-sifresi-123";

let tokenA = "";
let tokenB = "";
let todoIdA = 0;

beforeAll(async () => {
  // İki kullanıcı oluştur ve token'larını al
  const resA = await request(app).post("/register").send({ email: userA, password });
  tokenA = resA.body.token;

  const resB = await request(app).post("/register").send({ email: userB, password });
  tokenB = resB.body.token;

  // A kullanıcısı bir görev oluştursun
  const todo = await request(app)
    .post("/todos")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ text: "A'nın görevi" });
  todoIdA = todo.body.id;
});

describe("Görevler", () => {
  it("token olmadan erişimi reddeder", async () => {
    const res = await request(app).get("/todos");
    expect(res.status).toBe(401);
  });

  it("kullanıcı kendi görevlerini görür", async () => {
    const res = await request(app)
      .get("/todos")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].text).toBe("A'nın görevi");
  });

  it("başka kullanıcının görevlerini GÖRMEZ", async () => {
    const res = await request(app)
      .get("/todos")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);   // B'nin hiç görevi yok
  });

  it("başka kullanıcının görevini silemez", async () => {
    const res = await request(app)
      .delete(`/todos/${todoIdA}`)
      .set("Authorization", `Bearer ${tokenB}`);
      expect(res.status).toBe(404); // Yetkisiz

      const check = await request(app)
      .get("/todos")
      .set("Authorization", `Bearer ${tokenA}`);
      expect(check.body).toHaveLength(1); // A'nın görevi hala var
  });

  it("boş görev metnini reddeder", async () => {
    const res = await request(app)
      .post("/todos")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ text: "" });
      expect(res.status).toBe(400);
  });
});

afterAll(async () => {
  await prisma.todo.deleteMany({
    where: { user: { email: { endsWith: DOMAIN } } },
  });
  await prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });
});
