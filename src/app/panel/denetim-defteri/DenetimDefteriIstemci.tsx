"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, ShieldX, Link2, Info, KeyRound, Hash, Beaker, RotateCcw,
  Lock, AlertTriangle, Check, Download,
} from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { defterCeviri } from "./denetim-defteri.i18n";
import {
  defterDogrula, kurcalaSimule,
  type ZincirGiris, type DogrulamaSonuc,
} from "@/lib/specter/denetim-defteri";

export function DenetimDefteriIstemci({
  zincir, dogrulama, dil,
}: {
  zincir: ZincirGiris[];
  dogrulama: DogrulamaSonuc;
  dil: Dil;
}) {
  const t = (anahtar: string) => defterCeviri(anahtar, dil);
  // Kurcalama simülasyonu: kullanıcı bir kaydı değiştirir, zincir canlı kırılır.
  const [kurcaIndeks, setKurcaIndeks] = useState<number | null>(null);
  const [kurcaMetin, setKurcaMetin] = useState("");

  const aktifZincir = useMemo(
    () => (kurcaIndeks !== null ? kurcalaSimule(zincir, kurcaIndeks, kurcaMetin || t("dd.degistirildi")) : zincir),
    [zincir, kurcaIndeks, kurcaMetin],
  );
  const aktifDogrulama = useMemo(() => defterDogrula(aktifZincir), [aktifZincir]);

  const kurcala = (indeks: number) => {
    setKurcaIndeks(indeks);
    setKurcaMetin(t("dd.varsayilanKurca"));
  };
  const sifirla = () => { setKurcaIndeks(null); setKurcaMetin(""); };

  const gecerli = aktifDogrulama.gecerli;

  // Lib TR "neden" metnini istemci-tarafında yeniden türet (lib düzenlenmez).
  const nedenMetin = (): string | null => {
    if (aktifDogrulama.gecerli || aktifDogrulama.neden === null) return null;
    const n = String(aktifDogrulama.kirilanIndeks);
    const anahtar = aktifDogrulama.neden.includes("zincir bağı") ? "dd.neden.bag" : "dd.neden.icerik";
    return t(anahtar).replace("{n}", n);
  };

  const defterIndir = () => {
    const butunlukMetin = gecerli
      ? t("dd.rapor.gecerli")
      : t("dd.rapor.kirildi").replace("{n}", String(aktifDogrulama.kirilanIndeks));
    const satirlar = [
      t("dd.rapor.baslik"),
      t("dd.rapor.kokHash").replace("{n}", aktifDogrulama.kokHash),
      t("dd.rapor.butunluk").replace("{n}", butunlukMetin),
      t("dd.rapor.toplam").replace("{n}", String(aktifDogrulama.toplamGiris)),
      ``,
      ...aktifZincir.map((g) => `#${g.indeks} ${new Date(g.ts).toISOString()} ${g.aktor} ${g.eylem} → ${g.hedef} [hash ${g.hash}]`),
    ];
    const blob = new Blob([satirlar.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "denetim-defteri.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-8 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Link2 className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-ink">
            {t("dd.aciklamaVurgu").split(/\{b0\}|\{b1\}/).map((parca, i) => (i === 1 ? <b key={i}>{parca}</b> : parca))}
          </p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("dd.aciklamaMetin1")} <code className="rounded bg-canvas px-1">hash_n = H(hash_(n-1) + kayıt_n)</code>.{" "}
            {t("dd.aciklamaMetin2").split(/\{b0\}|\{b1\}/).map((parca, i) => (i === 1 ? <b key={i}>{parca}</b> : parca))}
          </p>
        </div>
      </div>

      {/* bütünlük durumu bandı */}
      <div className={cn("flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-5", gecerli ? "bg-ok-soft" : "bg-danger-soft")}>
        <div className="flex items-center gap-4">
          {gecerli ? <ShieldCheck className="size-10 text-ok" /> : <ShieldX className="size-10 text-danger2" />}
          <div>
            <p className={cn("text-[17px] font-bold", gecerli ? "text-green-700" : "text-red-700")}>
              {gecerli ? t("dd.dogrulandi") : t("dd.tahrifat").replace("{n}", String(aktifDogrulama.kirilanIndeks))}
            </p>
            <p className="text-[12.5px] text-slate-muted">
              {gecerli ? t("dd.dogrulandiAlt").replace("{n}", String(aktifDogrulama.toplamGiris)) : nedenMetin()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {kurcaIndeks !== null && (
            <button onClick={sifirla} className="flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-3.5 py-2 text-[13px] font-medium text-slate-ink transition hover:bg-white">
              <RotateCcw className="size-3.5" /> {t("dd.zinciriOnar")}
            </button>
          )}
          <button onClick={defterIndir} className="flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-3.5 py-2 text-[13px] font-medium text-slate-ink transition hover:bg-white">
            <Download className="size-3.5" /> {t("dd.butunlukRaporu")}
          </button>
        </div>
      </div>

      {/* özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={aktifDogrulama.toplamGiris} etiket={t("dd.stat.giris")} ikon={<Hash className="size-5" />} tone="brand" />
        <StatKart sayi={`%${aktifDogrulama.butunlukYuzde}`} etiket={t("dd.stat.butunluk")} ikon={<Lock className="size-5" />} tone={gecerli ? "ok" : "danger"} />
        <StatKart sayi={gecerli ? t("dd.stat.gecerli") : t("dd.stat.kirik")} etiket={t("dd.stat.durum")} ikon={gecerli ? <Check className="size-5" /> : <AlertTriangle className="size-5" />} tone={gecerli ? "ok" : "danger"} />
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <div className="flex items-center gap-2 text-slate-faint"><KeyRound className="size-4" /><span className="text-[12px]">{t("dd.merkleKok")}</span></div>
          <p className="num mt-2 break-all text-[13px] font-bold text-slate-ink">{aktifDogrulama.kokHash}</p>
        </div>
      </div>

      {/* zincir görünümü */}
      <Panel baslik={t("dd.zincirBaslik")}>
        <p className="mb-3 text-[13px] text-slate-muted">{t("dd.zincirAciklama")}</p>
        <div className="space-y-1.5">
          {aktifZincir.map((g) => {
            const kirik = !aktifDogrulama.gecerli && g.indeks >= aktifDogrulama.kirilanIndeks;
            const kurcalanmis = g.indeks === kurcaIndeks;
            return (
              <motion.div
                key={g.indeks}
                initial={false}
                animate={{ backgroundColor: kirik ? "rgba(220,38,38,0.06)" : "rgba(0,0,0,0)" }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[12.5px]",
                  kirik ? "border-danger2/30" : "border-line",
                )}
              >
                <span className="num w-8 shrink-0 text-slate-faint">#{g.indeks}</span>
                <div className="flex w-40 shrink-0 flex-col">
                  <span className="font-semibold text-slate-ink">{g.eylem}</span>
                  <span className="text-[11px] text-slate-faint">{g.aktor}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className={cn("truncate", kurcalanmis && "font-semibold text-danger2")}>{kurcalanmis ? kurcaMetin || t("dd.degistirildi") : g.detay}</span>
                  <span className="ml-1.5 text-slate-faint">→ {g.hedef}</span>
                </div>
                <div className="hidden items-center gap-1.5 lg:flex">
                  <Hash className="size-3 text-slate-faint" />
                  <span className={cn("num text-[10.5px]", kirik ? "text-danger2" : "text-slate-faint")}>{g.hash.slice(0, 12)}…</span>
                </div>
                {kirik ? (
                  <Badge ton="kirmizi">{t("dd.kirikRozet")}</Badge>
                ) : (
                  <button onClick={() => kurcala(g.indeks)} title={t("dd.kurcalaTitle")} className="shrink-0 rounded-lg p-1 text-slate-faint transition hover:bg-canvas hover:text-warn">
                    <Beaker className="size-3.5" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </Panel>

      {/* yöntem notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span>
          {t("dd.yontemNot")
            .split(/(\{c0\}.*?\{c1\}|\{b0\}.*?\{b1\}|\{b2\}.*?\{b3\}|\{b4\}.*?\{b5\})/)
            .map((parca, i) => {
              const kod = parca.match(/^\{c0\}(.*)\{c1\}$/);
              if (kod) return <code key={i} className="rounded bg-canvas px-1">{kod[1]}</code>;
              const kalin = parca.match(/^\{b[024]\}(.*)\{b[135]\}$/);
              if (kalin) return <b key={i}>{kalin[1]}</b>;
              return parca;
            })}
        </span>
      </div>
    </div>
  );
}
