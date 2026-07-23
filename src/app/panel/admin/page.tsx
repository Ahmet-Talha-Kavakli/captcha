/**
 * Specter — Platform Yönetici Konsolu (Operasyon Konsolu)
 * =======================================================
 * KÜRESEL (tüm dağıtım) görünüm: tüm hesaplar/kullanıcılar, tüm siteler,
 * platform-geneli trafik sağlığı, sistem-geneli tehdit duruşu, plan dağılımı
 * ve operasyonel metrikler. Vercel/Stripe iç-personel konsolu tarzı.
 *
 * VERİ ERİŞİMİ NOTU
 * -----------------
 * db.ts `load()`'ı DIŞA AKTARMIYOR (modül-özel). Bu yüzden küresel veri,
 * dışa aktarılan repo'lar üzerinden AGGREGATE edilir: `Users.all()` ile TÜM
 * kullanıcılar gezilir, her kullanıcı için sahip-kapsamlı repo'lar
 * (Sites/Events/Usage/Campaigns/Alerts/Rules/Tokens/Team) toplanır. Bu, tek
 * bir sorgu yerine hesap-başına toplama yapar ama sonuç gerçek bir platform
 * toplamıdır. Demo tohumu tek-kiracılı (tek owner) olduğundan bu, demo
 * dağıtımı üzerindeki dürüst platform görünümüdür.
 *
 * GÜVENLİK NOTU
 * -------------
 * Bu yüzey YALNIZCA Specter personeline (platform admin/staff) açıktır ve
 * `platformAdminMi()` kapısıyla korunur — admin olmayan kullanıcı `/panel`'e
 * yönlendirilir (küresel e-posta/plan/MRR verisi sızmaz). Admin listesi
 * VEYLIFY_ADMIN_EMAILS env'i ile veya User.platformAdmin bayrağıyla belirlenir.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { platformAdminMi } from "@/lib/platform-admin";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import {
  Users,
  Sites,
  Events,
  Usage,
  Campaigns,
  Alerts,
  Rules,
  Tokens,
  Team,
  Platform,
} from "@/lib/db/db";
import { PLANLAR, type Plan } from "@/lib/specter/plans";
import { ULKE_AD } from "@/lib/flag";
import { AdminIstemci, type AdminVeri, type HesapSatir } from "./AdminIstemci";

export const metadata: Metadata = { title: "Yönetici Konsolu — Veylify" };

/**
 * MRR (aylık yinelenen gelir) tahmini için plan başına aylık ₺ değeri.
 * free/pro fiyatı plans.ts'ten (tek kaynak) türetilir — böylece admin MRR
 * hesabı fatura/landing ile tutarlıdır. Scale "Özel" (sözleşmeye bağlı)
 * olduğundan MRR için temsili ~₺4.900/ay sözleşme değeri kullanılır (TAHMİN).
 */
const PLAN_AYLIK_TL: Record<Plan, number> = {
  free: Number(PLANLAR.free.fiyat.replace(/[^\d]/g, "")) || 0,
  pro: Number(PLANLAR.pro.fiyat.replace(/[^\d]/g, "")) || 0,
  scale: 4900,
};

