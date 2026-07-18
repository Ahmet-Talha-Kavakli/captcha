/**
 * POST /api/v1/passive
 * ---------------------
 * Görünmez mod: challenge GÖSTERMEDEN, yalnızca davranış sinyalleri +
 * kural motoru ile karar verir. Skor yüksek + kurallar temizse "geçti"
 * döner ve kullanıcı hiç CAPTCHA görmez. Aksi halde widget klasik
 * ghost-font challenge'a düşer.
 *
 * Bu, reCAPTCHA v3 / Turnstile'ın sürtünmesiz akışının Specter karşılığı.
 */
import { NextResponse } from "next/server";
import { Sites, Events, Users, Usage, IpRep } from "@/lib/db/db";
import { rateLimit } from "@/lib/db/rate";
import { scoreBehavior, emptySignals, type BehaviorSignals } from "@/lib/specter/behavior";
import { signVerification, secureSeed, type VerificationClaim } from "@/lib/specter/crypto";
import { extractMeta, classifyUA, baslikSahtekarligi } from "@/lib/specter/request-meta";
import { evaluateRules } from "@/lib/specter/rule-engine";
import { Rules } from "@/lib/db/db";
import { aiAjanTespit } from "@/lib/specter/ai-agents";
import { aiAjanDogrula } from "@/lib/specter/ai-verify";
import { fingerprintUret } from "@/lib/specter/fingerprint";
import { tehditBeslemeEslestir } from "@/lib/specter/threat-feed";
import { originIzinli } from "@/lib/specter/origin-esles";
import { aramaBotuDegerlendir } from "@/lib/specter/arama-botu";
import type { Verdict } from "@/lib/db/schema";

// CORS — origin YALNIZCA site domain'i izinliyse yansıtılır (körü körüne değil).
function cors(origin: string | null, izinli?: string[]): Record<string, string> {
  const ok = izinli ? originIzinli(origin, izinli) : false;
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}
export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: cors(req.headers.get("origin")) });
}

