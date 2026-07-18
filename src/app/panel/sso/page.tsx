import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Team, Sites } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { SsoIstemci } from "./SsoIstemci";

export const metadata: Metadata = { title: "SSO & SAML Hazırlık Merkezi — Veylify" };

/**
 * Kurumsal SSO & SAML Hazırlık Merkezi (sunucu sayfası)
 * =====================================================
 * currentUser guard'ı geçtikten sonra, SSO'nun ETKİLEYECEĞİ kullanıcı
 * kümesini göstermek için ekip (Team.forOwner — SALT-OKUNUR) ve site alan
 * adları (Sites.forOwner) okunur. Gerçek yapılandırma istemci tarafında
 * localStorage'da tutulur (dürüst bir ayar yüzeyi).
 */
export default async function SsoPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Ekibi SALT-OKUNUR çek — SSO zorunlu kılınırsa hangi üyeler etkilenir?
  const ekip = Team.forOwner(user.id);
  const uyeler = ekip.map((m) => ({
    ad: m.name,
    email: m.email,
    rol: m.role,
    durum: m.status,
    mfa: !!m.mfaEnabled,
  }));

  // Sahibin sitelerindeki benzersiz alan adları (SSO zorunluluğu alan-bazlıdır).
  const alanlar = [...new Set(Sites.forOwner(user.id).flatMap((s) => s.domains))]
    .filter(Boolean)
    .sort();

  const baslik = ceviri("nav.sso", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <SsoIstemci
        dil={dil}
        kullanici={{ email: user.email, plan: user.plan }}
        uyeler={uyeler}
        alanlar={alanlar}
      />
    </>
  );
}
