"use client";

/**
 * Specter — Kendi Kendini İyileştiren Savunma (Oto-Düzeltme)
 * =========================================================
 * Klasik WAF/bot-koruma ürünleri kuralları İNSANIN yazmasını bekler. Specter
 * bir adım öteye gider: savunma boşluklarını KENDİ bulur — kötü trafiğin
 * yoğunlaştığı ASN / bot sınıfı / ülkeyi tespit eder, her boşluk için somut bir
 * aday kural SENTEZLER, adayı sandbox'ta GERÇEK trafik yakalamalarına karşı
 * doğrular ve YALNIZCA yanlış-pozitif üretmeyen (regresyon=0, FP=0, net>0)
 * güvenli kuralları önerir. Kapalı-döngü otonom savunma.
 *
 * HİÇBİR sayı uydurma değildir — hepsi `oto-duzeltme` motorundan türetilir.
 * page.tsx SERVER'da hesaplar (bosluklariBul + otoDuzeltmeCalistir), buraya
 * hazır OtoDuzeltmeRaporu + SavunmaBosluk[] prop gelir. "Uygula" görünümü
 * dekoratiftir; gerçek uygulama akışı ayrıdır.
 *
 * Tasarım: KorelasyonBolumu / TehditAktorBolumu ile birebir aynı dil — Panel +
 * krem kartlar (bg-canvas), tabular-nums, rounded kartlar; framer-motion rise
 * (azHareket → sade). whileInView/viewport/opacity-fade YOK.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Wand2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Network,
  Bot,
  Globe,
  Ban,
  Target,
  ScanSearch,
  FlaskConical,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Gauge,
  Layers,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge, useToast } from "@/components/panel/kit";
import { DonutDagilim } from "@/components/panel/grafikler";
import { Gauge as GaugeGorsel } from "@/components/panel/grafikler-ek";
import type {
  OtoDuzeltmeRaporu,
  SavunmaBosluk,
  DuzeltmeSonuc,
} from "@/lib/specter/oto-duzeltme";

/** Bir aday/boşluk butonunun kural-oluşturma durumu. */
type KuralDurum = "hazir" | "calisiyor" | "olusturuldu";

/* ================================================================== Sabitler */

/** Boşluk türü → TR ad + ikon (asn=Network, botClass=Bot, country=Globe). */
const TUR_TANIM: Record<
  SavunmaBosluk["tur"],
  { ad: string; ikon: React.ElementType }
> = {
  asn: { ad: "ASN / Ağ", ikon: Network },
  botClass: { ad: "Bot sınıfı", ikon: Bot },
  country: { ad: "Ülke", ikon: Globe },
};

/** Aksiyon → renk paleti + etiket (block=kırmızı, challenge=amber). */
const AKSIYON_TANIM: Record<
  string,
  { hex: string; rozet: "kirmizi" | "sari"; etiket: string; ikon: React.ElementType }
> = {
  block: { hex: "#dc2626", rozet: "kirmizi", etiket: "Engelle", ikon: Ban },
  challenge: { hex: "#d97706", rozet: "sari", etiket: "Doğrula", ikon: ShieldAlert },
};

/* ================================================================== Yardımcılar */

function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
}

/** Saflığa göre renk (hex) — ne kadar saf, o kadar güvenli/etkili hedef. */
function saflikRenk(s: number): string {
  if (s >= 0.97) return "#dc2626";
  if (s >= 0.92) return "#ea580c";
  return "#d97706";
}

