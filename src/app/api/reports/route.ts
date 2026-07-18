import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Reports, Sites, Audit } from "@/lib/db/db";
import type { ReportType, ReportFormat, ReportFrequency } from "@/lib/db/schema";

const TURLER: ReportType[] = [
  "haftalik_ozet",
  "aylik_tehdit",
  "ai_ajan",
  "bot_trafik",
  "uyum_denetim",
  "kampanya_analiz",
];
const FORMATLAR: ReportFormat[] = ["pdf", "csv", "json"];
const SIKLIKLAR: ReportFrequency[] = ["gunluk", "haftalik", "aylik"];

/** Rapor türü etiketi (denetim/toast metinleri için). */
const TUR_ETIKET: Record<ReportType, string> = {
  haftalik_ozet: "Haftalık güvenlik özeti",
  aylik_tehdit: "Aylık tehdit raporu",
  ai_ajan: "AI ajan aktivite raporu",
  bot_trafik: "Bot trafiği analizi",
  uyum_denetim: "Uyum/denetim raporu",
  kampanya_analiz: "Kampanya sonrası analiz",
};

/** Yeni zamanlanmış rapor oluştur. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { type, name, frequency, format, recipients, siteId } = body;

  if (!TURLER.includes(type)) return NextResponse.json({ error: "geçersiz rapor türü" }, { status: 400 });
  if (!SIKLIKLAR.includes(frequency)) return NextResponse.json({ error: "geçersiz sıklık" }, { status: 400 });
  if (!FORMATLAR.includes(format)) return NextResponse.json({ error: "geçersiz format" }, { status: 400 });

  // Alıcı e-postaları doğrula (en az bir geçerli).
  const alicilar: string[] = Array.isArray(recipients)
    ? recipients.map((r: unknown) => String(r).trim()).filter((r: string) => r.includes("@"))
    : [];
  if (!alicilar.length) return NextResponse.json({ error: "en az bir geçerli alıcı e-posta gerekli" }, { status: 400 });

  // Site kapsamı verildiyse sahibe ait olmalı (ownerId guard).
  let kapsamSite: string | null = null;
  if (siteId) {
    const site = Sites.byId(siteId);
    if (!site || site.ownerId !== user.id) {
      return NextResponse.json({ error: "site bulunamadı" }, { status: 404 });
    }
    kapsamSite = site.id;
  }

  const ad = (typeof name === "string" && name.trim()) || TUR_ETIKET[type as ReportType];
  const rapor = Reports.createScheduled(user.id, {
    type,
    name: ad,
    frequency,
    format,
    recipients: alicilar,
    siteId: kapsamSite,
  });
  Audit.log(user.id, user.name, "rapor.zamanla", ad, {
    tür: TUR_ETIKET[type as ReportType],
    sıklık: frequency,
    format,
    alıcı: String(alicilar.length),
  });
  return NextResponse.json({ report: rapor });
}

/** Zamanlanmış raporu duraklat/aktifleştir VEYA bir üretimi geçmişe kaydet. */
export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { action } = body;

  // Bir rapor üretildiğinde geçmişe kayıt (elle üretim akışı).
  if (action === "record") {
    const { type, name, periodDays, format, sizeBytes, scheduledReportId } = body;
    if (!TURLER.includes(type)) return NextResponse.json({ error: "geçersiz rapor türü" }, { status: 400 });
    if (!FORMATLAR.includes(format)) return NextResponse.json({ error: "geçersiz format" }, { status: 400 });
    const gun = Number(periodDays);
    const boyut = Math.max(0, Math.round(Number(sizeBytes) || 0));
    const ad = (typeof name === "string" && name.trim()) || TUR_ETIKET[type as ReportType];
    const kayit = Reports.addHistory(user.id, {
      type,
      name: ad,
      periodDays: Number.isFinite(gun) && gun > 0 ? gun : 30,
      format,
      sizeBytes: boyut,
      createdBy: user.name,
      scheduledReportId: typeof scheduledReportId === "string" ? scheduledReportId : undefined,
    });
    Audit.log(user.id, user.name, "rapor.üret", ad, { format, dönem: `${kayit.periodDays} gün` });
    return NextResponse.json({ history: kayit });
  }

  // Varsayılan: duraklat/aktifleştir.
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  const hedef = Reports.scheduledById(user.id, id);
  if (!hedef) return NextResponse.json({ error: "rapor bulunamadı" }, { status: 404 });
  const rapor = Reports.toggleScheduled(user.id, id);
  if (!rapor) return NextResponse.json({ error: "işlem başarısız" }, { status: 400 });
  Audit.log(user.id, user.name, rapor.active ? "rapor.zamanla-aktif" : "rapor.zamanla-duraklat", rapor.name);
  return NextResponse.json({ report: rapor });
}

/** Zamanlanmış raporu sil. */
export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  const hedef = Reports.scheduledById(user.id, id);
  if (!hedef) return NextResponse.json({ error: "rapor bulunamadı" }, { status: 404 });
  const ok = Reports.removeScheduled(user.id, id);
  if (!ok) return NextResponse.json({ error: "silinemedi" }, { status: 400 });
  Audit.log(user.id, user.name, "rapor.zamanla-sil", hedef.name);
  return NextResponse.json({ ok: true });
}
