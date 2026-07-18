"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Swords, ShieldCheck, ShieldAlert, Play, KeyRound, Bot, Cpu, Zap, Ban, ArrowRight,
  AlertTriangle, Check, Gauge, Globe, Fingerprint, Activity, Ghost, SlidersHorizontal, Loader2, Radio,
} from "lucide-react";
import { Panel, StatKart, Badge, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { kirmiziTakimCeviri } from "./kirmizi-takim.i18n";

type Ceviri = (anahtar: string) => string;

interface Sonuc {
  id: string; ad: string; aciklama: string; kategori: string; siddet: string; beklenen: string;
  toplam: number; engellenen: number; dogrulanan: number; kacan: number; etkinlik: number; durum: string; yakalayanKurallar: string[];
}
interface Veri {
  ozet: { toplamSenaryo: number; korunuyor: number; acik: number; kapsamaSkoru: number; kritikAcik: number };
  kuralSayisi: number;
  sonuclar: Sonuc[];
}

const KATEGORI_IKON: Record<string, React.ReactNode> = {
  kimlik: <KeyRound className="size-5" />, kazima: <Bot className="size-5" />, ai: <Cpu className="size-5" />,
  ddos: <Zap className="size-5" />, atlatma: <ShieldAlert className="size-5" />, spam: <Ban className="size-5" />,
};
// durum VALUE → renk/ton + i18n anahtarı (değer çevrilmez; etiket t() ile çözülür)
const DURUM_META: Record<string, { anahtar: string; renk: string; ton: "yesil" | "sari" | "kirmizi" }> = {
  korunuyor: { anahtar: "kt.durum.korunuyor", renk: "#16a34a", ton: "yesil" },
  kismi: { anahtar: "kt.durum.kismi", renk: "#d97706", ton: "sari" },
  acik: { anahtar: "kt.durum.acik", renk: "#dc2626", ton: "kirmizi" },
};

// Kategori sırası (görsel gruplar). Boşluk kapatma önerisi anahtarı kategori id'siyle eşleşir.
const KATEGORI_SIRA = ["kimlik", "kazima", "ai", "ddos", "atlatma", "spam"] as const;

// Savunma katman zinciri — canlı akışta "hangi katman yakaladı" animasyonu için.
// Bir senaryo kategorisi hangi katmanda yakalanmayı bekler (görsel atıf; gerçek karar kural motorundan gelir).
const KATMAN_ZINCIRI = [
  { id: "rate", ikon: <Gauge className="size-3.5" />, renk: "#2f6fed" },
  { id: "reputation", ikon: <Globe className="size-3.5" />, renk: "#7c3aed" },
  { id: "fingerprint", ikon: <Fingerprint className="size-3.5" />, renk: "#0891b2" },
  { id: "behavior", ikon: <Activity className="size-3.5" />, renk: "#d97706" },
  { id: "ghostfont", ikon: <Ghost className="size-3.5" />, renk: "#16a34a" },
  { id: "rule", ikon: <SlidersHorizontal className="size-3.5" />, renk: "#dc2626" },
] as const;
// Kategori → görsel olarak vurgulanan birincil savunma katmanı (atıf; deterministik).
const KATEGORI_KATMAN: Record<string, string> = {
  ddos: "rate", kimlik: "reputation", kazima: "reputation", atlatma: "fingerprint",
  ai: "ghostfont", spam: "behavior",
};

function senaryoAd(s: Sonuc, t: Ceviri): string {
  const anahtar = `kt.senaryo.${s.id}.ad`;
  const cevrik = t(anahtar);
  return cevrik === anahtar ? s.ad : cevrik;
}
function senaryoAciklama(s: Sonuc, t: Ceviri): string {
  const cevrik = t(`kt.senaryo.${s.id}.aciklama`);
  return cevrik === `kt.senaryo.${s.id}.aciklama` ? s.aciklama : cevrik;
}
function siddetEtiket(deger: string, t: Ceviri): string {
  const anahtar = `kt.siddet.${deger}`;
  const cevrik = t(anahtar);
  return cevrik === anahtar ? deger : cevrik;
}
function beklenenEtiket(deger: string, t: Ceviri): string {
  const anahtar = `kt.beklenen.${deger}`;
  const cevrik = t(anahtar);
  return cevrik === anahtar ? deger : cevrik;
}

/** Canlı akış durumu: her senaryo için işlenen istek sayısı + tamamlanma. */
interface CanliDurum {
  aktifIndeks: number;          // şu an işlenen senaryonun (orijinal sıradaki) indeksi, -1 = yok
  islenen: Record<string, number>; // senaryo id → işlenen istek sayısı (canlı sayaç)
  tamamlanan: Set<string>;      // işlenmesi biten senaryolar
}

export function KirmiziTakimIstemci({ dil, ilkSonuc }: { dil: Dil; ilkSonuc: Veri }) {
  const t = (anahtar: string) => kirmiziTakimCeviri(anahtar, dil);
  const { goster } = useToast();
  const [veri, setVeri] = useState<Veri>(ilkSonuc);
  const [calisiyor, setCalisiyor] = useState(false);
  const [canli, setCanli] = useState<CanliDurum>({ aktifIndeks: -1, islenen: {}, tamamlanan: new Set() });
  const iptalRef = useRef(false);

  const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /** Gerçek API sonucunu senaryo-senaryo, istek-istek CANLI olarak açığa çıkar.
   *  Sayılar API'den GELEN gerçek verilerdir; yalnızca kademeli görselleştirilir. */
  const canliAkis = useCallback(async (yeni: Veri) => {
    // Orijinal senaryo sırasını (kategori sırasına göre) sabitle — deterministik akış.
    const sirali = [...yeni.sonuclar].sort(
      (a, b) => KATEGORI_SIRA.indexOf(a.kategori as never) - KATEGORI_SIRA.indexOf(b.kategori as never),
    );
    setCanli({ aktifIndeks: -1, islenen: {}, tamamlanan: new Set() });
    for (let si = 0; si < sirali.length; si++) {
      if (iptalRef.current) return;
      const s = sirali[si];
      setCanli((c) => ({ ...c, aktifIndeks: si }));
      // İstekleri kademeli say (görsel; toplam gerçek istek sayısı).
      const adim = Math.max(1, Math.floor(s.toplam / 12));
      for (let i = 0; i <= s.toplam; i += adim) {
        if (iptalRef.current) return;
        const say = Math.min(i, s.toplam);
        setCanli((c) => ({ ...c, islenen: { ...c.islenen, [s.id]: say } }));
        await bekle(38);
      }
      setCanli((c) => ({
        ...c,
        islenen: { ...c.islenen, [s.id]: s.toplam },
        tamamlanan: new Set([...c.tamamlanan, s.id]),
      }));
      await bekle(90);
    }
    setCanli((c) => ({ ...c, aktifIndeks: -1 }));
  }, []);

  async function calistir() {
    if (calisiyor) return;
    setCalisiyor(true);
    iptalRef.current = false;
    try {
      const r = await fetch("/api/kirmizi-takim", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ istekSayisi: 60 }),
      });
      if (!r.ok) throw new Error();
      const yeni: Veri = await r.json();
      setVeri(yeni);
      await canliAkis(yeni); // gerçek sonucu canlı açığa çıkar
      goster({ tip: "basari", baslik: t("kt.toast.basariBaslik"), aciklama: t("kt.toast.basariAciklama").replace("{n}", String(yeni.sonuclar.length)) });
    } catch {
      goster({ tip: "hata", baslik: t("kt.toast.hataBaslik") });
    } finally {
      setCalisiyor(false);
    }
  }

  const skorRenk = veri.ozet.kapsamaSkoru >= 85 ? "#16a34a" : veri.ozet.kapsamaSkoru >= 50 ? "#d97706" : "#dc2626";
  const senaryoSayisi = veri.sonuclar.length;
  const gostergeMetni = veri.ozet.kapsamaSkoru >= 85 ? t("kt.gosterge.mukemmel") : veri.ozet.kapsamaSkoru >= 50 ? t("kt.gosterge.iyi") : t("kt.gosterge.zayif");

  // Açıklama şeridi
  const seritParcalar = t("kt.serit.aciklama").replace("{n}", String(senaryoSayisi)).split(t("kt.serit.gercekKural"));

  // Kategori gruplarını hazırla (görsel gruplar; her grupta ort. etkinlik).
  const gruplar = useMemo(() => {
    return KATEGORI_SIRA
      .map((kat) => {
        const items = veri.sonuclar.filter((s) => s.kategori === kat);
        if (!items.length) return null;
        const ortEtkinlik = Math.round(items.reduce((a, s) => a + s.etkinlik, 0) / items.length);
        return { kat, items: items.sort((a, b) => a.etkinlik - b.etkinlik), ortEtkinlik };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);
  }, [veri.sonuclar]);

  // Canlı akış için: senaryo id → sıralı akış indeksi (aktif senaryoyu bulmak için).
  const akisSirasi = useMemo(
    () => [...veri.sonuclar].sort((a, b) => KATEGORI_SIRA.indexOf(a.kategori as never) - KATEGORI_SIRA.indexOf(b.kategori as never)),
    [veri.sonuclar],
  );
  const aktifId = canli.aktifIndeks >= 0 ? akisSirasi[canli.aktifIndeks]?.id : null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Swords className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("kt.serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {seritParcalar.length > 1
              ? <>{seritParcalar[0]}<b>{t("kt.serit.gercekKural")}</b>{seritParcalar[1]}</>
              : seritParcalar[0]}
          </p>
        </div>
      </div>

      {/* etkinlik göstergesi + çalıştır + canlı akış */}
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Panel baslik={t("kt.gosterge.baslik")}>
          <div className="flex flex-col items-center py-2">
            <div className="relative grid size-44 place-items-center">
              <svg viewBox="0 0 100 100" className="size-44 -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#eef0f4" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke={skorRenk} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 * (1 - veri.ozet.kapsamaSkoru / 100)}
                  style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)" }}
                />
              </svg>
              <div className="absolute text-center">
                <div className="num text-[42px] font-bold leading-none" style={{ color: skorRenk }}>%{veri.ozet.kapsamaSkoru}</div>
                <div className="mt-1 text-[11px] text-slate-faint">{t("kt.skor.kapsama")}</div>
              </div>
            </div>
            <div
              className="mt-3 rounded-full px-3 py-1 text-[12px] font-semibold"
              style={{ background: `${skorRenk}18`, color: skorRenk }}
            >
              {gostergeMetni}
            </div>
            <div className="mt-4 flex w-full items-center justify-around text-center">
              <div><div className="num text-[18px] font-bold text-ok">{veri.ozet.korunuyor}</div><div className="text-[10px] text-slate-faint">{t("kt.skor.korunuyor")}</div></div>
              <div><div className="num text-[18px] font-bold text-danger2">{veri.ozet.acik}</div><div className="text-[10px] text-slate-faint">{t("kt.skor.acik")}</div></div>
              <div><div className="num text-[18px] font-bold text-slate-ink">{veri.kuralSayisi}</div><div className="text-[10px] text-slate-faint">{t("kt.skor.aktifKural")}</div></div>
            </div>
            <Button className="mt-5 w-full" onClick={calistir} disabled={calisiyor}>
              {calisiyor ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              {calisiyor ? t("kt.skor.calisiyor") : t("kt.skor.calistir")}
            </Button>
          </div>
        </Panel>

        {/* canlı saldırı akışı */}
        <Panel
          baslik={<span className="flex items-center gap-2"><Radio className={cn("size-4", calisiyor ? "text-danger2 animate-pulse" : "text-slate-faint")} /> {t("kt.canli.baslik")}</span>}
        >
          {canli.aktifIndeks === -1 && Object.keys(canli.islenen).length === 0 && !calisiyor ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Swords className="size-8 text-slate-faint" />
              <p className="max-w-sm text-[13px] text-slate-muted">{t("kt.canli.hazir")}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {akisSirasi.map((s, idx) => {
                const islenen = canli.islenen[s.id] ?? 0;
                const bitti = canli.tamamlanan.has(s.id);
                const aktif = aktifId === s.id;
                const oran = s.toplam ? Math.round((islenen / s.toplam) * 100) : 0;
                const m = DURUM_META[s.durum];
                const katman = KATMAN_ZINCIRI.find((k) => k.id === KATEGORI_KATMAN[s.kategori]);
                const gorunur = aktif || bitti || idx <= canli.aktifIndeks;
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "rounded-xl border px-3.5 py-2.5 transition-all",
                      aktif ? "border-brand-200 bg-brand-50/40 shadow-sm" : bitti ? "border-line bg-canvas/30" : "border-line/60 bg-surface",
                      !gorunur && "opacity-40",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg text-white" style={{ background: bitti ? m.renk : "#94a3b8" }}>
                        {aktif ? <Loader2 className="size-4 animate-spin" /> : bitti ? <Check className="size-4" /> : KATEGORI_IKON[s.kategori]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-medium text-slate-ink">{senaryoAd(s, t)}</span>
                          <span className="shrink-0 text-[11px] text-slate-faint">
                            {aktif ? t("kt.canli.istek").replace("{i}", String(islenen)).replace("{n}", String(s.toplam)) : bitti ? `%${s.etkinlik}` : ""}
                          </span>
                        </div>
                        {/* ilerleme çubuğu (canlı) */}
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
                          <div
                            className="h-full rounded-full transition-[width] duration-100"
                            style={{ width: `${bitti ? 100 : oran}%`, background: bitti ? m.renk : "#2f6fed" }}
                          />
                        </div>
                        {/* yakalayan katman atfı (aktif/bitmiş) */}
                        {(aktif || bitti) && katman && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-faint">
                            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5" style={{ background: `${katman.renk}14`, color: katman.renk }}>
                              {katman.ikon}{t(`kt.canli.katman.${katman.id}`)}
                            </span>
                            {bitti && s.kacan > 0 && <span className="text-danger2">· {s.kacan} {t("kt.canli.gecti")}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {canli.aktifIndeks === -1 && canli.tamamlanan.size === akisSirasi.length && (
                <div className="flex items-center gap-1.5 pt-1 text-[12px] text-ok"><Check className="size-4" /> {t("kt.canli.tamamlandi")}</div>
              )}
            </div>
          )}
        </Panel>
      </div>

      {/* özet uyarı + KPI */}
      <div className="space-y-4">
        {veri.ozet.kritikAcik > 0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-danger-soft bg-danger-soft/40 px-5 py-4 text-danger2">
            <ShieldAlert className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-[14px] font-semibold">{t("kt.uyari.kritikBaslik").replace("{n}", String(veri.ozet.kritikAcik))}</p>
              <p className="mt-0.5 text-[13px]">{t("kt.uyari.kritikAciklama")}</p>
            </div>
          </div>
        ) : veri.ozet.acik > 0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-warn-soft bg-warn-soft/40 px-5 py-4 text-amber-700">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div><p className="text-[14px] font-semibold">{t("kt.uyari.acikBaslik").replace("{n}", String(veri.ozet.acik))}</p><p className="mt-0.5 text-[13px]">{t("kt.uyari.acikAciklama")}</p></div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-ok-soft px-5 py-4 text-green-700">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" />
            <div><p className="text-[14px] font-semibold">{t("kt.uyari.temizBaslik")}</p><p className="mt-0.5 text-[13px]">{t("kt.uyari.temizAciklama").replace("{n}", String(senaryoSayisi))}</p></div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          <StatKart sayi={veri.ozet.toplamSenaryo} etiket={t("kt.kpi.testEdilen")} ikon={<Swords className="size-5" />} />
          <StatKart sayi={veri.ozet.korunuyor} etiket={t("kt.kpi.korunan")} tone="ok" ikon={<ShieldCheck className="size-5" />} />
          <StatKart sayi={veri.ozet.acik} etiket={t("kt.kpi.acik")} tone={veri.ozet.acik > 0 ? "danger" : "ok"} ikon={<ShieldAlert className="size-5" />} />
        </div>
      </div>

      {/* senaryo sonuçları — KATEGORİ GRUPLARI */}
      <div className="space-y-7">
        {gruplar.map((g) => {
          const grupRenk = g.ortEtkinlik >= 85 ? "#16a34a" : g.ortEtkinlik >= 40 ? "#d97706" : "#dc2626";
          return (
            <section key={g.kat}>
              {/* grup başlığı */}
              <div className="mb-3 flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: grupRenk }}>{KATEGORI_IKON[g.kat]}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-slate-ink">{t(`kt.kategori.${g.kat}`)}</h3>
                    <span className="text-[12px] text-slate-faint">{t("kt.kategori.senaryoSayisi").replace("{n}", String(g.items.length))}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="num text-[18px] font-bold" style={{ color: grupRenk }}>%{g.ortEtkinlik}</div>
                  <div className="text-[10px] text-slate-faint">{t("kt.kategori.ortEtkinlik")}</div>
                </div>
              </div>

              <div className="space-y-3">
                {g.items.map((s) => {
                  const m = DURUM_META[s.durum];
                  const oneriMetni = t(`kt.oneri.${s.kategori}`);
                  return (
                    <div key={s.id} className={cn("overflow-hidden rounded-3xl border bg-surface p-5", s.durum === "acik" ? "border-danger-soft" : "border-line")}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: m.renk }}>{KATEGORI_IKON[s.kategori]}</span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[15px] font-semibold text-slate-ink">{senaryoAd(s, t)}</span>
                              <Badge ton={m.ton}>{t(m.anahtar)}</Badge>
                              <Badge ton={s.siddet === "kritik" ? "kirmizi" : s.siddet === "yuksek" ? "sari" : "gri"}>{siddetEtiket(s.siddet, t)}</Badge>
                            </div>
                            <p className="mt-1 text-[13px] text-slate-muted">{senaryoAciklama(s, t)}</p>
                            <div className="mt-1.5 text-[12px] text-slate-faint">
                              {t("kt.beklenen.on")} <b>{beklenenEtiket(s.beklenen, t)}</b> · {s.engellenen} {t("kt.satir.engellendi")} · {s.dogrulanan} {t("kt.satir.dogrulandi")} · <span className={s.kacan > 0 ? "font-semibold text-danger2" : ""}>{s.kacan} {t("kt.satir.kacti")}</span>
                              {s.yakalayanKurallar.length > 0 && <> · {t("kt.satir.yakalayan")} {s.yakalayanKurallar.map((r) => <span key={r} className="mr-1 rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-slate-ink">{r}</span>)}</>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="num text-[24px] font-bold" style={{ color: m.renk }}>%{s.etkinlik}</div>
                          <div className="text-[11px] text-slate-faint">{t("kt.satir.etkinlik")}</div>
                        </div>
                      </div>
                      {/* etkinlik barı */}
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.etkinlik}%`, background: m.renk }} />
                      </div>

                      {/* AÇIK: boşluk kapatma önerisi (actionable) + kural oluşturucu linki */}
                      {s.durum !== "korunuyor" && (
                        <div className="mt-3 rounded-2xl border border-danger-soft bg-danger-soft/30 p-3.5">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger2" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[12.5px] font-semibold text-danger2">{t("kt.acik.uyari")}</p>
                              <div className="mt-1.5 flex items-start gap-1.5 text-[12.5px] text-slate-muted">
                                <span className="mt-0.5 shrink-0 font-semibold text-slate-ink">{t("kt.oneri.baslik")}:</span>
                                <span>{oneriMetni}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2.5 flex justify-end">
                            <Link
                              href="/panel/kural-oneri"
                              className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-ink-800"
                            >
                              {t("kt.oneri.kurGit")} <ArrowRight className="size-3" />
                            </Link>
                          </div>
                        </div>
                      )}
                      {s.durum === "korunuyor" && (
                        <div className="mt-3 flex items-center gap-1.5 text-[12px] text-ok"><Check className="size-4" /> {t("kt.korunuyor.mesaj")}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
