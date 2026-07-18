import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events, Usage, Campaigns, Sites } from "@/lib/db/db";
import { korumaOzeti } from "@/lib/ozet";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { RaporStudyoIstemci, type StudyoVeriDTO } from "./RaporStudyoIstemci";

export const metadata: Metadata = { title: "Rapor Stüdyosu — Veylify" };

/**
 * Rapor Stüdyosu — sunucu sayfası.
 *
 * Mevcut /panel/raporlar sayfasını TAMAMLAR (onu değiştirmez). Buradaki fark:
 * gelişmiş bir rapor BESTECİSİdir — şablon seçimi, bölüm besteci, belge
 * görünümlü CANLI ÖNİZLEME, PDF/CSV/JSON dışa aktarma, zamanlama ve markalama.
 *
 * Sunucu tarafı yalnızca GERÇEK veriyi toplar (30 günlük trafik, engellenen
 * olaylar, en çok saldırılan ülkeler, en çok bot sınıfları, aktif kampanyalar,
 * koruma skoru) ve istemciye geçirir; böylece önizleme gerçek sayılarla dolar.
 */
function gunKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export default async function RaporStudyoPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const now = Date.now();
  const sites = Sites.forOwner(user.id);

  // --- 30 günlük kullanım serisi + toplamlar ---
  const usage = Usage.forOwner(user.id, 30);
  const gunHarita = new Map<string, number>();
  for (let d = 29; d >= 0; d--) gunHarita.set(gunKey(now - d * 86400000), 0);
  const toplam = { issued: 0, verified: 0, blocked: 0, challenged: 0 };
  for (const u of usage) {
    toplam.issued += u.issued;
    toplam.verified += u.verified;
    toplam.blocked += u.blocked;
    toplam.challenged += u.challenged;
    if (gunHarita.has(u.day)) {
      // Günlük "istek" trendi için issued kullan (trafik hacmi).
      gunHarita.set(u.day, (gunHarita.get(u.day) ?? 0) + u.issued);
    }
  }
  const trafikSerisi = [...gunHarita.entries()].map(([gun, deger]) => ({ gun, deger }));

  // --- Son 30 gün olayları: ülke + bot sınıfı dağılımı ---
  const events = Events.forOwner(user.id, 8000);
  const cutoff30 = now - 30 * 86400000;
  const son30 = events.filter((e) => e.ts >= cutoff30);

  const ulkeSayac: Record<string, number> = {};
  const sinifSayac: Record<string, number> = {};
  let engellenen = 0;
  for (const e of son30) {
    sinifSayac[e.botClass] = (sinifSayac[e.botClass] ?? 0) + 1;
    if (e.verdict === "blocked" || e.verdict === "challenged") engellenen++;
    if (e.botClass !== "human" && e.botClass !== "good_bot") {
      ulkeSayac[e.country] = (ulkeSayac[e.country] ?? 0) + 1;
    }
  }
  const enUlkeler = Object.entries(ulkeSayac)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([kod, deger]) => ({ kod, deger }));

  // Bot sınıfı sıralaması (insan/iyi-bot hariç ilk sıralar tehdit). Etiketler
  // istemcide i18n ile çevrilir; burada ham `kod` (enum değeri) geçilir.
  const enSiniflar = Object.entries(sinifSayac)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([kod, deger]) => ({ kod, deger }));

  // --- Aktif kampanyalar (botClass ham enum değeri; istemci çevirir) ---
  const kampanyalar = Campaigns.forOwner(user.id)
    .filter((c) => c.status === "active")
    .slice(0, 8)
    .map((c) => ({
      id: c.id,
      name: c.name,
      botClass: c.botClass,
      totalRequests: c.totalRequests,
      blockedRequests: c.blockedRequests,
      peakRps: c.peakRps,
    }));

  // --- Koruma skoru (özet) ---
  const ozet = korumaOzeti(user.id);

  const veri: StudyoVeriDTO = {
    donemGun: 30,
    olusturmaZamani: now,
    siteSayisi: sites.length,
    siteAdlari: sites.slice(0, 6).map((s) => s.name),
    trafikSerisi,
    toplam,
    engellenenSayisi: engellenen,
    olaySayisi: son30.length,
    enUlkeler,
    enSiniflar,
    kampanyalar,
    korumaSkoru: ozet.skor,
    tespitSkoru: ozet.tespit,
    kapsamSkoru: ozet.kapsam,
    yanitSkoru: ozet.yanit,
    aktifKampanya: ozet.aktifKampanya,
    kritikUyari: ozet.kritikUyari,
  };

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.reportstudio", dil) }]} baslik={ceviri("nav.reportstudio", dil)} />
      <RaporStudyoIstemci dil={dil} veri={veri} benimAdim={user.name} planim={user.plan} />
    </>
  );
}
