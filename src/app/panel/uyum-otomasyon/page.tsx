import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { Team, Tokens, Audit, Sites, Rules, Alerts, Integrations } from "@/lib/db/db";
import { ROLLER, YETENEKLER } from "@/app/panel/ekip/roller";
import { otomatikKanitTopla, type OtomasyonGirdi } from "@/lib/specter/uyum-otomasyon";
import { UyumOtomasyonIstemci } from "./UyumOtomasyonIstemci";

export const metadata: Metadata = { title: "Uyum Kanıt Otomasyonu — Veylify" };

export default async function UyumOtomasyonPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const ownerId = user.id;
  // Tarama anı SUNUCUDA bir kez okunur; motor saf kalsın diye içeri geçilir.
  const bugun = Date.now();

  // --- Gerçek repository verisini topla (hepsi ownerId-kapsamlı) ---
  const ekip = Team.forOwner(ownerId);
  const tokenlar = Tokens.forOwner(ownerId);
  const denetim = Audit.forOwner(ownerId, 500);
  const siteler = Sites.forOwner(ownerId);
  const kurallar = Rules.forOwner(ownerId);
  const olaylar = Alerts.forOwner(ownerId);
  const entegrasyonlar = Integrations.forOwner(ownerId);

  const girdi: OtomasyonGirdi = {
    bugun,
    ekip: ekip.map((u) => ({ rol: u.role, status: u.status, mfaEnabled: u.mfaEnabled })),
    yetenekSayisi: YETENEKLER.length,
    rolSayisi: ROLLER.length,
    sahip2FA: Boolean(user.twoFactorEnabled),
    parolaDegisimAni: user.passwordChangedAt ?? user.createdAt,
    tokenlar: tokenlar.map((t) => ({
      scopes: t.scopes,
      revoked: t.revoked,
      createdAt: t.createdAt,
      lastRotatedAt: t.lastRotatedAt,
      leaked: t.leaked,
      environment: t.environment,
    })),
    denetimSayisi: denetim.length,
    denetimZinciriVar: denetim.some((a) => Boolean(a.hash) && Boolean(a.prevHash)),
    denetimKritikSayisi: denetim.filter((a) => a.critical).length,
    siteler: siteler.map((s) => ({ verified: s.verified, mode: s.mode })),
    olaylar: olaylar.map((a) => ({ status: a.status, resolvedAt: a.resolvedAt, assignee: a.assignee })),
    aktifKuralSayisi: kurallar.filter((r) => r.enabled).length,
    toplamKuralSayisi: kurallar.length,
    aktifEntegrasyonSayisi: entegrasyonlar.filter((i) => i.aktif).length,
    // Veri dışa aktarma / yedekleme yeteneği ürün genelinde mevcut (tasarım gereği).
    yedeklemeVar: true,
  };

  const sonuc = otomatikKanitTopla(girdi);
  const hesapAdi = user.workspaceName || user.name;

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.complianceauto", dil) }]} baslik={ceviri("nav.complianceauto", dil)} />
      <UyumOtomasyonIstemci dil={dil} sonuc={sonuc} hesapAdi={hesapAdi} />
    </>
  );
}
