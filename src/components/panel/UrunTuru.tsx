"use client";

/**
 * Specter — Ürün Turu (interaktif panel gezisi)
 * =============================================
 * Appcues/Intro.js/Userpilot seviyesi spotlight walkthrough. İlk kullanıcıya
 * panelin hangi modülünün ne işe yaradığını "karartılmış overlay + hedefe
 * spotlight deliği + açıklama balonu" ile tanıtır.
 *
 * Bu, GenelBakisIstemci içindeki OnboardingKart'tan (5 adımlı KURULUM sihirbazı)
 * FARKLIDIR: bu bir panel GEZİSİdir (modül tanıtımı), kurulum değil. İkisi
 * çakışmasın diye tur yalnızca bir kez (localStorage `specter_tur_tamam`) ve
 * onboarding kartının ÜSTÜNDE (z-index) gösterilir.
 *
 * Tetikleme:
 *   - İlk açılış: localStorage'da `specter_tur_tamam` yoksa kısa gecikmeyle başlar.
 *   - Elle: `window.dispatchEvent(new CustomEvent("specter-tur-baslat"))`
 *     (komut paleti / ayarlar bu event'i gönderebilir — komut paletine DOKUNMADIK).
 *
 * Hedefleme: mümkün olduğunca CSS href-seçici (`a[href="/panel/trafik"]`) —
 * Sidebar/Topbar mantığına HİÇ dokunmadan hedefliyoruz. Hedef bulunamazsa adım
 * zarifçe merkez-modal olarak gösterilir.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowLeft, X, Check, Sparkles, PartyPopper } from "lucide-react";
import { cn } from "@/lib/cn";

const TUR_ANAHTAR = "specter_tur_tamam";
const TUR_EVENT = "specter-tur-baslat";

/** Bir tur adımı. `sec` verilirse o DOM elemanı hedeflenir; yoksa merkez modal. */
interface TurAdim {
  anahtar: string;
  baslik: string;
  metin: string;
  /** Hedef CSS seçicisi (href-seçici tercih). Yoksa/eşleşmezse merkez gösterilir. */
  sec?: string;
  /** true → hedef olsa bile merkez modal (hoş geldin / bitiş). */
  merkez?: boolean;
  /** Bitiş adımı: "Bitir" + isteğe bağlı CTA linki. */
  cta?: { ad: string; href: string };
}

const ADIMLAR: TurAdim[] = [
  {
    anahtar: "hosgeldin",
    baslik: "Veylify'a hoş geldin",
    metin: "60 saniyede paneli tanıyalım. Botlara ve AI ajanlarına karşı savunmanı buradan yöneteceksin. Hazırsan başlayalım.",
    merkez: true,
  },
  {
    anahtar: "genel",
    baslik: "Genel Bakış & menü",
    metin: "Soldaki menüden tüm modüllere erişirsin. Bu logo seni her zaman Genel Bakış'a — savunmanın özet ekranına — geri getirir.",
    sec: 'aside a[href="/panel"]',
  },
  {
    anahtar: "trafik",
    baslik: "Canlı Trafik",
    metin: "Her doğrulama isteği burada gerçek zamanlı akar: insan mı, bot mu, hangi ülkeden ve hangi kararla. Saldırıyı anında görürsün.",
    sec: 'aside a[href="/panel/trafik"]',
  },
  {
    anahtar: "ai",
    baslik: "AI Ajan İstihbaratı",
    metin: "Veylify'ın ana vaadi: GPTBot, Claude, Perplexity gibi AI botlarını tanı ve her biri için izin ver / doğrula / engelle politikası belirle.",
    sec: 'aside a[href="/panel/ai-ajanlar"]',
  },
  {
    anahtar: "kurallar",
    baslik: "Kurallar",
    metin: "Bot trafiğini önceliğe göre yönet: kural motorunda engelle, doğrulamaya zorla veya izin ver. Hazır şablonlarla saniyede başlarsın.",
    sec: 'aside a[href="/panel/kurallar"]',
  },
  {
    anahtar: "kurulum",
    baslik: "Kurulum Sihirbazı",
    metin: "En hızlı yol: adım adım kurulum sihirbazı. Site ekle, alan adını doğrula, kopyala-yapıştır entegrasyon kodunu al ve API anahtarını oluştur — hepsi tek ekranda, ilerlemen canlı işaretlenir.",
    sec: 'aside a[href="/panel/onboarding"]',
  },
  {
    anahtar: "gelistirici",
    baslik: "Geliştirici & API anahtarları",
    metin: "Sunucu tarafı doğrulama için gizli API anahtarını (sk_live_…) buradan üretirsin. Anahtarı yalnızca sunucuda tut; SDK ve /api/v1/siteverify örnekleri hazır.",
    sec: 'aside a[href="/panel/gelistirici"]',
  },
  {
    anahtar: "komut",
    baslik: "Komut paleti",
    metin: "İstediğin an ⌘K (Windows'ta Ctrl+K) ile komut paletini aç; her modüle, her eyleme klavyeden saniyede ulaş. Bu turu da oradan (\"Ürün turunu başlat\") istediğin an yeniden açabilirsin.",
    merkez: true,
  },
  {
    anahtar: "bitis",
    baslik: "Hazırsın! 🎉",
    metin: "Paneli tanıdın. Şimdi kurulum sihirbazından ilk siteni oluşturarak korumayı canlıya al — turu istediğin zaman komut paletinden yeniden başlatabilirsin.",
    merkez: true,
    cta: { ad: "Kuruluma başla", href: "/panel/onboarding" },
  },
];

