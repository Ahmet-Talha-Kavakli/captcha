import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import {
  Sites,
  Rules,
  Team,
  Tokens,
  Usage,
  Events,
  Integrations,
  Alerts,
  Audit,
  Users,
} from "@/lib/db/db";
import { planTanim } from "@/lib/specter/plans";
import { saglikHesap, type SaglikGirdi } from "@/lib/specter/hesap-saglik";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { HesapSaglikIstemci } from "./HesapSaglikIstemci";
import { hesapSaglikCeviri } from "./hesap-saglik.i18n";

export const metadata: Metadata = { title: "Hesap Sağlığı — Veylify" };

/** Bir epoch ms'den YYYY-MM-DD gün anahtarı (deterministik). */
function gunAnahtari(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export default async function HesapSaglikPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const tam = Users.byId(user.id) ?? user;

  // --- Repo verilerini topla (hepsi salt-okunur) ---
  const siteler = Sites.forOwner(user.id);
  const kurallar = Rules.forOwner(user.id);
  const ekip = Team.forOwner(user.id);
  const tokenlar = Tokens.forOwner(user.id);
  const kullanim30 = Usage.forOwner(user.id, 30);
  const olaylar = Events.forOwner(user.id, 500);
  const entegrasyonlar = Integrations.forOwner(user.id);
  const alarmlar = Alerts.forOwner(user.id);
  const denetim = Audit.forOwner(user.id, 100);

  const plan = planTanim(tam.plan);

  // --- "bugun" referansını verinin kendisinden deterministik türet ---
  // Argümansız new Date()/Date.now() KULLANMADAN: son aktiviteyi ve
  // "bugün"ü, hesaba ait en yeni olay/kullanım zaman damgasından alıyoruz.
  // Böylece sonAktiflikGun deterministiktir (test edilebilir).
  const olayMaxTs = olaylar.reduce((m, e) => Math.max(m, e.ts), 0);
  // Kullanım günlerinin en yenisi (YYYY-MM-DD → gün ortası ms).
  const kullanimGunleri = kullanim30.map((u) => u.day).sort();
  const enYeniKullanimGun = kullanimGunleri.length ? kullanimGunleri[kullanimGunleri.length - 1] : null;
  const kullanimMaxTs = enYeniKullanimGun ? Date.parse(enYeniKullanimGun + "T12:00:00.000Z") : 0;

  // Son aktivite = olay ve kullanımdan en yenisi.
  const sonAktiviteTs = Math.max(olayMaxTs, kullanimMaxTs);
  // "bugün" = kullanıcının son görülme anı ile son aktivite anının en yenisi.
  // (lastSeenAt hesaba özgü ve deterministik seed'den gelir.)
  const bugun = Math.max(sonAktiviteTs, tam.lastSeenAt ?? 0) || sonAktiviteTs;

  // Son aktiflikten bu yana geçen tam gün (gün anahtarı farkı — saat sapmasından bağımsız).
  const sonAktiflikGun =
    sonAktiviteTs > 0
      ? Math.max(
          0,
          Math.round((Date.parse(gunAnahtari(bugun)) - Date.parse(gunAnahtari(sonAktiviteTs))) / 86400000),
        )
      : 999; // hiç aktivite yoksa "uykuda" say

  // --- Türetilmiş sinyaller ---
  const aylikKullanim = kullanim30.reduce((a, u) => a + u.issued, 0);
  const trafikliSiteIds = new Set(kullanim30.filter((u) => u.issued > 0).map((u) => u.siteId));
  const dogrulanmisSite = siteler.filter((s) => s.verified).length;
  const ozelKural = kurallar.filter((r) => !r.system).length;
  const aiPolitikaSayisi = tam.aiPolicies ? Object.keys(tam.aiPolicies).length : 0;
  const aktifEntegrasyon = entegrasyonlar.filter((i) => i.aktif).length;
  const aktifToken = tokenlar.filter((t) => !t.revoked).length;
  const acikKritikAlarm = alarmlar.filter(
    (a) => a.severity === "critical" && (a.status === "acik" || a.status === "inceleniyor"),
  ).length;
  const cozulenAlarm = alarmlar.filter((a) => a.status === "cozuldu").length;
  const aktifGunSayisi = new Set(kullanim30.filter((u) => u.issued > 0).map((u) => u.day)).size;

  const girdi: SaglikGirdi = {
    plan: tam.plan,
    kota: plan.dogrulamaKotasi,
    aylikKullanim,
    siteSayisi: siteler.length,
    dogrulanmisSite,
    trafikliSite: trafikliSiteIds.size,
    kuralSayisi: kurallar.length,
    ozelKural,
    aiPolitikaSayisi,
    aktifEntegrasyon,
    ekipUyeSayisi: ekip.length,
    aktifTokenSayisi: aktifToken,
    denetimKayitSayisi: denetim.length,
    acikKritikAlarm,
    toplamAlarm: alarmlar.length,
    cozulenAlarm,
    aktifGunSayisi,
    sonAktiflikGun,
  };

  const sonuc = saglikHesap(girdi);

  // --- Kullanım trend grafiği için günlük seri (son 30 gün, boşluklar 0) ---
  const gunToplam = new Map<string, number>();
  for (const u of kullanim30) gunToplam.set(u.day, (gunToplam.get(u.day) ?? 0) + u.issued);
  // bugünden geriye 30 günlük eksen (deterministik: bugun referansından).
  const trend: { gun: string; deger: number }[] = [];
  const bazGun = Date.parse(gunAnahtari(bugun) + "T00:00:00.000Z");
  for (let i = 29; i >= 0; i--) {
    const g = gunAnahtari(bazGun - i * 86400000);
    trend.push({ gun: g, deger: gunToplam.get(g) ?? 0 });
  }

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: ceviri("nav.health", dil) }]}
        baslik={hesapSaglikCeviri("hs.baslik", dil)}
      />
      <HesapSaglikIstemci
        sonuc={sonuc}
        trend={trend}
        planAd={plan.ad}
        workspaceAd={tam.workspaceName || tam.name}
        girdi={girdi}
        dil={dil}
      />
    </>
  );
}
