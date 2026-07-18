/**
 * Specter — Korelasyondan Olay (Incident) Oluşturma
 * =================================================
 * Bir korelasyonu (saldırı zincirini) tam bir olay-yönetimi kaydına dönüştürür.
 * Böylece korelasyon yalnızca bir görünüm değil, olay yaşam döngüsünü (atama/
 * durum/timeline/MTTR) besleyen bir tetikleyici olur.
 *
 *   POST /api/korelasyon/olay  { korelasyonId, siteId }
 *
 * Güvenlik: korelasyonlar SUNUCUDA yeniden hesaplanır (istemciye güvenilmez);
 * verilen id gerçekten sahibin verisinde varsa olay oluşturulur.
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Events, Sites, Alerts, Audit } from "@/lib/db/db";
import { korelasyonBul, TUR_ETIKET, type KorelasyonOlay, type KorelasyonSiddet } from "@/lib/specter/correlation";
import type { AlertSeverity, AlertPriority } from "@/lib/db/schema";

const SIDDET_ALERT: Record<KorelasyonSiddet, { sev: AlertSeverity; pri: AlertPriority }> = {
  kritik: { sev: "critical", pri: "p1" },
  yuksek: { sev: "high", pri: "p2" },
  orta: { sev: "medium", pri: "p3" },
  dusuk: { sev: "low", pri: "p4" },
};

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const korelasyonId = String(body.korelasyonId ?? "");
  if (!korelasyonId) return NextResponse.json({ error: "korelasyon-id" }, { status: 400 });

  // Hedef site: verilen ya da sahibin ilk sitesi.
  const sites = Sites.forOwner(user.id);
  if (sites.length === 0) return NextResponse.json({ error: "site-yok" }, { status: 400 });
  const site = body.siteId ? sites.find((s) => s.id === body.siteId) : sites[0];
  if (!site) return NextResponse.json({ error: "site" }, { status: 400 });

  // Korelasyonları SUNUCUDA yeniden hesapla, id ile bul.
  const olaylar = Events.forOwner(user.id, 3000).map((e): KorelasyonOlay => ({
    id: e.id, ts: e.ts, ip: e.ip, country: e.country, asn: e.asn,
    ua: e.ua, path: e.path, botClass: e.botClass, verdict: e.verdict, score: e.score,
  }));
  const kor = korelasyonBul(olaylar).find((k) => k.id === korelasyonId);
  if (!kor) return NextResponse.json({ error: "korelasyon-bulunamadı" }, { status: 404 });

  const map = SIDDET_ALERT[kor.siddet];
  const mesaj = [
    `Korelasyon motoru "${TUR_ETIKET[kor.tur]}" tespit etti.`,
    `${kor.olaySayisi} olay · ${kor.benzersizIp} benzersiz IP · ${kor.ulkeler.join(", ") || "—"}.`,
    `Kill-chain: ${kor.taktikler.join(" → ")}.`,
    `Güven skoru %${kor.guvenSkoru} · engel oranı %${Math.round(kor.engelOrani * 100)}.`,
  ].join(" ");

  const alert = Alerts.create(user.id, {
    siteId: site.id,
    severity: map.sev,
    title: kor.baslik,
    message: mesaj,
    category: "saldiri",
    priority: map.pri,
    sourceIp: kor.ornekOlaylar[0]?.ip,
    actor: user.name,
  });
  if (!alert) return NextResponse.json({ error: "oluşturulamadı" }, { status: 400 });

  Audit.log(user.id, user.name, "olay.oluştur", `Korelasyon → ${kor.baslik}`);
  return NextResponse.json({ alert: { id: alert.id, title: alert.title, severity: alert.severity, priority: alert.priority } });
}
