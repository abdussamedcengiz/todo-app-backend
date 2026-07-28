import express, { Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const app = express();
const prisma = new PrismaClient({ adapter }); // veritabanı bağlantımız
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ["http://localhost:5173", "https://todo-app-frontend-puce-nine.vercel.app"]
}));
app.use(express.json());

// --- READ: Tüm görevleri getir ---
app.get("/todos", async (req: Request, res: Response) => {
  const todos = await prisma.todo.findMany();
  res.json(todos);
});

// --- CREATE: Yeni görev ekle ---
app.post("/todos", async (req: Request, res: Response) => {
  const newTodo = await prisma.todo.create({
    data: { text: req.body.text },
    
  });
  res.status(201).json(newTodo);
});

// --- UPDATE: Tamamlandı/tamamlanmadı yap ---
app.put("/todos/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) {
    return res.status(404).json({ error: "Görev bulunamadı" });
  }

  const updated = await prisma.todo.update({
    where: { id },
    data: { done: !todo.done },
    

  });
  res.json(updated);
});

app.put("/todos/:id/text",async(req:Request,res:Response)=>{
  const id =Number(req.params.id)
  const todo=await prisma.todo.findUnique(
    {
      where:{id}
    }
  )

  if(!todo){
    return res.status(404).json({error:"Görev bulunamadı"})
  }
  
  const updated=await prisma.todo.update({
    where:{id},
    data:{text:req.body.text}
  })

  res.json(updated)
} )

// --- DELETE: Görevi sil ---
app.delete("/todos/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.todo.delete({ where: { id } });
  res.json({ message: "Silindi" });
});

app.delete("/todos/completed/all", async (req: Request, res: Response) => {
  await prisma.todo.deleteMany({where:{done:true}})
  res.json({message:"tüm tamamlanmiş görevler silindi"})
})
  
app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
