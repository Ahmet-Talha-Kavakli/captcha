"use client";

import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { landingCeviri, LANDING_VARSAYILAN, type LandingDil } from "@/lib/i18n/landing";

/**
 * Pazarlama görseli — Gemini ile üretilen clay/plastisin WebP görseller
 * (public/pazarlama). Görsellerin arka planı sitenin zemin rengiyle (krem
 * #f4f1ea, ghost-font koyu #1e1b4b) BİREBİR aynı olacak şekilde normalize
 * edildi; bu yüzden çerçeve/kutu YOK — karakter doğrudan sayfaya dikişsiz
 * gömülür. `oran` ile kaplama aspect'i ayarlanır, `object-contain` ile
 * karakter asla kırpılmaz.
 */
export function Gorsel({
  ad,
  alt,
  oran = "16/10",
  className = "",
  oncelik = false,
}: {
  ad: string;
  alt: string;
  /** CSS aspect-ratio (ör. "16/10", "1/1", "16/9"). */
  oran?: string;
  className?: string;
  oncelik?: boolean;
}) {
  return (
    <div className={className} style={{ aspectRatio: oran }}>
      <Image
        src={`/pazarlama/${ad}.webp`}
        alt={alt}
        width={1024}
        height={1024}
        quality={95}
        priority={oncelik}
        sizes="(max-width: 768px) 100vw, 640px"
        className="h-full w-full object-contain"
      />
    </div>
  );
}

/**
 * Landing görselleri — hepsi elle çizilmiş, offline, keskin SVG.
 * Beyaz tema + Veylify indigo/violet marka rengi. Foto-gerçekçi görsel
 * yerine premium vektör illüstrasyon dili (Stripe/Linear kalitesinde).
 */

/* ---------------------------------------------------- Hero: koruma sahnesi
 * İnsan trafiği geçer (yeşil), AI botları kalkanda durur (kırmızı). Sağda
 * canlı bir "karar akışı" görseli — ürünün ne yaptığını tek bakışta anlatır. */
export function HeroGorsel({ dil = LANDING_VARSAYILAN }: { dil?: LandingDil }) {
  const t = (k: string) => landingCeviri(k, dil);
  return (
    <div className="relative">
      {/* zemin ışıması */}
      <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-veylify-100/60 via-violet-100/40 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-3xl border border-veylify-100 bg-white shadow-[0_30px_80px_-30px_rgba(79,70,229,0.35)]">
        {/* pencere çubuğu */}
        <div className="flex items-center gap-2 border-b border-veylify-100/70 bg-veylify-50/50 px-4 py-3">
          <span className="size-3 rounded-full bg-red-300" />
          <span className="size-3 rounded-full bg-amber-300" />
          <span className="size-3 rounded-full bg-emerald-300" />
          <span className="ml-3 rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-veylify-100">
            veylify.com/panel
          </span>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-[1.1fr_1fr]">
          {/* sol: gerçek-zamanlı karar akışı */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-veylify-950">{t("mock.canliKarar")}</span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                {t("mock.canli")}
              </span>
            </div>
            {[
              { ip: "91.10.4.18", tur: t("mock.insan"), karar: "izin", renk: "emerald" },
              { ip: "GPTBot", tur: t("mock.aiAjan"), karar: "engel", renk: "red" },
              { ip: "45.2.9.71", tur: t("mock.insan"), karar: "izin", renk: "emerald" },
              { ip: "ClaudeBot", tur: t("mock.aiAjan"), karar: "engel", renk: "red" },
              { ip: "Scrapy/2.11", tur: t("mock.kaziyici"), karar: "engel", renk: "red" },
              { ip: "77.8.1.30", tur: t("mock.insan"), karar: "izin", renk: "emerald" },
            ].map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-xl border border-veylify-100/80 bg-white px-3 py-2 text-[11.5px]"
                style={{ animation: `zn-slide-in 0.5s ${i * 0.08}s both` }}
              >
                <span className={`size-2 shrink-0 rounded-full ${r.renk === "emerald" ? "bg-emerald-500" : "bg-red-500"}`} />
                <span className="font-mono font-medium text-veylify-950">{r.ip}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{r.tur}</span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    r.renk === "emerald"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {r.karar === "izin" ? t("mock.izinVerildi") : t("mock.engellendi")}
                </span>
              </div>
            ))}
          </div>
          {/* sağ: özet metrik + mini kalkan */}
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-veylify-100 bg-gradient-to-br from-veylify-600 to-violet-600 p-4 text-white">
              <div className="text-[11px] font-medium text-white/70">{t("mock.bugunEngellenen")}</div>
              <div className="mt-1 text-3xl font-bold tabular-nums">12.480</div>
              <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-white/80">
                <span className="rounded-full bg-white/20 px-1.5 py-0.5">↑ %18</span>
                <span>{t("mock.dunden")}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat etiket={t("mock.insanGecti")} deger="%99.4" ton="ok" />
              <MiniStat etiket={t("mock.yanitSuresi")} deger="48ms" ton="brand" />
            </div>
            <MiniSparkKart baslik={t("mock.saatTrafik")} altBaslik={t("mock.insanBot")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ etiket, deger, ton }: { etiket: string; deger: string; ton: "ok" | "brand" }) {
  return (
    <div className="rounded-2xl border border-veylify-100 bg-white p-3">
      <div className="text-[10.5px] font-medium text-slate-400">{etiket}</div>
      <div
        className={`mt-0.5 text-lg font-bold tabular-nums ${
          ton === "ok" ? "text-emerald-600" : "text-veylify-600"
        }`}
      >
        {deger}
      </div>
    </div>
  );
}

