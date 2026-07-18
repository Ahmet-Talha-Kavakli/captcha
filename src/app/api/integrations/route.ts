/**
 * POST /api/integrations   → yeni entegrasyon (Slack/Discord/...) bağla
 * PATCH /api/integrations  → aç/kapat (toggle) veya test bildirimi (action:test)
 * DELETE /api/integrations → kaldır
 * Hepsi currentUser + ownerId guard'lı + Audit.
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Integrations, Audit } from "@/lib/db/db";
import { entegrasyonGonder, ENTEGRASYON_KATALOG } from "@/lib/specter/integrations";
import type { IntegrationTur } from "@/lib/db/schema";

const TURLER = ENTEGRASYON_KATALOG.map((k) => k.tur);

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const tur = body.tur as IntegrationTur;
  const ad = (body.ad || "").trim();
  const hedef = (body.hedef || "").trim();
  const olaylar: string[] = Array.isArray(body.olaylar) ? body.olaylar : [];

  if (!TURLER.includes(tur)) return NextResponse.json({ error: "geçersiz tür" }, { status: 400 });
  if (!ad || !hedef) return NextResponse.json({ error: "ad ve hedef gerekli" }, { status: 400 });
  if (tur !== "email" && !/^https?:\/\//.test(hedef)) return NextResponse.json({ error: "geçerli bir URL girin" }, { status: 400 });
  if (!olaylar.length) return NextResponse.json({ error: "en az bir olay seçin" }, { status: 400 });

  const ent = Integrations.create(user.id, { tur, ad, hedef, olaylar });
  Audit.log(user.id, user.name, "entegrasyon.bagla", `${tur} · ${ad}`);
  return NextResponse.json({ integration: ent });
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, action } = await req.json().catch(() => ({}));
  const ent = Integrations.byId(user.id, id);
  if (!ent) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (action === "test") {
    // GERÇEK test bildirimi gönder (platforma-özgü biçimde).
    const sonuc = await entegrasyonGonder(ent.tur, ent.hedef, {
      tur: "test",
      baslik: "Veylify test bildirimi",
      mesaj: "Bu bir test bildirimidir. Entegrasyonun çalışıyor! 🎉",
      alanlar: [{ ad: "Durum", deger: "Bağlantı başarılı" }],
      onem: "bilgi",
    });
    Integrations.kaydetTeslimat(user.id, id, sonuc.status);
    Audit.log(user.id, user.name, "entegrasyon.test", `${ent.tur} · ${ent.ad}`, { status: String(sonuc.status) });
    return NextResponse.json({ ok: sonuc.status >= 200 && sonuc.status < 300, status: sonuc.status });
  }

  const guncel = Integrations.toggle(user.id, id);
  Audit.log(user.id, user.name, "entegrasyon.durum", `${ent.ad} → ${guncel?.aktif ? "aktif" : "pasif"}`);
  return NextResponse.json({ integration: guncel });
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const ent = Integrations.byId(user.id, id);
  if (!ent) return NextResponse.json({ error: "not_found" }, { status: 404 });
  Integrations.remove(user.id, id);
  Audit.log(user.id, user.name, "entegrasyon.kaldir", `${ent.tur} · ${ent.ad}`);
  return NextResponse.json({ ok: true });
}
