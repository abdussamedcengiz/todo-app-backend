import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { loginSchema, registerSchema } from "../schemas";
import { validate } from "../middleware/validate";
import { authLimiter } from "../middleware/rateLimiter";

// ROUTE KATMANI
// Tek isi: hangi URL + metot hangi fonksiyona gidecek ve yolda
// hangi kontrollerden gececek. Is mantigi controller'da.
const router = Router();

// authLimiter: kaba kuvvet saldirisina karsi 15 dakikada 10 istek.
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register,
);

router.post("/login", authLimiter, validate(loginSchema), authController.login);

export default router;
