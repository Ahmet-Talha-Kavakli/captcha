import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { Events } from "@/lib/db/db";
import { CanliKonsolIstemci, type KonsolOlay } from "./CanliKonsolIstemci";

export const metadata: Metadata = { title: "Canlı Olay Konsolu — Veylify" };

/**
 * Canlı Olay Konsolu — sunucu sayfası.
 * Canlı akış devreye girmeden önce konsolu doldurmak için ilk 100 olayı
 * çeker (Events.forOwner). Akış (SSE) sonra üstüne yeni olayları ekler.
 */
export default async function CanliKonsolPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  // İlk parti — konsolu tohumla (en yeni üstte gelir). Yalnızca istemcinin
  // ihtiyaç duyduğu alanları düzleştirip gönderiyoruz.
  const ilkOlaylar: KonsolOlay[] = Events.forOwner(user.id, 100).map((e) => ({
    id: e.id,
    ts: e.ts,
    ip: e.ip,
    country: e.country,
    asn: e.asn,
    ua: e.ua,
    path: e.path,
    botClass: e.botClass,
    verdict: e.verdict,
    score: e.score,
    method: e.method,
    latency: e.latency,
    ja3: e.ja3,
    headless: e.headless,
    sinyaller: e.sinyaller,
  }));

  const baslik = ceviri("nav.console", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <CanliKonsolIstemci ilkOlaylar={ilkOlaylar} dil={dil} />
    </>
  );
}
