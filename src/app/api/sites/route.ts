/**
 * GET  /api/sites  → sahibin siteleri
 * POST /api/sites  → yeni site + key çifti üret
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Sites } from "@/lib/db/db";
import { generateSiteKeys } from "@/lib/specter/crypto";
import { planTanim } from "@/lib/specter/plans";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ sites: Sites.forOwner(user.id) });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name: string = (body.name || "").trim();
  const domainsRaw: string = body.domains || "";
  if (!name) {
    return NextResponse.json({ error: "Site adı gerekli" }, { status: 400 });
  }

  // PLAN LİMİTİ: mevcut site sayısı planın site-limitine ulaştıysa yeni site
  // oluşturma reddedilir (403). Daha önce kontrol YOKTU — free plan (limit 1)
  // sınırsız site açabiliyordu, plan farkı anlamsızdı (gelir kaçağı).
  const limit = planTanim(user.plan).siteLimiti;
  const mevcut = Sites.forOwner(user.id).length;
  if (mevcut >= limit) {
    return NextResponse.json(
      {
        error: "site_limit",
        message: `Planınızın site limiti (${limit}) doldu. Daha fazla site için planınızı yükseltin.`,
        limit,
        current: mevcut,
      },
      { status: 403 },
    );
  }

  const domains = domainsRaw
    .split(/[\n,]/)
    .map((d: string) => d.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
    .filter(Boolean);

  const { siteKey, secretKey } = generateSiteKeys();
  const site = Sites.create({
    ownerId: user.id,
    name,
    domains: domains.length ? domains : ["localhost"],
    siteKey,
    secretKey,
    difficulty: body.difficulty || "medium",
    behaviorThreshold: 0.35,
    invisibleMode: false,
    mode: body.mode || "challenge",
  });

  return NextResponse.json({ site });
}
