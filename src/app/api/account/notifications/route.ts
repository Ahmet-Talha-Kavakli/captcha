import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Users, Audit } from "@/lib/db/db";
import type { BildirimTercihleri, BildirimOlay, BildirimKanal } from "@/lib/db/schema";

const OLAYLAR: BildirimOlay[] = ["kritik_uyari", "ai_ajan", "kota", "haftalik_ozet", "ekip", "fatura"];
const KANALLAR: BildirimKanal[] = ["email", "webhook", "panel"];

/** Bildirim tercih matrisini (olay × kanal) kaydeder. */
export async function PUT(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const gelen = (body?.prefs ?? {}) as Record<string, Record<string, unknown>>;

  // Yalnızca bilinen olay/kanal anahtarlarını al (boolean'a zorla).
  const temiz: BildirimTercihleri = {};
  for (const olay of OLAYLAR) {
    const satir = gelen[olay];
    if (!satir || typeof satir !== "object") continue;
    const kanallar: Partial<Record<BildirimKanal, boolean>> = {};
    for (const kanal of KANALLAR) {
      if (kanal in satir) kanallar[kanal] = Boolean(satir[kanal]);
    }
    if (Object.keys(kanallar).length) temiz[olay] = kanallar;
  }

  const guncel = Users.setNotificationPrefs(user.id, temiz);
  if (!guncel) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  Audit.log(user.id, user.name, "hesap.bildirim-tercihi", user.email);

  return NextResponse.json({ prefs: guncel.notificationPrefs ?? {} });
}
