import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Team, Sites, Usage } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { CalismaAlaniIstemci } from "./CalismaAlaniIstemci";
import { calismaAlaniCeviri } from "./calisma-alani.i18n";

export const metadata: Metadata = { title: "Çalışma Alanı — Veylify" };

/**
 * Çalışma Alanı (workspace) yönetim sayfası (sunucu).
 * =====================================================
 * Dekoratif çalışma-alanı anahtarını gerçek yapar: kullanıcı buradan
 * çalışma alanının adını değiştirir ve alan-düzeyi bilgileri görür.
 * Şimdilik tek (mevcut) çalışma alanı gerçektir; çoklu çalışma alanı
 * iskelesi "Yakında" olarak dürüstçe belirtilir.
 */
export default async function CalismaAlaniPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // Alan-düzeyi veriler (hepsi sahip-güvenli repolardan).
  const uyeler = Team.forOwner(user.id);
  const siteler = Sites.forOwner(user.id);
  const kullanim = Usage.forOwner(user.id, 30);

  // 30 günlük toplam doğrulama (issued) sayısı.
  const dogrulama30g = kullanim.reduce((toplam, u) => toplam + u.issued, 0);

  // Çalışma alanı adı: workspaceName varsa o, yoksa kullanıcı adı.
  const calismaAlaniAdi = (user.workspaceName ?? "").trim() || user.name;

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: calismaAlaniCeviri("ca.baslik", dil) }]}
        baslik={calismaAlaniCeviri("ca.baslik", dil)}
      />
      <CalismaAlaniIstemci
        dil={dil}
        calismaAlaniAdi={calismaAlaniAdi}
        varsayilanAd={user.name}
        calismaAlaniId={user.id}
        plan={user.plan}
        avatarRenk={user.avatarColor}
        olusturuldu={user.createdAt}
        uyeler={uyeler.map((u) => ({
          id: u.id,
          ad: u.name,
          eposta: u.email,
          rol: u.role,
          avatarRenk: u.avatarColor,
          durum: u.status,
        }))}
        siteSayisi={siteler.length}
        dogrulama30g={dogrulama30g}
      />
    </>
  );
}
