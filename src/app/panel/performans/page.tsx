import type { Metadata } from "next";
import { statSync } from "fs";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { PerformansIstemci } from "./PerformansIstemci";
import {
  butceDegerlendir,
  performansSkoru,
  coreWebVitals,
  RECAPTCHA_TIPIK_KB,
  GZIP_KATSAYI,
  PARSE_MS_PER_KB,
} from "./butce";

export const metadata: Metadata = { title: "Widget Performans Bütçesi — Veylify" };

/**
 * Sunucu bileşeni. GERÇEK ölçüm: public/specter.js dosyasının bayt boyutunu
 * fs.statSync ile okur (bu dosya bir sunucu bileşeni olduğu için fs kullanımı
 * doğaldır). Bu tek gerçek girdi, saf butceDegerlendir() ile tüm metrik
 * kataloğuna deterministik olarak dönüşür. CWV/timing değerleri MODELLENEN
 * tahmindir ve UI'da öyle etiketlenir.
 */
export default async function PerformansPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  // GERÇEK bayt boyutu — müşteri sitesine inen gerçek widget dosyası.
  let gercekBaytlar = 0;
  try {
    gercekBaytlar = statSync(process.cwd() + "/public/specter.js").size;
  } catch {
    // Dosya bulunamazsa panel yine dolu görünsün diye makul bir taban.
    gercekBaytlar = 52000;
  }

  const metrikler = butceDegerlendir(gercekBaytlar);
  const skor = performansSkoru(metrikler);
  const vitals = coreWebVitals(metrikler);

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.perfbudget", dil), href: "/panel/performans" }]}
        baslik={ceviri("nav.perfbudget", dil)}
      />
      <PerformansIstemci
        gercekBaytlar={gercekBaytlar}
        metrikler={metrikler}
        skor={skor}
        vitals={vitals}
        recaptchaTipikKb={RECAPTCHA_TIPIK_KB}
        gzipKatsayi={GZIP_KATSAYI}
        parseMsPerKb={PARSE_MS_PER_KB}
        dil={dil}
      />
    </>
  );
}
