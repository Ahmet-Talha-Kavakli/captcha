/**
 * useOdakTuzak — erişilebilir diyalog/çekmece için odak tuzağı (focus-trap).
 *
 * WCAG 2.1.2 (No Keyboard Trap — tersi: modal AÇIKKEN odak modal İÇİNDE kalmalı)
 * ve 2.4.3 (Focus Order). Bir modal/drawer açıldığında:
 *   1) o anki odaklı öğeyi hatırlar,
 *   2) modal içindeki ilk odaklanabilir öğeye odağı taşır,
 *   3) Tab / Shift+Tab ile odağın modal dışına kaçmasını engeller (döngüler),
 *   4) kapanınca odağı açılıştan önceki öğeye geri verir.
 *
 * Kullanım: modal kabına bir ref bağla → `useOdakTuzak(ref, acik)`.
 * Not: Escape ile kapatma çağıran bileşende ayrı ele alınır (bu hook sadece
 * odak yönetiminden sorumlu, tek sorumluluk).
 */
import { useEffect } from "react";
import type { RefObject } from "react";

const ODAKLANABILIR =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function useOdakTuzak(ref: RefObject<HTMLElement | null>, acik: boolean) {
  useEffect(() => {
    if (!acik) return;
    const kap = ref.current;
    if (!kap) return;

    // Açılıştan önceki odağı hatırla (kapanınca geri vermek için).
    const oncekiOdak = document.activeElement as HTMLElement | null;

    const odaklanabilirler = () =>
      Array.from(kap.querySelectorAll<HTMLElement>(ODAKLANABILIR)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // İçerideki ilk odaklanabilir öğeye odağı taşı (yoksa kabın kendisine).
    const ilk = odaklanabilirler()[0];
    if (ilk) ilk.focus();
    else {
      kap.setAttribute("tabindex", "-1");
      kap.focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const oge = odaklanabilirler();
      if (oge.length === 0) {
        e.preventDefault();
        return;
      }
      const ilkOge = oge[0];
      const sonOge = oge[oge.length - 1];
      const aktif = document.activeElement as HTMLElement | null;
      // Shift+Tab ile baştan geriye → sona sar; Tab ile sondan ileriye → başa sar.
      if (e.shiftKey && (aktif === ilkOge || !kap.contains(aktif))) {
        e.preventDefault();
        sonOge.focus();
      } else if (!e.shiftKey && (aktif === sonOge || !kap.contains(aktif))) {
        e.preventDefault();
        ilkOge.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // Odağı açılıştan önceki öğeye geri ver (hâlâ DOM'daysa).
      if (oncekiOdak && document.contains(oncekiOdak)) oncekiOdak.focus();
    };
  }, [acik, ref]);
}
