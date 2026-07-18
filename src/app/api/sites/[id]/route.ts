/**
 * GET    /api/sites/:id  → tek site + son eventler + kullanım
 * PATCH  /api/sites/:id  → ayar güncelle (difficulty, threshold, invisible, mode,
 *                          rateLimit, active, domains, name) — gerçek Sites.update + audit
 * DELETE /api/sites/:id  → sil + audit
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Sites, Events, Usage, Audit } from "@/lib/db/db";
import type { User } from "@/lib/db/schema";

async function guard(id: string): Promise<{ error: NextResponse } | { user: User; site: NonNullable<ReturnType<typeof Sites.byId>> }> {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  const site = Sites.byId(id);
  if (!site || site.ownerId !== user.id) {
    return { error: NextResponse.json({ error: "not found" }, { status: 404 }) };
  }
  return { user, site };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(id);
  if ("error" in g) return g.error;
  return NextResponse.json({
    site: g.site,
    events: Events.forSite(id, 50),
    usage: Usage.forSite(id, 30),
  });
}

/** İnsan-okur değişiklik özeti (audit onceki/sonraki + toast) için etiketler. */
const MOD_ETIKET: Record<string, string> = { monitor: "İzleme", challenge: "Doğrulama", block: "Engelleme" };
const ZORLUK_ETIKET: Record<string, string> = { low: "Düşük", medium: "Orta", high: "Yüksek" };
const TUR_ETIKET: Record<string, string> = { kod: "Kod", sayi: "Sayı", yon: "Yön", sec: "Seçim", rotasyon: "Rotasyon" };
const GECERLI_TUR = ["kod", "sayi", "yon", "sec", "rotasyon"];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(id);
  if ("error" in g) return g.error;
  const { user, site } = g;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  // İnsan-okur denetim izi için değişen ilk anlamlı alanın önce/sonra değerini yakala.
  let alan = "";
  let onceki = "";
  let sonraki = "";

  if (typeof body.name === "string" && body.name.trim() && body.name.trim() !== site.name) {
    patch.name = body.name.trim();
    alan = "Ad"; onceki = site.name; sonraki = body.name.trim();
  }
  if (["low", "medium", "high"].includes(body.difficulty) && body.difficulty !== site.difficulty) {
    patch.difficulty = body.difficulty;
    alan = "Zorluk"; onceki = ZORLUK_ETIKET[site.difficulty]; sonraki = ZORLUK_ETIKET[body.difficulty];
  }
  if (typeof body.behaviorThreshold === "number") {
    const v = Math.max(0, Math.min(1, body.behaviorThreshold));
    if (v !== site.behaviorThreshold) {
      patch.behaviorThreshold = v;
      alan = "Davranış eşiği"; onceki = site.behaviorThreshold.toFixed(2); sonraki = v.toFixed(2);
    }
  }
  if (typeof body.invisibleMode === "boolean" && body.invisibleMode !== site.invisibleMode) {
    patch.invisibleMode = body.invisibleMode;
    alan = "Görünmez mod"; onceki = site.invisibleMode ? "Açık" : "Kapalı"; sonraki = body.invisibleMode ? "Açık" : "Kapalı";
  }
  if (["monitor", "challenge", "block"].includes(body.mode) && body.mode !== site.mode) {
    patch.mode = body.mode;
    alan = "Koruma modu"; onceki = MOD_ETIKET[site.mode]; sonraki = MOD_ETIKET[body.mode];
  }
  // Challenge türü (kod/sayı/yön/seç/rotasyon) — daha önce PATCH'te İŞLENMİYORDU:
  // alan + challenge route + widget destekliyordu ama site sahibi panelden
  // DEĞİŞTİREMİYORDU (özellik tamdı, son bağlantı eksikti).
  if (GECERLI_TUR.includes(body.challengeType) && body.challengeType !== (site.challengeType ?? "kod")) {
    patch.challengeType = body.challengeType;
    alan = "Doğrulama türü"; onceki = TUR_ETIKET[site.challengeType ?? "kod"]; sonraki = TUR_ETIKET[body.challengeType];
  }
  if (typeof body.rateLimit === "number") {
    // 0 = kapalı; üst sınır makul tutulur (0..100000).
    const v = Math.max(0, Math.min(100000, Math.round(body.rateLimit)));
    if (v !== (site.rateLimit ?? 0)) {
      patch.rateLimit = v;
      alan = "Rate limit"; onceki = String(site.rateLimit ?? 0); sonraki = String(v);
    }
  }
  if (typeof body.active === "boolean" && body.active !== site.active) {
    patch.active = body.active;
    alan = "Koruma durumu"; onceki = site.active ? "Aktif" : "Pasif"; sonraki = body.active ? "Aktif" : "Pasif";
  }
  if (typeof body.domains === "string") {
    const yeni = body.domains
      .split(/[\n,]/)
      .map((d: string) => d.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
      .filter(Boolean);
    if (yeni.length && yeni.join(",") !== site.domains.join(",")) {
      patch.domains = yeni;
      alan = "Alan adları"; onceki = site.domains.join(", "); sonraki = yeni.join(", ");
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ site });
  }

  const updated = Sites.update(id, patch);
  // Yapılandırma değişikliğini denetim günlüğüne düşür (kim / ne / önce→sonra).
  Audit.log(
    user.id,
    user.name,
    "site.yapılandır",
    site.name,
    { alan, degisiklik: `${onceki} → ${sonraki}` },
    { category: "site", onceki, sonraki },
  );
  return NextResponse.json({ site: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(id);
  if ("error" in g) return g.error;
  const { user, site } = g;
  const ad = site.name;
  Sites.remove(id);
  Audit.log(user.id, user.name, "site.sil", ad, undefined, { category: "site", critical: true });
  return NextResponse.json({ ok: true });
}
