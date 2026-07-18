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
import { Sites, Events, Users, Usage } from "@/lib/db/db";
import { rateLimit } from "@/lib/db/rate";
import { scoreBehavior, emptySignals, type BehaviorSignals } from "@/lib/specter/behavior";
import { signVerification, secureSeed, type VerificationClaim } from "@/lib/specter/crypto";
import { extractMeta, classifyUA } from "@/lib/specter/request-meta";
import { evaluateRules } from "@/lib/specter/rule-engine";
import { Rules } from "@/lib/db/db";
import { aiAjanTespit } from "@/lib/specter/ai-agents";
import { fingerprintUret } from "@/lib/specter/fingerprint";
import { tehditBeslemeEslestir } from "@/lib/specter/threat-feed";
import type { Verdict } from "@/lib/db/schema";

function cors(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "null",
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
  const headers = cors(origin);
  const body = await req.json().catch(() => ({}));
  const { siteKey } = body as { siteKey?: string };
  const signals: BehaviorSignals = { ...emptySignals(), ...(body.signals || {}) };

  if (!siteKey) return NextResponse.json({ error: "siteKey gerekli" }, { status: 400, headers });
  const site = Sites.bySiteKey(siteKey);
  if (!site || !site.active) return NextResponse.json({ error: "Geçersiz site anahtarı" }, { status: 403, headers });
  if (!site.invisibleMode) {
    // Görünmez mod kapalı → daima challenge iste.
    return NextResponse.json({ passed: false, reason: "invisible_disabled" }, { status: 200, headers });
  }

  const rl = rateLimit(`passive:${site.id}`, 300, 60_000);
  if (!rl.ok) return NextResponse.json({ passed: false, reason: "rate" }, { status: 200, headers });

  const behavior = scoreBehavior(signals);
  const meta = extractMeta(req);

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

  // AI Ajan politikası: istek bilinen bir AI crawler'dan geliyorsa, site
  // sahibinin bu ajan için belirlediği politikayı uygula (izin/doğrula/engelle).
  // Belirtilmemişse Veylify'ın önerilen varsayılanı geçerli.
  let aiEngeli = false;
  let aiIzin = false; // "izin" → davranış eşiğini BYPASS et (AI'da davranış sinyali yok).
  if (aiAjan) {
    const sahip = Users.byId(site.ownerId);
    const politika = sahip?.aiPolicies?.[aiAjan.id] || aiAjan.onerilenPolitika;
    if (politika === "izin") aiIzin = true;
    else aiEngeli = true; // "doğrula" | "engelle" → görünmez geçemez (challenge)
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
  const davranisGecti = aiIzin || behavior.score >= invisibleEsik;
  const gecti = davranisGecti && !kuralEngeli && !aiEngeli && !beslemeEngeli;

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

  if (!gecti) {
    return NextResponse.json({ passed: false, reason: "needs_challenge", score: behavior.score }, { status: 200, headers });
  }

  const claim: VerificationClaim = {
    cid: "inv_" + secureSeed().toString(16), site: site.siteKey, success: true,
    iat: now, exp: now + 2 * 60 * 1000, score: behavior.score,
  };
  const verification = signVerification(claim, site.secretKey);
  return NextResponse.json({ passed: true, token: verification, score: behavior.score }, { status: 200, headers });
}
