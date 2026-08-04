import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { prisma } from "../prisma";

const userA = `a-${Date.now()}@example.com`;
const userB = `b-${Date.now()}@example.com`;
const password = "123456";

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
  await prisma.todo.deleteMany({ where: { user: { email: { contains: "@example.com" } } } });
  await prisma.user.deleteMany({ where: { email: { contains: "@example.com" } } });
});
