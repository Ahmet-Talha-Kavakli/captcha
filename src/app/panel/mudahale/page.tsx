import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { Events } from "@/lib/db/db";
import { panelDil } from "@/lib/i18n/sunucu";
import { playbookTetikle } from "./playbook";
import { MudahaleIstemci, type TetikOzet } from "./MudahaleIstemci";
import { mudahaleCeviri } from "./mudahale.i18n";

export const metadata: Metadata = { title: "Olay Müdahale — Veylify" };

/**
 * Olay Müdahale Playbook Motoru — sunucu sayfası.
 * ==============================================
 * Saldırı türü başına önceden yazılmış, fazlara ayrılmış müdahale runbook'ları
 * (tespit → sınırlama → engelleme → doğrulama → kapanış). Komuta-merkezinden
 * FARKLIDIR: orası canlı aksiyon konsolu; burası yapılandırılmış, yaşam-döngülü
 * PLAYBOOK'lardır (tamamlayıcı).
 *
 * Veri: HANGI playbook'un ŞU AN ilgili olduğu GERÇEK trafikten hesaplanır —
 * Events.forOwner ile son 500 olayın bot sınıfları playbook'larla eşleştirilir.
 * Adımların kendisi şablon/rehberdir; işaretlemek niyeti kaydeder (istemci net
 * söyler). Uydurma veri yok.
 */
export default async function MudahalePage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();
  const baslik = mudahaleCeviri("x.baslik", dil);

  // GERÇEK olaylar — hangi playbook'un tetiklendiğini saymak için.
  const olaylar = Events.forOwner(user.id, 500);
  const tetikler = playbookTetikle(olaylar, 5);

  // İstemciye yalnızca playbook id + tetik sayısı/aktiflik gönder (playbook
  // katalogu istemcide de import edilir; burada trafiğe-bağlı durumu geçiyoruz).
  const tetikOzet: TetikOzet[] = tetikler.map((t) => ({
    id: t.playbook.id,
    tetikSayisi: t.tetikSayisi,
    aktif: t.aktif,
  }));

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <MudahaleIstemci dil={dil} tetikOzet={tetikOzet} toplamOlay={olaylar.length} />
    </>
  );
}