function MiniSparkKart({ baslik, altBaslik }: { baslik: string; altBaslik: string }) {
  return (
    <div className="rounded-2xl border border-veylify-100 bg-white p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10.5px] font-medium text-slate-400">{baslik}</span>
        <span className="text-[10px] font-semibold text-veylify-600">{altBaslik}</span>
      </div>
      <div className="flex h-10 items-end gap-1">
        {[40, 55, 45, 70, 60, 80, 65, 90, 75, 95, 85, 100].map((h, i) => (
          <div key={i} className="flex-1 overflow-hidden rounded-sm bg-veylify-100">
            <div
              className="w-full rounded-sm bg-gradient-to-t from-veylify-600 to-violet-500"
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------- Ghost-font demo görseli
 * "İnsan görür, makine göremez" — tek karede gürültü, hareket koheransıyla okunur.
 * Statik SVG olduğu için burada iki kare yan yana: makinenin gördüğü (gürültü) vs
 * insanın algıladığı (net kod). */
export function GhostFontGorsel({ dil = LANDING_VARSAYILAN }: { dil?: LandingDil }) {
  const t = (k: string) => landingCeviri(k, dil);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* makine görüşü — gürültü */}
      <div className="rounded-2xl border border-veylify-100 bg-veylify-950 p-5">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-red-300">
          <span className="size-1.5 rounded-full bg-red-400" /> {t("mock.makineninGordugu")}
        </div>
        <div className="grid grid-cols-12 gap-[3px]">
          {Array.from({ length: 96 }).map((_, i) => (
            <span
              key={i}
              className="aspect-square rounded-[1px]"
              style={{ background: `rgba(199,210,254,${0.08 + ((i * 37) % 20) / 60})` }}
            />
          ))}
        </div>
        <div className="mt-3 text-center text-[11px] font-medium text-red-300/80">
          {t("mock.ocrOkunamadi")}
        </div>
      </div>
      {/* insan görüşü — net */}
      <div className="rounded-2xl border border-veylify-100 bg-veylify-950 p-5">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-400" /> {t("mock.insaninGordugu")}
        </div>
        <div className="flex h-[132px] items-center justify-center rounded-xl bg-veylify-900">
          <span className="font-mono text-4xl font-bold tracking-[0.25em] text-veylify-100">
            7K4Q
          </span>
        </div>
        <div className="mt-3 text-center text-[11px] font-medium text-emerald-300/80">
          {t("mock.insanDogrulama")}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------- Ürün ekran-görüntüsü mockup
 * Tam-genişlik dashboard önizlemesi: sol nav + KPI şeridi + canlı trafik grafiği
 * + karar tablosu. "Ürün gerçekten böyle görünüyor" hissini tek bakışta verir. */
export function UrunEkranGorseli({ dil = LANDING_VARSAYILAN }: { dil?: LandingDil }) {
  const t = (k: string) => landingCeviri(k, dil);
  const kpiler = [
    { e: t("mock.engellenenBot"), d: "48.912", t: "danger" },
    { e: t("mock.insanGecisi"), d: "%99.4", t: "ok" },
    { e: t("mock.aiAjan"), d: "3.204", t: "brand" },
    { e: "Yanıt", d: "46ms", t: "brand" },
  ] as const;
  const barlar = [38, 52, 44, 66, 58, 78, 62, 88, 72, 94, 80, 98, 84, 70];
  const satirlar = [
    { ip: "GPTBot/1.1", tur: t("mock.modelEgitimi"), karar: "engel" },
    { ip: "88.29.4.10", tur: `${t("mock.insan")} · Chrome`, karar: "izin" },
    { ip: "ClaudeBot/1.0", tur: t("mock.modelEgitimi"), karar: "engel" },
    { ip: "Bytespider", tur: t("mock.kaziyici"), karar: "engel" },
    { ip: "45.9.10.2", tur: `${t("mock.insan")} · Safari`, karar: "izin" },
  ] as const;
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-br from-veylify-100/50 via-violet-100/40 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-3xl border border-veylify-100 bg-white shadow-[0_40px_100px_-40px_rgba(79,70,229,0.4)]">
        {/* pencere çubuğu */}
        <div className="flex items-center gap-2 border-b border-veylify-100/70 bg-veylify-50/50 px-4 py-3">
          <span className="size-3 rounded-full bg-red-300" />
          <span className="size-3 rounded-full bg-amber-300" />
          <span className="size-3 rounded-full bg-emerald-300" />
          <span className="ml-3 rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-veylify-100">
            veylify.com/panel/komuta-merkezi
          </span>
        </div>
        <div className="grid grid-cols-[132px_1fr] sm:grid-cols-[160px_1fr]">
          {/* sol nav */}
          <div className="hidden flex-col gap-1 border-r border-veylify-100/70 bg-veylify-50/30 p-3 sm:flex">
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className="grid size-6 place-items-center rounded-lg bg-gradient-to-br from-veylify-600 to-violet-600 text-[11px] font-bold text-white">V</span>
              <span className="text-[12px] font-bold text-veylify-950">Veylify</span>
            </div>
            {["Komuta merkezi", "AI ajanlar", "Kurallar", "Coğrafi risk", "İmza", "Kayıtlı avlar"].map((n, i) => (
              <span
                key={n}
                className={`rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium ${i === 0 ? "bg-veylify-600 text-white" : "text-slate-500"}`}
              >
                {n}
              </span>
            ))}
          </div>
          {/* içerik */}
          <div className="space-y-3 p-4">
            {/* kpi şeridi */}
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {kpiler.map((k) => (
                <div key={k.e} className="rounded-2xl border border-veylify-100 bg-white p-3">
                  <div className="text-[10px] font-medium text-slate-400">{k.e}</div>
                  <div className={`mt-0.5 text-lg font-bold tabular-nums ${k.t === "ok" ? "text-emerald-600" : k.t === "danger" ? "text-red-500" : "text-veylify-600"}`}>
                    {k.d}
                  </div>
                </div>
              ))}
            </div>
            {/* trafik grafiği */}
            <div className="rounded-2xl border border-veylify-100 bg-white p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-veylify-950">{t("mock.gun14Trafik")}</span>
                <span className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-veylify-500" /> insan</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-400" /> bot</span>
                </span>
              </div>
              <div className="flex h-16 items-end gap-1.5">
                {barlar.map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col justify-end gap-0.5">
                    <div className="w-full rounded-sm bg-red-200" style={{ height: `${h * 0.35}%` }} />
                    <div className="w-full rounded-sm bg-gradient-to-t from-veylify-600 to-violet-500" style={{ height: `${h * 0.6}%` }} />
                  </div>
                ))}
              </div>
            </div>
            {/* karar tablosu */}
            <div className="overflow-hidden rounded-2xl border border-veylify-100 bg-white">
              {satirlar.map((r, i) => (
                <div key={i} className={`flex items-center gap-2.5 px-3 py-2 text-[11px] ${i !== satirlar.length - 1 ? "border-b border-veylify-50" : ""}`}>
                  <span className={`size-1.5 shrink-0 rounded-full ${r.karar === "izin" ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className="font-mono font-medium text-veylify-950">{r.ip}</span>
                  <span className="hidden text-slate-400 sm:inline">·</span>
                  <span className="hidden text-slate-500 sm:inline">{r.tur}</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[9.5px] font-semibold ${r.karar === "izin" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {r.karar === "izin" ? t("mock.izinVerildi") : t("mock.engellendi")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- AI-şirket marka işaretleri
 * Her AI operatörünün gerçek, tanınır logo işareti (küçük mono/renkli inline
 * SVG). Kamuya açık teknoloji markalarının tanımlayıcı işaretleridir. */
type BotLogoProps = { className?: string };

function OpenAILogo({ className = "" }: BotLogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="#000000">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

function ClaudeLogo({ className = "" }: BotLogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="#D97757">
      <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.004 2.234 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.729-.82.85-.904.547-.431h1.033l.76 1.130-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.607.213-.668-.122-1.372-1.925-1.415-2.167-1.14-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.462-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312z" />
    </svg>
  );
}

function GoogleGLogo({ className = "" }: BotLogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.55-5.17 3.55-8.87z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function TikTokLogo({ className = "" }: BotLogoProps) {
  // ByteDance/TikTok nota işareti (Bytespider tarayıcısı ByteDance'e ait).
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="#010101">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function PerplexityLogo({ className = "" }: BotLogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="#20808D">
      <path d="M22.398 12.019v6.354l-1.618 1.36v-5.11l-4.518 4.11h-3.483v3.86h-1.559v-3.86H7.738l-4.518-4.11v5.11l-1.618-1.36v-6.354l1.618-1.361v5.111l4.518-4.11h3.483V2.298l-4.892 4.45-1.058-1.164L11.996 0l6.727 5.585-1.059 1.163-4.892-4.45v9.36h3.483l4.518 4.11v-5.111l1.625 1.362z" />
    </svg>
  );
}

function AmazonBotLogo({ className = "" }: BotLogoProps) {
  return (
    <svg viewBox="0 0 26 16" className={className} aria-hidden fill="#FF9900">
      <path d="M15.93 12.2C13.66 13.86 10.38 14.75 7.55 14.75c-3.96 0-7.53-1.46-10.23-3.9-.21-.19-.02-.45.24-.3 2.9 1.69 6.5 2.7 10.2 2.7 2.52 0 5.28-.52 7.83-1.6.39-.16.71.25.34.55z" transform="translate(3 0)" />
      <path d="M17.98 11.03c-.29-.37-1.93-.18-2.67-.09-.22.03-.26-.17-.06-.31 1.31-.92 3.46-.66 3.71-.35.25.31-.07 2.47-1.3 3.5-.19.16-.37.07-.29-.14.28-.7.9-2.26.61-2.61z" transform="translate(3 0)" />
    </svg>
  );
}

function MetaBotLogo({ className = "" }: BotLogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#0082FB" d="M6.897 4c1.915 0 3.516 1.442 4.68 3.109.643-.804 1.33-1.472 2.063-1.977C14.762 4.415 15.826 4 16.906 4c3.462 0 5.892 3.626 6.056 8.516.048 1.437-.115 2.816-.475 4.023-.371 1.244-.932 2.196-1.665 2.831-.68.589-1.475.887-2.312.887-1.017 0-1.784-.375-2.573-1.532-.596-.874-1.209-2.055-1.985-3.556l-.849-1.64c-.03-.058-.06-.115-.09-.171-.615.982-1.192 1.916-1.737 2.723-1.305 1.933-2.42 3.176-4.19 3.176-1.66 0-2.986-.983-3.517-2.94-.343-1.263-.492-2.868-.443-4.407C2.751 7.482 5.108 4 6.897 4Zm.28 2.407c-.892 0-2.174 2.01-2.174 4.94 0 1.02.148 1.926.383 2.673.2.634.508 1.077.913 1.077.406 0 .766-.28 1.312-1.06.435-.622 1.064-1.632 1.72-2.68l.53-.85c-.858-1.44-1.65-2.605-2.28-3.288-.464-.503-.891-.812-1.404-.812Zm9.548 0c-.564 0-1.03.244-1.548.744-.487.472-1.03 1.191-1.634 2.121l.62 1.03c.626 1.043 1.315 2.238 1.995 3.238.708 1.043 1.106 1.291 1.632 1.291.505 0 .81-.442.995-1.02.234-.73.343-1.72.284-2.788-.164-3.05-1.238-4.616-2.344-4.616Z" />
    </svg>
  );
}

function CommonCrawlLogo({ className = "" }: BotLogoProps) {
  // CCBot = Common Crawl. Jenerik ama temiz mono tarayıcı-bot ikonu.
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="#1A1A18" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="16" height="11" rx="2.5" />
      <path d="M12 4v4M8 2.8l1.2 1.6M16 2.8l-1.2 1.6" />
      <circle cx="9" cy="13" r="1.1" fill="#1A1A18" stroke="none" />
      <circle cx="15" cy="13" r="1.1" fill="#1A1A18" stroke="none" />
      <path d="M9.5 16.3h5" />
    </svg>
  );
}

/* ---------------------------------------------------- AI-ajan koruması görseli
 * Merkezde kalkan; çevresinde bilinen AI operatör düğümleri (gerçek marka
 * işareti + ad). Bağlantı çizgileri kalkanda "engellendi/doğrulandı" olur. */
export function AiAjanKoruma({ dil = LANDING_VARSAYILAN }: { dil?: LandingDil }) {
  const t = (k: string) => landingCeviri(k, dil);
  const ajanlar: { ad: string; Logo: (p: BotLogoProps) => React.ReactElement; durum: string }[] = [
    { ad: "GPTBot", Logo: OpenAILogo, durum: "engel" },
    { ad: "ClaudeBot", Logo: ClaudeLogo, durum: "engel" },
    { ad: "Google-Ext.", Logo: GoogleGLogo, durum: "dogrula" },
    { ad: "Bytespider", Logo: TikTokLogo, durum: "engel" },
    { ad: "PerplexityBot", Logo: PerplexityLogo, durum: "dogrula" },
    { ad: "Amazonbot", Logo: AmazonBotLogo, durum: "dogrula" },
    { ad: "meta-agent", Logo: MetaBotLogo, durum: "engel" },
    { ad: "CCBot", Logo: CommonCrawlLogo, durum: "engel" },
  ];
  const ton = (d: string) =>
    d === "engel"
      ? { r: "bg-red-50 text-red-600 ring-red-100", et: t("mock.engellendi") }
      : { r: "bg-amber-50 text-amber-700 ring-amber-100", et: "Doğrulandı" };
  return (
    <div className="relative overflow-hidden rounded-3xl border border-veylify-100 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(79,70,229,0.35)] sm:p-8">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-0 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-veylify-100/60 to-violet-100/40 blur-3xl" />
      {/* merkez kalkan */}
      <div className="relative mx-auto mb-6 flex w-fit flex-col items-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-veylify-600 to-violet-600 text-white shadow-[0_16px_40px_-16px_rgba(79,70,229,0.7)]">
          <ShieldCheck className="size-8" />
        </span>
        <span className="mt-2 rounded-full bg-veylify-50 px-3 py-1 text-[11px] font-semibold text-veylify-700 ring-1 ring-veylify-100">
          Veylify koruma katmanı
        </span>
      </div>
      {/* ajan düğümleri */}
      <div className="relative grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {ajanlar.map((a) => {
          const t = ton(a.durum);
          return (
            <div key={a.ad} className="flex flex-col items-center gap-2 rounded-2xl border border-veylify-100 bg-white/80 p-3 text-center backdrop-blur">
              <span className="grid size-9 place-items-center rounded-xl bg-white ring-1 ring-veylify-100 shadow-sm">
                <a.Logo className="size-5" />
              </span>
              <span className="truncate text-[11.5px] font-semibold text-veylify-950">{a.ad}</span>
              <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ring-1 ${t.r}`}>{t.et}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------- Dekoratif ızgara arka plan */
export function IzgaraArka({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 -z-10 h-full w-full ${className}`}
      aria-hidden
    >
      <defs>
        <pattern id="zn-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0H0V48" fill="none" stroke="#e0e7ff" strokeWidth="1" />
        </pattern>
        <radialGradient id="zn-fade" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#zn-grid)" />
      <rect width="100%" height="100%" fill="url(#zn-fade)" />
    </svg>
  );
}
