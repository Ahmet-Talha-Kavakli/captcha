"use client";

/**
 * Bot-sınıf dağılım listesi — TEK premium bileşen.
 * Her satır: sınıf ikonu (renkli çip) + etiket + sınıf-renginde bar + sağda
 * TEK SATIRLIK sayı·yüzde. Panelin her yerindeki ikonsuz/siyah-barlı/
 * iki-satıra-kırılan dağılım listelerinin yerine bunu kullan.
 *
 * `sinif` alanı BotClass anahtarı VEYA Türkçe etiket olabilir (ikisi de eşleşir).
 */
import { motion } from "framer-motion";
import { botSinifGorsel } from "./bot-sinif-gorsel";

const GRID = "#eceae2";

export interface DagilimSatir {
  /** BotClass anahtarı (human/ddos…) veya Türkçe etiket ("DDoS", "Kazıyıcı"). */
  sinif: string;
  /** Görünen etiket. */
  etiket: string;
  deger: number;
  /** Opsiyonel önceden hesaplanmış yüzde; verilmezse toplamdan türetilir. */
  yuzde?: number;
}

export function SinifDagilimListesi({
  satirlar,
  azHareket = false,
}: {
  satirlar: DagilimSatir[];
  azHareket?: boolean;
}) {
  const toplam = satirlar.reduce((a, s) => a + s.deger, 0) || 1;
  const max = Math.max(1, ...satirlar.map((s) => s.deger));

  if (satirlar.length === 0) {
    return (
      <div className="grid h-20 place-items-center rounded-xl border border-dashed border-line text-[12px] text-slate-faint">
        Henüz veri yok
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {satirlar.map((s, i) => {
        const g = botSinifGorsel(s.sinif);
        const Ikon = g.ikon;
        const yuzde = s.yuzde ?? (s.deger / toplam) * 100;
        const barW = (s.deger / max) * 100;
        return (
          <div key={`${s.sinif}-${i}`} className="flex items-center gap-3">
            {/* İkon çipi */}
            <span
              className="grid size-7 shrink-0 place-items-center rounded-lg"
              style={{ background: g.soft, color: g.renk }}
            >
              <Ikon className="size-3.5" strokeWidth={2.2} />
            </span>
            {/* Etiket — sabit genişlik, hizalı */}
            <span className="w-28 shrink-0 truncate text-[13px] font-medium text-slate-muted">
              {s.etiket}
            </span>
            {/* Bar */}
            <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: GRID }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: g.renk }}
                initial={azHareket ? false : { width: 0 }}
                animate={{ width: `${barW}%` }}
                transition={{ duration: 0.7, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            {/* Sağda TEK SATIR sayı · yüzde (whitespace-nowrap → asla kırılmaz) */}
            <span className="w-24 shrink-0 whitespace-nowrap text-right text-[12.5px] tabular-nums text-slate-muted">
              <span className="font-semibold text-slate-ink">{s.deger.toLocaleString("tr-TR")}</span>
              <span className="mx-1 text-slate-faint">·</span>
              <span>%{yuzde.toFixed(yuzde < 10 && yuzde % 1 !== 0 ? 1 : 0)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
