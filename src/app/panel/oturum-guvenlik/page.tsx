import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Usage, Sites } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import {
  guvenlikDurusu,
  tokenYasamDongusu,
  ONERILEN_TOKEN_TTL_MS,
  ONERILEN_MAX_OTURUM,
  NONCE_PENCERE_MS,
} from "@/lib/specter/oturum-guvenlik";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { OturumGuvenlikIstemci } from "./OturumGuvenlikIstemci";
import { oturumGuvenlikCeviri } from "./oturum-guvenlik.i18n";

export const metadata: Metadata = { title: "Oturum Güvenliği & Token Yaşam Döngüsü — Veylify" };

export default async function OturumGuvenlikPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Gerçek kullanım hacmi: son 30 gün token issue/verify sayaçları.
  const usage = Usage.forOwner(user.id, 30);
  const issued = usage.reduce((a, u) => a + u.issued, 0);
  const verified = usage.reduce((a, u) => a + u.verified, 0);
  const yasamDongusu = tokenYasamDongusu(issued, verified);

  // Sahip site sayısı — token TTL / nonce koruması tüm sitelerde geçerli.
  const siteSayisi = Sites.forOwner(user.id).length;

  // Başlangıç duruşu: 2FA gerçek kullanıcı durumundan; oturum politikası
  // varsayılanları (istemci localStorage'tan geçerli ayarları yükler).
  const baslangicDurus = guvenlikDurusu({
    ikiAdimli: !!user.twoFactorEnabled,
    oturumSayisi: 1,
    maxOturum: ONERILEN_MAX_OTURUM,
    tokenTtlMs: ONERILEN_TOKEN_TTL_MS,
    nonceReplay: true,
    yeniCihaz2fa: true,
    supheliKonumAskiya: false,
  });

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.sessionsec", dil) }]}
        baslik={oturumGuvenlikCeviri("og.baslik", dil)}
      />
      <OturumGuvenlikIstemci
        kullaniciAdi={user.name}
        ikiAdimli={!!user.twoFactorEnabled}
        issued={issued}
        verified={verified}
        yasamDongusu={yasamDongusu}
        baslangicDurus={baslangicDurus}
        siteSayisi={siteSayisi}
        onerilenTokenTtlMs={ONERILEN_TOKEN_TTL_MS}
        onerilenMaxOturum={ONERILEN_MAX_OTURUM}
        noncePencereMs={NONCE_PENCERE_MS}
        dil={dil}
      />
    </>
  );
}
