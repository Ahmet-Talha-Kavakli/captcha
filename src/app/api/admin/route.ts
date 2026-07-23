import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { platformAdminMi } from "@/lib/platform-admin";
import { Users, Audit } from "@/lib/db/db";
import { mailGonder, mailAktif } from "@/lib/specter/mail";
import { askiMail } from "@/lib/specter/mail-sablonlar";
import { MARKA } from "@/lib/marka";
import type { Plan, Role, User } from "@/lib/db/schema";

/**
 * POST /api/admin — Platform yönetici işlemleri (GERÇEK mutasyonlar).
 * ==================================================================
 * YALNIZCA platform admin (staff) çağırabilir — `platformAdminMi` kapısı.
 * Tüm işlemler değişmez denetim defterine (Audit) yazılır. localStorage/sahte
 * kontroller YERİNE gerçek DB mutasyonu yapar.
 *
 * Gövde: { action, uid, ...parametreler }
 *   - setPlan        { uid, plan }               → aboneliği değiştir
 *   - setRole        { uid, role }               → rolü değiştir
 *   - suspend        { uid, neden? }             → hesabı askıya al
 *   - activate       { uid }                     → askıyı kaldır
 *   - addKredi       { uid, miktar, aciklama? }  → kredi ekle/çıkar (bonus)
 *   - setStaff       { uid, deger }              → platform admin ata/kaldır
 *   - deleteUser     { uid }                     → hesabı + tüm verisini sil
 */

const GECERLI_PLAN: Plan[] = ["free", "pro", "scale"];
const GECERLI_ROL: Role[] = ["owner", "admin", "analyst", "viewer"];

export async function POST(req: Request) {
  // taze:false → session cookie zaten cache'te; Supabase blob'unu tekrar
  // indirmeye çalışıp timeout'a takılma (dev'de yavaş anlarda 401'e sebep oluyordu).
  const admin = await currentUser({ taze: false });
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!platformAdminMi(admin)) return NextResponse.json({ error: "Yetkisiz — platform admin gerekli." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { action, uid } = body as { action?: string; uid?: string };
  if (!action) return NextResponse.json({ error: "action zorunlu." }, { status: 400 });

  // MAIL TEST — uid gerektirmez; admin'in kendisine test maili gönderir.
  if (action === "mailTest") {
    if (!mailAktif()) {
      return NextResponse.json({
        ok: false,
        smtp: false,
        mesaj: "SMTP yapılandırılmamış. .env.local'e SMTP_HOST/PORT/USER/PASS/FROM ekleyin.",
      });
    }
    const sonuc = await mailGonder({
      kime: admin.email,
      konu: `${MARKA.ad} — Mail altyapı testi ✓`,
      html: `<p>Bu bir test e-postasıdır. ${MARKA.ad} mail altyapısı <strong>çalışıyor</strong>.</p>`,
      metin: `${MARKA.ad} mail altyapısı çalışıyor.`,
    });
    return NextResponse.json({ ok: sonuc.gonderildi, smtp: true, sebep: sonuc.sebep, kime: admin.email });
  }

  if (!uid) return NextResponse.json({ error: "uid zorunlu." }, { status: 400 });

  const hedef = Users.byId(uid);
  if (!hedef) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

  // Kendini kilitlemeyi/silmeyi engelle (kritik güvenlik).
  const kendiHassas = admin.id === uid && ["suspend", "deleteUser", "setStaff"].includes(action);
  if (kendiHassas) {
    return NextResponse.json({ error: "Kendi hesabınıza bu işlemi uygulayamazsınız." }, { status: 400 });
  }

  const denetle = (aksiyon: string, meta?: Record<string, string>, onceki?: string, sonraki?: string) =>
    Audit.log(admin.id, admin.name, aksiyon, hedef.email, meta, { category: "admin", critical: true, onceki, sonraki });

  switch (action) {
    case "setPlan": {
      const plan = body.plan as Plan;
      if (!GECERLI_PLAN.includes(plan)) return NextResponse.json({ error: "Geçersiz plan." }, { status: 400 });
      const onceki = hedef.plan;
      const u = Users.setPlan(uid, plan);
      denetle("admin.plan-değiştir", { plan }, onceki, plan);
      return NextResponse.json({ ok: true, user: guvenli(u) });
    }
    case "setRole": {
      const role = body.role as Role;
      if (!GECERLI_ROL.includes(role)) return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
      const onceki = hedef.role;
      const u = Users.setRole(uid, role);
      denetle("admin.rol-değiştir", { role }, onceki, role);
      return NextResponse.json({ ok: true, user: guvenli(u) });
    }
    case "suspend": {
      const neden = typeof body.neden === "string" ? body.neden.slice(0, 200) : undefined;
      const u = Users.setHesapDurumu(uid, "suspended", neden);
      denetle("admin.hesap-askıya", neden ? { neden } : undefined, "active", "suspended");
      // Bilgilendirme maili (fire-and-forget; SMTP yoksa loglanır).
      const m = askiMail(hedef.name, neden || "Yönetici tarafından askıya alındı");
      void mailGonder({ kime: hedef.email, konu: m.konu, html: m.html, metin: m.metin });
      return NextResponse.json({ ok: true, user: guvenli(u) });
    }
    case "activate": {
      const u = Users.setHesapDurumu(uid, "active");
      denetle("admin.hesap-aktifleştir", undefined, "suspended", "active");
      return NextResponse.json({ ok: true, user: guvenli(u) });
    }
    case "addKredi": {
      const miktar = Math.round(Number(body.miktar));
      if (!Number.isFinite(miktar) || miktar === 0) return NextResponse.json({ error: "Geçersiz miktar." }, { status: 400 });
      const aciklama = typeof body.aciklama === "string" && body.aciklama.trim() ? body.aciklama.slice(0, 120) : "Yönetici kredi ayarı";
      const sonuc = Users.krediHareket(uid, "bonus", miktar, aciklama);
      if (!sonuc) return NextResponse.json({ error: "Yetersiz bakiye (negatife düşürülemez)." }, { status: 400 });
      denetle("admin.kredi-ayarla", { miktar: String(miktar) });
      return NextResponse.json({ ok: true, user: guvenli(sonuc.user), bakiye: sonuc.user.krediBakiye });
    }
    case "setStaff": {
      const deger = Boolean(body.deger);
      const u = Users.setPlatformAdmin(uid, deger);
      denetle("admin.staff-ata", { deger: String(deger) });
      return NextResponse.json({ ok: true, user: guvenli(u) });
    }
    case "deleteUser": {
      Users.remove(uid);
      denetle("admin.hesap-sil");
      return NextResponse.json({ ok: true, silindi: uid });
    }
    default:
      return NextResponse.json({ error: "Bilinmeyen işlem." }, { status: 400 });
  }
}

/** Hassas alanları (passwordHash, totpSecret) çıkararak güvenli kullanıcı döndür. */
function guvenli(u: User | null | undefined) {
  if (!u) return null;
  const { passwordHash: _p, totpSecret: _t, ...rest } = u;
  return rest;
}
