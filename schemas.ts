import { z } from "zod";

const priorityEnum = z.enum(["LOW", "NORMAL", "HIGH"]);

// E-POSTA: ONCE NORMALIZE, SONRA DOGRULA.
//
// Sira onemli. "z.email().trim()" yazmak ise yaramaz: zod once bicimi
// kontrol eder, bastaki/sondaki bosluklar yuzunden istek reddedilir ve
// trim hic calismaz. pipe ile once metni temizliyoruz.
//
// toLowerCase: "Ali@x.com" ile "ali@x.com" ayni hesaptir. Normalize
// etmezsek kullanici kayit olurken kullandigi buyuk/kucuk harf
// duzenini hatirlamak zorunda kalir -- ve hatirlamazsa giris yapamaz.
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Geçerli bir e-posta girin"));

// Görev oluşturma
export const createTodoSchema = z.object({
  text: z.string().trim().min(1, "Görev metni boş olamaz").max(200, "Görev çok uzun"),
  priority: priorityEnum.optional(),
  dueDate: z.iso.datetime("Geçerli bir tarih girin").optional().nullable(),
});

// Sadece metin güncelleme
export const updateTextSchema = z.object({
  text: z.string().trim().min(1, "Görev metni boş olamaz").max(200, "Görev çok uzun"),
});

// Sadece öncelik güncelleme
export const updatePrioritySchema = z.object({
  priority: priorityEnum,
});

// GIRIS: bicim kurali UYGULANMAZ, yalnizca normalize edilir.
//
// Kayit kurallari zamanla sikilasabilir (ornegin sifre uzunlugu).
// Girise ayni siki kurallari koyarsak, eski kurallarla kayit olmus
// kullanicilar bir gun kendi hesaplarina giremez hale gelir.
// Burada tek beklentimiz alanlarin dolu olmasi.
//
// Normalize etmek yine de sart: kayit lowercase sakliyorsa giris de
// lowercase aramali, yoksa eslesme tutmaz.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "E-posta gerekli"),
  password: z.string().min(1, "Şifre gerekli"),
});

// Kayıt — sıkı kurallar
export const registerSchema = z.object({
  email: emailSchema,
  // 8 karakter, 6 degil: 6 karakterlik bir sifre gunumuzde kaba
  // kuvvetle makul surede kirilabilir.
  //
  // MEVCUT KULLANICILAR ETKILENMEZ: bu kural yalnizca yeni kayitlarda
  // calisir, giris semasinda uzunluk kontrolu yok.
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .max(200, "Şifre en fazla 200 karakter olabilir"),
});

// Route'lar bu tipleri kullanir; sema ile kod arasinda elle yazilmis
// ikinci bir tip tanimi olmaz, ikisi ayrisamaz.
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTextInput = z.infer<typeof updateTextSchema>;
export type UpdatePriorityInput = z.infer<typeof updatePrioritySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
