import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Webhooks, Sites, Audit } from "@/lib/db/db";
import { webhookTetikle } from "@/lib/specter/webhook-delivery";

/** Yeni webhook endpoint'i oluştur. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { siteId, url, events } = await req.json().catch(() => ({}));
  if (!url || typeof url !== "string" || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }
  // Sahiplik guard: hedef site sahibe ait olmalı.
  const site = Sites.byId(siteId);
  if (!site || site.ownerId !== user.id) {
    return NextResponse.json({ error: "invalid_site" }, { status: 403 });
  }
  const wh = Webhooks.create(siteId, url, Array.isArray(events) && events.length ? events : ["bot.blocked"]);
  Audit.log(user.id, user.name, "webhook.oluştur", url);
  return NextResponse.json({ webhook: wh });
}

/** Aktif/pasif değiştir veya test teslimatı gönder. body.action = "toggle" | "test". */
export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, action, event } = await req.json().catch(() => ({}));
  if (action === "test") {
    const wh = Webhooks.byId(user.id, id);
    if (!wh) return NextResponse.json({ error: "not_found" }, { status: 404 });
    // GERÇEK teslimat: müşterinin webhook URL'ine imzalı HTTP POST gönder.
    const sonuc = await webhookTetikle(user.id, {
      type: event || "webhook.test",
      data: { test: true, message: "Veylify test teslimatı", ts: Date.now() },
    });
    Audit.log(user.id, user.name, "webhook.test", wh.url, { basarili: String(sonuc.basarili), hedef: String(sonuc.hedef) });
    // Son kaydedilen teslimatı döndür (motor kaydetTeslimat ile yazdı).
    const guncel = Webhooks.byId(user.id, id);
    const delivery = guncel?.deliveries?.[guncel.deliveries.length - 1];
    return NextResponse.json({ delivery, sonuc });
  }
  const wh = Webhooks.toggle(user.id, id);
  if (!wh) return NextResponse.json({ error: "not_found" }, { status: 404 });
  Audit.log(user.id, user.name, "webhook.durum", `${wh.url} → ${wh.active ? "aktif" : "pasif"}`);
  return NextResponse.json({ webhook: wh });
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const ok = Webhooks.remove(user.id, id);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  Audit.log(user.id, user.name, "webhook.sil", id);
  return NextResponse.json({ ok: true });
}
