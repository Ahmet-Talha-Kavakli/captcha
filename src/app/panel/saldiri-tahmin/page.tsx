import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events, Usage } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import {
  saldiriTahmin,
  erkenUyari,
  mevsimsellik,
} from "@/lib/specter/saldiri-tahmin";
import { SaldiriTahminIstemci } from "./SaldiriTahminIstemci";

export const metadata: Metadata = { title: "Saldırı Tahmini & Erken Uyarı — Veylify" };

const SAAT_MS = 3_600_000;
/** Kaç saatlik geçmiş kova kurulacak (yaklaşık son 72 saat). */
const GECMIS_SAAT = 72;
/** Kaç saat ileri tahmin edilecek. */
const TAHMIN_UFKU = 12;

/** Bir olayın bot/saldırı sayılıp sayılmayacağı (engellenen/challenge/flag + bot sınıfları). */
function saldiriMi(verdict: string, botClass: string): boolean {
  if (verdict === "blocked" || verdict === "challenged" || verdict === "flagged") return true;
  // "allowed" ama insan-dışı sınıflar da saldırı-baskısına sayılır.
  return botClass !== "human" && botClass !== "good_bot";
}

export default async function SaldiriTahminPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  // Sahibe ait geniş bir olay penceresi (yeni→eski sıralı gelir).
  const events = Events.forOwner(user.id, 6000);

  // DETERMİNİZM: "şimdi" olarak gerçek saati DEĞİL, en yeni olayın ts'ini alırız.
  // Böylece sayfa her yüklendiğinde kova sınırları sabit kalır (sabit veri →
  // sabit tahmin). Olay yoksa 0 kabul edip boş serilerle güvenli davranırız.
  const enYeniTs = events.length ? Math.max(...events.map((e) => e.ts)) : 0;

  // Saatlik kovalar: kova 0 = [enYeniTs-1saat, enYeniTs], en yeni kova serinin
  // SONUNDA olacak şekilde eskiden yeniye diz. saatVektoru[i] = kovanın günün
  // hangi saatine (0..23) denk geldiği (mevsimsellik için).
  const saatlikBot = new Array(GECMIS_SAAT).fill(0);
  if (enYeniTs > 0) {
    for (const e of events) {
      if (!saldiriMi(e.verdict, e.botClass)) continue;
      // enYeniTs'ten kaç saat geriye düşüyor (0 = en yeni kova).
      const geri = Math.floor((enYeniTs - e.ts) / SAAT_MS);
      if (geri < 0 || geri >= GECMIS_SAAT) continue;
      // Diziyi eskiden→yeniye tut: index 0 = en eski, son index = en yeni.
      const idx = GECMIS_SAAT - 1 - geri;
      saatlikBot[idx] += 1;
    }
  }

  // Son (en yeni) kovanın günün saati — mevsimsellik hizalaması için.
  // enYeniTs UTC saatini alırız (deterministik; DB dayKey de UTC/ISO kullanır).
  const sonSaatDilimi = enYeniTs > 0 ? new Date(enYeniTs).getUTCHours() : 0;

  // Tahmin + erken uyarı + mevsimsellik (hepsi saf motor).
  const tahminSonuc = saldiriTahmin(saatlikBot, TAHMIN_UFKU);
  const uyari = erkenUyari(saatlikBot, tahminSonuc.tahmin);
  const mevsim = mevsimsellik(saatlikBot, sonSaatDilimi);

  // Günlük (Usage) serisi — daha uzun-vadeli bağlam kartı için.
  const usage = Usage.forOwner(user.id, 30).sort((a, b) => a.day.localeCompare(b.day));
  // Aynı güne ait birden çok site sayacını birleştir.
  const gunlukMap = new Map<string, number>();
  for (const u of usage) {
    gunlukMap.set(u.day, (gunlukMap.get(u.day) || 0) + u.blocked + u.challenged);
  }
  const gunlukGunler = [...gunlukMap.keys()].sort();
  const gunlukBot = gunlukGunler.map((g) => gunlukMap.get(g) || 0);
  const gunlukTahmin = saldiriTahmin(gunlukBot, 7);

  // Son kovadaki mevcut saldırı hızı (en yeni kova).
  const mevcutHiz = saatlikBot[saatlikBot.length - 1] ?? 0;

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.attackforecast", dil) }]}
        baslik={ceviri("nav.attackforecast", dil)}
      />
      <SaldiriTahminIstemci
        saatlikBot={saatlikBot}
        tahmin={tahminSonuc}
        uyari={uyari}
        mevsim={mevsim}
        mevcutHiz={mevcutHiz}
        sonSaatDilimi={sonSaatDilimi}
        gunlukGunler={gunlukGunler}
        gunlukBot={gunlukBot}
        gunlukTahmin={gunlukTahmin}
        veriVar={enYeniTs > 0}
        dil={dil}
      />
    </>
  );
}
