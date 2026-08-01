import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export function auth(req:Request, res:Response, next:NextFunction) {

    const header =req.headers.authorization;
    if(!header){
        return res.status(401).json({error:"Token yok"});
    }

    const token =header.split(" ")[1];

    try{
        const payload=jwt.verify(token,process.env.JWT_SECRET!) as {userId:number};
        req.userId=payload.userId;
        next();
    }catch{
        return res.status(401).json({error:"Geçersiz token"});
    }
}

export default auth;
