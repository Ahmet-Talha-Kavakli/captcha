import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Events, Sites, Rules } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { katmanGeriBesleme } from "@/lib/specter/katman-geribesleme";
import { katmanOzAyar } from "@/lib/specter/katman-ozayar";
import { ozAyarEtki } from "@/lib/specter/ozayar-etki";
import { geriBeslemeCeviri } from "./geri-besleme.i18n";
import { GeriBeslemeIstemci } from "./GeriBeslemeIstemci";

export const metadata: Metadata = { title: "Katman Geri-Besleme — Veylify" };

export default async function GeriBeslemePage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Sahibin son olayları üzerinden saf/deterministik geri-besleme analizi.
  // Motor, her olayın GERÇEK katman-hit'lerinden öğrenir; Date.now/Math.random yok.
  const olaylar = Events.forOwner(user.id, 3000);
  const sonuc = katmanGeriBesleme(olaylar);
  // Kapalı-döngü öz-ayar: geri-besleme çıktısından somut ayar önerileri türet
  // (saf/deterministik; uygulama insan onaylı, üretimi kendiliğinden değiştirmez).
  const ozAyar = katmanOzAyar(sonuc);

  // Kapalı-döngünün ÖLÇÜM halkası: uygulanmış öz-ayar kurallarının gerçekten işe
  // yarayıp yaramadığını, kural-oluşturma anının öncesi/sonrasını kıyaslayarak ölç.
  const kurallar = Rules.forOwner(user.id);
  const etki = ozAyarEtki(olaylar, kurallar, Date.now());

  // Öneriyi gerçek kurala çevirmek için: kuralın uygulanacağı siteyi istemcide
  // seçebilmek adına sahibin sitelerini (yalın {id,name}) geçir.
  const siteler = Sites.forOwner(user.id).map((s) => ({ id: s.id, name: s.name }));

  const baslik = geriBeslemeCeviri("gb.baslik", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <GeriBeslemeIstemci sonuc={sonuc} ozAyar={ozAyar} etki={etki} siteler={siteler} dil={dil} />
    </>
  );
}
