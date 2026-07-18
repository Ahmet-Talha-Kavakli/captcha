"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Network, Bot, Fingerprint, Server, Globe, ArrowRight, Search, Share2, AlertTriangle, Radar } from "lucide-react";
import { Panel, StatKart, Badge, Ulke } from "@/components/panel/kit";
import type { Kume, GrafDugum, GrafKenar } from "@/lib/specter/iliski-grafigi";
import type { Dil } from "@/lib/i18n/panel";
import { cn } from "@/lib/cn";
import { grafCeviri } from "./iliski-grafigi.i18n";

// Locale-aware sayı biçimlendirme için BCP-47 eşlemesi.
const LOCALE: Record<Dil, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
};

export function IliskiGrafigiIstemci({
  kumeler, odakGraf, ozet, dil,
}: {
  kumeler: Kume[];
  odakGraf: { dugumler: GrafDugum[]; kenarlar: GrafKenar[] } | null;
  ozet: { toplamKume: number; botnetKume: number; enBuyukKume: number; iliskiliIp: number };
  dil: Dil;
}) {
  const t = (anahtar: string) => grafCeviri(anahtar, dil);
  const loc = LOCALE[dil];

  const [sorgu, setSorgu] = useState("");
  const [seciliKume, setSeciliKume] = useState<Kume | null>(kumeler.find((k) => k.ipler.length >= 2) ?? kumeler[0] ?? null);

  const filtreli = kumeler.filter((k) =>
    !sorgu || `${k.ipler.join(" ")} ${k.asnler.join(" ")} ${k.ulkeler.join(" ")} ${k.dominantBotClass}`.toLowerCase().includes(sorgu.toLowerCase()),
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Share2 className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("graf.aciklama.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("graf.aciklama.metin")}</p>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplamKume} etiket={t("graf.ozet.tespitKume")} ikon={<Network className="size-5" />} />
        <StatKart sayi={ozet.botnetKume} etiket={t("graf.ozet.botnet")} ikon={<Bot className="size-5" />} tone="danger" />
        <StatKart sayi={ozet.enBuyukKume} etiket={t("graf.ozet.enBuyukAg")} ikon={<Radar className="size-5" />} tone="warn" />
        <StatKart sayi={ozet.iliskiliIp} etiket={t("graf.ozet.iliskiliIp")} ikon={<Share2 className="size-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* graf görselleştirme */}
        <Panel baslik={seciliKume ? t("graf.ag.baslikSayi").replace("{n}", String(seciliKume.ipler.length)) : t("graf.ag.baslik")}>
          {seciliKume && seciliKume.ipler.length >= 2 ? (
            <GrafGorsel kume={seciliKume} svgEtiket={t("graf.ag.svgEtiket").replace("{n}", String(seciliKume.ipler.length))} />
          ) : (
            <div className="grid h-[360px] place-items-center text-center text-slate-muted">
              <div>
                <Network className="mx-auto mb-2 size-10 opacity-30" />
                <p className="text-sm">{t("graf.ag.tekil")}</p>
                <p className="text-[12px] text-slate-faint">{t("graf.ag.tekilAlt")}</p>
              </div>
            </div>
          )}
          {seciliKume && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <span className="text-[12px] font-medium text-slate-muted">{t("graf.ag.nedenBagli")}</span>
              {seciliKume.baglar.length > 0 ? seciliKume.baglar.map((b) => (
                <span key={b} className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 text-[11.5px] font-medium text-danger2">
                  {b.startsWith("parmak") ? <Fingerprint className="size-3" /> : <Server className="size-3" />} {b}
                </span>
              )) : <span className="text-[12px] text-slate-faint">{t("graf.ag.tekilBag")}</span>}
            </div>
          )}
        </Panel>

        {/* küme listesi */}
        <Panel baslik={t("graf.liste.baslik")} padding={false}>
          <div className="border-b border-line px-4 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
              <Search className="size-4 text-slate-faint" />
              <input value={sorgu} onChange={(e) => setSorgu(e.target.value)} placeholder={t("graf.liste.ara")} className="w-full bg-transparent text-[13px] outline-none" aria-label={t("graf.liste.araEtiket")} />
            </div>
          </div>
          <div className="max-h-[520px] divide-y divide-line overflow-y-auto">
            {filtreli.map((k) => (
              <button key={k.id} onClick={() => setSeciliKume(k)} className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-canvas/50", seciliKume?.id === k.id && "bg-brand-50/40")}>
                <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl", k.tehditSkoru >= 60 ? "bg-danger-soft text-danger2" : "bg-warn-soft text-amber-700")}>
                  {k.ipler.length >= 3 ? <Network className="size-4" /> : <Bot className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-slate-ink">{t(`graf.boyut.${k.boyut}`)}</span>
                    <Badge ton={k.ipler.length >= 3 ? "kirmizi" : "sari"}>{t("graf.liste.ipRozet").replace("{n}", String(k.ipler.length))}</Badge>
                  </div>
                  <div className="mt-0.5 truncate text-[11.5px] text-slate-faint">
                    {t(`graf.bot.${k.dominantBotClass}`)} · {k.asnler[0] ?? "—"}
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    {k.ulkeler.slice(0, 4).map((u) => <Ulke key={u} kod={u} />)}
                  </div>
                </div>
                <span className="num shrink-0 text-[13px] font-bold" style={{ color: k.tehditSkoru >= 60 ? "#dc2626" : "#d97706" }}>{k.tehditSkoru}</span>
              </button>
            ))}
            {filtreli.length === 0 && <p className="py-8 text-center text-sm text-slate-muted">{t("graf.liste.bosSonuc")}</p>}
          </div>
        </Panel>
      </div>

      {/* seçili küme detay */}
      {seciliKume && (
        <Panel baslik={t("graf.detay.baslik")}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint"><Globe className="size-3.5" /> {t("graf.detay.ipler").replace("{n}", String(seciliKume.ipler.length))}</div>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {seciliKume.ipler.map((ip) => (
                  <Link key={ip} href={`/panel/tehdit/${encodeURIComponent(ip)}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[12.5px] transition hover:bg-canvas">
                    <span className="num font-medium text-slate-ink">{ip}</span>
                    <ArrowRight className="size-3.5 text-slate-faint" />
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint"><Server className="size-3.5" /> {t("graf.detay.asnler")}</div>
              <div className="space-y-1 text-[12.5px] text-slate-muted">{seciliKume.asnler.map((a) => <div key={a} className="rounded-lg bg-canvas px-2 py-1.5">{a}</div>)}</div>
            </div>
            <div className="space-y-2">
              <MetaSatir etiket={t("graf.detay.toplamOlay")} deger={seciliKume.toplamOlay.toLocaleString(loc)} />
              <MetaSatir etiket={t("graf.detay.engellenen")} deger={t("graf.detay.engellenenDeger").replace("{n}", String(seciliKume.engellenen)).replace("{yuzde}", String(Math.round((seciliKume.engellenen / seciliKume.toplamOlay) * 100)))} />
              <MetaSatir etiket={t("graf.detay.minSkor")} deger={seciliKume.minSkor.toFixed(2)} />
              <MetaSatir etiket={t("graf.detay.tehditSkoru")} deger={String(seciliKume.tehditSkoru)} vurgu />
              <MetaSatir etiket={t("graf.detay.parmakIziCesidi")} deger={String(seciliKume.fingerprintler.length)} />
            </div>
          </div>
          {seciliKume.tehditSkoru >= 60 && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger-soft bg-danger-soft/40 px-3.5 py-3 text-[12.5px] text-danger2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{t("graf.uyari.metinOnce")}<b>{t("graf.uyari.metinVurgu")}</b>{t("graf.uyari.metinSonra")}<Link href="/panel/kurallar/gelismis" className="font-semibold underline">{t("graf.uyari.kuralOlustur")}</Link></span>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function MetaSatir({ etiket, deger, vurgu }: { etiket: string; deger: string; vurgu?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-line pb-1.5 text-[12.5px]">
      <span className="text-slate-muted">{etiket}</span>
      <span className={cn("num font-semibold", vurgu ? "text-danger2" : "text-slate-ink")}>{deger}</span>
    </div>
  );
}

/* Deterministik radyal graf: ASN merkezde, IP'ler çevrede yıldız.
 * KRİTİK: kümede yüzlerce IP olabilir (ör. 232). Hepsini tam-IP etiketiyle
 * çizmek okunamaz kırmızı halka kaosu üretir. Bu yüzden:
 *   • En fazla GORUNEN_IP düğüm çizilir (kalanı "+N daha" olarak özetlenir).
 *   • IP düğümlerinde METİN ETİKETİ YOK (232 IP adresi okunamaz) — düğüm
 *     büyüklüğü/rengi bilgi taşır, detay sağdaki listede.
 * Böylece görsel temiz bir "botnet yıldızı" olur, çakışma/taşma olmaz. */
const GORUNEN_IP = 40;

function GrafGorsel({ kume, svgEtiket }: { kume: Kume; svgEtiket: string }) {
  const layout = useMemo(() => {
    const W = 640, H = 380, cx = W / 2, cy = H / 2;
    const dugumler: { id: string; x: number; y: number; tur: string; etiket: string; boyut: number }[] = [];
    const kenarlar: { x1: number; y1: number; x2: number; y2: number; op: number }[] = [];

    // ASN'ler merkezde (çoğu kümede tek ASN → tam merkez).
    const asnKonum = new Map<string, { x: number; y: number }>();
    const asnSay = kume.asnler.length;
    kume.asnler.forEach((asn, i) => {
      const aci = asnSay > 1 ? (i / asnSay) * Math.PI * 2 - Math.PI / 2 : 0;
      const rx = asnSay > 1 ? 46 : 0;
      const x = cx + Math.cos(aci) * rx, y = cy + Math.sin(aci) * rx;
      asnKonum.set(asn, { x, y });
      dugumler.push({ id: `asn:${asn}`, x, y, tur: "asn", etiket: asn.split(" ")[0], boyut: 15 });
    });
    const merkez = asnKonum.values().next().value ?? { x: cx, y: cy };

    // IP'leri çevreye yerleştir — yalnızca ilk GORUNEN_IP tanesi.
    const toplamIp = kume.ipler.length;
    const gorunen = kume.ipler.slice(0, GORUNEN_IP);
    const n = Math.max(1, gorunen.length);
    // Tek halka; nokta sayısına göre yarıçap ölçekle ama tavana sabitle.
    const R = Math.min(150, 96 + n * 1.3);
    gorunen.forEach((ip, i) => {
      const aci = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(aci) * R, y = cy + Math.sin(aci) * R * 0.9;
      dugumler.push({ id: `ip:${ip}`, x, y, tur: "ip", etiket: ip, boyut: 5.5 });
      kenarlar.push({ x1: x, y1: y, x2: merkez.x, y2: merkez.y, op: 0.22 });
    });
    const gizli = Math.max(0, toplamIp - gorunen.length);
    return { W, H, dugumler, kenarlar, gizli, merkezX: merkez.x, merkezY: merkez.y };
  }, [kume]);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-[#0b1220]">
      <svg viewBox={`0 0 ${layout.W} ${layout.H}`} className="w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label={svgEtiket}>
        {/* bağlantı kenarları (ince, saydam) */}
        {layout.kenarlar.map((e, i) => (
          <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#dc2626" strokeOpacity={e.op} strokeWidth="0.8" />
        ))}
        {/* IP düğümleri (etiketsiz — temiz yıldız) */}
        {layout.dugumler.filter((d) => d.tur === "ip").map((d) => (
          <circle key={d.id} cx={d.x} cy={d.y} r={d.boyut} fill="#ef4444" fillOpacity="0.9" stroke="#fca5a5" strokeWidth="0.75" />
        ))}
        {/* ASN düğümleri (merkez, etiketli) — en üstte */}
        {layout.dugumler.filter((d) => d.tur === "asn").map((d) => (
          <g key={d.id}>
            <circle cx={d.x} cy={d.y} r={d.boyut} fill="#f59e0b" fillOpacity="0.28" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx={d.x} cy={d.y} r={d.boyut * 0.45} fill="#f59e0b" fillOpacity="0.9" />
            <text
              x={d.x}
              y={d.y + d.boyut + 13}
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="10.5"
              fontWeight="700"
              style={{ paintOrder: "stroke", stroke: "#0b1220", strokeWidth: 3 }}
            >
              {d.etiket}
            </text>
          </g>
        ))}
        {/* "+N IP daha" özeti (çizilmeyen düğümler) */}
        {layout.gizli > 0 && (
          <text x={layout.W - 14} y={layout.H - 12} textAnchor="end" fill="#94a3b8" fontSize="11" fontWeight="600" className="num">
            +{layout.gizli.toLocaleString("tr-TR")} IP daha
          </text>
        )}
      </svg>
    </div>
  );
}
