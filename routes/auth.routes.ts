import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import {  loginSchema, registerSchema } from "../schemas";
import { validate } from "../middleware/validate";

const router = Router();


router.post("/register",validate(registerSchema), async(req,res)=>{

    const { email, password } = req.body;
   


  

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        return res.status(400).json({ error: "Kullanıcı zaten mevcut" });
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(password, 10);

    // Yeni kullanıcıyı oluştur
    const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword
        }
    });

    // Token oluştur
    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });

    res.status(201).json({ token });
})

router.post("/login",validate(loginSchema), async(req,res)=>{

   const { email, password } = req.body;
    const user =await prisma.user.findUnique({where:{email}});

    if(!user){
        return res.status(401).json({error:"E-posta veya şifre hatali"})
    }
    
    const isPasswordValid = await bcrypt.compare(password,user.password);
    if(!isPasswordValid){
        return res.status(401).json({error:"E-posta veya şifre hatali"})
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    res.status(200).json({token});




})

export default router;
