import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});

export const todoSchema = z.object({
  text: z.string().min(1, "Görev metni boş olamaz").max(200, "Görev çok uzun"),
});
