"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll'la uçan clay baykuş — sayfada PÜRÜZSÜZ gezinen karakter.
 *
 *  - VİDEO kendi loop'unda sürekli kanat çırpar (scroll'dan bağımsız).
 *  - KONUM scroll'a göre TEK SÜREKLİ eğrisel rota izler: yatayda yumuşak bir
 *    sinüs (soldan-sağa-sola), dikeyde üstten alta doğru. Ani sıçrama/atlama
 *    YOK (eski "bant geçişi" sıçraması kaldırıldı). Kenarlara taşmaz.
 *  - Konum lerp ile yumuşatılır; her karede küçük adım → akıcı, atlamasız.
 *
 * Yalnız lg+ ekran + reduced-motion kapalıysa görünür. pointer-events yok.
 */
export function UcanBaykus() {
  const ref = useRef<HTMLDivElement>(null);
  const [gizli, setGizli] = useState(false);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const kucuk = window.matchMedia("(max-width: 1023px)");
    const guncelleGorunur = () => setGizli(rm.matches || kucuk.matches);
    guncelleGorunur();
    rm.addEventListener("change", guncelleGorunur);
    kucuk.addEventListener("change", guncelleGorunur);

    const el = ref.current;
    if (!el) {
      return () => {
        rm.removeEventListener("change", guncelleGorunur);
        kucuk.removeEventListener("change", guncelleGorunur);
      };
    }

    const GENISLIK = 320;    // baykuş kutusu genişliği (xl)
    const KENAR = 32;        // ekran kenar boşluğu (kenara yapışmasın)

    let suanX = 0, suanY = 0, suanEgim = 0;
    let hedefX = 0, hedefY = 0;
    let oncekiX = 0;
    let t = 0;
    let raf = 0;
    let calisiyor = true;

    const hesapla = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const h = document.documentElement;
      const maxScroll = Math.max(1, h.scrollHeight - vh);
      const ilerleme = Math.min(1, Math.max(0, window.scrollY / maxScroll)); // 0..1

      // YATAY: TEK sürekli sinüs. Başlangıçta (scroll=0) SAĞ tarafta durur
      // (hero görselinin olduğu boş alan) → sol yazıyı kapatmaz. cos → 0'da +1.
      const genislikAlani = vw - GENISLIK - KENAR * 2;
      const dalga = (Math.cos(ilerleme * Math.PI * 2) + 1) / 2; // 0..1, 0'da 1 (sağ)
      const oran = 0.07 + dalga * 0.86; // 0.07..0.93 (kenara dayanmaz)
      hedefX = KENAR + oran * genislikAlani;

      // DİKEY: başlangıçta EKRAN ORTASINDA (hero başlığının hizasında değil,
      // görselin olduğu bantta), sayfa boyunca yumuşak iniş.
      hedefY = vh * (0.34 + ilerleme * 0.42);
    };

    const dongu = () => {
      if (!calisiyor) return;
      t += 0.02;
      hesapla();

      // idle süzülme (dururken bile hafif canlı)
      const idleY = Math.sin(t) * 10;

      // lerp — düşük katsayı = daha yumuşak, atlamasız takip. Aynı katsayı her
      // eksen → tutarlı hız, ani sıçrama olmaz.
      suanX += (hedefX - suanX) * 0.055;
      suanY += (hedefY + idleY - suanY) * 0.055;

      // eğim: yatay hıza göre hafif yatıklık (uçuş hissi), sınırlı + yumuşak.
      const hiz = suanX - oncekiX;
      oncekiX = suanX;
      const hedefEgim = Math.max(-12, Math.min(12, hiz * 2.2));
      suanEgim += (hedefEgim - suanEgim) * 0.06;

      el.style.transform =
        `translate3d(${suanX.toFixed(1)}px, ${suanY.toFixed(1)}px, 0) rotate(${suanEgim.toFixed(1)}deg)`;
      raf = requestAnimationFrame(dongu);
    };

    // başlangıç konumu — ani sıçrama olmasın (hedefe eşitle)
    hesapla();
    suanX = hedefX; suanY = hedefY; oncekiX = suanX;
    raf = requestAnimationFrame(dongu);

    return () => {
      calisiyor = false;
      rm.removeEventListener("change", guncelleGorunur);
      kucuk.removeEventListener("change", guncelleGorunur);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none fixed left-0 top-0 z-40 w-[280px] overflow-visible will-change-transform xl:w-[320px] ${
        gizli ? "hidden" : "hidden lg:block"
      }`}
    >
      <video
        src="/video/ucan-baykus-v8.webm"
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full overflow-visible drop-shadow-[0_18px_28px_rgba(79,70,229,0.28)]"
      />
    </div>
  );
}
