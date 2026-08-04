import { Router } from "express";
import { prisma } from "../prisma";
import { auth } from "../middleware/auth";
import { createTodoSchema, updatePrioritySchema, updateTextSchema} from "../schemas";
import { validate } from "../middleware/validate";

const router = Router();
router.use(auth);

// --- READ: Tüm görevleri getir ---    

router.get("/", async (req, res) => {
  const todos = await prisma.todo.findMany({ where: { userId: req.userId },
  orderBy:[{done:"asc"},{dueDate:"asc"},{id:"asc"}]
});
  res.json(todos);
});

// --- CREATE: Yeni görev ekle ---
router.post("/",validate(createTodoSchema),    async (req, res) => {
    const {text, priority, dueDate} = req.body;

   
  const newTodo = await prisma.todo.create({
    
    data: { text, priority,  dueDate:dueDate?new Date(dueDate):null, userId: req.userId! },
  });
  res.status(201).json(newTodo);
});

// --- UPDATE: Tamamlandı/tamamlanmadı yap ---
router.put("/:id",async(req,res)=>{
    const id =Number(req.params.id);

    const todo =await prisma.todo.findFirst({where:{id,userId:req.userId}});
    if(!todo){
        return res.status(404).json({error:"Görev bulunamadı"})
    }

    const updated =await prisma.todo.update({
        where:{id},
        data:{done:!todo.done}
    })
    res.json(updated)


})

router.put("/:id/text",validate(updateTextSchema) ,async(req,res)=>{
    const id =Number(req.params.id)
    const todo =await prisma.todo.findFirst({where:{id,userId:req.userId}});

    if(!todo){
        return res.status(404).json({error:"Görev bulunamadı"})
    }

    const updated =await prisma.todo.update({
        where:{id},
        data:{text:req.body.text}
    })
    res.json(updated)
})

router.put("/:id/priority",validate(updatePrioritySchema    ) ,async(req,res)=>{
    const id =Number(req.params.id)
    const todo =await prisma.todo.findFirst({where:{id,userId:req.userId}});
    if(!todo){
        return res.status(404).json({error:"Görev bulunamadı"})
    }
    const updated=await prisma.todo.update({
        where:{id},
        data:{priority:req.body.priority}
    })
    res.json(updated)
})

router.delete("/:id",async(req,res)=>{
    const id =Number(req.params.id)
    const todo=await prisma.todo.findFirst({where:{id,userId:req.userId}});
    if(!todo){
        return res.status(404).json({error:"Görev bulunamadi"})

    }

    await prisma.todo.delete({where:{id}});
    res.status(204).send();
})

router.delete("/completed/all", async (req, res) => {
  await prisma.todo.deleteMany({ where: { done: true, userId: req.userId } });
  res.status(204).send();
});

export default router;
