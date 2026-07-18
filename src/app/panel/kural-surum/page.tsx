/**
 * Specter — Kural Sürüm Geçmişi & Geri-Alma (sunucu sayfası)
 * =========================================================
 * Kuralların sürüm geçmişini (git-benzeri) yüzeye çıkarır. Motor hazır
 * (schema + db.revert + /api/rules/:id/revert); burası yalnızca kullanıcı
 * arayüzünü kurar. Sahibin kuralları çekilip her birinin geçmiş uzunluğu
 * hesaplanır ve istemciye (sadeleştirilmiş, güvenli) aktarılır.
 */
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Rules, Sites } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { KuralSurumIstemci, type KuralVeri } from "./KuralSurumIstemci";

export const metadata: Metadata = { title: "Kural Sürümleri — Veylify" };

export default async function KuralSurumPage() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();
  const baslik = ceviri("nav.ruleversions", dil);

  // Sahibin siteleri → id→ad haritası (sürümlerde site adını göstermek için).
  const siteAdi: Record<string, string> = {};
  for (const s of Sites.forOwner(user.id)) siteAdi[s.id] = s.name;

  // Sahibin kuralları — her biri artık opsiyonel `history` taşıyabilir.
  const kurallar: KuralVeri[] = Rules.forOwner(user.id).map((r) => ({
    id: r.id,
    siteId: r.siteId,
    siteAdi: siteAdi[r.siteId] ?? "—",
    // O anki (aktif) yapılandırma — diff'in "yeni" tarafı.
    guncel: {
      name: r.name,
      description: r.description,
      enabled: r.enabled,
      priority: r.priority,
      field: r.field,
      op: r.op,
      value: r.value,
      action: r.action,
      kosulGrup: r.kosulGrup,
    },
    // Sürüm geçmişi (yoksa boş dizi).
    history: Array.isArray(r.history) ? r.history : [],
  }));

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <KuralSurumIstemci dil={dil} kurallar={kurallar} />
    </>
  );
}
