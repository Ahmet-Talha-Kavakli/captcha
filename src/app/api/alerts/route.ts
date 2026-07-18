import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Alerts } from "@/lib/db/db";
import type { AlertStatus } from "@/lib/db/schema";

const GECERLI_DURUM: AlertStatus[] = ["acik", "inceleniyor", "cozuldu", "yoksayildi"];

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, ids, all } = await req.json().catch(() => ({}));
  if (all) {
    Alerts.markAllRead(user.id);
  } else if (Array.isArray(ids)) {
    // Toplu tekil-okundu (yetki-güvenli: yalnızca sahibin olayları).
    for (const x of ids) {
      if (typeof x === "string" && Alerts.byId(user.id, x)) Alerts.markRead(x);
    }
  } else if (id) {
    // Yetki-güvenli: id sahibin bir olayına aitse işaretle.
    if (Alerts.byId(user.id, id)) Alerts.markRead(id);
  }
  return NextResponse.json({ ok: true });
}

/**
 * Olay güncelleme: durum değiştir / ata / not ekle.
 * Body: { id, status?, assignee? (id|null), note? }
 * Hepsi currentUser + ownerId guard'lı; timeline'a kayıt düşer.
 */
export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id, status, assignee, note } = body as {
    id?: string;
    status?: AlertStatus;
    assignee?: string | null;
    note?: string;
  };
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  // İşlemi yapan: giriş yapan kullanıcının adı.
  const actor = user.name;
  let alert = Alerts.byId(user.id, id);
  if (!alert) return NextResponse.json({ error: "bulunamadı" }, { status: 404 });

  if (typeof note === "string" && note.trim()) {
    alert = Alerts.addNote(user.id, id, actor, note) ?? alert;
  }
  if (assignee !== undefined) {
    alert = Alerts.assign(user.id, id, assignee, actor) ?? alert;
  }
  if (status) {
    if (!GECERLI_DURUM.includes(status)) return NextResponse.json({ error: "geçersiz durum" }, { status: 400 });
    alert = Alerts.updateStatus(user.id, id, status, actor) ?? alert;
  }

  return NextResponse.json({ ok: true, alert });
}
