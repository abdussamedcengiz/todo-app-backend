import { defineConfig } from "vitest/config";

// Dosya uzantisi ".mts": package.json "type": "commonjs" oldugu icin
// ".ts" uzantili bu ESM dosyasi Vite tarafindan uyari ile yukleniyordu.
// .mts uzantisi "bu dosya ESM" der ve uyari ortadan kalkar.
export default defineConfig({
  test: {
    // Gercek bir veritabanina baglaniliyor; varsayilan 5 saniye
    // konteyner soguk baslarken yetmeyebilir.
    testTimeout: 20000,
    hookTimeout: 20000,

    env: {
      // NODE_ENV=test olmadan iki sey yanlis calisirdi:
      //   1) Hiz sinirlayici DEVREDE olurdu. Testler arka arkaya
      //      onlarca kayit/giris istegi atiyor ve 15 dakikada 10
      //      istek sinirini asip 429 alirlardi -- hata mesaji da
      //      gercek sebebi gizlerdi.
      //   2) Hata isleyici ic hata mesajlarini cevaba eklerdi;
      //      sizinti testi gercek canli davranisi olcemezdi.
      //
      // DATABASE_URL ve JWT_SECRET BURADA TANIMLI DEGIL: gercek
      // ortamdan gelmeliler (yerelde .env, CI'da workflow).
      NODE_ENV: "test",
    },
  },
});