/** Hedef dikdörtgeni (viewport koordinatları) + görünürlük. */
interface HedefKutu {
  ust: number;
  sol: number;
  gen: number;
  yuk: number;
}

export function UrunTuru() {
  const [aktif, setAktif] = useState(false);
  const [idx, setIdx] = useState(0);
  const [hedef, setHedef] = useState<HedefKutu | null>(null);
  // İlk-kez NAZİK davet (köşe kartı). Zorla tam-ekran modal AÇMAK yerine küçük bir
  // "Paneli tanıtayım mı?" kartı gösterir → dashboard hiç kapanmaz, kullanıcı ister
  // başlatır ister kapatır. Bir kez kapatılınca (localStorage) bir daha çıkmaz.
  const [davet, setDavet] = useState(false);
  // Hareket azaltma tercihi (erişilebilirlik).
  const azalt = useHareketAzalt();
  const overlayRef = useRef<HTMLDivElement>(null);
  const kapatBtnRef = useRef<HTMLButtonElement>(null);

  const adim = ADIMLAR[idx];
  const sonMu = idx === ADIMLAR.length - 1;
  const ilkMi = idx === 0;

  // ---- Turu başlat / bitir ----
  const basla = useCallback(() => {
    setIdx(0);
    setAktif(true);
  }, []);

  const bitir = useCallback((tamamlandiOlarakIsaretle = true) => {
    setAktif(false);
    setHedef(null);
    if (tamamlandiOlarakIsaretle) {
      try {
        localStorage.setItem(TUR_ANAHTAR, "1");
      } catch {
        /* sessiz */
      }
    }
  }, []);

  // ---- İlk açılışta NAZİK davet göster (zorla modal AÇMA) ----
  // Eskiden 700ms sonra tam-ekran modal açılıp dashboard'ı kapatıyordu. Artık
  // sadece küçük bir köşe kartı beliriyor; tur yalnızca kullanıcı "Evet" derse
  // başlar. Böylece kullanıcı gerçek dashboard'ını hemen görür.
  useEffect(() => {
    let zamanlayici: ReturnType<typeof setTimeout> | null = null;
    try {
      if (localStorage.getItem(TUR_ANAHTAR) !== "1") {
        zamanlayici = setTimeout(() => setDavet(true), 900);
      }
    } catch {
      /* sessiz — localStorage yoksa tur gösterme */
    }
    return () => {
      if (zamanlayici) clearTimeout(zamanlayici);
    };
  }, []);

  // Daveti kalıcı kapat (bir daha gösterme) — turu tamamlanmış say.
  const daveteKapat = useCallback(() => {
    setDavet(false);
    try { localStorage.setItem(TUR_ANAHTAR, "1"); } catch { /* sessiz */ }
  }, []);
  // Davetten turu başlat.
  const davettenBasla = useCallback(() => {
    setDavet(false);
    basla();
  }, [basla]);

  // ---- Elle tetikleme event'ini dinle (komut paleti / ayarlar) ----
  useEffect(() => {
    const onBaslat = () => basla();
    window.addEventListener(TUR_EVENT, onBaslat);
    return () => window.removeEventListener(TUR_EVENT, onBaslat);
  }, [basla]);

  // ---- Aktif adımın hedefini ölç (ve resize/scroll'da güncelle) ----
  const hedefOlc = useCallback(() => {
    if (!adim || adim.merkez || !adim.sec) {
      setHedef(null);
      return;
    }
    const el = document.querySelector(adim.sec) as HTMLElement | null;
    if (!el) {
      // Hedef bulunamadı → zarifçe merkez modal.
      setHedef(null);
      return;
    }
    const r = el.getBoundingClientRect();
    // Ekran dışındaysa görünür kısma kaydır.
    if (r.top < 0 || r.bottom > window.innerHeight) {
      el.scrollIntoView({ block: "center", behavior: azalt ? "auto" : "smooth" });
    }
    const r2 = el.getBoundingClientRect();
    const pad = 8;
    setHedef({
      ust: r2.top - pad,
      sol: r2.left - pad,
      gen: r2.width + pad * 2,
      yuk: r2.height + pad * 2,
    });
  }, [adim, azalt]);

  useLayoutEffect(() => {
    if (!aktif) return;
    hedefOlc();
    // Kaydırma/yeniden boyutlandırmada hedefi takip et.
    const el = document.scrollingElement || window;
    window.addEventListener("resize", hedefOlc);
    window.addEventListener("scroll", hedefOlc, true);
    void el;
    return () => {
      window.removeEventListener("resize", hedefOlc);
      window.removeEventListener("scroll", hedefOlc, true);
    };
  }, [aktif, hedefOlc]);

  // ---- Klavye: ← → gezinme, Esc atla, Home/End ----
  useEffect(() => {
    if (!aktif) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        bitir(true); // Esc = atla (tamamlandı say, bir daha gösterme)
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setIdx((i) => Math.min(ADIMLAR.length - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aktif, bitir]);

  // ---- Scroll kilidi + focus yönetimi ----
  useEffect(() => {
    if (!aktif) return;
    const eskiOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Açılışta kapat butonuna odak (tuzak basit: overlay içinde kalır).
    const t = setTimeout(() => kapatBtnRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = eskiOverflow;
      clearTimeout(t);
    };
  }, [aktif]);

  const ileri = useCallback(() => {
    if (sonMu) bitir(true);
    else setIdx((i) => Math.min(ADIMLAR.length - 1, i + 1));
  }, [sonMu, bitir]);

  const geri = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);

  // Balon konumu: hedef varsa yanına/altına, yoksa merkeze.
  const balonStil = useBalonKonum(hedef, adim?.merkez ?? false);

  // ---- Nazik ilk-kez daveti (tur aktif değilken) ----
  if (!aktif && davet) {
    return (
      <div
        role="dialog"
        aria-label="Panel turu daveti"
        className={cn(
          "fixed bottom-5 right-5 z-[240] w-[min(92vw,340px)] rounded-3xl border border-line bg-surface p-4 shadow-lift",
          !azalt && "animate-fade-up",
        )}
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Sparkles className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold text-slate-ink">Paneli tanıtayım mı?</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-muted">
              60 saniyede modülleri gezelim — botlara ve AI ajanlarına karşı savunmanı nasıl yöneteceğini göstereyim.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={davettenBasla}
                className="flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-ink-800"
              >
                Turu başlat <ArrowRight className="size-3.5" />
              </button>
              <button
                onClick={daveteKapat}
                className="rounded-full px-3 py-2 text-[13px] font-medium text-slate-muted transition hover:text-slate-ink"
              >
                Şimdi değil
              </button>
            </div>
          </div>
          <button
            onClick={daveteKapat}
            aria-label="Kapat"
            className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-faint transition hover:bg-canvas hover:text-slate-ink"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!aktif || !adim) return null;

  const merkezModal = adim.merkez || !hedef;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Ürün turu — ${adim.baslik}`}
      className="fixed inset-0 z-[250]"
    >
      {/* Karartılmış overlay + spotlight deliği (SVG mask). Hedef yoksa düz karartma. */}
      <TurOrtu hedef={merkezModal ? null : hedef} azalt={azalt} onClick={() => bitir(true)} />

      {/* Hedef çerçevesi (spotlight kenar vurgusu) */}
      {!merkezModal && hedef && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none fixed rounded-2xl ring-2 ring-brand-500 ring-offset-2 ring-offset-transparent",
            !azalt && "transition-all duration-300 ease-out",
          )}
          style={{
            top: hedef.ust,
            left: hedef.sol,
            width: hedef.gen,
            height: hedef.yuk,
            boxShadow: "0 0 0 3px rgba(47,111,237,0.25)",
          }}
        />
      )}

      {/* Açıklama balonu / merkez modal */}
      <div
        className={cn(
          "fixed z-[251] w-[min(92vw,384px)] rounded-3xl border border-line bg-surface p-5 shadow-lift",
          !azalt && "animate-fade-up",
        )}
        style={balonStil}
      >
        {/* üst: rozet + kapat */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700">
            <Sparkles className="size-3.5" /> Ürün turu
          </span>
          <button
            ref={kapatBtnRef}
            onClick={() => bitir(true)}
            aria-label="Turu kapat"
            className="grid size-7 place-items-center rounded-lg text-slate-faint transition hover:bg-canvas hover:text-slate-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* içerik */}
        <div className="flex items-start gap-3">
          {sonMu && (
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-ink-900 text-white shadow-card">
              <PartyPopper className="size-5" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold text-slate-ink">{adim.baslik}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-muted">{adim.metin}</p>
          </div>
        </div>

        {/* bitiş CTA */}
        {adim.cta && (
          <a
            href={adim.cta.href}
            onClick={() => bitir(true)}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-brand-600 px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-brand-700"
          >
            {adim.cta.ad} <ArrowRight className="size-4" />
          </a>
        )}

        {/* adım noktaları + sayaç */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5" aria-hidden>
            {ADIMLAR.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-1.5 rounded-full transition-all",
                  i === idx ? "w-4 bg-brand-600" : i < idx ? "bg-brand-300" : "bg-line-strong",
                )}
              />
            ))}
          </div>
          <span className="num text-[12px] font-semibold text-slate-faint">
            {idx + 1} / {ADIMLAR.length}
          </span>
        </div>

        {/* kontroller */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={() => bitir(true)}
            className="rounded-full px-3 py-2 text-[13px] font-medium text-slate-muted transition hover:text-slate-ink"
          >
            {sonMu ? "Kapat" : "Atla"}
          </button>
          <div className="flex items-center gap-2">
            {!ilkMi && (
              <button
                onClick={geri}
                className="flex items-center gap-1.5 rounded-full border border-line-strong px-3.5 py-2 text-[13px] font-medium text-slate-ink transition hover:bg-canvas"
              >
                <ArrowLeft className="size-3.5" /> Geri
              </button>
            )}
            <button
              onClick={ileri}
              className="flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-ink-800"
            >
              {sonMu ? (
                <>
                  Bitir <Check className="size-3.5" />
                </>
              ) : (
                <>
                  İleri <ArrowRight className="size-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ TurOrtu
 * Karartılmış overlay. Hedef varsa SVG mask ile o alanda "delik" (spotlight)
 * açar; böylece hedef aydınlık, gerisi karanlık kalır. Tıklama overlay'i
 * kapatır (atla). prefers-reduced-motion'da geçiş yok. */
function TurOrtu({
  hedef,
  azalt,
  onClick,
}: {
  hedef: HedefKutu | null;
  azalt: boolean;
  onClick: () => void;
}) {
  // Delik köşe yarıçapı.
  const rx = 16;
  return (
    <svg
      className="fixed inset-0 h-full w-full"
      onClick={onClick}
      aria-hidden
      style={{ cursor: "pointer" }}
    >
      <defs>
        <mask id="specter-tur-mask">
          {/* Tümü görünür (beyaz) → karartma uygulanır */}
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          {/* Hedef alanı siyah → o alan maskeden çıkar (delik) */}
          {hedef && (
            <rect
              x={hedef.sol}
              y={hedef.ust}
              width={hedef.gen}
              height={hedef.yuk}
              rx={rx}
              ry={rx}
              fill="black"
              className={azalt ? undefined : "transition-all duration-300 ease-out"}
            />
          )}
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(15, 23, 42, 0.55)"
        mask="url(#specter-tur-mask)"
      />
    </svg>
  );
}

/* ---------------------------------------------------------- useBalonKonum
 * Balon konumunu hesaplar: hedef varsa altına (sığmazsa üstüne), sağa
 * hizalar; hedef yoksa/merkez modalsa ekranı ortalar. Viewport sınırlarına
 * kelepçelenir. */
function useBalonKonum(hedef: HedefKutu | null, merkez: boolean): React.CSSProperties {
  return useMemo(() => {
    if (typeof window === "undefined" || merkez || !hedef) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const balonGen = Math.min(384, vw * 0.92);
    const tahminiYuk = 300; // balon yaklaşık yüksekliği
    const bosluk = 14;

    // Dikey: hedefin altına sığıyorsa alta, değilse üste, o da olmazsa yana ortala.
    let top: number;
    const altSigar = hedef.ust + hedef.yuk + bosluk + tahminiYuk < vh;
    if (altSigar) {
      top = hedef.ust + hedef.yuk + bosluk;
    } else if (hedef.ust - bosluk - tahminiYuk > 0) {
      top = hedef.ust - bosluk - tahminiYuk;
    } else {
      top = Math.max(bosluk, (vh - tahminiYuk) / 2);
    }

    // Yatay: hedefin sağ kenarından başla; taşarsa sola kelepçe.
    // Sidebar hedefleri solda olduğu için genelde hedefin sağına yerleşir.
    let left = hedef.sol + hedef.gen + bosluk;
    if (left + balonGen > vw - bosluk) {
      // Sağa sığmıyor → hedefin sol hizasına al, o da taşarsa kelepçe.
      left = Math.min(hedef.sol, vw - balonGen - bosluk);
    }
    left = Math.max(bosluk, left);
    top = Math.max(bosluk, Math.min(top, vh - bosluk - 120));

    return { top, left };
  }, [hedef, merkez]);
}

/* -------------------------------------------------------- useHareketAzalt
 * prefers-reduced-motion: reduce → animasyonları/geçişleri kapat. */
function useHareketAzalt(): boolean {
  const [azalt, setAzalt] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setAzalt(mq.matches);
    const on = () => setAzalt(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return azalt;
}
