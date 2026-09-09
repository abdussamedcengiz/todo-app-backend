import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env, isProduction } from "./config/env";

// DATABASE_URL'in var oldugunu config/env.ts acilista dogruladi;
// burada tekrar kontrol etmiyoruz.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

// Uygulamanin TAMAMINDA tek bir PrismaClient ornegi kullanilir.
// Her "new PrismaClient()" yeni bir baglanti havuzu acar.
//
// tsx watch her degisiklikte modulleri yeniden yukler; globalThis
// yeniden yuklemede sifirlanmadigi icin ornegi orada saklayip
// baglanti havuzunun her kayitta cogalmasini engelliyoruz.
// Neon'un ucretsiz planinda baglanti sayisi sinirli, bu onemli.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// Canlida modul yeniden yukleme yok, bu numaraya gerek de yok.
if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
