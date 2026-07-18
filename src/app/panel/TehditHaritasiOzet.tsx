"use client";

/**
 * Veylify — Tehdit Haritası Özeti (Compact World Threat Map)
 * ==========================================================
 * Dashboard'a gömülü kompakt dünya tehdit haritası. `cografya`
 * (CografyaIstihbarat) prop'undan beslenir — YENİ MOTOR YOK. Ülke kartları
 * hacim + risk yoğunluğuna göre ısı-renkli (amber → kırmızı), en riskli 6-8
 * ülke bayraklı; altta ASN kategori özeti (datacenter / VPN-proxy / bulletproof
 * / konut). Tam sayfa haritaya link.
 *
 * KURAL: framer-motion opacity:0 giriş YOK — sadece y/width. Yatay taşma yok.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Globe, ArrowRight, ServerCog, ShieldAlert, Building2, Home } from "lucide-react";
import { Panel } from "@/components/panel/kit";
import { bayrak, ULKE_AD } from "@/lib/flag";
import type { CografyaIstihbarat, UlkeIstihbarat } from "@/lib/specter/cografya-istihbarat";
import { cn } from "@/lib/cn";

function ulkeAdi(kod: string): string {
  return ULKE_AD[(kod ?? "").toUpperCase()] ?? kod ?? "—";
}

/** Isı rengi: bot oranı + hacme göre amber→kırmızı yoğunluk. */
function isiRenk(u: UlkeIstihbarat): { arka: string; kenar: string; metin: string } {
  if (u.tehditSeviyesi === "yuksek") return { arka: "rgba(220,38,38,0.08)", kenar: "rgba(220,38,38,0.28)", metin: "#dc2626" };
  if (u.tehditSeviyesi === "orta") return { arka: "rgba(217,119,6,0.08)", kenar: "rgba(217,119,6,0.26)", metin: "#d97706" };
  return { arka: "rgba(22,163,74,0.06)", kenar: "rgba(22,163,74,0.22)", metin: "#16a34a" };
}

/** ASN sağlayıcı adından kaba kategori. */
const ASN_KATEGORI = [
  { id: "datacenter", ad: "Veri merkezi / bulut", ikon: Building2, renk: "#7c3aed", desen: /amazon|google|digitalocean|ovh|hetzner|microsoft|linode|m247|azure|aws|cloud/i },
  { id: "vpn", ad: "VPN / proxy", ikon: ServerCog, renk: "#db2777", desen: /vpn|proxy|tor|nord|express|mullvad|datacamp/i },
  { id: "bulletproof", ad: "Kurşun-geçirmez", ikon: ShieldAlert, renk: "#dc2626", desen: /bullet|offshore|abuse|hosting|server|colo/i },
  { id: "konut", ad: "Konut / mobil", ikon: Home, renk: "#16a34a", desen: /telecom|mobile|broadband|cable|isp|residential|fiber|gsm/i },
] as const;

function asnKategori(saglayici: string): (typeof ASN_KATEGORI)[number] {
  for (const k of ASN_KATEGORI) if (k.desen.test(saglayici)) return k;
  return ASN_KATEGORI[3]; // varsayılan: konut
}

