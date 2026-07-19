"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll'la uçan clay baykuş — sayfanın TÜM GENİŞLİĞİNDE gezinen karakter.
 *
 *  - VİDEO kendi loop'unda sürekli kanat çırpar (scroll'dan bağımsız).
 *  - KONUM scroll'a göre: baykuş sayfa boyunca soldan-sağa-sola dalgalanan
 *    (sinüs) yatay bir rota + üstten-alta doğru dikey bir rota izler. Yani
 *    sadece sağda değil, ekranın her yerinde gezinir.
 *  - Eğim: hareket yönüne göre hafifçe yatık durur (uçuş hissi).
 *
 * Konum viewport'un sol-üstünden (0,0) itibaren translate ile hesaplanır.
 * Video koşulsuz render edilir; görünürlük CSS ile (lg + reduced-motion).
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

    const GENISLIK = 320; // baykuş kutusu genişliği (xl)
    let suanX = 0, suanY = 0, suanEgim = 0;
    let hedefX = 0, hedefY = 0, hedefEgim = 0;
    let sonX = 0, sonY = 0; // yön (eğim) için önceki konum
    let t = 0;
    let raf = 0;
    let calisiyor = true;

    const hesapla = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const h = document.documentElement;
      const maxScroll = Math.max(1, h.scrollHeight - vh);
      const ilerleme = Math.min(1, Math.max(0, window.scrollY / maxScroll)); // 0..1

      // YATAY: baykuş yalnızca KENAR bantlarında gezinir (sol %6..%26 ve sağ
      // %74..%94) — ekranın ORTASINA hiç gelmez, böylece merkezi içeriğin
      // (ghost-font görseli vb.) üstüne binmez. Sayfa ilerledikçe sol↔sağ geçer.
      const dalga = (Math.sin(ilerleme * Math.PI * 2.5 + Math.PI / 2) + 1) / 2; // 0..1
      // dalga<0.5 → sol bant, dalga>=0.5 → sağ bant (ortayı atla)
      let oran; // ekran genişliğine göre 0..1 sol konum
      if (dalga < 0.5) {
        oran = 0.04 + (dalga / 0.5) * 0.16;          // sol bant: %4..%20
      } else {
        oran = 0.72 + ((dalga - 0.5) / 0.5) * 0.16;  // sağ bant: %72..%88
      }
      hedefX = oran * vw;

      // DİKEY: başlangıçta biraz aşağıda, sayfa boyunca hafifçe iner.
      hedefY = vh * (0.32 + ilerleme * 0.34);
    };

    const dongu = () => {
      if (!calisiyor) return;
      t += 0.02;
      hesapla();

      const idleY = Math.sin(t) * 14;
      // lerp (yumuşak takip)
      suanX += (hedefX - suanX) * 0.07;
      suanY += (hedefY + idleY - suanY) * 0.07;

      // eğim: son harekete göre (sağa giderken hafif sağa yatık)
      const dx = suanX - sonX;
      const dy = suanY - sonY;
      hedefEgim = Math.max(-18, Math.min(18, dx * 1.6 + dy * 0.4));
      suanEgim += (hedefEgim - suanEgim) * 0.08;
      sonX = suanX; sonY = suanY;

      el.style.transform =
        `translate3d(${suanX.toFixed(1)}px, ${suanY.toFixed(1)}px, 0) rotate(${suanEgim.toFixed(1)}deg)`;
      raf = requestAnimationFrame(dongu);
    };

    // başlangıç konumu (ani sıçrama olmasın)
    hesapla();
    suanX = hedefX; suanY = hedefY; sonX = suanX; sonY = suanY;
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
        src="/video/ucan-baykus-v7.webm"
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full overflow-visible drop-shadow-[0_18px_28px_rgba(79,70,229,0.28)]"
      />
    </div>
  );
}