/** Bölümü rise ile saran motion sarmalayıcı (KorelasyonBolumu ile aynı). */
function Bolum({
  azHareket,
  gecikme = 0,
  children,
}: {
  azHareket: boolean;
  gecikme?: number;
  children: React.ReactNode;
}) {
  if (azHareket) return <div>{children}</div>;
  return (
    <motion.div
      initial={{ y: 12 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: gecikme, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Panel başlığında ikon + metin. */
function BaslikIkon({ ikon: Ikon, metin }: { ikon: React.ElementType; metin: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Ikon className="size-4 text-slate-faint" />
      {metin}
    </span>
  );
}

/* ================================================================== Özet hapı */

function OzetHap({
  ikon: Ikon,
  etiket,
  deger,
  ek,
  ton = "ink",
}: {
  ikon: React.ElementType;
  etiket: string;
  deger: string;
  ek?: string;
  ton?: "ink" | "danger" | "ok" | "brand";
}) {
  const renk =
    ton === "danger"
      ? "text-danger2"
      : ton === "ok"
        ? "text-ok"
        : ton === "brand"
          ? "text-brand-700"
          : "text-slate-ink";
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3.5" />
        {etiket}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={cn("text-[22px] font-bold leading-none num", renk)}>{deger}</span>
        {ek && <span className="truncate text-[12px] text-slate-faint">{ek}</span>}
      </div>
    </div>
  );
}

/* ================================================================== Doğrulama metriği */

/** İyileşme / regresyon / yanlış-pozitif metrik hücresi. 0 regresyon + 0 FP
 *  yeşil "güvenli" işaretiyle vurgulanır; sıfır-olmayan risk kırmızı. */
function DogrulamaMetrik({
  ikon: Ikon,
  etiket,
  deger,
  iyiSifir,
}: {
  ikon: React.ElementType;
  etiket: string;
  deger: number;
  /** true → 0 iyidir (regresyon/FP): 0=yeşil, >0=kırmızı. false → >0 iyidir (iyileşme). */
  iyiSifir: boolean;
}) {
  const guvenli = iyiSifir ? deger === 0 : deger > 0;
  const renk = iyiSifir
    ? deger === 0
      ? "text-ok"
      : "text-danger2"
    : deger > 0
      ? "text-ok"
      : "text-slate-muted";
  return (
    <div className="rounded-lg border border-line bg-surface px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3" />
        {etiket}
      </div>
      <div className="mt-0.5 flex items-center gap-1">
        <span className={cn("text-[15px] font-bold tabular-nums leading-none", renk)}>
          {iyiSifir && deger === 0 ? "0" : sayi(deger)}
        </span>
        {guvenli && iyiSifir && <CheckCircle2 className="size-3 text-ok" />}
      </div>
    </div>
  );
}

/* ================================================================== Onaylanan aday kartı */

function AdayKart({
  sonuc,
  durum,
  onUygula,
}: {
  sonuc: DuzeltmeSonuc;
  durum: KuralDurum;
  onUygula: () => void;
}) {
  const { aday } = sonuc;
  const aksiyon = AKSIYON_TANIM[aday.action] ?? AKSIYON_TANIM.block;
  const AksiyonIkon = aksiyon.ikon;
  const turTanim = TUR_TANIM[aday.bosluk.tur];
  const TurIkon = turTanim.ikon;
  const guvenli = sonuc.toplamRegresyon === 0 && sonuc.toplamYanlisPozitif === 0;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-canvas/40 p-4 transition",
        guvenli ? "border-green-200 bg-ok-soft/25" : "border-line",
      )}
    >
      {/* Üst şerit: aday adı + aksiyon rozeti + net kazanım */}
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset"
            style={{
              background: `${aksiyon.hex}14`,
              color: aksiyon.hex,
              borderColor: `${aksiyon.hex}33`,
            }}
          >
            <AksiyonIkon className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-ink">{aday.ad}</span>
              <Badge ton={aksiyon.rozet}>
                <AksiyonIkon className="size-3" />
                {aksiyon.etiket}
              </Badge>
              {guvenli && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-green-700 ring-1 ring-inset ring-green-200">
                  <ShieldCheck className="size-3" />
                  Güvenli
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-faint">
              <TurIkon className="size-3" />
              {turTanim.ad}
              <span className="text-slate-300">·</span>
              <span className="tabular-nums">
                %{Math.round(aday.bosluk.saflik * 100)} saf hedef
              </span>
            </div>
          </div>
        </div>

        {/* Net kazanım pili */}
        <div className="flex shrink-0 flex-col items-end">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-ok" />
            <span className="text-[15px] font-bold tabular-nums text-ok">
              +{sonuc.ortNetDegisim}
            </span>
          </div>
          <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
            net kazanım
          </span>
        </div>
      </div>

      {/* Kural özeti — field op value mono kod gibi */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
        <span className="inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
          <Layers className="size-3" />
          Kural
        </span>
        <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[11.5px] text-slate-ink ring-1 ring-inset ring-line">
          {aday.field}
        </code>
        <span className="font-mono text-[11.5px] font-semibold text-brand-600">{aday.op}</span>
        <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[11.5px] text-slate-ink ring-1 ring-inset ring-line">
          {aday.value}
        </code>
        <ArrowRight className="size-3.5 text-slate-faint" />
        <span
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset"
          style={{
            background: `${aksiyon.hex}12`,
            color: aksiyon.hex,
            borderColor: `${aksiyon.hex}33`,
          }}
        >
          <AksiyonIkon className="size-3" />
          {aksiyon.etiket.toLowerCase()}
        </span>
      </div>

      {/* Sandbox doğrulama metrikleri */}
      <div className="grid grid-cols-3 gap-2">
        <DogrulamaMetrik
          ikon={Target}
          etiket="Yakalanan"
          deger={sonuc.toplamIyilesme}
          iyiSifir={false}
        />
        <DogrulamaMetrik
          ikon={AlertTriangle}
          etiket="Regresyon"
          deger={sonuc.toplamRegresyon}
          iyiSifir
        />
        <DogrulamaMetrik
          ikon={ShieldX}
          etiket="Yanlış-poz."
          deger={sonuc.toplamYanlisPozitif}
          iyiSifir
        />
      </div>

      {/* Karar gerekçesi (insan-okur) + dekoratif uygula butonu */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-3">
        <p className="flex min-w-0 items-start gap-1.5 text-[11.5px] leading-relaxed text-slate-muted">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-ok" />
          <span>{sonuc.gerekce}</span>
        </p>
        {durum === "olusturuldu" ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-ok-soft px-3 py-1.5 text-[12px] font-semibold text-green-700 ring-1 ring-inset ring-green-200">
            <CheckCircle2 className="size-3.5" />
            Uygulandı
          </span>
        ) : (
          <button
            type="button"
            onClick={onUygula}
            disabled={durum === "calisiyor"}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-ink px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {durum === "calisiyor" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Wand2 className="size-3.5" />
            )}
            {durum === "calisiyor" ? "Uygulanıyor…" : "Uygula"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ================================================================== Reddedilen aday satırı */

function ReddedilenSatir({ sonuc }: { sonuc: DuzeltmeSonuc }) {
  const { aday } = sonuc;
  const turTanim = TUR_TANIM[aday.bosluk.tur];
  const TurIkon = turTanim.ikon;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-line bg-canvas/40 px-3.5 py-2.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-danger-soft text-danger2 ring-1 ring-inset ring-red-200">
        <XCircle className="size-3.5" />
      </span>
      <div className="flex min-w-0 items-center gap-1.5">
        <TurIkon className="size-3.5 shrink-0 text-slate-faint" />
        <span className="truncate text-[12.5px] font-medium text-slate-ink">{aday.ad}</span>
      </div>
      <code className="hidden shrink-0 rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-slate-muted ring-1 ring-inset ring-line sm:inline">
        {aday.field} {aday.op} {aday.value}
      </code>
      <span className="ml-auto min-w-0 truncate text-[11.5px] text-slate-muted">{sonuc.gerekce}</span>
    </div>
  );
}

/* ================================================================== Boşluk satırı */

function BoslukKart({
  bosluk,
  durum,
  onOner,
}: {
  bosluk: SavunmaBosluk;
  durum: KuralDurum;
  onOner: () => void;
}) {
  const turTanim = TUR_TANIM[bosluk.tur];
  const TurIkon = turTanim.ikon;
  const hex = saflikRenk(bosluk.saflik);
  const yuzde = Math.round(bosluk.saflik * 100);
  // Motorun sentezleyeceği aksiyonu yansıt: ülke → doğrula, diğer → engelle.
  const onerilenAksiyon = bosluk.tur === "country" ? AKSIYON_TANIM.challenge : AKSIYON_TANIM.block;
  const OnerilenIkon = onerilenAksiyon.ikon;
  const toplam = bosluk.kotuSayi + bosluk.insanSayi;
  const kotuOran = toplam ? Math.round((bosluk.kotuSayi / toplam) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-canvas/40 p-4 pl-5">
      {/* Isı-renkli sol şerit — saflığa göre (yüksek saflık = güvenli hedef) */}
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: hex }} aria-hidden />

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset"
            style={{ background: `${hex}14`, color: hex, borderColor: `${hex}33` }}
          >
            <TurIkon className="size-4" />
          </span>
          <div className="min-w-0">
            <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
              {turTanim.ad}
            </span>
            <code className="mt-0.5 block truncate rounded bg-surface px-1.5 py-0.5 font-mono text-[12px] font-semibold text-slate-ink ring-1 ring-inset ring-line">
              {bosluk.value}
            </code>
          </div>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ring-inset"
          style={{ background: `${hex}12`, color: hex, borderColor: `${hex}33` }}
        >
          <Gauge className="size-3" />%{yuzde} saf
        </span>
      </div>

      {/* Kötü/meşru dengesi — ince oran çubuğu (görsel çeşitlilik) */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-danger2">
            <Ban className="size-3.5" />
            {sayi(bosluk.kotuSayi)} kötü
          </span>
          <span className="inline-flex items-center gap-1 tabular-nums text-slate-muted">
            <ShieldCheck className="size-3.5 text-slate-faint" />
            {sayi(bosluk.insanSayi)} meşru
          </span>
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full" style={{ width: `${kotuOran}%`, background: hex }} />
        </div>
      </div>

      {/* Kural önerisi CTA — tıklanınca bu boşluk için gerçek kural oluşturur */}
      <div className="flex items-center justify-between gap-2 border-t border-line/70 pt-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-faint">
          <Wand2 className="size-3.5" />
          {bosluk.field} {bosluk.tur === "asn" ? "contains" : "eq"} {bosluk.value}
        </span>
        {durum === "olusturuldu" ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-ok-soft px-2.5 py-1 text-[11.5px] font-semibold text-green-700 ring-1 ring-inset ring-green-200">
            <CheckCircle2 className="size-3.5" />
            Oluşturuldu
          </span>
        ) : (
          <button
            type="button"
            onClick={onOner}
            disabled={durum === "calisiyor"}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: `${onerilenAksiyon.hex}12`,
              color: onerilenAksiyon.hex,
              borderColor: `${onerilenAksiyon.hex}33`,
            }}
          >
            {durum === "calisiyor" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <OnerilenIkon className="size-3.5" />
            )}
            Kural öner: {onerilenAksiyon.etiket.toLowerCase()}
          </button>
        )}
      </div>
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function OtoDuzeltmeBolumu({
  rapor,
  bosluklar,
  azHareket,
  siteId,
}: {
  rapor: OtoDuzeltmeRaporu;
  bosluklar: SavunmaBosluk[];
  azHareket: boolean;
  /** Kuralın oluşturulacağı site — yoksa buton kullanıcıyı site eklemeye yönlendirir. */
  siteId?: string | null;
}) {
  const router = useRouter();
  const { goster } = useToast();
  // Her aday/boşluk anahtarı için buton durumu (idempotent: oluşturulan tekrar basılmaz).
  const [durumlar, setDurumlar] = useState<Record<string, KuralDurum>>({});

  /** field/op/value/action ile gerçek bir kural POST'lar; başarıda toast + durum güncellenir. */
  async function kuralOlustur(
    anahtar: string,
    veri: { name: string; field: string; op: string; value: string; action: string },
  ) {
    if (durumlar[anahtar] === "calisiyor" || durumlar[anahtar] === "olusturuldu") return;
    // Site yoksa: kullanıcıyı site eklemeye yönlendir (dekoratif değil, anlamlı aksiyon).
    if (!siteId) {
      goster({ tip: "bilgi", baslik: "Önce bir site ekle", aciklama: "Kural oluşturmak için önce site eklemelisin." });
      router.push("/panel/siteler");
      return;
    }
    setDurumlar((p) => ({ ...p, [anahtar]: "calisiyor" }));
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          name: veri.name,
          description: "Oto-Düzeltme tarafından önerildi",
          field: veri.field,
          op: veri.op,
          value: veri.value,
          action: veri.action,
          priority: 5,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "hata");
      }
      setDurumlar((p) => ({ ...p, [anahtar]: "olusturuldu" }));
      goster({ tip: "basari", baslik: "Kural oluşturuldu", aciklama: veri.name });
      router.refresh();
    } catch {
      setDurumlar((p) => ({ ...p, [anahtar]: "hazir" }));
      goster({ tip: "hata", baslik: "Kural oluşturulamadı", aciklama: "Lütfen tekrar dene." });
    }
  }

  const { ozet } = rapor;
  const onaylananlar = rapor.onaylanan.slice(0, 8);
  const reddedilenler = rapor.reddedilen.slice(0, 5);
  const boslukGoster = bosluklar.slice(0, 6);
  const onayVar = ozet.onaylanan > 0;

  /* --- Görsel özet türetimleri (yalnızca mevcut motor verisinden) --- */
  // Boşluk şiddeti donut'u: saflığa göre bantlanır (yüksek saflık = kritik hedef).
  const bandKritik = bosluklar.filter((b) => b.saflik >= 0.97);
  const bandYuksek = bosluklar.filter((b) => b.saflik >= 0.92 && b.saflik < 0.97);
  const bandOrta = bosluklar.filter((b) => b.saflik < 0.92);
  const siddetSegment = [
    { etiket: "Kritik (%97+ saf)", deger: bandKritik.reduce((a, b) => a + b.kotuSayi, 0), renk: "#dc2626" },
    { etiket: "Yüksek (%92-97)", deger: bandYuksek.reduce((a, b) => a + b.kotuSayi, 0), renk: "#ea580c" },
    { etiket: "Orta (<%92)", deger: bandOrta.reduce((a, b) => a + b.kotuSayi, 0), renk: "#d97706" },
  ].filter((s) => s.deger > 0);

  // Kapsama skoru Gauge: denenen adayların kaçı güvenle onaylandı (kapalı-döngü verimi).
  const kapsamaOran = ozet.denenenAday ? Math.round((ozet.onaylanan / ozet.denenenAday) * 100) : 0;

  return (
    <Bolum azHareket={azHareket}>
      <Panel
        baslik={<BaslikIkon ikon={Wand2} metin="Kendi Kendini İyileştiren Savunma" />}
        sagUst={
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-faint">
              {sayi(ozet.onaylanan)}/{sayi(ozet.denenenAday)} onaylandı
            </span>
            <Badge ton="brand">
              <Sparkles className="size-3" />
              Oto-Düzeltme
            </Badge>
          </div>
        }
      >
        {/* Açıklama — kilit fikir */}
        <p className="-mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-slate-muted">
          Veylify savunma boşluklarını <span className="font-medium text-slate-ink">kendi bulur</span> —
          kötü trafiğin yoğunlaştığı ASN, bot sınıfı ve ülkeyi tespit eder, her boşluk için
          aday kural üretir, sandbox&apos;ta gerçek yakalamalara karşı test eder ve yalnızca{" "}
          <span className="font-medium text-slate-ink">yanlış-pozitif üretmeyen</span> (0 regresyon,
          0 FP) güvenli kuralları önerir. Kapalı-döngü otonom savunma.
        </p>

        {/* Ferah görsel özet: solda kapsama gauge + KPI'lar, sağda boşluk-şiddeti
            donut'u. TlsIstihbarat'tan FARKLI düzen — donut sağda, gauge büyük solda. */}
        <div className="grid gap-4 lg:grid-cols-[1fr_1.35fr]">
          {/* Kapsama gauge + iki büyük KPI */}
          <div className="flex flex-col gap-4">
            <div className="grid place-items-center rounded-2xl border border-line bg-canvas/40 p-5">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
                <ShieldCheck className="size-3.5" />
                Boşluk kapsama skoru
              </div>
              <GaugeGorsel
                deger={kapsamaOran}
                etiket={kapsamaOran >= 60 ? "güçlü kapsama" : kapsamaOran > 0 ? "kısmi kapsama" : "boşluk açık"}
                boyut={170}
                renk={kapsamaOran >= 60 ? "#16a34a" : kapsamaOran >= 30 ? "#2f6fed" : "#d97706"}
              />
              <p className="mt-1 max-w-[15rem] text-center text-[11px] leading-snug text-slate-muted">
                Denenen adayların kaçı sandbox&apos;ta güvenle onaylandı — kapalı-döngü verimi.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <OzetHap
                ikon={CheckCircle2}
                etiket="Onaylanan"
                deger={sayi(ozet.onaylanan)}
                ek={`/${sayi(ozet.denenenAday)}`}
                ton={onayVar ? "ok" : "ink"}
              />
              <OzetHap
                ikon={Target}
                etiket="Engellenecek"
                deger={sayi(ozet.engellenenTahmini)}
                ek="kötü istek"
                ton={ozet.engellenenTahmini > 0 ? "danger" : "ink"}
              />
            </div>
          </div>

          {/* Boşluk şiddeti donut'u — kötü isteklerin saflık bandına göre dağılımı */}
          <div className="rounded-2xl border border-line bg-canvas/40 p-5">
            <div className="mb-4 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
              <ScanSearch className="size-3.5" />
              Boşluk şiddeti — kötü trafiğin saflık bandına göre yoğunluğu
            </div>
            {siddetSegment.length > 0 ? (
              <DonutDagilim segmentler={siddetSegment} />
            ) : (
              <div className="grid place-items-center py-8 text-center text-[12px] text-slate-faint">
                Tespit edilmiş bir savunma boşluğu yok — mevcut savunma boşlukları örtüyor.
              </div>
            )}
          </div>
        </div>

        {/* Onaylanan aday kurallar */}
        <div className="mt-5">
          <div className="mb-2.5 flex items-center gap-2">
            <ShieldCheck className="size-4 text-ok" />
            <span className="text-[13px] font-semibold text-slate-ink">
              Önerilen güvenli kurallar
            </span>
            <span className="text-[12px] text-slate-faint">
              sandbox&apos;ta doğrulandı · net +{ozet.netKazanim}
            </span>
          </div>

          {onaylananlar.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-line py-12 text-center">
              <ShieldCheck className="mb-2 size-7 text-ok" />
              <p className="text-[13px] font-medium text-slate-muted">
                Güvenle önerilebilecek yeni kural yok
              </p>
              <p className="mt-0.5 max-w-sm text-[12px] text-slate-faint">
                Mevcut savunman boşlukları örtüyor — yeni bir kötü-trafik yoğunluğu
                belirdiğinde Veylify aday kural sentezleyip burada önerir.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {onaylananlar.map((sonuc, i) => {
                const anahtar = "aday:" + sonuc.aday.field + ":" + sonuc.aday.value;
                return (
                  <Bolum
                    key={sonuc.aday.value + sonuc.aday.field}
                    azHareket={azHareket}
                    gecikme={azHareket ? 0 : 0.05 + i * 0.03}
                  >
                    <AdayKart
                      sonuc={sonuc}
                      durum={durumlar[anahtar] ?? "hazir"}
                      onUygula={() =>
                        kuralOlustur(anahtar, {
                          name: sonuc.aday.ad,
                          field: sonuc.aday.field,
                          op: sonuc.aday.op,
                          value: sonuc.aday.value,
                          action: sonuc.aday.action,
                        })
                      }
                    />
                  </Bolum>
                );
              })}
            </div>
          )}
        </div>

        {/* Reddedilen adaylar (neden reddedildi) */}
        {reddedilenler.length > 0 && (
          <div className="mt-6">
            <div className="mb-2.5 flex items-center gap-2">
              <ShieldX className="size-4 text-slate-faint" />
              <span className="text-[13px] font-semibold text-slate-ink">Reddedilen adaylar</span>
              <span className="text-[12px] text-slate-faint">
                regresyon / yanlış-pozitif üretti — güvenli değil
              </span>
            </div>
            <div className="space-y-2">
              {reddedilenler.map((sonuc) => (
                <ReddedilenSatir key={sonuc.aday.value + sonuc.aday.field} sonuc={sonuc} />
              ))}
            </div>
          </div>
        )}

        {/* Tespit edilen boşluklar */}
        {boslukGoster.length > 0 && (
          <div className="mt-6">
            <div className="mb-2.5 flex items-center gap-2">
              <ScanSearch className="size-4 text-slate-faint" />
              <span className="text-[13px] font-semibold text-slate-ink">
                Tespit edilen savunma boşlukları
              </span>
              <span className="text-[12px] text-slate-faint">
                kötü trafiğin yoğunlaştığı hedefler
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {boslukGoster.map((b) => {
                const anahtar = "bosluk:" + b.id;
                // adaySentezle ile aynı sentez: op (asn→contains, diğer→eq), aksiyon (country→challenge, diğer→block).
                const op = b.tur === "asn" ? "contains" : "eq";
                const action = b.tur === "country" ? "challenge" : "block";
                const ad =
                  b.tur === "botClass"
                    ? `${b.value} sınıfını engelle`
                    : b.tur === "asn"
                      ? `${b.value} ağını engelle`
                      : `${b.value} ülkesini doğrula`;
                return (
                  <BoslukKart
                    key={b.id}
                    bosluk={b}
                    durum={durumlar[anahtar] ?? "hazir"}
                    onOner={() =>
                      kuralOlustur(anahtar, { name: ad, field: b.field, op, value: b.value, action })
                    }
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Döngü lejantı */}
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-4 text-[11px] text-slate-faint">
          <span className="font-medium uppercase tracking-wide">Kapalı döngü:</span>
          {[
            { ikon: ScanSearch, ad: "Boşluk bul" },
            { ikon: Wand2, ad: "Aday sentezle" },
            { ikon: FlaskConical, ad: "Sandbox doğrula" },
            { ikon: ShieldCheck, ad: "Güvenli öner" },
          ].map((adim, i) => {
            const Ikon = adim.ikon;
            return (
              <span key={adim.ad} className="inline-flex items-center gap-1.5">
                {i > 0 && <ArrowRight className="size-3 text-slate-300" />}
                <span className="inline-flex items-center gap-1 text-slate-muted">
                  <Ikon className="size-3.5" />
                  {adim.ad}
                </span>
              </span>
            );
          })}
          <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-green-700">
            <ShieldCheck className="size-3.5" />
            onay eşiği: 0 regresyon · 0 yanlış-pozitif
          </span>
        </div>
      </Panel>
    </Bolum>
  );
}
