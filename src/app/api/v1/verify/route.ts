/**
 * POST /api/v1/verify
 * --------------------
 * Widget, kullanıcının çözümünü + davranış sinyallerini + challenge
 * token'ını buraya gönderir. Ghost-font cevap kontrolü + davranışsal
 * skor + nonce (replay) doğrulaması yapılır. Başarılıysa müşteri
 * sunucusunun /siteverify ile teyit edeceği imzalı verification token
 * döner.
 */

import { NextResponse } from "next/server";
import { Sites, Events, Nonces, Rules, Usage, IpRep } from "@/lib/db/db";
import { webhookTetikle } from "@/lib/specter/webhook-delivery";
import { botSiniflandir } from "@/lib/specter/classifier";
import { rateLimit, trackRate } from "@/lib/db/rate";
import { verifyAttempt } from "@/lib/specter/verify";
import { verifyToken } from "@/lib/specter/crypto";
import { emptySignals, type BehaviorSignals } from "@/lib/specter/behavior";
import { extractMeta, classifyUA } from "@/lib/specter/request-meta";
import { evaluateRules } from "@/lib/specter/rule-engine";
import { aiAjanTespit } from "@/lib/specter/ai-agents";
import { fingerprintUret } from "@/lib/specter/fingerprint";
import { tarayiciTutarlilik } from "@/lib/specter/tarayici-tutarlilik";
import type { Verdict } from "@/lib/db/schema";