export function TehditHaritasiOzet({ cografya }: { cografya: CografyaIstihbarat }) {
  // En riskli ülkeler: bot oranı × hacim skoruna göre ilk 8.
  const enRiskli = [...cografya.ulkeler]
    .sort((a, b) => (b.botOran * b.olay) - (a.botOran * a.olay) || b.olay - a.olay)
    .slice(0, 8);

  // ASN kategori özeti — riskli ASN'leri kategorilere topla.
  const katSayim = new Map<string, { ad: string; ikon: (typeof ASN_KATEGORI)[number]["ikon"]; renk: string; olay: number; bot: number }>();
  for (const a of cografya.asnler) {
    const kat = asnKategori(a.saglayici);
    const cur = katSayim.get(kat.id) ?? { ad: kat.ad, ikon: kat.ikon, renk: kat.renk, olay: 0, bot: 0 };
    cur.olay += a.olay;
    cur.bot += a.bot;
    katSayim.set(kat.id, cur);
  }
  const asnKategoriler = [...katSayim.values()].sort((a, b) => b.olay - a.olay);
  const asnToplam = asnKategoriler.reduce((s, k) => s + k.olay, 0) || 1;

  const enTehdit = cografya.ozet.enTehditkarUlke;

  return (
    <Panel
      baslik={
        <span className="flex items-center gap-2">
          <Globe className="size-[18px] text-brand-600" /> Tehdit Haritası
        </span>
      }
      sagUst={
        <Link href="/panel/harita" className="flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
          Tam harita <ArrowRight className="size-3.5" />
        </Link>
      }
    >
      {/* Üst özet metrikleri */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <OzetMetrik etiket="Ülke" deger={cografya.ozet.ulkeSayisi} />
        <OzetMetrik etiket="Ağ (ASN)" deger={cografya.ozet.asnSayisi} />
        <OzetMetrik etiket="Datacenter" deger={`%${Math.round(cografya.ozet.datacenterOran * 100)}`} tehdit={cografya.ozet.datacenterOran > 0.3} />
        <OzetMetrik etiket="Riskli bölge" deger={cografya.riskliBolgeler.length} tehdit={cografya.riskliBolgeler.length > 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_270px]">
        {/* En riskli ülke kartları (ısı-renkli) */}
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-faint">En riskli kaynaklar</span>
          {enRiskli.length === 0 ? (
            <div className="mt-3 grid place-items-center rounded-2xl border border-dashed border-line py-8 text-[13px] text-slate-faint">
              Coğrafi tehdit verisi yok.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {enRiskli.map((u, i) => {
                const isi = isiRenk(u);
                return (
                  <motion.div
                    key={u.kod}
                    initial={{ y: 10 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-2xl border p-3.5"
                    style={{ background: isi.arka, borderColor: isi.kenar }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 text-[18px] leading-none">{bayrak(u.kod)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-slate-ink">{ulkeAdi(u.kod)}</p>
                        <p className="num text-[10.5px] text-slate-faint">{u.kod}</p>
                      </div>
                      {u.kod === enTehdit && (
                        <span className="shrink-0 rounded-full bg-danger-soft px-1.5 py-0.5 text-[9px] font-bold uppercase text-danger2">#1</span>
                      )}
                    </div>
                    <div className="mt-2.5 flex items-end justify-between">
                      <div>
                        <p className="num text-[17px] font-bold leading-none text-slate-ink">{u.olay.toLocaleString("tr-TR")}</p>
                        <p className="text-[10px] text-slate-muted">olay</p>
                      </div>
                      <span className="num text-[12px] font-bold" style={{ color: isi.metin }}>%{Math.round(u.botOran * 100)}</span>
                    </div>
                    {/* ısı çubuğu */}
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-canvas">
                      <motion.div className="h-full rounded-full" style={{ background: isi.metin }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, u.botOran * 100)}%` }} transition={{ duration: 0.7, delay: i * 0.03 }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ASN kategori özeti */}
        <div className="space-y-3 rounded-2xl border border-line bg-canvas/40 px-5 py-4">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-faint">Ağ kategorileri</span>
          {asnKategoriler.length === 0 ? (
            <p className="text-[12.5px] text-slate-faint">ASN verisi yok.</p>
          ) : (
            asnKategoriler.map((k) => {
              const Ikon = k.ikon;
              const oran = (k.olay / asnToplam) * 100;
              const botOran = k.olay > 0 ? Math.round((k.bot / k.olay) * 100) : 0;
              return (
                <div key={k.ad}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-muted">
                      <Ikon className="size-3.5 shrink-0" style={{ color: k.renk }} />
                      <span className="truncate">{k.ad}</span>
                    </span>
                    <span className="num shrink-0 font-semibold text-slate-ink">{k.olay.toLocaleString("tr-TR")}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white">
                    <motion.div className="h-full rounded-full" style={{ background: k.renk }} initial={{ width: 0 }} animate={{ width: `${oran}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-faint">%{botOran} bot yoğunluğu</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Panel>
  );
}

function OzetMetrik({ etiket, deger, tehdit }: { etiket: string; deger: string | number; tehdit?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-card">
      <p className={cn("num text-[24px] font-bold leading-none", tehdit ? "text-danger2" : "text-slate-ink")}>{typeof deger === "number" ? deger.toLocaleString("tr-TR") : deger}</p>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate-faint">{etiket}</p>
    </div>
  );
}
