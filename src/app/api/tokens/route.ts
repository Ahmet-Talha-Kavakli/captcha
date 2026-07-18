import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Tokens, Audit } from "@/lib/db/db";
import { planTanim } from "@/lib/specter/plans";

/** Yeni API anahtarı oluştur. Gizli anahtar YALNIZCA bu yanıtta döner. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // PLAN LİMİTİ: AKTİF (iptal edilmemiş) anahtar sayısı planın anahtar-limitine
  // ulaştıysa reddedilir (403). İptal edilen anahtarlar limiti tıkamaz. Site/ekip
  // limiti gibi, daha önce kontrol YOKTU (free plan sınırsız anahtar açabiliyordu).
  const anahtarLimiti = planTanim(user.plan).anahtarLimiti;
  const aktifSayi = Tokens.forOwner(user.id).filter((t) => !t.revoked).length;
  if (aktifSayi >= anahtarLimiti) {
    return NextResponse.json(
      {
        error: "key_limit",
        message: `Planınızın API anahtarı limiti (${anahtarLimiti}) doldu. Daha fazlası için planınızı yükseltin.`,
        limit: anahtarLimiti,
      },
      { status: 403 },
    );
  }

  const { name, scopes, environment } = await req.json().catch(() => ({}));
  const env = environment === "test" ? "test" : "live";
  const { token, secret } = Tokens.create(
    user.id,
    name || "Yeni anahtar",
    Array.isArray(scopes) && scopes.length ? scopes : ["verify"],
    env,
  );
  Audit.log(user.id, user.name, "anahtar.oluştur", `${name || "anahtar"} (${env})`);
  return NextResponse.json({ token, secret });
}

/** Anahtar döndür (yeni gizli anahtar üret). PATCH ?rotate. */
export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const res = Tokens.rotate(user.id, id);
  if (!res) return NextResponse.json({ error: "not_found" }, { status: 404 });
  Audit.log(user.id, user.name, "anahtar.döndür", res.token.name);
  return NextResponse.json({ token: res.token, secret: res.secret });
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  Tokens.revoke(user.id, id);
  Audit.log(user.id, user.name, "anahtar.iptal", id);
  return NextResponse.json({ ok: true });
}