export async function POST(req: Request) {
  // İşleme başlangıcı — event'e GERÇEK sunucu gecikmesi yazmak için.
  const t0 = performance.now();
  const origin = req.headers.get("origin");
  let headers = cors(origin); // site bilinene kadar güvenli varsayılan
  const body = await req.json().catch(() => ({}));
  const { siteKey } = body as { siteKey?: string };
  const signals: BehaviorSignals = { ...emptySignals(), ...(body.signals || {}) };

  if (!siteKey) return NextResponse.json({ error: "siteKey gerekli" }, { status: 400, headers });
  const site = Sites.bySiteKey(siteKey);
  if (!site || !site.active) return NextResponse.json({ error: "Geçersiz site anahtarı" }, { status: 403, headers });
  headers = cors(origin, site.domains); // site domain'ine göre yeniden hesapla
  if (!site.invisibleMode) {
    // Görünmez mod kapalı → daima challenge iste.
    return NextResponse.json({ passed: false, reason: "invisible_disabled" }, { status: 200, headers });
  }

  const meta = extractMeta(req);
  // İki kademeli rate-limit (DoS koruması): IP+site 150/dk (saldırgan yalnızca
  // kendi IP'sini kilitler; meşru kullanıcılar etkilenmez) + site geneli 3000/dk.
  const rlIp = rateLimit(`passive:${site.id}:${meta.ip}`, 150, 60_000);
  const rlSite = rateLimit(`passive:${site.id}`, 3000, 60_000);
  if (!rlIp.ok || !rlSite.ok) return NextResponse.json({ passed: false, reason: "rate" }, { status: 200, headers });

  const behavior = scoreBehavior(signals);

  // AI ajanı + parmak izini kural değerlendirmesinden ÖNCE türet; böylece
  // kurallar aiAgent/aiCategory/headless/tlsMismatch/httpVersion alanlarını görebilir.
  const aiAjan = aiAjanTespit((meta.ua || "").toLowerCase());
  const onKurBotClass = aiAjan ? "ai_agent" : classifyUA(meta.ua);
  const fpKural = fingerprintUret(meta.ua, onKurBotClass, meta.ip);

  // Kurallar da pasif akışta değerlendirilir (AI/parmak izi sinyalleriyle).
  const evalRes = evaluateRules(Rules.forSite(site.id), {
    ip: meta.ip, country: meta.country, asn: meta.asn, ua: meta.ua, path: meta.path,
    score: behavior.score, botClass: onKurBotClass,
    aiAgentId: aiAjan?.id ?? "", aiCategory: aiAjan?.kategori ?? "",
    headless: fpKural.headless, tlsUaUyumsuz: fpKural.tlsUaUyumsuz, httpVersion: fpKural.httpVersion,
  });
  if (evalRes.matched.length) Rules.bumpHits(evalRes.matched.map((m) => m.ruleId));

  // MEŞRU ARAMA BOTU: Googlebot/Bingbot gibi klasik arama motoru botları
  // davranış sinyali üretmez → aksi halde challenge'a düşer ve müşterinin SEO'su
  // zarar görür. UA imzası + kaynak IP'nin operatörün RESMİ CIDR bloğunda olması
  // BİRLİKTE doğrulanır (UA taklidi yeterli değil; sahte Googlebot geçemez).
  // Doğrulanmış arama botu → davranış eşiğini bypass eder (AI "izin" gibi), ama
  // otomasyon vetosu + tehdit beslemesi + block kuralı yine geçerli kalır.
  const aramaBotu = aramaBotuDegerlendir(meta.ua, meta.ip);
  const dogrulanmisAramaBotu = aramaBotu.eslesti && aramaBotu.dogrulandi;

  // AI Ajan politikası: istek bilinen bir AI crawler'dan geliyorsa, site
  // sahibinin bu ajan için belirlediği politikayı uygula (izin/doğrula/engelle).
  // Belirtilmemişse Veylify'ın önerilen varsayılanı geçerli.
  let aiEngeli = false;
  let aiIzin = false; // "izin" → davranış eşiğini BYPASS et (AI'da davranış sinyali yok).
  if (aiAjan) {
    const sahip = Users.byId(site.ownerId);
    const politika = sahip?.aiPolicies?.[aiAjan.id] || aiAjan.onerilenPolitika;
    // ANTI-SPOOFING (kritik): AI ajanı SADECE User-Agent'tan tespit edilir; UA
    // trivial taklit edilir. "izin" politikası davranış eşiğini bypass ettiğinden,
    // izni ancak ajan GERÇEKTEN doğrulanırsa (kaynak IP operatörün resmi CIDR'ında
    // / reverse-DNS operatör alanına çözülüyor) veririz. Doğrulanamayan/SAHTE bir
    // "izin"li ajan (UA taklidi) izin ALMAZ → görünmez geçemez, challenge'a düşer.
    // (Aksi halde kazıyıcı "OAI-SearchBot" UA'sıyla korumayı tamamen atlardı.)
    const dogrulama = aiAjanDogrula(aiAjan.id, aiAjan.dogrulama, meta.ip);
    if (politika === "izin") {
      if (dogrulama.durum === "dogrulandi") aiIzin = true;
      else aiEngeli = true; // UA "izin"li ajan iddia ediyor ama IP doğrulanamadı → challenge
    } else {
      aiEngeli = true; // "doğrula" | "engelle" → görünmez geçemez (challenge)
    }
  }

  // Tehdit beslemesi: IP/ASN bilinen kötü altyapıyla (Tor/bulletproof/botnet)
  // eşleşiyorsa yüksek güvenle görünmez geçişi engelle → challenge'a düşür.
  const besleme = tehditBeslemeEslestir(meta.ip, meta.asn);
  const beslemeEngeli = besleme.eslesti && besleme.maxGuven >= 0.85;

  // Geçiş şartı: davranış görünmez-eşiğin ÜSTÜNDE + kural block/challenge değil
  // + AI politikası engellemiyor + tehdit beslemesi işaretlemiyor.
  // ÖZEL: "izin" verilen AI ajanı davranış eşiğinden MUAF — AI crawler'lar
  // fare/klavye davranışı üretmez; site sahibi bilerek erişim verdi. Yine de
  // kural motoru ve tehdit beslemesi (bilinen kötü altyapı) geçerli kalır.
  const invisibleEsik = Math.max(0.6, site.behaviorThreshold + 0.25);
  // AI ajanına AÇIKÇA "izin" verildiyse, bu spesifik izin genel bot kurallarını
  // (ör. botClass=ai_agent→challenge) ve davranış eşiğini geçersiz kılar —
  // spesifik politika > genel kural. Ancak "block" aksiyonlu bir kural yine de
  // en katı olarak kalır (kullanıcı hem izin hem block yazdıysa güvenlik önce).
  const kesinBlock = evalRes.action === "block";
  const kuralEngeli = aiIzin ? kesinBlock : (evalRes.action === "block" || evalRes.action === "challenge");

  // ── KESİN OTOMASYON VETOSU ──────────────────────────────────────────
  // İstemci-tarafı davranış sinyalleri UYDURULABİLİR: bir bot mükemmel fare/
  // tuş sinyalleri enjekte edip yüksek skor toplayabilir. Bu yüzden davranış
  // skoru TEK BAŞINA görünmez geçiş için yeterli değildir. `navigator.webdriver`
  // veya headless/otomasyon parmak-izi gibi TARTIŞMASIZ otomasyon kanıtları
  // varsa, skor ne olursa olsun görünmez geçiş REDDEDİLİR (challenge'a düşer) —
  // çünkü bu işaretler "ben otomasyonum" itirafıdır. AI "izin" bunu bypass etmez
  // (izin verilen AI zaten davranış eşiğinden muaf ama otomasyon-yalanı söyleyen
  // bir crawler değil, dürüst UA ile gelir; yine de veto güvenlik için kalır).
  // GERÇEK, UA-taklidine BAĞIŞIK üçüncü kanıt: istemci "Chrome/Edge" iddia
  // ediyor ama gerçek Chromium'un daima gönderdiği başlık setini (Client Hints
  // sec-ch-ua + Accept-Language + tarayıcı Accept) göndermiyor → UA sahtekârlığı.
  // signals.webdriver istemci-beyanıdır (bot yalanlar); baslikSahtekarligi ise
  // sunucunun GÖRDÜĞÜ ham başlıklardan türer — bot bunu enjekte edemez.
  const baslikYalani = baslikSahtekarligi(meta.headerSinyal);
  const otomasyonKaniti = signals.webdriver === true || fpKural.headless === true || baslikYalani;

  // Doğrulanmış arama botu VEYA "izin"li AI ajanı davranış eşiğinden muaftır
  // (ikisi de fare/klavye üretmez). Yine de kural-block, tehdit-beslemesi ve
  // otomasyon vetosu geçerli — meşru bir arama botu bunları zaten tetiklemez.
  const davranisGecti = aiIzin || dogrulanmisAramaBotu || behavior.score >= invisibleEsik;
  const gecti = davranisGecti && !kuralEngeli && !aiEngeli && !beslemeEngeli && !otomasyonKaniti;

  const now = Date.now();
  const verdict: Verdict = gecti ? "allowed" : "challenged";
  const m = extractMeta(req);
  const botClass = aiAjan ? "ai_agent" : gecti ? "human" : classifyUA(m.ua);
  const fp = fingerprintUret(m.ua, botClass, m.ip);
  Events.add({
    siteId: site.id, ts: now, ip: m.ip, country: m.country, asn: m.asn, ua: m.ua, path: m.path,
    botClass, verdict, score: behavior.score,
    triggeredRules: evalRes.matched.map((x) => x.ruleName), fingerprint: fp.ja3.slice(0, 8),
    method: m.method, latency: Math.max(0, Math.round(performance.now() - t0)),
    ja3: fp.ja3, ja4: fp.ja4, httpVersion: fp.httpVersion, headless: fp.headless,
    automationFlags: fp.automationFlags, tlsUaUyumsuz: fp.tlsUaUyumsuz, engine: fp.engine,
    headerAnomali: fp.headerAnomali, sinyaller: fp.sinyaller,
  });
  // Gerçek kullanım ölçümü: görünmez mod da doğrulama sayılır.
  Usage.increment(site.id, "issued", 1);
  Usage.increment(site.id, gecti ? "verified" : "challenged", 1);
  // GERÇEK ÖĞRENME (verify ile simetrik): IP itibarını gözlemle. Passive'de
  // "geçemedi" tek başına bot demek değil (meşru kullanıcı da olabilir), o yüzden
  // yalnızca KESİN otomasyon/AI/besleme kanıtı varsa itibar bozulur; temiz geçiş
  // itibarı iyileştirir. Böylece kesin-bot IP'lerin PoW zorluğu adaptif artar.
  const kesinBot = otomasyonKaniti || aiEngeli || beslemeEngeli;
  IpRep.gozlemle(m.ip, { country: m.country, asn: m.asn, bloklandi: kesinBot });

  // MONITOR MODU: "sadece izle" — görünmez geçemeyecek (challenge gerektiren)
  // istek bile ENGELLENMEZ; olay gerçek verdict'iyle (yukarıda "challenged")
  // loglandı, ama kullanıcıya geçiş token'ı verilir. "Önce izle, sonra engelle"
  // akışı için (Cloudflare Log modu). Daha önce mode HİÇ kontrol edilmiyordu.
  if (!gecti && site.mode === "monitor") {
    const claimM: VerificationClaim = {
      cid: "inv_" + secureSeed().toString(16), site: site.siteKey, success: true,
      iat: now, exp: now + 2 * 60 * 1000, score: behavior.score,
    };
    return NextResponse.json(
      { passed: true, monitor: true, wouldChallenge: true, token: signVerification(claimM, site.secretKey), score: behavior.score },
      { status: 200, headers },
    );
  }

  if (!gecti) {
    // Sebep önceliği: kesin otomasyon kanıtı > AI politikası > kural > tehdit
    // beslemesi > düşük davranış. Böylece istemci veya panel neden challenge'a
    // düşüldüğünü doğru görür (uydurma sinyalle yüksek skor toplanmış olsa bile).
    const reason = otomasyonKaniti ? "automation_detected"
      : aiEngeli ? "ai_policy"
      : kuralEngeli ? "rule_challenge"
      : beslemeEngeli ? "threat_feed"
      : "needs_challenge";
    return NextResponse.json({ passed: false, reason, score: behavior.score }, { status: 200, headers });
  }

  const claim: VerificationClaim = {
    cid: "inv_" + secureSeed().toString(16), site: site.siteKey, success: true,
    iat: now, exp: now + 2 * 60 * 1000, score: behavior.score,
  };
  const verification = signVerification(claim, site.secretKey);
  return NextResponse.json({ passed: true, token: verification, score: behavior.score }, { status: 200, headers });
}
