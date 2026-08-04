import { z } from "zod";

const priorityEnum = z.enum(["LOW", "NORMAL", "HIGH"]);

// Görev oluşturma
export const createTodoSchema = z.object({
  text: z.string().min(1, "Görev metni boş olamaz").max(200, "Görev çok uzun"),
  priority: priorityEnum.optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

// Sadece metin güncelleme
export const updateTextSchema = z.object({
  text: z.string().min(1, "Görev metni boş olamaz").max(200, "Görev çok uzun"),
});

// Sadece öncelik güncelleme
export const updatePrioritySchema = z.object({
  priority: priorityEnum,
});

export const loginSchema = z.object({
  email: z.string().min(1, "E-posta gerekli"),
  password: z.string().min(1, "Şifre gerekli"),
});

// Kayıt — sıkı kurallar
export const registerSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});
