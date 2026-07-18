import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { korumaOzeti, panelSayilari } from "@/lib/ozet";
import { Events, Usage, Campaigns, Sites, Rules, IpRep, Alerts, Integrations, Users, Tokens } from "@/lib/db/db";
import { planTanim } from "@/lib/specter/plans";
import { anomaliTespit } from "@/lib/specter/anomaly";
import { korumaSkoruHesap } from "@/lib/specter/protection-score";
import { tehditDurusu } from "@/lib/specter/tehdit-durusu";
import { saldiriYuzeyi } from "@/lib/specter/saldiri-yuzeyi";
import { canliNabiz } from "@/lib/specter/canli-nabiz";
import { cografyaIstihbarat } from "@/lib/specter/cografya-istihbarat";
import { savunmaEtkinlik } from "@/lib/specter/savunma-etkinlik";
import { aiBotRadar } from "@/lib/specter/ai-bot-radar";
import { brifingGirdiTopla, brifingUret } from "@/lib/specter/tehdit-brifing";
import { roiHesap, fiyatTl } from "@/lib/specter/roi";
import { botEkonomiHesap } from "@/lib/specter/bot-ekonomi";
import { korelasyonBul, korelasyonOzet, type KorelasyonOlay } from "@/lib/specter/correlation";
import { killChainCikar, killChainOzet } from "@/lib/specter/kill-chain";
import { iliskiGrafigi } from "@/lib/specter/iliski-grafigi";
import { tehditAktorAnaliz } from "@/lib/specter/tehdit-aktor";
import { niyetSiniflandir, saldirganNiyetleri, niyetOzet } from "@/lib/specter/niyet-siniflandirma";
import { saldiriZamanTuneli, tunelOzet } from "@/lib/specter/zaman-tuneli";
import { tlsIstihbarat } from "@/lib/specter/tls-istihbarat";
import { savunmaGenel } from "@/lib/specter/savunma-katmanlari";
import { bosluklariBul, otoDuzeltmeCalistir } from "@/lib/specter/oto-duzeltme";
import { apiAbuseAnaliz } from "@/lib/specter/api-kotuye";
import { kalibrasyonAnaliz } from "@/lib/specter/skor-kalibrasyon";
import { federeKorelasyon } from "@/lib/specter/federe-korelasyon";
import { biyometriAnaliz, ornekSinyal, type OrnekTur } from "@/lib/specter/davranis-biyometri";
import { tehditAvi, AV_SABLONLARI } from "@/lib/specter/tehdit-avi";
import { BESLEMELER, beslemeOzeti, tehditBeslemeEslestir } from "@/lib/specter/threat-feed";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { GenelBakisIstemci } from "./GenelBakisIstemci";

export const metadata: Metadata = { title: "Genel Bakış — Veylify" };

