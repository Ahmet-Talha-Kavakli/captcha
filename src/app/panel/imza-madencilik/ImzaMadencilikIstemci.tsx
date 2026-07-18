"use client";

/**
 * Otomatik İmza Madenciliği — istemci arayüzü.
 * Keşfedilen aday imzaları kart olarak gösterir; kesinlik/kapsama/kalite
 * çubukları, kural-benzeri desen (monospace), örnek olaylar ve "kütüphaneye
 * ekle" (oturum-yerel) aksiyonu. Kalite dağılımı + kesinlik-kapsama scatter'ı
 * elle SVG ile çizilir. DÜRÜSTLÜK: bu bir kara-kutu değil; şeffaf özellik
 * kümelemesidir ve metrikler yalnızca gözlemlenen veride ölçülür.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Pickaxe,
  ShieldCheck,
  Target,
  Layers,
  ChevronDown,
  Plus,
  Check,
  Info,
  ArrowRight,
  Boxes,
  ScanSearch,
} from "lucide-react";
import { Panel, StatKart, Badge, Ulke, Ilerleme, NotKutusu, BosDurum, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { kosulDesenMetin } from "./madencilik";
import type { MadenImza, MadencilikOzet } from "./madencilik";
import { mdCeviri } from "./madencilik.i18n";

/** Dil → BCP-47 yerel etiketi (sayı biçimleme için). */
const BCP47: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

// Enum güvenliği: renk sabittir (veri değil, görsel); etiketler t() ile çevrilir.
const SIDDET_RENK: Record<string, string> = { dusuk: "#65a30d", orta: "#d97706", yuksek: "#ea580c", kritik: "#dc2626" };

function siddetTon(s: string): "kirmizi" | "sari" | "yesil" {
  return s === "kritik" || s === "yuksek" ? "kirmizi" : s === "orta" ? "sari" : "yesil";
}

/* ------------------------------------------------------------------ Kalite çubuğu */
function MetrikCubuk({ etiket, deger, ton }: { etiket: string; deger: number; ton: "brand" | "ok" | "warn" | "danger" }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-slate-muted">{etiket}</span>
        <span className="num font-semibold text-slate-ink">%{deger}</span>
      </div>
      <Ilerleme deger={deger} ton={ton} />
    </div>
  );
}

