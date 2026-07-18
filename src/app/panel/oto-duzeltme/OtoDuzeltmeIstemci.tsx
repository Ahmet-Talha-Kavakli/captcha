"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wand2, ShieldCheck, Check, X, Info, ArrowRight, Download,
  CircleCheck, CircleX, Zap, FlaskConical, ChevronDown, TrendingUp,
} from "lucide-react";
import { Panel, StatKart, Badge } from "@/components/panel/kit";
import { cn } from "@/lib/cn";
import { type OtoDuzeltmeRaporu, type DuzeltmeSonuc } from "@/lib/specter/oto-duzeltme";
import type { RuleAction } from "@/lib/db/schema";
import type { Dil } from "@/lib/i18n/panel";
import { odCeviri } from "./oto-duzeltme.i18n";

/**
 * ENUM GÜVENLİĞİ: lib'deki ACTION_ETIKET (TR sabiti) ve TUR_ETIKET yerine
 * enum değerini (allow/challenge/block/flag, asn/botClass/country) anahtar
 * olarak kullanıp yerel sözlükten çeviririz. Enum değerlerine hiç dokunulmaz.
 */

export function OtoDuzeltmeIstemci({
  rapor, olaySayisi, kuralSayisi, dil,
}: {
  rapor: OtoDuzeltmeRaporu;
  olaySayisi: number;
  kuralSayisi: number;
  dil: Dil;
}) {
  const t = (k: string) => odCeviri(k, dil);
  const { onaylanan, reddedilen, ozet } = rapor;
  const bosVeri = ozet.denenenAday === 0;

  // Enum değerini gösterim etiketine çevir (lib sabitine dokunmadan).
  const aksiyonEtiket = (a: RuleAction) => t("action." + a);

  const yamaIndir = () => {
    const satirlar = [
      t("yama.baslik"),
      t("yama.gozlem").replace("{olay}", String(olaySayisi)).replace("{kural}", String(kuralSayisi)),
      t("yama.onaySatir").replace("{onay}", String(ozet.onaylanan)).replace("{aday}", String(ozet.denenenAday)),
      t("yama.kazanim").replace("{kazanim}", String(ozet.netKazanim)).replace("{engel}", String(ozet.engellenenTahmini)),
      ``,
      t("yama.onayBaslik"),
      ...onaylanan.map((o, i) => `  ${i + 1}. ${o.aday.ad}  [${t("yama.eger")} ${o.aday.field} ${o.aday.op} "${o.aday.value}" → ${aksiyonEtiket(o.aday.action as RuleAction)}]  (+${o.ortNetDegisim} ${t("yama.puan")})`),
      ``,
      t("yama.redBaslik"),
      ...reddedilen.map((o) => `  ✗ ${o.aday.ad} — ${o.gerekce}`),
      ``,
      t("yama.not"),
    ];
    const blob = new Blob([satirlar.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = t("yama.dosyaAd"); a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Wand2 className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("aciklama.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("aciklama.p1a")} <b>{t("aciklama.p1kanit")}</b>{t("aciklama.p1b")} <Link href="/panel/sandbox" className="font-medium text-brand-600 underline-offset-2 hover:underline">{t("aciklama.sandbox")}</Link>{t("aciklama.p1c")}{" "}
            <b>{t("aciklama.p1garanti")}</b> {t("aciklama.p1d")}
          </p>
        </div>
      </div>

      {bosVeri ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-canvas/30 px-6 py-16 text-center">
          <ShieldCheck className="size-10 text-ok" />
          <p className="mt-3 text-[15px] font-semibold text-slate-ink">{t("bos.baslik")}</p>
          <p className="mt-1 max-w-md text-[13px] text-slate-muted">{t("bos.metin").replace("{olay}", String(olaySayisi)).replace("{kural}", String(kuralSayisi))}</p>
        </div>
      ) : (
        <>
          {/* özet */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatKart sayi={ozet.onaylanan} etiket={t("stat.onaylanan")} ikon={<CircleCheck className="size-5" />} tone="ok" />
            <StatKart sayi={ozet.reddedilen} etiket={t("stat.reddedilen")} ikon={<CircleX className="size-5" />} tone={ozet.reddedilen > 0 ? "warn" : "brand"} />
            <StatKart sayi={`+${ozet.netKazanim}`} etiket={t("stat.netKazanim")} ikon={<TrendingUp className="size-5" />} tone="ok" />
            <StatKart sayi={ozet.engellenenTahmini} etiket={t("stat.engellenen")} ikon={<Zap className="size-5" />} />
          </div>

          {/* onaylanan yama seti */}
          <Panel baslik={t("onay.baslik").replace("{n}", String(onaylanan.length))}>
            {onaylanan.length === 0 ? (
              <p className="rounded-xl bg-canvas/50 px-4 py-6 text-center text-[13px] text-slate-faint">{t("onay.bos")}</p>
            ) : (
              <div className="space-y-2.5">
                {onaylanan.map((o) => <SonucKart key={o.aday.bosluk.id} o={o} onay t={t} aksiyonEtiket={aksiyonEtiket} />)}
              </div>
            )}
            {onaylanan.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-900 px-6 py-4">
                <div>
                  <p className="flex items-center gap-2 text-[14px] font-semibold text-white"><ShieldCheck className="size-4 text-ok" /> {t("onay.uygulanabilir").replace("{n}", String(onaylanan.length))}</p>
                  <p className="mt-0.5 text-[12.5px] text-white/60">{t("onay.uygulanabilirAlt")}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={yamaIndir} className="flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-white/10"><Download className="size-3.5" /> {t("onay.yamaButon")}</button>
                  <Link href="/panel/kurallar" className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink-900">{t("onay.kurallarButon")} <ArrowRight className="size-3.5" /></Link>
                </div>
              </div>
            )}
          </Panel>

          {/* reddedilen adaylar */}
          {reddedilen.length > 0 && (
            <Panel baslik={t("red.baslik").replace("{n}", String(reddedilen.length))}>
              <p className="mb-3 text-[13px] text-slate-muted">{t("red.aciklama")}</p>
              <div className="space-y-2.5">
                {reddedilen.map((o) => <SonucKart key={o.aday.bosluk.id} o={o} t={t} aksiyonEtiket={aksiyonEtiket} />)}
              </div>
            </Panel>
          )}
        </>
      )}

      {/* yöntem notu */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <span>{t("not.a")} <b>{t("not.gercek")}</b> {t("not.b")} <code className="rounded bg-canvas px-1">{t("aciklama.sandbox")}</code> {t("not.c")} <i>{t("not.onerir")}</i>{t("not.d")}</span>
      </div>
    </div>
  );
}

function SonucKart({ o, onay, t, aksiyonEtiket }: {
  o: DuzeltmeSonuc;
  onay?: boolean;
  t: (k: string) => string;
  aksiyonEtiket: (a: RuleAction) => string;
}) {
  const [acik, setAcik] = useState(false);
  const a = o.aday;
  return (
    <div className={cn("rounded-xl border px-4 py-3", onay ? "border-ok/30 bg-ok-soft/30" : "border-line bg-white")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {onay ? <Check className="mt-0.5 size-4 shrink-0 text-ok" /> : <X className="mt-0.5 size-4 shrink-0 text-slate-faint" />}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13.5px] font-semibold text-slate-ink">{a.ad}</span>
              <Badge ton="gri">{t("tur." + a.bosluk.tur)}</Badge>
              {onay && <Badge ton="yesil">{t("kart.puan").replace("{n}", String(o.ortNetDegisim))}</Badge>}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-slate-muted">
              <span className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px]">{t("kart.eger")} {a.field} {a.op} "{a.value}"</span>
              <ArrowRight className="size-3" />
              <Badge ton={a.action === "block" ? "kirmizi" : a.action === "challenge" ? "sari" : "yesil"}>{aksiyonEtiket(a.action as RuleAction)}</Badge>
            </p>
            <p className="mt-1 text-[12px] text-slate-faint">{o.gerekce}</p>
          </div>
        </div>
        <button onClick={() => setAcik((v) => !v)} className="shrink-0 rounded-lg p-1 text-slate-faint hover:bg-canvas hover:text-slate-ink" title={t("kart.sandboxDetay")}>
          <ChevronDown className={cn("size-4 transition", acik && "rotate-180")} />
        </button>
      </div>

      {acik && (
        <div className="mt-3 border-t border-line/60 pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-slate-muted"><FlaskConical className="size-3.5 text-brand-600" /> {t("kart.sandboxDogrulama").replace("{n}", String(o.yakalamaDetay.length))}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-[12px]">
              <thead>
                <tr className="text-left text-slate-faint">
                  <th className="pb-1 font-medium">{t("kart.kol.yakalama")}</th>
                  <th className="pb-1 font-medium">{t("kart.kol.iyilesme")}</th>
                  <th className="pb-1 font-medium">{t("kart.kol.regresyon")}</th>
                  <th className="pb-1 font-medium">{t("kart.kol.yanlisPoz")}</th>
                  <th className="pb-1 font-medium">{t("kart.kol.net")}</th>
                </tr>
              </thead>
              <tbody>
                {o.yakalamaDetay.map((d) => (
                  <tr key={d.ad} className="border-t border-line/50">
                    <td className="py-1 text-slate-ink">{d.ad}</td>
                    <td className="py-1 num text-ok">{d.iyilesme > 0 ? `+${d.iyilesme}` : "0"}</td>
                    <td className={cn("py-1 num", d.regresyon > 0 ? "font-semibold text-danger2" : "text-slate-faint")}>{d.regresyon}</td>
                    <td className={cn("py-1 num", d.yanlisPozitif > 0 ? "font-semibold text-warn" : "text-slate-faint")}>{d.yanlisPozitif}</td>
                    <td className={cn("py-1 num", d.net > 0 ? "text-ok" : d.net < 0 ? "text-danger2" : "text-slate-muted")}>{d.net >= 0 ? "+" : ""}{d.net}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