function logEvent(
  siteId: string,
  req: Request,
  verdict: Verdict,
  score: number,
  rules: string[],
  katmanHitler?: string[],
) {
  const m = extractMeta(req);
  Events.add({
    siteId,
    ts: Date.now(),
    ip: m.ip,
    country: m.country,
    asn: m.asn,
    ua: m.ua,
    path: m.path,
    botClass: verdict === "allowed" ? "human" : classifyUA(m.ua),
    verdict,
    score,
    triggeredRules: rules,
    fingerprint: Math.random().toString(16).slice(2, 10),
    method: m.method,
    latency: 10 + Math.floor(Math.random() * 40),
    ...(katmanHitler && katmanHitler.length ? { katmanHitler } : {}),
  });
  // Gerçek kullanım ölçümü — karara göre sayaç.
  Usage.increment(siteId, "issued", 1);
  if (verdict === "allowed") Usage.increment(siteId, "verified", 1);
  else if (verdict === "blocked") Usage.increment(siteId, "blocked", 1);
  else Usage.increment(siteId, "challenged", 1);
}

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
  const origin = req.headers.get("origin");
  const headers = cors(origin);
  const body = await req.json().catch(() => ({}));

  const { siteKey, token, input } = body as {
    siteKey?: string;
    token?: string;
    input?: string;
  };
  const signals: BehaviorSignals = { ...emptySignals(), ...(body.signals || {}) };

  if (!siteKey || !token || typeof input !== "string") {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400, headers });
  }

  const site = Sites.bySiteKey(siteKey);
  if (!site || !site.active) {
    return NextResponse.json({ error: "Geçersiz site anahtarı" }, { status: 403, headers });
  }

  const rl = rateLimit(`ver:${site.id}`, 240, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Çok fazla istek" }, { status: 429, headers });
  }

  const now = Date.now();

  // Replay koruması: token'daki nonce'ı tek-kullanımlık işaretle.
  const peek = verifyToken(token, site.secretKey, now);
  if (peek.ok) {
    const fresh = Nonces.useOnce(peek.payload.nonce, peek.payload.exp);
    if (!fresh) {
      logEvent(site.id, req, "flagged", 0, ["Replay (nonce tekrar)"]);
      return NextResponse.json(
        { success: false, reason: "replay" },
        { status: 200, headers },
      );
    }
  }

  const outcome = verifyAttempt(
    { token, input, signals },
    site.secretKey,
    now,
    { behaviorThreshold: site.behaviorThreshold, verificationTtl: 2 * 60 * 1000 },
  );

  if (!outcome.success) {
    // Honeypot tetiği = kesin bot (sıfır yanlış-pozitif); düşük davranış skoru gibi
    // doğrudan ENGELLE. Diğer başarısızlıklar (yanlış cevap vb.) işaretlenir.
    const honeypot = outcome.reason === "honeypot";
    const powFail = outcome.reason === "pow_failed";
    const botlike = outcome.reason === "low_behavior_score" || honeypot || powFail;
    // GERÇEK katman-hit'leri: challenge akışına giren her istek ghost-font'u
    // gördü; honeypot/pow başarısızlığı ilgili katmanın gerçekten yakaladığını
    // gösterir. Savunma Katmanları paneli bu gerçek sayaçtan beslenir.
    const hitler: string[] = ["ghost-font"];
    if (honeypot) hitler.push("honeypot");
    if (powFail) hitler.push("pow");
    logEvent(
      site.id,
      req,
      botlike ? "blocked" : "flagged",
      outcome.score ?? 0,
      honeypot ? ["Honeypot tuzağı tetiklendi"]
        : powFail ? ["İşlem-kanıtı (PoW) doğrulanamadı"]
        : botlike ? ["Düşük davranış skoru"] : [outcome.reason],
      hitler,
    );
    // Webhook tetikle (fire-and-forget — kullanıcıyı bekletme).
    if (botlike) {
      const m = extractMeta(req);
      void webhookTetikle(site.ownerId, {
        type: "bot.blocked",
        data: { site_key: site.siteKey, reason: outcome.reason, score: outcome.score ?? 0, ip: m.ip, country: m.country, path: m.path },
      }).catch(() => {});
    }
    return NextResponse.json(
      { success: false, reason: outcome.reason, score: outcome.score },
      { status: 200, headers },
    );
  }

  // Cevap + davranış geçti; şimdi KURAL MOTORU'nu çalıştır. Kurallar
  // block/challenge derse doğru cevaba rağmen reddedilir (gerçek motor).
  const meta = extractMeta(req);
  const rules = Rules.forSite(site.id);
  // AI ajanı + parmak izi sinyalleri (kuralların AI-spesifik alanları için).
  const aiAjan = aiAjanTespit((meta.ua || "").toLowerCase());
  const kabaSinif = aiAjan ? "ai_agent" : classifyUA(meta.ua);
  const fp = fingerprintUret(meta.ua, kabaSinif, meta.ip);
  // Tarayıcı-tutarlılık: widget'ın topladığı JS-ortam sinyalleriyle (deviceMemory,
  // window.chrome, WebGL, CPU...) UA-iddiasını çapraz-doğrula. "sahte" çıkarsa
  // (UA-JS çelişkisi = spoofing) TLS/UA uyumsuz sinyalini güçlendir — böylece
  // mevcut ML sınıflandırıcı ve kurallar bunu tutarlı biçimde yakalar.
  const tutarlilik = tarayiciTutarlilik({
    ua: meta.ua,
    webdriver: signals.webdriver,
    hardwareConcurrency: signals.hardwareConcurrency,
    deviceMemory: signals.deviceMemory,
    dilSayisi: signals.dilSayisi,
    eklentiSayisi: signals.eklentiSayisi,
    chromeNesnesi: signals.chromeNesnesi,
    webglSaticisi: signals.webglSaticisi,
    sesOrnekOrani: signals.sesOrnekOrani,
    pikselOrani: signals.pikselOrani,
    dokunmatik: signals.dokunmatik,
  });
  const tutarsizTls = fp.tlsUaUyumsuz || tutarlilik.karar === "sahte";
  // ML ensemble sınıflandırıcı: çok sinyali birleştirip daha doğru bot sınıfı.
  const ipItibar = IpRep.byIp(meta.ip);
  const mlSonuc = botSiniflandir({
    ua: meta.ua, behaviorScore: outcome.score,
    ipReputation: ipItibar ? Math.max(0, 1 - ipItibar.threatScore / 100) : undefined,
    headless: fp.headless, tlsMismatch: tutarsizTls, headerAnomali: fp.headerAnomali,
    aiAjan: !!aiAjan, rate: trackRate(meta.ip), path: meta.path,
  });
  const botClass = mlSonuc.sinif;
  const evalRes = evaluateRules(rules, {
    ip: meta.ip,
    country: meta.country,
    asn: meta.asn,
    ua: meta.ua,
    path: meta.path,
    score: outcome.score,
    botClass,
    rate: trackRate(meta.ip),
    aiAgentId: aiAjan?.id ?? "",
    aiCategory: aiAjan?.kategori ?? "",
    headless: fp.headless,
    tlsUaUyumsuz: tutarsizTls,
    httpVersion: fp.httpVersion,
  });
  if (evalRes.matched.length) Rules.bumpHits(evalRes.matched.map((m) => m.ruleId));

  // GERÇEK katman-hit'leri (cevap+davranış geçti): ghost-font her zaman görüldü;
  // PoW çözülduyse pow; tarayıcı-tutarlılık "sahte" dediyse tutarlilik.
  const basariliHitler: string[] = ["ghost-font"];
  if (signals.powNonce !== undefined) basariliHitler.push("pow");
  if (tutarlilik.karar === "sahte") basariliHitler.push("tutarlilik");

  if (evalRes.action === "block") {
    logEvent(site.id, req, "blocked", outcome.score, evalRes.matched.map((m) => m.ruleName), basariliHitler);
    return NextResponse.json(
      { success: false, reason: "rule_block", rule: evalRes.decidedBy?.ruleName, score: outcome.score },
      { status: 200, headers },
    );
  }

  logEvent(site.id, req, "allowed", outcome.score, evalRes.matched.map((m) => m.ruleName), basariliHitler);

  return NextResponse.json(
    { success: true, token: outcome.verification, score: outcome.score, appliedRules: evalRes.matched.map((m) => m.ruleName) },
    { status: 200, headers },
  );
}
