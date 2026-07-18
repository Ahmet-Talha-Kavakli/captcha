/**
 * Specter — Türetilmiş Metrikler
 * Ham veriden koruma skoru, KPI'lar ve bildirimler hesaplar.
 *
 * PERFORMANS NOTU
 * ================
 * korumaOzeti ve panelSayilari her panel yüklemesinde çağrılır ve altında
 * çok sayıda ağır repo sorgusu (Usage/Events/Campaigns/Alerts/Rules…) yapar.
 * Aynı istek/render içinde bunlar defalarca tetiklenebilir. Sonuç yalnızca DB
 * durumuna bağlı olduğundan, `cacheSignature()` (mtime+writeSeq) sabit kaldığı
 * sürece hesabı bir kez yapıp owner-bazlı önbellekten döneriz. Yazma sonrası
 * imza değişir → önbellek otomatik geçersiz olur (eski metrik dönmez).
 */
import { Sites, Usage, Events, Campaigns, Alerts, IpRep, Rules, Team, Reports, Users, cacheSignature } from "@/lib/db/db";
import { kotaDurumu } from "@/lib/specter/plans";
import type { AlertSeverity } from "@/lib/db/schema";

// owner → { imza, değer } — imza değişince yeniden hesaplanır.
type MemoGiris<T> = { sig: string; val: T };
const ozetMemo = new Map<string, MemoGiris<ReturnType<typeof korumaOzetiHesap>>>();
const sayilarMemo = new Map<string, MemoGiris<ReturnType<typeof panelSayilariHesap>>>();

export function korumaOzeti(ownerId: string) {
  const sig = cacheSignature();
  const m = ozetMemo.get(ownerId);
  if (m && m.sig === sig) return m.val;
  const val = korumaOzetiHesap(ownerId);
  ozetMemo.set(ownerId, { sig, val });
  return val;
}

function korumaOzetiHesap(ownerId: string) {
  const sites = Sites.forOwner(ownerId);
  const usage = Usage.forOwner(ownerId, 30);
  const campaigns = Campaigns.forOwner(ownerId);
  const alerts = Alerts.forOwner(ownerId);

  const totals = usage.reduce(
    (a, u) => ({
      issued: a.issued + u.issued,
      verified: a.verified + u.verified,
      blocked: a.blocked + u.blocked,
      challenged: a.challenged + u.challenged,
    }),
    { issued: 0, verified: 0, blocked: 0, challenged: 0 },
  );

  const blockRate = totals.issued ? totals.blocked / totals.issued : 0;
  const aktifKampanya = campaigns.filter((c) => c.status === "active").length;
  const kritikUyari = alerts.filter((a) => a.severity === "critical" && !a.read).length;

  // Koruma skoru: engelleme etkinliği + kapsam − aktif tehdit cezası.
  const kapsama = sites.length ? sites.filter((s) => s.mode !== "monitor").length / sites.length : 0;
  const etkinlik = Math.min(1, blockRate / 0.3); // %30 blok = tam etkin
  let skor = Math.round((etkinlik * 0.5 + kapsama * 0.3 + 0.2) * 100);
  skor -= aktifKampanya * 4 + kritikUyari * 5;
  skor = Math.max(0, Math.min(100, skor));

  return {
    skor,
    siteCount: sites.length,
    totals,
    blockRate,
    aktifKampanya,
    kritikUyari,
    // alt-skorlar (bar için)
    tespit: Math.min(100, Math.round(etkinlik * 100)),
    kapsam: Math.round(kapsama * 100),
    yanit: Math.max(60, 100 - aktifKampanya * 8),
  };
}

export function bildirimler(ownerId: string) {
  return Alerts.forOwner(ownerId).slice(0, 10);
}

/* ------------------------------------------------------------------ Bildirim Merkezi
 *
 * Topbar dropdown'u yalnızca son alerts'i gösterir. Bildirim Merkezi (tam sayfa)
 * bundan DAHA GENİŞ: güvenlik olaylarına (alerts) ek olarak kullanıcıya yönelik
 * SİSTEM bildirimlerini de türetir — kota eşiği, bekleyen ekip daveti, rapor
 * hazır, zamanlanmış rapor. Uyarılar modülü (incident/olay yönetimi) bu kümenin
 * yalnızca "güvenlik" kategorisindeki alt kümesidir; burada onları da içeririz
 * ama okundu/tıklama davranışıyla birleşik bir gelen-kutusu sunarız.
 *
 * NOT: Sistem bildirimleri türetilmiştir (DB'de ayrı tablo yok) — deterministik
 * id + türetilmiş `read` (ilgili durum çözülünce okunmuş sayılır). Alert'ler
 * gerçek kalıcı kayıtlardır; okundu işaretleme onlara /api/alerts ile yazar.
 */

/** Bildirim Merkezi kategorileri (filtre sekmeleri). */
export type BildirimKategori = "guvenlik" | "sistem" | "ekip" | "kota" | "rapor";

/** Birleşik bildirim kaydı (alert + türetilmiş sistem bildirimleri). */
export interface MerkezBildirim {
  id: string;
  /** "alert" ise okundu işaretleme gerçek Alert kaydına yazılır; "sistem" türetilmiştir. */
  kaynak: "alert" | "sistem";
  severity: AlertSeverity;
  kategori: BildirimKategori;
  title: string;
  message: string;
  ts: number;
  read: boolean;
  /** Tıklanınca gidilecek panel yolu (yoksa tıklanamaz). */
  href?: string;
}

