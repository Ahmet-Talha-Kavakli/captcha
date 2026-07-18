import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { Events } from "@/lib/db/db";
import { panelDil } from "@/lib/i18n/sunucu";
import { canliYayinCeviri } from "./canli-yayin.i18n";
import { CanliYayinIstemci } from "./CanliYayinIstemci";

export const metadata: Metadata = { title: "Gerçek-Zaman Tehdit Yayını — Veylify" };

/**
 * Gerçek-Zaman Tehdit Yayını — sunucu sayfası.
 * ============================================
 * İçerik CANLI olarak SSE üzerinden akar (istemci `/api/live/stream`'e bir
 * EventSource açar). Sunucu tarafında yalnızca ilk boyama için başlangıç
 * sayaçları hesaplanır (Events.forOwner) — akış bağlanana kadar ekran boş
 * kalmasın diye. Gerçek "canlılık" push edilen olaylardan gelir.
 */
export default async function CanliYayinPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // İlk-boyama sayaçları: sahibin son olaylarından türetilir. Akış açılınca
  // canlı sayaçlar bunların üzerine sıfırdan (oturum içi) sayar.
  const son = Events.forOwner(user.id, 200);
  const ilk = {
    toplam: son.length,
    engellenen: son.filter((e) => e.verdict === "blocked").length,
    dogrulanan: son.filter((e) => e.verdict === "challenged").length,
  };

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: canliYayinCeviri("cy.kirinti", dil) }]}
        baslik={canliYayinCeviri("cy.baslik", dil)}
      />
      <CanliYayinIstemci ilk={ilk} dil={dil} />
    </>
  );
}
