import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { Sites, Rules, Tokens, Events, Team, Integrations, Usage } from "@/lib/db/db";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { OnboardingIstemci } from "./OnboardingIstemci";

export const metadata: Metadata = { title: "Kurulum Sihirbazı — Veylify" };

/**
 * Kurulum Sihirbazı & Entegrasyon Merkezi (sunucu)
 * ------------------------------------------------
 * Her adımın "tamamlandı mı" durumu GERÇEK hesap durumundan hesaplanır
 * (site var mı, doğrulandı mı, trafik geldi mi, kural tanımlı mı, anahtar
 * üretildi mi, entegrasyon bağlı mı, ekip davet edildi mi). Böylece sihirbaz
 * canlı olarak kullanıcının ilerlemesini yansıtır — dekoratif değil.
 */
export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  const siteler = Sites.forOwner(user.id);
  const kurallar = Rules.forOwner(user.id);
  const tokenlar = Tokens.forOwner(user.id);
  const olaylar = Events.forOwner(user.id, 1);
  const ekip = Team.forOwner(user.id);
  const entegrasyonlar = Integrations.forOwner(user.id);
  const kullanim = Usage.forOwner(user.id, 30);

  // İlk (en eski) siteyi baz al — entegrasyon kodu bunun anahtarını kullanır.
  const ilkSite = [...siteler].sort((a, b) => a.createdAt - b.createdAt)[0] ?? null;

  // GERÇEK adım-tamamlanma sinyalleri:
  const siteVar = siteler.length > 0;
  const dogrulandi = siteler.some((s) => s.verified);
  const kullanimVar = kullanim.some((u) => u.issued > 0);
  const trafikVar = olaylar.length > 0 || kullanimVar;
  // Özel (kullanıcı tanımlı) kural: sistem kuralları sayılmaz.
  const kuralVar = kurallar.some((r) => !r.system);
  const anahtarVar = tokenlar.some((t) => !t.revoked);
  const entegrasyonVar = entegrasyonlar.some((i) => i.aktif);
  // Ekipte owner dışında en az bir üye (davet edilmiş ya da aktif) varsa.
  const ekipVar = ekip.length > 1;

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.onboarding", dil) }]} baslik={ceviri("nav.onboarding", dil)} />
      <OnboardingIstemci
        durum={{ siteVar, dogrulandi, trafikVar, kuralVar, anahtarVar, entegrasyonVar, ekipVar }}
        siteKey={ilkSite?.siteKey ?? "site_XXXXXXXXXXXXXXXX"}
        siteAd={ilkSite?.name ?? null}
        siteId={ilkSite?.id ?? null}
        dil={dil}
      />
    </>
  );
}