/* ------------------------------------------------------------------ Scatter (kesinlik × kapsama) */
function KesinlikKapsamaScatter({ imzalar, secili, onSec, t }: {
  imzalar: MadenImza[];
  secili: string | null;
  onSec: (id: string) => void;
  t: (anahtar: string) => string;
}) {
  const W = 460, H = 300, P = 40;
  // Nokta yarıçapı en fazla 14 (r = 4 + min(10,…)); merkezi bu kadar + küçük pay
  // kadar çizim alanına kıstır ki hiçbir daire çerçeve/viewBox dışına taşmasın.
  const NOKTA_PAY = 16;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const x = (kapsama: number) =>
    clamp(P + (kapsama / 100) * (W - P * 2), P + NOKTA_PAY, W - P - NOKTA_PAY);
  const y = (kesinlik: number) =>
    clamp(H - P - (kesinlik / 100) * (H - P * 2), P + NOKTA_PAY, H - P - NOKTA_PAY);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="w-full min-w-[420px]" role="img" aria-label={t("scatter.aria")}>
        {/* En iyi bölge vurgusu (sağ-üst = yüksek kesinlik + yüksek kapsama) */}
        <rect x={x(50)} y={y(100)} width={x(100) - x(50)} height={y(75) - y(100)} fill="#4a41e8" opacity={0.06} />
        {/* "En iyi bölge" etiketi — sağ-üst köşeye, noktalardan uzak, küçük punto + halo */}
        <text
          x={W - P - 2}
          y={P + 11}
          textAnchor="end"
          className="fill-brand-600"
          style={{ fontSize: 9, fontWeight: 600, paintOrder: "stroke", stroke: "#faf9f4", strokeWidth: 3, strokeLinejoin: "round" }}
        >
          {t("scatter.enIyi")}
        </text>

        {/* Izgara + eksen çizgileri */}
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={x(g)} y1={P} x2={x(g)} y2={H - P} stroke="#e5e7eb" strokeWidth={1} />
            <line x1={P} y1={y(g)} x2={W - P} y2={y(g)} stroke="#e5e7eb" strokeWidth={1} />
            <text x={x(g)} y={H - P + 16} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 9 }}>%{g}</text>
            <text x={P - 8} y={y(g) + 3} textAnchor="end" className="fill-slate-400" style={{ fontSize: 9 }}>%{g}</text>
          </g>
        ))}
        {/* Eksen etiketleri */}
        <text x={W / 2} y={H - 6} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 10, fontWeight: 600 }}>
          {t("scatter.kapsama")}
        </text>
        <text x={12} y={H / 2} textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`} className="fill-slate-500" style={{ fontSize: 10, fontWeight: 600 }}>
          {t("scatter.kesinlik")}
        </text>

        {/* Noktalar — büyüklük üye sayısıyla orantılı */}
        {imzalar.map((im) => {
          const r = 4 + Math.min(10, Math.log2(im.uyeSayisi + 1) * 2);
          const aktif = secili === im.id;
          return (
            <circle
              key={im.id}
              cx={x(im.kapsama)}
              cy={y(im.kesinlik)}
              r={r}
              fill={SIDDET_RENK[im.siddet]}
              opacity={aktif ? 0.95 : 0.55}
              stroke={aktif ? "#0c1424" : "#fff"}
              strokeWidth={aktif ? 2 : 1}
              className="cursor-pointer transition-opacity hover:opacity-90"
              onClick={() => onSec(im.id)}
            >
              <title>{t("scatter.nokta").replace("{ad}", im.ad).replace("{kesinlik}", String(im.kesinlik)).replace("{kapsama}", String(im.kapsama)).replace("{uye}", String(im.uyeSayisi))}</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ Kalite dağılımı (bar) */
function KaliteDagilimi({ imzalar, t }: { imzalar: MadenImza[]; t: (anahtar: string) => string }) {
  const yuksek = imzalar.filter((i) => i.kalite >= 70).length;
  const orta = imzalar.filter((i) => i.kalite >= 45 && i.kalite < 70).length;
  const dusuk = imzalar.filter((i) => i.kalite < 45).length;
  const toplam = Math.max(1, imzalar.length);
  const bantlar = [
    { ad: t("bant.yuksek"), n: yuksek, renk: "#16a34a" },
    { ad: t("bant.orta"), n: orta, renk: "#d97706" },
    { ad: t("bant.dusuk"), n: dusuk, renk: "#94a3b8" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-canvas">
        {bantlar.map((b) => b.n > 0 && (
          <div key={b.ad} style={{ width: `${(b.n / toplam) * 100}%`, background: b.renk }} title={`${b.ad}: ${b.n}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {bantlar.map((b) => (
          <div key={b.ad} className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: b.renk }} />
              <span className="num text-[18px] font-bold text-slate-ink">{b.n}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-muted">{b.ad}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ İmza kartı */
function ImzaKart({ imza, eklendi, onEkle, t }: { imza: MadenImza; eklendi: boolean; onEkle: () => void; t: (anahtar: string) => string }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="rounded-3xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: SIDDET_RENK[imza.siddet] }}>
            <Pickaxe className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-semibold text-slate-ink">{imza.ad}</span>
              <span className="font-mono text-[11px] text-slate-faint">{imza.id}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge ton={siddetTon(imza.siddet)}>{t(`siddet.${imza.siddet}`)}</Badge>
              <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] text-slate-muted">{t(`kategori.${imza.kategori}`)}</span>
              {/* Taktik: sunucudaki TR string yerine kategori enum'undan dile göre türetilir. */}
              <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] text-slate-faint">{t(`taktik.${imza.kategori}`)}</span>
              <span className="text-[11px] text-slate-faint">· {t("kart.uyeOlay").replace("{n}", String(imza.uyeSayisi))}</span>
            </div>
          </div>
        </div>
        {/* Kalite madalyonu */}
        <div
          className="grid size-16 shrink-0 place-items-center rounded-2xl text-white shadow-card"
          style={{ background: SIDDET_RENK[imza.siddet] }}
          title={t("kart.kaliteSkoru").replace("{n}", String(imza.kalite))}
        >
          <span className="num text-[20px] font-bold leading-none">{imza.kalite}</span>
          <span className="text-[9px] uppercase tracking-wide opacity-80">{t("kart.kalite")}</span>
        </div>
      </div>

      {/* Kural-benzeri desen */}
      <div className="mt-3 overflow-x-auto rounded-xl bg-[#0c1424] px-3.5 py-2.5">
        <code className="whitespace-nowrap font-mono text-[12px] text-[#dbe4f0]">
          {kosulDesenMetin(imza)}
        </code>
      </div>

      {/* Metrik çubukları */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MetrikCubuk etiket={t("kart.kesinlik")} deger={imza.kesinlik} ton={imza.kesinlik >= 90 ? "ok" : imza.kesinlik >= 70 ? "warn" : "danger"} />
        <MetrikCubuk etiket={t("kart.kapsama")} deger={imza.kapsama} ton="brand" />
        <MetrikCubuk etiket={t("kart.kaliteEtiket")} deger={imza.kalite} ton={imza.kalite >= 70 ? "ok" : imza.kalite >= 45 ? "warn" : "danger"} />
      </div>

      {/* Alt bar: örnek aç + kütüphaneye ekle */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setAcik((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-muted transition hover:text-slate-ink"
        >
          <ChevronDown className={cn("size-4 transition-transform", acik && "rotate-180")} />
          {acik ? t("kart.ornekGizle") : t("kart.ornekGoster").replace("{n}", String(imza.ornekOlaylar.length))}
        </button>
        {eklendi ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-3.5 py-1.5 text-[13px] font-medium text-green-700">
            <Check className="size-4" /> {t("kart.eklendi")}
          </span>
        ) : (
          <Button size="sm" onClick={onEkle}>
            <Plus className="size-4" /> {t("kart.ekle")}
          </Button>
        )}
      </div>

      {/* Örnek olaylar */}
      {acik && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-line bg-canvas/40 text-[10px] uppercase tracking-wide text-slate-faint">
                <th className="px-3 py-2 font-semibold">{t("tablo.ip")}</th>
                <th className="px-3 py-2 font-semibold">{t("tablo.ulke")}</th>
                <th className="px-3 py-2 font-semibold">{t("tablo.yol")}</th>
                <th className="px-3 py-2 font-semibold">{t("tablo.skor")}</th>
                <th className="px-3 py-2 font-semibold">{t("tablo.ua")}</th>
              </tr>
            </thead>
            <tbody>
              {imza.ornekOlaylar.map((o, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 font-mono text-slate-ink">{o.ip}</td>
                  <td className="px-3 py-2"><Ulke kod={o.country} /></td>
                  <td className="px-3 py-2 font-mono text-slate-muted">{o.path}</td>
                  <td className="px-3 py-2 num text-slate-ink">{o.score.toFixed(2)}</td>
                  <td className="max-w-[220px] truncate px-3 py-2 font-mono text-[11px] text-slate-faint" title={o.ua}>{o.ua}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Ana istemci */
export function ImzaMadencilikIstemci({
  imzalar,
  ozet,
  toplamOlay,
  kotuOlay,
  dil,
}: {
  imzalar: MadenImza[];
  ozet: MadencilikOzet;
  toplamOlay: number;
  kotuOlay: number;
  dil: Dil;
}) {
  const t = (anahtar: string) => mdCeviri(anahtar, dil);
  const loc = BCP47[dil];
  const { goster } = useToast();
  // Oturum-yerel promote (gerçek promotion imza kütüphanesine ayrı eklenir).
  const [eklenenler, setEklenenler] = useState<Set<string>>(new Set());
  const [secili, setSecili] = useState<string | null>(imzalar[0]?.id ?? null);

  function ekle(im: MadenImza) {
    setEklenenler((p) => new Set(p).add(im.id));
    goster({
      tip: "basari",
      baslik: t("toast.baslik"),
      aciklama: t("toast.aciklama").replace("{ad}", im.ad).replace("{kalite}", String(im.kalite)),
    });
  }

  const seciliImza = useMemo(() => imzalar.find((i) => i.id === secili) ?? null, [imzalar, secili]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* Açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Pickaxe className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("aciklama.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("aciklama.p1a")} <span className="font-medium text-slate-ink">{t("aciklama.imza")}</span> {t("aciklama.p1b")}
          </p>
        </div>
      </div>

      {/* Özet StatKart'lar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplamImza} etiket={t("stat.kesfedilen")} ikon={<Pickaxe className="size-5" />} tone="brand" />
        <StatKart sayi={ozet.yuksekKalite} etiket={t("stat.yuksekKalite")} ikon={<ShieldCheck className="size-5" />} tone="ok" />
        <StatKart sayi={ozet.otoOnaylanabilir} etiket={t("stat.otoOnay")} ikon={<Check className="size-5" />} tone="warn" />
        <StatKart sayi={`%${ozet.toplamKapsama}`} etiket={t("stat.birlesikKapsama")} ikon={<Target className="size-5" />} />
      </div>

      {imzalar.length === 0 ? (
        <BosDurum
          ikon={<Pickaxe className="size-7" />}
          baslik={t("bos.baslik")}
          aciklama={t("bos.metin").replace("{toplam}", toplamOlay.toLocaleString(loc)).replace("{kotu}", kotuOlay.toLocaleString(loc))}
        />
      ) : (
        <>
          {/* Dağılım + scatter */}
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <Panel baslik={t("panel.kaliteDagilimi")}>
              <KaliteDagilimi imzalar={imzalar} t={t} />
              <p className="mt-4 flex items-start gap-2 text-[12px] text-slate-muted">
                <Layers className="mt-0.5 size-3.5 shrink-0 text-slate-faint" />
                {t("panel.kaliteNot")}
              </p>
            </Panel>

            <Panel baslik={t("panel.scatterBaslik")} sagUst={
              seciliImza ? <span className="max-w-[200px] truncate text-[12px] text-slate-muted">{seciliImza.ad}</span> : undefined
            }>
              <KesinlikKapsamaScatter imzalar={imzalar} secili={secili} onSec={setSecili} t={t} />
              <p className="mt-1 text-[11.5px] text-slate-faint">
                {t("panel.scatterNot")}
              </p>
            </Panel>
          </div>

          {/* Keşfedilen imzalar */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ScanSearch className="size-4 text-slate-faint" />
              <h2 className="text-[15px] font-semibold text-slate-ink">{t("kesif.baslik")}</h2>
              <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] text-slate-muted">{t("kesif.rozet")}</span>
            </div>
            <div className="space-y-4">
              {imzalar.map((im) => (
                <ImzaKart key={im.id} imza={im} eklendi={eklenenler.has(im.id)} onEkle={() => ekle(im)} t={t} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Kümeleme açıklaması */}
      <Panel baslik={t("kume.baslik")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3 text-[13px] text-slate-muted">
            <div className="flex gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">1</span>
              <p><span className="font-medium text-slate-ink">{t("kume.1t")}</span> {t("kume.1a")} <code className="rounded bg-canvas px-1 font-mono text-[11px]">UA · ASN · path · botClass</code>. {t("kume.1b")}</p>
            </div>
            <div className="flex gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">2</span>
              <p><span className="font-medium text-slate-ink">{t("kume.2t")}</span> {t("kume.2a")}</p>
            </div>
            <div className="flex gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">3</span>
              <p><span className="font-medium text-slate-ink">{t("kume.3t")}</span> {t("kume.3a")}</p>
            </div>
            <div className="flex gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">4</span>
              <p><span className="font-medium text-slate-ink">{t("kume.4t")}</span> {t("kume.4a")}</p>
            </div>
          </div>
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-line-strong bg-canvas/40 p-4">
            <div className="flex items-center gap-2 text-[12px] text-slate-muted">
              <Boxes className="size-4 text-brand-500" />
              <span className="font-mono">{t("kume.akis")}</span>
            </div>
          </div>
        </div>
      </Panel>

      {/* Dürüstlük notu */}
      <NotKutusu ton="sari" baslik={t("not.baslik")}>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-[12.5px]">
          <li>{t("not.1a")} <span className="font-medium">{t("not.1b")}</span> {t("not.1c")} <span className="font-medium">{t("not.1d")}</span>{t("not.1e")}</li>
          <li>{t("not.2a")} <span className="font-medium">{t("not.2b")}</span> {t("not.2c")} <span className="font-medium">{t("not.2d")}</span>{t("not.2e")}</li>
          <li>{t("not.3a")} <span className="font-medium">{t("not.3b")}</span> {t("not.3c")}{" "}
            <Link href="/panel/imza" className="font-medium text-brand-700 underline">{t("not.imzaKutuphane")}</Link>{t("not.3d")}</li>
        </ul>
        <Link href="/panel/imza" className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand-700 transition hover:gap-2">
          <Info className="size-3.5" /> {t("not.git")} <ArrowRight className="size-3.5" />
        </Link>
      </NotKutusu>
    </div>
  );
}
