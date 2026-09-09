import { Request, Response } from "express";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError";
import type {
  CreateTodoInput,
  UpdatePriorityInput,
  UpdateTextInput,
} from "../schemas";

// Her istek icin kullanici kimligi.
//
// auth middleware'i bunu garanti ediyor, ama TypeScript bilemez:
// types/express.d.ts'te userId "number | undefined". Bu yardimci
// hem tipi daraltir hem de route'a auth eklemeyi unutursak
// sessizce TUM kullanicilarin verisine erisilmesini engeller.
function requireUserId(req: Request): number {
  if (req.userId === undefined) {
    throw AppError.unauthorized();
  }
  return req.userId;
}

// SAHIPLIK KONTROLU
//
// Ayni uc satir dort route'ta tekrar ediyordu. Tek yerde toplamak
// sadece kisalik meselesi degil: bir gun bu kontrolun degismesi
// gerekirse dort yerden birini atlamak imkansiz hale geliyor.
//
// Bulunamadiginda 404 donuyoruz, 403 degil -- 403 "bu gorev var ama
// senin degil" bilgisini sizdirirdi.
async function findOwnedTodo(id: number, userId: number) {
  const todo = await prisma.todo.findFirst({ where: { id, userId } });

  if (!todo) {
    throw AppError.notFound("Görev bulunamadı");
  }

  return todo;
}

export async function listTodos(req: Request, res: Response) {
  const userId = requireUserId(req);

  const todos = await prisma.todo.findMany({
    where: { userId },
    // Tamamlanmamislar once, sonra yaklasan son tarihe gore.
    orderBy: [{ done: "asc" }, { dueDate: "asc" }, { id: "asc" }],
  });

  res.json(todos);
}

export async function createTodo(req: Request, res: Response) {
  const userId = requireUserId(req);
  const { text, priority, dueDate } = req.body as CreateTodoInput;

  const newTodo = await prisma.todo.create({
    data: {
      text,
      priority,
      // Sema ISO metin dogruluyor; Date'e cevirmek bizim isimiz.
      dueDate: dueDate ? new Date(dueDate) : null,
      userId,
    },
  });

  res.status(201).json(newTodo);
}

// Tamamlandi durumunu ters cevirir.
export async function toggleTodo(req: Request<{ id: string }>, res: Response) {
  const userId = requireUserId(req);
  const id = Number(req.params.id); // validateIdParam gecerliligini dogruladi

  const todo = await findOwnedTodo(id, userId);

  const updated = await prisma.todo.update({
    where: { id },
    data: { done: !todo.done },
  });

  res.json(updated);
}

export async function updateTodoText(
  req: Request<{ id: string }>,
  res: Response,
) {
  const userId = requireUserId(req);
  const id = Number(req.params.id);
  const { text } = req.body as UpdateTextInput;

  await findOwnedTodo(id, userId);

  const updated = await prisma.todo.update({
    where: { id },
    data: { text },
  });

  res.json(updated);
}

export async function updateTodoPriority(
  req: Request<{ id: string }>,
  res: Response,
) {
  const userId = requireUserId(req);
  const id = Number(req.params.id);
  const { priority } = req.body as UpdatePriorityInput;

  await findOwnedTodo(id, userId);

  const updated = await prisma.todo.update({
    where: { id },
    data: { priority },
  });

  res.json(updated);
}

export async function deleteTodo(req: Request<{ id: string }>, res: Response) {
  const userId = requireUserId(req);
  const id = Number(req.params.id);

  await findOwnedTodo(id, userId);

  await prisma.todo.delete({ where: { id } });

  // 204 = basarili, donecek govde yok.
  res.status(204).send();
}

export async function deleteCompletedTodos(req: Request, res: Response) {
  const userId = requireUserId(req);

  // deleteMany zaten userId ile sinirli: baskasinin tamamlanmis
  // gorevlerine dokunmasi mumkun degil.
  await prisma.todo.deleteMany({ where: { done: true, userId } });

  res.status(204).send();
}