export function bildirimMerkezi(ownerId: string): MerkezBildirim[] {
  const liste: MerkezBildirim[] = [];

  // 1) Güvenlik olayları (gerçek alerts). Kategori güvenlik altında toplanır;
  //    "sistem"/"kota" kategorili alert'ler kendi kategorisine düşer.
  const alerts = Alerts.forOwner(ownerId);
  for (const a of alerts) {
    const kat: BildirimKategori =
      a.category === "kota" ? "kota" : a.category === "sistem" ? "sistem" : "guvenlik";
    liste.push({
      id: a.id,
      kaynak: "alert",
      severity: a.severity,
      kategori: kat,
      title: a.title,
      message: a.message,
      ts: a.ts,
      read: a.read,
      // Kaynağa göre en anlamlı hedefe götür: IP → tehdit, kampanya → kampanyalar,
      // aksi halde Olaylar modülündeki ilgili kaydı aç.
      href: a.sourceIp
        ? `/panel/tehdit/${encodeURIComponent(a.sourceIp)}`
        : a.relatedCampaignId
          ? `/panel/tehdit/kampanyalar`
          : `/panel/uyarilar`,
    });
  }

  const gun = 86400000;
  const now = Date.now();

  // 2) Kota bildirimi (türetilmiş): son 30 gün issued vs plan kotası.
  const user = Users.byId(ownerId);
  if (user) {
    const kullanilan = Usage.aylikIssued(ownerId);
    const kd = kotaDurumu(kullanilan, user.plan);
    if (kd.uyari) {
      const yuzde = Math.round(kd.oran * 100);
      liste.push({
        id: `sys_kota_${ownerId}`,
        kaynak: "sistem",
        severity: kd.asildi ? "critical" : "high",
        kategori: "kota",
        title: kd.asildi ? "Aylık doğrulama kotası aşıldı" : `Kota kullanımı %${yuzde}`,
        message: kd.asildi
          ? `Bu ay ${kullanilan.toLocaleString("tr-TR")} / ${kd.kota.toLocaleString("tr-TR")} doğrulama kullanıldı. ${kd.asimDavranisi === "block" ? "Yeni istekler reddediliyor." : "Fazla kullanım ücretlendiriliyor."} Planı yükseltmeyi düşünün.`
          : `Aylık kotanızın %${yuzde}'i kullanıldı (${kullanilan.toLocaleString("tr-TR")} / ${kd.kota.toLocaleString("tr-TR")}). Kalan: ${kd.kalan.toLocaleString("tr-TR")}.`,
        ts: now - 2 * 3600000,
        // Türetilmiş: yalnızca eşik altındayken "okunmuş" sayılır; eşik aşılıysa okunmamış kalır.
        read: false,
        href: "/panel/ayarlar/plan",
      });
    }
  }

  // 3) Bekleyen ekip davetleri (türetilmiş).
  for (const m of Team.forOwner(ownerId)) {
    if (m.status === "invited" && m.invitedAt) {
      liste.push({
        id: `sys_davet_${m.id}`,
        kaynak: "sistem",
        severity: "low",
        kategori: "ekip",
        title: "Bekleyen ekip daveti",
        message: `${m.name} (${m.email}) davet edildi, henüz katılmadı${m.role ? ` — rol: ${m.role}` : ""}.`,
        ts: m.invitedAt,
        read: false,
        href: "/panel/ekip",
      });
    }
  }

  // 4) Son üretilen raporlar — "Rapor hazır" (türetilmiş, son 7 gün).
  const raporlar = Reports.historyForOwner(ownerId, 8);
  for (const r of raporlar) {
    if (r.createdAt < now - 7 * gun) continue;
    const kb = Math.max(1, Math.round(r.sizeBytes / 1024));
    liste.push({
      id: `sys_rapor_${r.id}`,
      kaynak: "sistem",
      severity: "low",
      kategori: "rapor",
      title: "Rapor hazır",
      message: `"${r.name}" raporu üretildi (${r.format.toUpperCase()}, ~${kb.toLocaleString("tr-TR")} KB). İndirmeye hazır.`,
      ts: r.createdAt,
      // Rapor bildirimleri bilgilendiricidir; 24 saatten eskisi okunmuş sayılır.
      read: r.createdAt < now - gun,
      href: "/panel/raporlar",
    });
  }

  // En yeni üstte.
  return liste.sort((a, b) => b.ts - a.ts);
}

export function panelSayilari(ownerId: string) {
  const sig = cacheSignature();
  const m = sayilarMemo.get(ownerId);
  if (m && m.sig === sig) return m.val;
  const val = panelSayilariHesap(ownerId);
  sayilarMemo.set(ownerId, { sig, val });
  return val;
}

function panelSayilariHesap(ownerId: string) {
  const events = Events.forOwner(ownerId, 2000);
  const son24 = events.filter((e) => e.ts > Date.now() - 86400000);
  const bots = son24.filter((e) => e.verdict === "blocked" || e.verdict === "challenged");
  const ai = son24.filter((e) => e.botClass === "ai_agent");
  return {
    son24Toplam: son24.length,
    son24Bot: bots.length,
    son24Ai: ai.length,
    kotuIp: IpRep.forOwner().filter((r) => r.threatScore > 60).length,
    aktifKural: Rules.forOwner(ownerId).filter((r) => r.enabled).length,
  };
}
