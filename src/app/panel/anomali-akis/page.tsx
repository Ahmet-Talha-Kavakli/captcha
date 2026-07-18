import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { anomaliTespit } from "@/lib/specter/anomaly";
import { AnomaliAkisIstemci } from "./AnomaliAkisIstemci";

export const metadata: Metadata = { title: "Anomali Akışı — Veylify" };

/**
 * Gerçek-Zaman Anomali Akışı — sunucu sayfası.
 * Başlangıç tohumu: son ~1500 olayı çekip batch anomali motorunu bir kez
 * çalıştırır (ilk anomali listesi). Canlı katman istemcide SSE/polling ile
 * bunun üzerine akar.
 */
export default async function AnomaliAkisPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Tohum: batch motor için son 1500 olay (Events.forOwner en yeni önce döner).
  const events = Events.forOwner(user.id, 1500);
  const anomaliler = anomaliTespit(events);

  // İstemciye yalnızca gereken alanları geçir (hafif payload).
  const baslangicAnomaliler = anomaliler.map((a) => ({
    tur: a.tur,
    siddet: a.siddet,
    baslik: a.baslik,
    aciklama: a.aciklama,
    oneri: a.oneri ?? null,
    skor: a.skor,
  }));

  // Canlı hız temel çizgisi için başlangıç bot oranı (son 300 olaydan).
  const sonPencere = events.slice(0, 300);
  const botSay = sonPencere.filter((e) => e.verdict === "blocked" || e.verdict === "challenged").length;
  const baslangicBotOran = sonPencere.length ? botSay / sonPencere.length : 0;

  const baslik = ceviri("nav.anomalystream", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <AnomaliAkisIstemci
        dil={dil}
        baslangicAnomaliler={baslangicAnomaliler}
        baslangicBotOran={baslangicBotOran}
        tohumOlaySayisi={events.length}
      />
    </>
  );
}
