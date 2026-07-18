import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { Events, Usage, Audit, Alerts } from "@/lib/db/db";
import { VeriSaklamaIstemci } from "./VeriSaklamaIstemci";

export const metadata: Metadata = { title: "Veri Saklama & Silme — Veylify" };

/**
 * Veri Saklama & KVKK/GDPR Silme Otomasyonu — sunucu sayfası.
 * ==========================================================
 * Salt-okunur repo'lardan (Events/Usage/Audit/Alerts) GERÇEK veri ayak izini
 * ölçer: her kategori için kaç kayıt var, en eski kayıt kaç günlük. Kayıtların
 * ham zaman damgaları da (olaylar) istemciye taşınır ki saklama süresi
 * değiştikçe "kaç kayıt silinecek" tarayıcıda canlı hesaplansın.
 */
export default async function VeriSaklamaPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const bugun = Date.now();
  const GUN = 86_400_000;

  // --- Olaylar (en yaygın kişisel-veri kaynağı) ---
  // Geniş bir pencere çekip yaş dağılımını istemciye taşıyoruz. Ham ts'ler
  // yeterli; PII taşımadan yalnızca zaman damgası gönderilir.
  const olaylar = Events.forOwner(user.id, 4000);
  const olayTsler = olaylar.map((e) => e.ts).sort((a, b) => a - b);
  const olayEnEski = olayTsler.length ? olayTsler[0] : bugun;
  const olayEnEskiGun = olayTsler.length ? Math.max(0, Math.floor((bugun - olayEnEski) / GUN)) : 0;

  // Benzersiz IP sayısı (IP kategorisi footprint'i) + IP → en eski görülme.
  const ipSet = new Set<string>();
  for (const e of olaylar) ipSet.add(e.ip);

  // --- Denetim günlüğü ---
  const denetim = Audit.forOwner(user.id, 500);
  const denetimTsler = denetim.map((a) => a.ts);
  const denetimEnEski = denetimTsler.length ? Math.min(...denetimTsler) : bugun;
  const denetimEnEskiGun = denetimTsler.length ? Math.max(0, Math.floor((bugun - denetimEnEski) / GUN)) : 0;

  // --- Kullanım sayaçları (gün-bazlı toplulaştırılmış; 2 yıl penceresi) ---
  const kullanim = Usage.forOwner(user.id, 730);

  // --- Uyarılar / olaylar ---
  const uyarilar = Alerts.forOwner(user.id);
  const uyariTsler = uyarilar.map((a) => a.ts);
  const uyariEnEski = uyariTsler.length ? Math.min(...uyariTsler) : bugun;
  const uyariEnEskiGun = uyariTsler.length ? Math.max(0, Math.floor((bugun - uyariEnEski) / GUN)) : 0;

  // Örnek IP'ler (anonimleştirme önizlemesi için — gerçek veriden birkaç tane).
  const ornekIpler = [...ipSet].slice(0, 3);

  // Her kategori için footprint özeti (kayıt sayısı + en eski yaş).
  const ayakIzi = {
    "olay-loglari": { adet: olaylar.length, enEskiGun: olayEnEskiGun },
    "ip-adresleri": { adet: ipSet.size, enEskiGun: olayEnEskiGun },
    "davranis-verisi": { adet: olaylar.length, enEskiGun: olayEnEskiGun },
    "denetim-gunlugu": { adet: denetim.length, enEskiGun: denetimEnEskiGun },
    "kullanim-sayaclari": { adet: kullanim.length, enEskiGun: kullanim.length ? Math.min(730, olayEnEskiGun) : 0 },
    "uyarilar": { adet: uyarilar.length, enEskiGun: uyariEnEskiGun },
  } as Record<string, { adet: number; enEskiGun: number }>;

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.retention", dil) }]} baslik={ceviri("nav.retention", dil)} />
      <VeriSaklamaIstemci
        dil={dil}
        bugun={bugun}
        ayakIzi={ayakIzi}
        olayTsler={olayTsler}
        ornekIpler={ornekIpler}
      />
    </>
  );
}
