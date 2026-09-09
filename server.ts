import app from "./app";
import { env } from "./config/env";
import { prisma } from "./prisma";

const server = app.listen(env.PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${env.PORT} (${env.NODE_ENV})`);

  // CORS LISTESI ACILISTA YAZILIYOR.
  //
  // Bu satir gercek bir olaydan sonra eklendi: panele CORS_ORIGINS
  // olarak yanlis bir adres girilmisti. Sunucu sorunsuz acildi,
  // /health 200 dondu, loglarda hicbir hata yoktu -- ama tarayici
  // canli arayuzun her istegini CORS'a takti. Disaridan bakan biri
  // icin "her sey calisiyor" gorunuyordu.
  //
  // Sunucunun HANGI adresleri kabul ettigini yazmak, bu hatayi
  // loglara tek bakista gorunur kilar. Degerler zaten gizli degil;
  // istemcinin adresi her cevapta zaten geri gonderiliyor.
  console.log(`CORS izinli adresler: ${env.CORS_ORIGINS.join(", ")}`);
});

// --- DUZGUN KAPANMA (graceful shutdown) ---
//
// Render yeni bir surum yayina alirken eski surume SIGTERM gonderir.
// Dinlemezsek Node aniden olur: islenmekte olan istekler yarida
// kesilir ve veritabani baglantilari duzgun kapanmaz.
//
// server.close() YENI baglanti kabul etmeyi birakir ama devam eden
// istekleri bitirmeyi bekler.
async function shutdown(signal: string) {
  console.log(`${signal} alindi, sunucu kapaniyor...`);

  // Kapanma takilirsa sonsuza kadar beklemeyelim.
  // unref: bu sayac Node'un kapanmasini engellemesin.
  const forceExit = setTimeout(() => {
    console.error("Kapanma zaman asimina ugradi, zorla cikiliyor.");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close(async (error) => {
    if (error) {
      console.error("Sunucu kapatilirken hata:", error);
    }

    await prisma.$disconnect();
    console.log("Kapandi.");
    process.exit(error ? 1 : 0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