/** İki gün-anahtarı (YYYY-MM-DD) arası fark yerine son N gün etiketi üret. */
function sonGunler(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  }
  return out;
}

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  // YETKİ KAPISI: yalnızca platform admin (staff) girebilir. Aksi halde bu
  // küresel operasyon panosu (tüm kullanıcı e-postaları/planları) sızardı.
  if (!platformAdminMi(user)) redirect("/panel");
  const dil = await panelDil();

  const tumKullanicilar = Users.all();

  // --- Hesap-başına toplama (küresel görünüm) ---
  const hesaplar: HesapSatir[] = [];
  const planSayim: Record<Plan, number> = { free: 0, pro: 0, scale: 0 };

  let toplamSite = 0;
  let toplamOlay30g = 0;
  let toplamEngellenen30g = 0;
  let toplamDogrulanan30g = 0;
  let toplamChallenge30g = 0;
  let toplamAktifKampanya = 0;
  let toplamKritikAcikUyari = 0;
  let toplamToken = 0;
  let toplamKural = 0;
  let toplamEkipUye = 0;
  let dogrulanmamisSite = 0;

  // Ülke → engellenen/olay birikimi (küresel tehdit coğrafyası)
  const ulkeOlay = new Map<string, number>();
  // botClass benzeri kaba dağılım için verdict sayımı yeterli.
  // Günlük küresel trafik trendi (son 30 gün).
  const gunler = sonGunler(30);
  const gunIndeks = new Map(gunler.map((g, i) => [g, i]));
  const gunlukIssued = new Array(30).fill(0);
  const gunlukBlocked = new Array(30).fill(0);

  // En büyük kampanyalar (küresel)
  const enBuyukKampanyalar: {
    id: string;
    ad: string;
    site: string;
    durum: string;
    toplamIstek: number;
    engellenen: number;
    zirveRps: number;
    ulkeler: string[];
  }[] = [];

  for (const k of tumKullanicilar) {
    const plan = (k.plan as Plan) ?? "free";
    planSayim[plan] = (planSayim[plan] ?? 0) + 1;

    const siteler = Sites.forOwner(k.id);
    toplamSite += siteler.length;
    dogrulanmamisSite += siteler.filter((s) => !s.verified).length;
    const siteAdiById = new Map(siteler.map((s) => [s.id, s.name]));

    // 30 günlük kullanım sayaçları (gerçek toplamlar).
    const kullanim = Usage.forOwner(k.id, 30);
    let hesapOlay = 0;
    let hesapEngellenen = 0;
    for (const u of kullanim) {
      hesapOlay += u.issued;
      hesapEngellenen += u.blocked;
      toplamOlay30g += u.issued;
      toplamEngellenen30g += u.blocked;
      toplamDogrulanan30g += u.verified;
      toplamChallenge30g += u.challenged;
      const gi = gunIndeks.get(u.day);
      if (gi !== undefined) {
        gunlukIssued[gi] += u.issued;
        gunlukBlocked[gi] += u.blocked;
      }
    }

    // Küresel coğrafya: son olayların ülke dağılımı (örneklem).
    for (const e of Events.forOwner(k.id, 800)) {
      ulkeOlay.set(e.country, (ulkeOlay.get(e.country) ?? 0) + 1);
    }

    const kampanyalar = Campaigns.forOwner(k.id);
    toplamAktifKampanya += kampanyalar.filter((c) => c.status === "active").length;
    for (const c of kampanyalar) {
      enBuyukKampanyalar.push({
        id: c.id,
        ad: c.name,
        site: siteAdiById.get(c.siteId) ?? "—",
        durum: c.status,
        toplamIstek: c.totalRequests,
        engellenen: c.blockedRequests,
        zirveRps: c.peakRps,
        ulkeler: c.topCountries,
      });
    }

    const uyarilar = Alerts.forOwner(k.id);
    toplamKritikAcikUyari += uyarilar.filter(
      (a) => a.severity === "critical" && (a.status === "acik" || a.status === "inceleniyor"),
    ).length;

    const kurallar = Rules.forOwner(k.id);
    toplamKural += kurallar.length;

    const tokenlar = Tokens.forOwner(k.id).filter((t) => !t.revoked);
    toplamToken += tokenlar.length;

    const ekip = Team.forOwner(k.id);
    toplamEkipUye += ekip.length;

    hesaplar.push({
      id: k.id,
      ad: k.workspaceName || k.name,
      email: k.email,
      plan,
      renk: k.avatarColor,
      siteSayisi: siteler.length,
      olay30g: hesapOlay,
      engellenen30g: hesapEngellenen,
      ekipSayisi: ekip.length,
      tokenSayisi: tokenlar.length,
      kuralSayisi: kurallar.length,
      // Hesap durumu: 30g trafiği varsa aktif, hiç yoksa boşta.
      durum: hesapOlay > 0 ? "aktif" : "bosta",
      olusturuldu: k.createdAt,
      sonGorulme: k.lastSeenAt,
      // Platform yönetimi (gerçek işlemler için).
      rol: k.role,
      hesapDurumu: k.hesapDurumu === "suspended" ? "suspended" : "active",
      platformAdmin: platformAdminMi(k),
      krediBakiye: k.krediBakiye ?? 0,
    });
  }

  // En büyük 6 kampanya (toplam isteğe göre).
  enBuyukKampanyalar.sort((a, b) => b.toplamIstek - a.toplamIstek);
  const buyukKampanyalar = enBuyukKampanyalar.slice(0, 6);

  // Küresel coğrafya top 8.
  const enTehditliUlkeler = [...ulkeOlay.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([kod, deger]) => ({ kod, ad: ULKE_AD[kod] ?? kod, deger }));

  // --- Türetilmiş oranlar ---
  const botOran =
    toplamOlay30g > 0 ? (toplamEngellenen30g + toplamChallenge30g) / toplamOlay30g : 0;
  const engelOran = toplamOlay30g > 0 ? toplamEngellenen30g / toplamOlay30g : 0;

  // --- MRR tahmini ---
  const mrrTl =
    planSayim.free * PLAN_AYLIK_TL.free +
    planSayim.pro * PLAN_AYLIK_TL.pro +
    planSayim.scale * PLAN_AYLIK_TL.scale;

  // --- Platform sağlık skoru (0..100) ---
  // Bileşenler (ağırlıklı): düşük kritik-açık-uyarı yükü, sağlıklı doğrulanmış
  // site oranı, makul engelleme oranı (çok yüksek = saldırı altında baskı,
  // çok düşük = koruma pasif olabilir), aktif hesap oranı.
  const dogrulanmisOran =
    toplamSite > 0 ? (toplamSite - dogrulanmamisSite) / toplamSite : 1;
  const aktifHesapOran =
    hesaplar.length > 0 ? hesaplar.filter((h) => h.durum === "aktif").length / hesaplar.length : 0;
  // Kritik uyarı cezası: her açık kritik uyarı skoru düşürür (azami -30).
  const uyariCezasi = Math.min(30, toplamKritikAcikUyari * 6);
  // Engelleme oranı "sağlıklı bant" (0.05..0.35) dışına çıkınca hafif ceza.
  const engelSapma =
    engelOran < 0.05 ? (0.05 - engelOran) * 120 : engelOran > 0.35 ? (engelOran - 0.35) * 120 : 0;
  const saglikSkoru = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        40 * dogrulanmisOran +
          30 * aktifHesapOran +
          30 -
          uyariCezasi -
          Math.min(20, engelSapma),
      ),
    ),
  );

  const veri: AdminVeri = {
    // özet
    toplamHesap: tumKullanicilar.length,
    toplamKullanici: tumKullanicilar.length + toplamEkipUye,
    toplamSite,
    dogrulanmamisSite,
    toplamOlay30g,
    toplamEngellenen30g,
    toplamDogrulanan30g,
    toplamChallenge30g,
    toplamAktifKampanya,
    toplamKritikAcikUyari,
    toplamToken,
    toplamKural,
    toplamEkipUye,
    botOran,
    engelOran,
    saglikSkoru,
    // plan & MRR
    planSayim,
    planFiyatTl: PLAN_AYLIK_TL,
    mrrTl,
    // platform bayrakları (gerçek DB durumu)
    platformBayraklar: Platform.bayraklar(),
    // tablolar
    hesaplar,
    enTehditliUlkeler,
    buyukKampanyalar,
    // trend
    gunler,
    gunlukIssued,
    gunlukBlocked,
    // meta
    kayitSayimlari: {
      kullanicilar: tumKullanicilar.length,
      siteler: toplamSite,
      kurallar: toplamKural,
      tokenlar: toplamToken,
      ekip: toplamEkipUye,
      kampanyalar: enBuyukKampanyalar.length,
    },
  };

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.admin", dil) }]} baslik={ceviri("nav.admin", dil)} />
      <AdminIstemci veri={veri} dil={dil} />
    </>
  );
}
