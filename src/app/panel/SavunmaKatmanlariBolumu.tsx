"use client";

/**
 * Specter — Çok-Katmanlı Savunma Derinliği (Defense-in-Depth)
 * ===========================================================
 * Tek bir savunma atlatılabilir. Specter, birbirinden BAĞIMSIZ 4 savunma
 * katmanını üst üste koyar (defense-in-depth): bir bot birini geçse bir diğeri
 * yakalar. Bu bölüm, gözlemlenen trafikte her katmanın ne yaptığını, ne kadar
 * tehdit yakaladığını ve katmanların birbirini nasıl tamamladığını TEK ekranda
 * gösterir — Cloudflare/DataDome tarzı şeffaf katmanlı-savunma görselleştirmesi.
 *
 * HİÇBİR sayı uydurma değildir — hepsi `savunma-katmanlari` motorundan türetilir.
 * page.tsx SERVER'da hesaplar (savunmaGenel), buraya hazır SavunmaGenel gelir.
 *
 * GÖRSEL DİL: "savunma profili" — katmanların çok-eksenli RADAR profili + katman
 * başına GAUGE durum kartı ızgarası (monoton dikey-bar yığını kırıldı).
 * framer-motion rise (azHareket → sade). whileInView/viewport/opacity-fade YOK.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Bug,
  Fingerprint,
  Cpu,
  Gauge as GaugeIkon,
  Boxes,
  Flame,
  Lock,
  Radio,
  Radar,
  ChevronDown,
  Activity,
  Target,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Panel, Badge } from "@/components/panel/kit";
import { RadarGrafik, Gauge } from "@/components/panel/grafikler-ek";
import type { SavunmaGenel, SavunmaKatman, KatmanId } from "@/lib/specter/savunma-katmanlari";

/* ================================================================== Sabitler */

/** Katman kimliği → TR ad + ikon + kısa etiket (savunma katmanının kimliği). */
const KATMAN_TANIM: Record<KatmanId, { ad: string; kisaAd: string; ikon: React.ElementType; kisa: string; aciklama: string; nasil: string }> = {
  "ghost-font": {
    ad: "Ghost-Font Challenge",
    kisaAd: "Ghost-Font",
    ikon: Eye,
    kisa: "İnsan algısı",
    aciklama: "Hareketli-nokta (temporal dithering) challenge; metni yalnızca insan gözü okuyabilir, OCR ve ekran-okur botlar kördür.",
    nasil: "Karakterler zamanla titreşen noktalardan oluşur — insan retinası bunu birleştirip okur, piksel-tabanlı OCR ise anlamlı bir şey göremez.",
  },
  honeypot: {
    ad: "Honeypot Tuzağı",
    kisaAd: "Honeypot",
    ikon: Bug,
    kisa: "Görünmez yem",
    aciklama: "Görünmez tuzak alan; formu otomatik dolduran bot yakalanır, gerçek kullanıcı bu alanı hiç görmez (sıfır yanlış-pozitif).",
    nasil: "CSS ile gizlenmiş alan gerçek kullanıcıya hiç görünmez; bir bot onu doldurursa niyeti kesin olarak otomasyondur.",
  },
  tutarlilik: {
    ad: "Tarayıcı Tutarlılığı",
    kisaAd: "Tutarlılık",
    ikon: Fingerprint,
    kisa: "Parmak izi",
    aciklama: "UA ile JS ortamının çapraz-doğrulaması; \"iddia ettiğin tarayıcı gerçekten sen misin?\" sorusunu sınar.",
    nasil: "Beyan edilen User-Agent, gerçek JS/TLS parmak iziyle karşılaştırılır — uyumsuzluk sahte veya headless tarayıcıyı açığa çıkarır.",
  },
  pow: {
    ad: "Proof-of-Work",
    kisaAd: "PoW",
    ikon: Cpu,
    kisa: "CPU maliyeti",
    aciklama: "Adaptif CPU-bulmacası; yüksek-hacimli botu ekonomik olarak caydırır, tek kullanıcıya maliyeti ihmal edilebilir.",
    nasil: "İstemci küçük bir hesap bulmacası çözer — tek kullanıcı için milisaniyeler, binlerce istek atan bot için sürdürülemez maliyet.",
  },
};