export default async function PanelAnaSayfa() {
  const user = await currentUser();
  if (!user) return null;

  const dil = await panelDil();

  const ozet = korumaOzeti(user.id);
  const sayilar = panelSayilari(user.id);
  const events = Events.forOwner(user.id, 400);
  const sonOlaylar = events.slice(0, 6);
  const campaigns = Campaigns.forOwner(user.id).slice(0, 3);

  // Onboarding durumu — 5 adımlı sihirbaz için gerçek durumdan türetilir.
  const sites = Sites.forOwner(user.id);
  const ownSiteId = sites[0]?.id;
  const dogrulanmisSite = sites.some((s) => s.verified);
  const rules = Rules.forOwner(user.id);
  const ozelKuralVar = rules.some((r) => !r.system);
  // API anahtarı: iptal edilmemiş en az bir token → "API anahtarını al" adımı tamam.
  const apiAnahtarVar = Tokens.forOwner(user.id).some((tk) => !tk.revoked);
  const onboarding = {
    siteVar: sites.length > 0,
    dogrulandiVar: dogrulanmisSite,
    trafikVar: ozet.totals.issued > 0 || Events.forOwner(user.id, 1).length > 0,
    dogrulamaVar: ozet.totals.issued > 0,
    kuralVar: ozelKuralVar,
    apiAnahtarVar,
    ilkSiteId: ownSiteId ?? null,
  };
  const tamamlandi =
    onboarding.siteVar && onboarding.dogrulandiVar && onboarding.trafikVar &&
    onboarding.dogrulamaVar && onboarding.kuralVar && onboarding.apiAnahtarVar;

  // 14 günlük trend: günlük engellenen + verilen doğrulama (çift seri).
  const usage14 = Usage.forOwner(user.id, 14);
  const gunler: string[] = [];
  for (let i = 13; i >= 0; i--) gunler.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  const blokMap = new Map<string, number>();
  const verilenMap = new Map<string, number>();
  for (const u of usage14) {
    blokMap.set(u.day, (blokMap.get(u.day) || 0) + u.blocked);
    verilenMap.set(u.day, (verilenMap.get(u.day) || 0) + u.issued);
  }
  const trendBlok = gunler.map((g) => blokMap.get(g) || 0);
  const trendVerilen = gunler.map((g) => verilenMap.get(g) || 0);
  const trendEtiket = gunler.map((g) => g.slice(5));

  // Plan kotası.
  const usage30 = Usage.forOwner(user.id, 30);
  const kullanilan = usage30.reduce((a, u) => a + u.issued, 0);
  const kota = planTanim(user.plan).dogrulamaKotasi;
  const planAd = user.plan === "pro" ? "Koruyucu" : user.plan === "scale" ? "Kurumsal" : "Başlangıç";

  // En çok engellenen IP'ler (son 400 olaydan türetilir) — "başlıca saldırganlar".
  const ipSay = new Map<string, { ip: string; country: string; blocked: number; total: number; botClass: string }>();
  for (const e of events) {
    const k = ipSay.get(e.ip) ?? { ip: e.ip, country: e.country, blocked: 0, total: 0, botClass: e.botClass };
    k.total += 1;
    if (e.verdict === "blocked" || e.verdict === "challenged") k.blocked += 1;
    ipSay.set(e.ip, k);
  }
  const baslicaSaldirgan = [...ipSay.values()]
    .filter((x) => x.blocked > 0)
    .sort((a, b) => b.blocked - a.blocked)
    .slice(0, 5);

  // Modül kısayolları için canlı sayılar.
  const kotuIpler = IpRep.forOwner().filter((r) => r.category === "malicious" || r.threatScore >= 70);
  const aktifOlaylar = Alerts.forOwner(user.id).filter((a) => a.severity === "critical" || a.severity === "high").filter((a) => !a.read).length;
  const moduller = [
    { key: "trafik", ad: "Canlı Trafik", href: "/panel/trafik", icon: "Radar", deger: `${sayilar.son24Toplam.toLocaleString("tr-TR")} olay / 24s` },
    { key: "tehdit", ad: "Tehdit İstihbaratı", href: "/panel/tehdit", icon: "ShieldAlert", deger: `${kotuIpler.length} kötü ün IP` },
    { key: "ai", ad: "AI Ajan İstihbaratı", href: "/panel/ai-ajanlar", icon: "Bot", deger: `${sayilar.son24Ai} AI denemesi / 24s` },
    { key: "korelasyon", ad: "Olay Korelasyonu", href: "/panel/korelasyon", icon: "Workflow", deger: "SIEM saldırı zincirleri" },
    { key: "kurallar", ad: "Kurallar", href: "/panel/kurallar", icon: "GitBranch", deger: `${sayilar.aktifKural} aktif kural` },
    { key: "uyum", ad: "Uyum & Sertifika", href: "/panel/uyum", icon: "ShieldCheck", deger: "SOC2 · ISO · KVKK · GDPR" },
  ];

  // Anomali tespiti + AI içgörü.
  const anomaliOlaylar = Events.forOwner(user.id, 3000);
  const anomaliler = anomaliTespit(anomaliOlaylar).slice(0, 3).map((a) => ({
    tur: a.tur, siddet: a.siddet, baslik: a.baslik, aciklama: a.aciklama, oneri: a.oneri ?? "",
  }));
  const icgoru = aiIcgoruUret(ozet, sayilar, anomaliler.length);

  // ── DERİNLİK MOTORLARI ─────────────────────────────────────────────
  // guven-merkezi düzenini Specter'ın GERÇEK güvenlik istihbaratıyla doldur.
  // Hepsi saf/deterministik; "şimdi" tek referans; 3000-olay penceresinden hesap.
  const simdi = Date.now();
  const durus = tehditDurusu(anomaliOlaylar, simdi);          // 5-eksen tehdit duruşu (skor halkası + kırılım)
  const yuzey = saldiriYuzeyi(anomaliOlaylar);                 // saldırı yüzeyi (sınıf/yol/yöntem/protokol/TLS)
  const nabiz = canliNabiz(anomaliOlaylar, simdi);             // canlı nabız + 24s saatlik seri
  const cografya = cografyaIstihbarat(anomaliOlaylar);         // ülke + ASN istihbaratı
  const savunma = savunmaEtkinlik(anomaliOlaylar, simdi);      // kural perf + yakalama hunisi + FP riski
  const aiRadar = aiBotRadar(anomaliOlaylar, simdi);           // AI ajan radarı (Specter'ın ana farkı)

  // Şeffaf koruma skoru — ağırlıklı alt-sistemler + "neden bu skor" kırılımı.
  const alerts = Alerts.forOwner(user.id);
  const cozulen = alerts.filter((a) => a.status === "cozuldu");
  const mttrler = cozulen
    .filter((a) => a.resolvedAt && a.ts)
    .map((a) => (a.resolvedAt! - a.ts) / 60000); // dk
  const ortMttrDk = mttrler.length ? mttrler.reduce((x, y) => x + y, 0) / mttrler.length : null;
  const skorSonuc = korumaSkoruHesap({
    siteSayisi: sites.length,
    aktifKorumaSite: sites.filter((s) => s.mode !== "monitor").length,
    dogrulanmisSite: sites.filter((s) => s.verified).length,
    blockRate: ozet.blockRate,
    aktifKural: rules.filter((r) => r.enabled).length,
    ozelKural: rules.filter((r) => !r.system).length,
    aiPolitikaSayisi: Object.keys(Users.byId(user.id)?.aiPolicies ?? {}).length,
    acikKritikOlay: alerts.filter((a) => a.severity === "critical" && a.status !== "cozuldu" && a.status !== "yoksayildi").length,
    cozulenOlay: cozulen.length,
    toplamOlay: alerts.length,
    ortMttrDk,
    entegrasyonSayisi: Integrations.forOwner(user.id).filter((i) => i.aktif).length,
  });

  // ── 100x DERİNLİK KATMANI: iş etkisi + saldırı hikayesi + yönetici brifingi ──
  // Kullanılmayan güçlü motorları genel bakışa bağlar. Hepsi 3000-olay
  // penceresinden, saf/deterministik (simdi tek referans).

  // Korelasyon (SIEM saldırı zincirleri) — brifinge girdi + kendi bölümü.
  const korelasyonOlaylar: KorelasyonOlay[] = anomaliOlaylar.map((e) => ({
    id: e.id, ts: e.ts, ip: e.ip, country: e.country, asn: e.asn,
    botClass: e.botClass, verdict: e.verdict, path: e.path, score: e.score, ua: e.ua,
  }));
  const korelasyonlar = korelasyonBul(korelasyonOlaylar);
  const korOzet = korelasyonOzet(korelasyonlar);

  // Kill-chain (saldırgan başına 6-aşama zincir) + özet.
  const killZincirler = killChainCikar(anomaliOlaylar, 40);
  const killOzet = killChainOzet(killZincirler);

  // İlişki grafiği (aynı fingerprint/ASN paylaşan IP'ler → botnet kümeleri).
  const iliskiGraf = iliskiGrafigi(anomaliOlaylar);

  // Tehdit aktör atfı (saldırgan altyapısını bilinen aktör arketiplerine eşle).
  const aktorSonuc = tehditAktorAnaliz(anomaliOlaylar);

  // Saldırgan niyet analizi (finansal/veri/yıkım/keşif motivasyonu).
  const niyetGenel = niyetSiniflandir(anomaliOlaylar);
  const niyetSaldirgan = saldirganNiyetleri(anomaliOlaylar, 12);
  const niyetOzeti = niyetOzet(anomaliOlaylar, niyetSaldirgan);

  // Saldırı zaman tüneli (kronolojik kill-chain fazları + adli anlatı).
  const zamanIncidentler = saldiriZamanTuneli(korelasyonOlaylar);
  const zamanOzeti = tunelOzet(zamanIncidentler);

  // TLS/JA3 parmak izi istihbaratı (sahte-tarayıcı + headless tespiti).
  const tlsSonuc = tlsIstihbarat(anomaliOlaylar);

  // Çok-katmanlı savunma derinliği (4 katmanın kapsaması).
  const savunmaKatman = savunmaGenel(anomaliOlaylar);

  // Kendi kendini iyileştiren savunma (boşluk tespiti + oto-kural sentezi).
  const otoBosluklar = bosluklariBul(anomaliOlaylar);
  const otoRapor = otoDuzeltmeCalistir(anomaliOlaylar, rules);

  // API kötüye-kullanım + rate-limit istihbaratı (endpoint başına abuse skoru).
  const apiAbuse = apiAbuseAnaliz(anomaliOlaylar, 5);

  // Skor kalibrasyonu (reliability diagram — model güvenilirliği).
  const kalibrasyon = kalibrasyonAnaliz(anomaliOlaylar);

  // Çapraz-site federe korelasyon (aynı saldırgan birden çok siteyi vuruyor mu).
  const federe = federeKorelasyon(anomaliOlaylar, sites.length);

  // Davranışsal biyometri — 4 örnek profili (insan/mobil/script-bot/gürültü-bot)
  // gerçek motorla analiz et; açıklanabilir insanlık skoru + katkı barları.
  const biyometriTurler: OrnekTur[] = ["insan", "mobil-insan", "script-bot", "gurultu-bot"];
  const biyometriKartlar = biyometriTurler.map((tur) => ({
    tur,
    sonuc: biyometriAnaliz(ornekSinyal(tur)),
  }));

  // Tehdit avı — hazır şablonları gerçek olay kümesine karşı çalıştır; en çok
  // eşleşen şablonu "çalıştırılan sorgu" olarak öne çıkar (gerçek sonuç).
  const avSablonlar = AV_SABLONLARI.map((s) => ({
    ad: s.ad,
    sorgu: s.sorgu,
    aciklama: s.aciklama,
    eslesme: tehditAvi(s.sorgu, anomaliOlaylar).eslesme,
  }));
  const avAktif =
    [...avSablonlar].sort((a, b) => b.eslesme - a.eslesme)[0] ?? {
      ad: "Headless botlar", sorgu: "headless:true", aciklama: "Puppeteer/Playwright imzaları.", eslesme: 0,
    };
  const avGoster = {
    sorgu: avAktif.sorgu,
    aciklama: avAktif.aciklama,
    sonuc: tehditAvi(avAktif.sorgu, anomaliOlaylar),
  };

  // Global tehdit beslemesi — gözlemlenen IP'leri bilinen kötü altyapı
  // beslemeleriyle eşleştir (Tor/botnet/bulletproof/VPN/datacenter/scanner/spam).
  const beslemeOzet = beslemeOzeti();
  const ipOlaySay = new Map<string, { country: string; asn: string; sayi: number }>();
  for (const e of anomaliOlaylar) {
    const k = ipOlaySay.get(e.ip) ?? { country: e.country, asn: e.asn, sayi: 0 };
    k.sayi += 1;
    ipOlaySay.set(e.ip, k);
  }
  const beslemeVuruslar = [...ipOlaySay.entries()]
    .map(([ip, v]) => {
      const es = tehditBeslemeEslestir(ip, v.asn);
      if (!es.eslesti) return null;
      const enGuvenli = es.kaynaklar[0];
      return {
        ip, country: v.country, asn: v.asn,
        kaynak: enGuvenli.kaynak, kaynakAd: enGuvenli.ad, guven: enGuvenli.guven, olaySayisi: v.sayi,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.guven - a.guven || b.olaySayisi - a.olaySayisi);
  const besleme = {
    toplamKayit: beslemeOzet.toplamKayit,
    aktifBesleme: beslemeOzet.aktifBesleme,
    enGuncelGun: beslemeOzet.enGuncelGun,
    gozlemlenenIp: ipOlaySay.size,
    eslesenIp: beslemeVuruslar.length,
    beslemeler: BESLEMELER,
    vuruslar: beslemeVuruslar,
  };

  // İş etkisi: ROI (engellenen botların TL karşılığı) + bot ekonomisi (caydırıcılık).
  const botDagilim: Record<string, number> = {};
  for (const e of anomaliOlaylar) {
    if (e.verdict === "blocked" || e.verdict === "challenged") {
      botDagilim[e.botClass] = (botDagilim[e.botClass] || 0) + 1;
    }
  }
  const specterAylikTl = fiyatTl(planTanim(user.plan).fiyat);
  const roi = roiHesap(botDagilim, specterAylikTl);
  const ekonomi = botEkonomiHesap(anomaliOlaylar);

  // Yönetici tehdit brifingi (24s / 7g / 30g) — otomatik istihbarat anlatısı.
  const brifingEkstra = {
    anomaliSayi: anomaliler.length,
    korelasyonSayi: korelasyonlar.length,
    aktifKampanya: campaigns.filter((c) => c.status === "active").length,
    kritikOlay: alerts.filter((a) => a.severity === "critical" && a.status !== "cozuldu" && a.status !== "yoksayildi").length,
    korumaSkoru: skorSonuc.skor,
  };
  const brifing24 = brifingUret(brifingGirdiTopla(anomaliOlaylar, "24s", simdi, brifingEkstra));
  const brifing7 = brifingUret(brifingGirdiTopla(anomaliOlaylar, "7g", simdi, brifingEkstra));
  const brifing30 = brifingUret(brifingGirdiTopla(anomaliOlaylar, "30g", simdi, brifingEkstra));

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.overview", dil) }]} baslik={ceviri("nav.overview", dil)} />
      <GenelBakisIstemci
        dil={dil}
        ad={user.name}
        planAd={planAd}
        kullanilan={kullanilan}
        kota={kota}
        ozet={ozet}
        sayilar={sayilar}
        onboarding={tamamlandi ? null : onboarding}
        events={sonOlaylar.map((e) => ({ id: e.id, ts: e.ts, ip: e.ip, country: e.country, botClass: e.botClass, verdict: e.verdict, path: e.path, score: e.score }))}
        campaigns={campaigns.map((c) => ({ id: c.id, name: c.name, status: c.status, botClass: c.botClass, blocked: c.blockedRequests, peak: c.peakRps }))}
        anomaliler={anomaliler}
        icgoru={icgoru}
        trendBlok={trendBlok}
        trendVerilen={trendVerilen}
        trendEtiket={trendEtiket}
        moduller={moduller}
        baslicaSaldirgan={baslicaSaldirgan}
        aktifOlay={aktifOlaylar}
        skorSonuc={skorSonuc}
        durus={durus}
        yuzey={yuzey}
        nabiz={nabiz}
        cografya={cografya}
        savunma={savunma}
        aiRadar={aiRadar}
        brifing24={brifing24}
        brifing7={brifing7}
        brifing30={brifing30}
        roi={roi}
        ekonomi={ekonomi}
        killZincirler={killZincirler}
        killOzet={killOzet}
        korelasyonlar={korelasyonlar}
        korOzet={korOzet}
        iliskiGraf={iliskiGraf}
        aktorSonuc={aktorSonuc}
        niyetGenel={niyetGenel}
        niyetSaldirgan={niyetSaldirgan}
        niyetOzeti={niyetOzeti}
        zamanIncidentler={zamanIncidentler}
        zamanOzeti={zamanOzeti}
        tlsSonuc={tlsSonuc}
        savunmaKatman={savunmaKatman}
        otoBosluklar={otoBosluklar}
        otoRapor={otoRapor}
        otoSiteId={ownSiteId ?? null}
        apiAbuse={apiAbuse}
        kalibrasyon={kalibrasyon}
        federe={federe}
        biyometriKartlar={biyometriKartlar}
        avGoster={avGoster}
        avSablonlar={avSablonlar}
        besleme={besleme}
      />
    </>
  );
}

/** AI içgörü üreteci — koruma özetinden veriye-dayalı içgörü + eylem önerisi. */
function aiIcgoruUret(
  ozet: ReturnType<typeof korumaOzeti>,
  sayilar: ReturnType<typeof panelSayilari>,
  anomaliSayi: number,
): { baslik: string; metin: string; eylem: { ad: string; href: string } | null } {
  const botOran = Math.round(ozet.blockRate * 100);
  if (anomaliSayi > 0) {
    return {
      baslik: "Dikkat gerektiren aktivite var",
      metin: `Son 48 saatte ${anomaliSayi} anormal desen tespit ettim. Trafik desenin normalden sapıyor — aşağıdaki içgörüleri incele.`,
      eylem: { ad: "Tehdit İstihbaratı", href: "/panel/tehdit" },
    };
  }
  if (ozet.skor >= 85) {
    return {
      baslik: "Koruman güçlü durumda",
      metin: `Koruma skorun ${ozet.skor}/100. Son 24 saatte ${sayilar.son24Bot} bot engelledim, bot oranın %${botOran}. Sistemin sağlıklı çalışıyor.`,
      eylem: sayilar.son24Ai > 0 ? { ad: "AI ajan trafiğini gör", href: "/panel/ai-ajanlar" } : null,
    };
  }
  if (ozet.skor < 60) {
    return {
      baslik: "Korumanı güçlendirebilirsin",
      metin: `Koruma skorun ${ozet.skor}/100 — iyileştirme alanı var. Kural motorunda daha agresif kurallar ekleyerek veya davranış eşiğini yükselterek skoru artırabilirsin.`,
      eylem: { ad: "Kuralları düzenle", href: "/panel/kurallar" },
    };
  }
  return {
    baslik: "Sistemin izleniyor",
    metin: `Koruma skorun ${ozet.skor}/100, bot oranın %${botOran}. ${sayilar.kotuIp} kötü ün IP takip ediyorum. Her şey normal seyrinde.`,
    eylem: sayilar.son24Ai > 3 ? { ad: "AI ajanlarını yönet", href: "/panel/ai-ajanlar" } : null,
  };
}
