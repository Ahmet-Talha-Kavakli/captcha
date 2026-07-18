import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { orkestraCeviri } from "./orkestra.i18n";
import { niyetSiniflandir, saldirganNiyetleri, niyetOzet } from "@/lib/specter/niyet-siniflandirma";
import { killChainCikar, killChainOzet } from "@/lib/specter/kill-chain";
import { botEkonomiHesap } from "@/lib/specter/bot-ekonomi";
import { saldiriTahmin, erkenUyari } from "@/lib/specter/saldiri-tahmin";
import { birlesikRisk } from "@/lib/specter/birlesik-risk";
import { defansDurusuHesap, type Sinyaller } from "./orkestra";
import { OrkestratorIstemci } from "./OrkestratorIstemci";

export const metadata: Metadata = { title: "Otonom Orkestratör — Veylify" };

const SAAT_MS = 3_600_000;
const GECMIS_SAAT = 72;
const TAHMIN_UFKU = 12;

/** Bir olayın saldırı-baskısına sayılıp sayılmayacağı (saldiri-tahmin ile aynı mantık). */
function saldiriMi(verdict: string, botClass: string): boolean {
  if (verdict === "blocked" || verdict === "challenged" || verdict === "flagged") return true;
  return botClass !== "human" && botClass !== "good_bot";
}

export default async function OrkestratorPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const events = Events.forOwner(user.id, 2000);

  // --- Saatlik seri (deterministik: "şimdi" = en yeni olayın ts'i) ---
  const enYeniTs = events.length ? Math.max(...events.map((e) => e.ts)) : 0;
  const saatlikBot = new Array(GECMIS_SAAT).fill(0);
  if (enYeniTs > 0) {
    for (const e of events) {
      if (!saldiriMi(e.verdict, e.botClass)) continue;
      const geri = Math.floor((enYeniTs - e.ts) / SAAT_MS);
      if (geri < 0 || geri >= GECMIS_SAAT) continue;
      saatlikBot[GECMIS_SAAT - 1 - geri] += 1;
    }
  }
  const mevcutHiz = saatlikBot[saatlikBot.length - 1] ?? 0;

  // --- Gerçek motorları çağır ---
  // Niyet: saldırgan bazında sınıflandır + özet.
  const saldirganlar = saldirganNiyetleri(events, 12);
  const niyet = niyetOzet(events, saldirganlar);
  // (niyetSiniflandir niyetOzet içinde kullanılıyor; ayrıca import ederek imzayı doğruladık.)
  void niyetSiniflandir;

  // Kill-chain: zincirleri çıkar + özet.
  const zincirler = killChainCikar(events, 40);
  const killChain = killChainOzet(zincirler);

  // Bot ekonomisi.
  const ekonomi = botEkonomiHesap(events);

  // Tahmin + erken uyarı.
  const tahmin = saldiriTahmin(saatlikBot, TAHMIN_UFKU);
  const uyari = erkenUyari(saatlikBot, tahmin.tahmin);

  // Birleşik risk.
  const risk = birlesikRisk(events);

  // --- FÜZYON ---
  const sinyaller: Sinyaller = { niyet, killChain, ekonomi, tahmin, uyari, risk, mevcutHiz };
  const sonuc = defansDurusuHesap(sinyaller);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.orchestrator", dil) }]}
        baslik={orkestraCeviri("o.baslik", dil)}
      />
      <OrkestratorIstemci
        sonuc={sonuc}
        toplamOlay={events.length}
        dil={dil}
        ozet={{
          saldirgan: niyet.toplamSaldirgan,
          baskinNiyet: niyet.baskinNiyet,
          zincir: killChain.toplamZincir,
          ileriUlasan: killChain.ileriUlasan,
          durdurmaOran: killChain.durdurulanOran,
          kritikIp: risk.ozet.kritik,
          engellenmeli: risk.ozet.engellenmeli,
          caydirilanSinif: ekonomi.ozet.caydirilanSinif,
          toplamSinif: ekonomi.ozet.toplamSinif,
          uyariBaslik: uyari.baslik,
          uyariSiddet: uyari.siddet,
          trend: tahmin.trendYonu,
        }}
      />
    </>
  );
}
