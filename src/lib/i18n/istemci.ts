"use client";
/**
 * Specter panel i18n — istemci tarafı dil hook'u.
 *
 * `usePanelDil(baslangic)` — sunucudan gelen dil prop'unu başlangıç değeri
 * alır, `specter_panel_dil` cookie'sinden okumayı da dener (anlık senkron).
 * Döndürdüğü `ceviri` yardımcısı seçili dile bağlıdır; `degistir` cookie'yi
 * ayarlayıp state'i günceller.
 */
import { useCallback, useEffect, useState } from "react";
import { ceviri as cevirHam, dileCevir, VARSAYILAN_DIL, type Dil } from "./panel";

export const PANEL_DIL_COOKIE = "specter_panel_dil";

function cookieDili(): Dil | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${PANEL_DIL_COOKIE}=([^;]+)`));
  return m ? dileCevir(decodeURIComponent(m[1])) : null;
}

export interface PanelDilKanca {
  dil: Dil;
  /** Anahtarı seçili dile çevirir. */
  ceviri: (anahtar: string) => string;
  /** Dili değiştirir: cookie ayarlar + state günceller (365 gün). */
  degistir: (yeni: Dil) => void;
}

export function usePanelDil(baslangic: Dil = VARSAYILAN_DIL): PanelDilKanca {
  const [dil, setDil] = useState<Dil>(baslangic);

  // Mount'ta cookie ile senkronize et (sunucu prop'u ile cookie farklı olabilir).
  useEffect(() => {
    const c = cookieDili();
    if (c && c !== dil) setDil(c);
    // baslangic değişirse (route değişimi) onu da yakala.
  }, [baslangic]); // eslint-disable-line react-hooks/exhaustive-deps

  const degistir = useCallback((yeni: Dil) => {
    document.cookie = `${PANEL_DIL_COOKIE}=${yeni}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setDil(yeni);
  }, []);

  const ceviri = useCallback((anahtar: string) => cevirHam(anahtar, dil), [dil]);

  return { dil, ceviri, degistir };
}