/** Atlatma zorluğu → renk paleti (hex + rozet tonu + etiket). Görev spesifikasyonu:
 *  orta=amber, yüksek=turuncu, kritik=kırmızı (en güçlü katman). */
const ZORLUK_TANIM: Record<
  SavunmaKatman["zorluk"],
  { hex: string; soft: string; rozet: "sari" | "kirmizi"; etiket: string; alt: string }
> = {
  orta: { hex: "#d97706", soft: "#fdf1e3", rozet: "sari", etiket: "Orta", alt: "Atlatılması güç" },
  yuksek: { hex: "#ea580c", soft: "#fdeee3", rozet: "kirmizi", etiket: "Yüksek", alt: "Atlatılması çok güç" },
  kritik: { hex: "#dc2626", soft: "#fdeaea", rozet: "kirmizi", etiket: "Kritik", alt: "Atlatılması neredeyse imkânsız" },
};

/* ================================================================== Yardımcılar */

function sayi(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR");
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

/* ================================================================== Sağlık halkası */

/** Genel savunma sağlığını (0-100) yay olarak çizen kompakt gösterge. */
function SaglikHalka({ saglik, azHareket }: { saglik: number; azHareket: boolean }) {
  const r = 34;
  const cevre = 2 * Math.PI * r;
  const oran = Math.max(0, Math.min(100, saglik)) / 100;
  const renk = saglik >= 80 ? "#16a34a" : saglik >= 55 ? "#d97706" : "#dc2626";
  return (
    <div className="relative grid size-[88px] shrink-0 place-items-center">
      <svg viewBox="-4 -4 96 96" className="size-[88px] -rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#eef1f6" strokeWidth="8" />
        <motion.circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={renk}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={cevre}
          initial={azHareket ? false : { strokeDashoffset: cevre }}
          animate={azHareket ? undefined : { strokeDashoffset: cevre * (1 - oran) }}
          style={azHareket ? { strokeDashoffset: cevre * (1 - oran) } : undefined}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-[22px] font-bold leading-none tabular-nums" style={{ color: renk }}>
          {saglik}
        </span>
        <span className="mt-0.5 text-[9.5px] font-medium uppercase tracking-wide text-slate-faint">/ 100</span>
      </div>
    </div>
  );
}

/* ================================================================== Katman durum kartı */

/**
 * Bir savunma katmanını GAUGE + rozet + yakalanan ile kompakt durum kartı olarak
 * gösterir — dikey-bar yığını yerine ızgara. Her kart kendi zorluk rengini taşır.
 */
function KatmanKart({
  katman,
  sira,
  toplamOlay,
  azHareket,
  acik,
  onToggle,
}: {
  katman: SavunmaKatman;
  sira: number;
  toplamOlay: number;
  azHareket: boolean;
  acik: boolean;
  onToggle: () => void;
}) {
  const tanim = KATMAN_TANIM[katman.id];
  const Ikon = tanim.ikon;
  const zorluk = ZORLUK_TANIM[katman.zorluk];
  const kapsama = Math.max(0, Math.min(100, Math.round(katman.kapsama)));
  const gecen = Math.max(0, toplamOlay - katman.yakalanan); // bu katmanın etkilemediği/geçen olay

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-canvas/40 p-4 transition",
        acik && "ring-1 ring-inset ring-slate-300",
      )}
      style={{ borderColor: `${zorluk.hex}33` }}
    >
      {/* üst renkli şerit */}
      <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: zorluk.hex }} />

      {/* Başlık + Gauge — TIKLANABİLİR (drill-down aç/kapa) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={acik}
        aria-label={`${tanim.ad} katmanı detayını ${acik ? "kapat" : "aç"}`}
        className="w-full text-left transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-lg"
      >
        {/* Başlık: ikon + ad + sıra */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset"
              style={{ background: zorluk.soft, color: zorluk.hex, borderColor: `${zorluk.hex}33` }}
            >
              <Ikon className="size-[18px]" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex size-[16px] items-center justify-center rounded-md bg-canvas text-[10px] font-bold text-slate-muted ring-1 ring-inset ring-line">
                  {sira}
                </span>
                <span className="truncate text-[13px] font-semibold text-slate-ink">{tanim.ad}</span>
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-muted">{tanim.kisa}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge ton={zorluk.rozet}>
              {katman.zorluk === "kritik" && <Flame className="size-3" />}
              {zorluk.etiket}
            </Badge>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-slate-faint transition-transform",
                acik && "rotate-180",
              )}
            />
          </div>
        </div>

        {/* Kapsama Gauge + yakalanan */}
        <div className="mt-3 flex items-center gap-3">
          <Gauge deger={kapsama} etiket="kapsama" boyut={120} renk={zorluk.hex} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="size-3.5 text-slate-faint" />
              <span className="text-[18px] font-bold tabular-nums" style={{ color: zorluk.hex }}>
                {sayi(katman.yakalanan)}
              </span>
            </div>
            <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">yakalanan olay</span>
            {katman.aktif && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-green-700 ring-1 ring-inset ring-green-200">
                <span className="size-1.5 rounded-full bg-ok" />
                Aktif
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Kapalıyken ipucu */}
      {!acik && (
        <p className="flex items-center gap-1.5 text-[11px] text-slate-faint">
          <ChevronDown className="size-3" />
          Detay için tıklayın
        </p>
      )}

      {/* Drill-down detay — tıklayınca açılır */}
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div
            initial={azHareket ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={azHareket ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: azHareket ? 0 : 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-3 border-t border-line pt-3">
              {/* Katmanın yanıtladığı soru */}
              <div className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-muted">
                <Lock className="mt-0.5 size-3 shrink-0 text-slate-faint" />
                <span>
                  <span className="font-medium text-slate-ink">Soru:</span> {katman.soru}
                </span>
              </div>

              {/* Ne yapar */}
              <div className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-slate-muted">
                <HelpCircle className="mt-0.5 size-3.5 shrink-0 text-slate-faint" />
                <span>
                  <span className="font-medium text-slate-ink">Ne yapar:</span> {tanim.aciklama}
                </span>
              </div>

              {/* Nasıl çalışır */}
              <div className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-slate-muted">
                <Cpu className="mt-0.5 size-3.5 shrink-0 text-slate-faint" />
                <span>
                  <span className="font-medium text-slate-ink">Nasıl çalışır:</span> {tanim.nasil}
                </span>
              </div>

              {/* Bu katmanın trafik üstündeki etkisi — gerçek sayaçlar */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-line bg-surface px-2.5 py-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-[9.5px] font-medium uppercase tracking-wide text-slate-faint">
                    <Target className="size-3" /> Kapsama
                  </div>
                  <div className="mt-1 text-[16px] font-bold leading-none tabular-nums" style={{ color: zorluk.hex }}>
                    %{kapsama}
                  </div>
                </div>
                <div className="rounded-lg border border-line bg-surface px-2.5 py-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-[9.5px] font-medium uppercase tracking-wide text-slate-faint">
                    <ShieldAlert className="size-3" /> Yakalanan
                  </div>
                  <div className="mt-1 text-[16px] font-bold leading-none tabular-nums text-slate-ink">
                    {sayi(katman.yakalanan)}
                  </div>
                </div>
                <div className="rounded-lg border border-line bg-surface px-2.5 py-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-[9.5px] font-medium uppercase tracking-wide text-slate-faint">
                    <Activity className="size-3" /> Etkilemedi
                  </div>
                  <div className="mt-1 text-[16px] font-bold leading-none tabular-nums text-slate-muted">
                    {sayi(gecen)}
                  </div>
                </div>
              </div>
              <p className="text-[10.5px] leading-relaxed text-slate-faint">
                Gözlemlenen {sayi(toplamOlay)} olayın {sayi(katman.yakalanan)} tanesi bu katmanı tetikledi;
                geri kalanı diğer katmanlara bırakıldı (defense-in-depth).
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== Ana bileşen */

export function SavunmaKatmanlariBolumu({ savunma, azHareket }: { savunma: SavunmaGenel; azHareket: boolean }) {
  const { katmanlar, saglik, ortDerinlik, toplamYakalanan, toplamOlay, gercekVeri } = savunma;
  const aktifSayi = katmanlar.filter((k) => k.aktif).length;
  // Açık drill-down katmanı (katman id) — null = hepsi kapalı.
  const [acikId, setAcikId] = useState<KatmanId | null>(null);
  const saglikTon: "danger" | "ok" | "ink" = saglik >= 80 ? "ok" : saglik >= 55 ? "ink" : "danger";
  const saglikRozet: "yesil" | "sari" | "kirmizi" = saglik >= 80 ? "yesil" : saglik >= 55 ? "sari" : "kirmizi";

  // Radar profili — her katmanın kapsaması bir eksen (çok-eksenli etkinlik profili).
  const radarEksenler = katmanlar.map((k) => ({
    etiket: KATMAN_TANIM[k.id].kisaAd,
    deger: Math.max(0, Math.min(100, Math.round(k.kapsama))),
  }));

  return (
    <Bolum azHareket={azHareket}>
      <Panel
        baslik={<BaslikIkon ikon={Layers} metin="Çok-Katmanlı Savunma Derinliği" />}
        sagUst={
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-faint">{aktifSayi}/{katmanlar.length} katman aktif</span>
            <Badge ton={saglikRozet}>
              <ShieldCheck className="size-3" />
              Sağlık %{saglik}
            </Badge>
          </div>
        }
      >
        {/* Açıklama — kilit fikir (defense-in-depth) */}
        <p className="-mt-1 mb-4 max-w-2xl text-[13px] leading-relaxed text-slate-muted">
          Tek bir savunma atlatılabilir — Veylify, birbirinden bağımsız{" "}
          <span className="font-medium text-slate-ink">{katmanlar.length} katmanı</span> üst üste koyar
          (defense-in-depth). Bir bot bir katmanı geçse bir sonraki onu yakalar; hepsini aynı anda
          atlatmak neredeyse imkânsızdır. Aşağıda her katmanın gözlemlenen trafikteki kapsaması
          gösteriliyor.
          {!gercekVeri && (
            <span className="text-slate-faint">
              {" "}(Sayaçlar gözlemlenen trafikten çıkarımsaldır.)
            </span>
          )}
        </p>

        {/* Üst özet: savunma sağlığı halkası + derinlik/kapsama hapları */}
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas/40 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <SaglikHalka saglik={saglik} azHareket={azHareket} />
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-faint">
                Savunma sağlığı
              </div>
              <div className={cn("mt-0.5 text-[15px] font-semibold", saglikTon === "danger" ? "text-danger2" : saglikTon === "ok" ? "text-ok" : "text-slate-ink")}>
                {saglik >= 80 ? "Katmanlı savunma sağlam" : saglik >= 55 ? "Savunma çalışıyor" : "Derinlik zayıf — dikkat"}
              </div>
              <p className="mt-0.5 max-w-[240px] text-[11.5px] leading-relaxed text-slate-muted">
                {katmanlar.length} entegre katman + ortalama katman-derinliği bonusu.
              </p>
            </div>
          </div>

          {/* Ayırıcı + derinlik göstergeleri — büyük ferah sayılar */}
          <div className="grid flex-1 grid-cols-3 gap-3 sm:border-l sm:border-line sm:pl-4">
            <div className="rounded-xl border border-line bg-surface px-3 py-3 text-center">
              <div className="text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">Ort. derinlik</div>
              <div className="mt-1 text-[22px] font-bold leading-none num text-slate-ink">
                {ortDerinlik.toLocaleString("tr-TR")}×
              </div>
              <div className="mt-0.5 text-[10.5px] text-slate-faint">katman/tehdit</div>
            </div>
            <div className="rounded-xl border border-line bg-surface px-3 py-3 text-center">
              <div className="text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">Yakalanan</div>
              <div className={cn("mt-1 text-[22px] font-bold leading-none num", toplamYakalanan > 0 ? "text-danger2" : "text-ok")}>
                {sayi(toplamYakalanan)}
              </div>
              <div className="mt-0.5 text-[10.5px] text-slate-faint">/ {sayi(toplamOlay)} olay</div>
            </div>
            <div className="rounded-xl border border-line bg-surface px-3 py-3 text-center">
              <div className="text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">Aktif</div>
              <div className="mt-1 text-[22px] font-bold leading-none num text-brand-600">
                {aktifSayi}/{katmanlar.length}
              </div>
              <div className="mt-0.5 text-[10.5px] text-slate-faint">katman canlı</div>
            </div>
          </div>
        </div>

        {/* GÖRSEL PANEL: radar profili + derinlik anlatısı */}
        <div className="mt-4 grid gap-3 lg:grid-cols-5">
          {/* Radar — çok-eksenli etkinlik profili */}
          <div className="flex flex-col items-center rounded-2xl border border-line bg-canvas/40 p-4 lg:col-span-2">
            <div className="mb-1 flex w-full items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-faint">
              <Radar className="size-3" />
              Katman etkinlik profili
            </div>
            <RadarGrafik eksenler={radarEksenler} boyut={210} renk="#2f6fed" />
            <p className="mt-1 text-center text-[11px] leading-snug text-slate-muted">
              Her eksen bir katmanın trafik kapsamasıdır — dengeli profil güçlü derinlik demektir.
            </p>
          </div>

          {/* Derinlik anlatısı — ferah metin bloğu */}
          <div className="flex flex-col justify-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-5 lg:col-span-3">
            <div className="flex items-center gap-2 text-brand-700">
              <GaugeIkon className="size-5" />
              <span className="text-[13px] font-semibold uppercase tracking-wide">Katman-derinliği etkisi</span>
            </div>
            <p className="text-[26px] font-bold leading-tight text-brand-800">
              Bir tehdit ortalama{" "}
              <span className="tabular-nums">{ortDerinlik.toLocaleString("tr-TR")} katman</span>{" "}
              tarafından aynı anda yakalanıyor.
            </p>
            <p className="max-w-md text-[13px] leading-relaxed text-brand-800/80">
              Üst üste binen bu bağımsız katmanlar tek-nokta atlatmayı etkisiz kılar: bir bot birini
              geçse bir sonraki onu yakalar. Hepsini aynı anda atlatmak neredeyse imkânsızdır.
            </p>
          </div>
        </div>

        {/* 4 KATMAN — durum kartı ızgarası (dikey-bar yığını değil) */}
        <div className="mt-4">
          <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-faint">
            <Boxes className="size-3.5" />
            Savunma katmanları — her katmanın bağımsız durumu
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {katmanlar.map((k, i) => (
              <Bolum key={k.id} azHareket={azHareket} gecikme={azHareket ? 0 : 0.05 + i * 0.05}>
                <KatmanKart
                  katman={k}
                  sira={i + 1}
                  toplamOlay={toplamOlay}
                  azHareket={azHareket}
                  acik={acikId === k.id}
                  onToggle={() => setAcikId(acikId === k.id ? null : k.id)}
                />
              </Bolum>
            ))}
          </div>
        </div>

        {/* Zorluk lejantı */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] text-slate-faint">
          <span className="font-medium uppercase tracking-wide">Atlatma zorluğu:</span>
          {(["orta", "yuksek", "kritik"] as SavunmaKatman["zorluk"][]).map((z) => {
            const t = ZORLUK_TANIM[z];
            return (
              <span key={z} className="inline-flex items-center gap-1.5 text-slate-muted">
                <span className="size-2.5 rounded-full" style={{ background: t.hex }} />
                {t.etiket}
              </span>
            );
          })}
          <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-slate-muted">
            <Radio className="size-3.5 text-slate-faint" />
            Katmanlar bağımsız — hepsini birden atlatmak gerekir
          </span>
        </div>
      </Panel>
    </Bolum>
  );
}
