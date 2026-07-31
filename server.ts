import express, { Request, Response, NextFunction } from "express";
import "dotenv/config";
import cors from "cors";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
const prisma = new PrismaClient({ adapter }); // veritabanı bağlantımız
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ["http://localhost:5173", "https://todo-app-frontend-puce-nine.vercel.app"]
}));
app.use(express.json());



// TypeScript'e "Request nesnesine userId ekleyebilirim" demek için
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

function auth(req: Request, res: Response, next: NextFunction) {
  // 1) Başlığı oku
  const header = req.headers.authorization;

  // 2) Yoksa reddet
  if (!header) {
    return res.status(401).json({ error: "Token yok" });
  }

  // 3) "Bearer xxx" formatından token'ı ayır
  const token = header.split(" ")[1];

  try {
    // 4) Token'ı doğrula ve içindekini çıkar
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    req.userId = payload.userId;
    next();   // her şey yolunda, sıradakine geç
  } catch {
    return res.status(401).json({ error: "Geçersiz token" });
  }
}






// --- READ: Tüm görevleri getir ---
app.get("/todos",auth, async (req: Request, res: Response) => {
  const todos = await prisma.todo.findMany({where:{userId:req.userId}});
  res.json(todos);
});

// --- CREATE: Yeni görev ekle ---
app.post("/todos",auth, async (req: Request, res: Response) => {
  const newTodo = await prisma.todo.create({
    data: { text: req.body.text ,userId:req.userId!},
    
  });
  res.status(201).json(newTodo);
});

// --- UPDATE: Tamamlandı/tamamlanmadı yap ---
app.put("/todos/:id",auth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const todo = await prisma.todo.findFirst({ where: { id,userId:req.userId } });
  if (!todo) {
    return res.status(404).json({ error: "Görev bulunamadı" });
  }

  const updated = await prisma.todo.update({
    where: { id },
    data: { done: !todo.done },
    

  });
  res.json(updated);
});

app.put("/todos/:id/text",auth,async(req:Request,res:Response)=>{
  const id =Number(req.params.id)
 const todo = await prisma.todo.findFirst({ where: { id, userId: req.userId } });

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
app.delete("/todos/:id",auth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.todo.deleteMany({ where: { id ,userId:req.userId} });
  res.json({ message: "Silindi" });
});

app.delete("/todos/completed/all",auth, async (req: Request, res: Response) => {
  await prisma.todo.deleteMany({where:{done:true,userId:req.userId}})
  res.json({message:"tüm tamamlanmiş görevler silindi"})
})

app.post("/register",async(req:Request,res:Response)=>{
  const {email,password}=req.body;

  const hashed =await bcrypt.hash(password,10);

 

  const user =await prisma.user.create({
    data:{email:email,password:hashed}

  });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  res.status(201).json({token});

})

app.post("/login",async(req:Request,res:Response)=>{
  const {email,password}=req.body;
   const user =await prisma.user.findUnique({where:{email}});

  if(!user){
    return res.status(401).json({ error: "E-posta veya şifre hatalı" });
  }

  const valid=await bcrypt.compare(password,user.password)

  if(!valid){
    return res.status(401).json({
      error:"E-posta veya şifre hatali"
    })
  }


   const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  res.status(200).json({token});

  
})
  
app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});


