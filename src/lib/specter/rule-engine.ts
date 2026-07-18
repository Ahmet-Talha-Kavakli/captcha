/**
 * Specter — Kural Değerlendirme Motoru
 * =====================================
 * Bir isteğin (bot-olay adayının) sinyallerini alır, sitenin kurallarını
 * ÖNCELİK sırasıyla değerlendirir ve ilk eşleşen kuralın aksiyonunu döner.
 * Bu motor gerçek verify akışında (canlı trafik) ve kural playground'ında
 * (simülasyon) kullanılır — yani kurallar dekoratif değil, GERÇEK.
 */
import type { Rule, RuleField, RuleOp, RuleAction, BotClass, RuleKosul, RuleKosulGrup } from "@/lib/db/schema";

/** Bir kural değerlendirmesi için gereken istek bağlamı. */
export interface RequestContext {
  ip: string;
  country: string;
  asn: string;
  ua: string;
  path: string;
  score: number; // 0..1 insanlık skoru
  botClass: BotClass;
  /** Son 1 dk içindeki istek sayısı (rate kuralları için). */
  rate?: number;
  /* --- AI-ajan / parmak izi sinyalleri (opsiyonel — verify/passive doldurur) --- */
  /** Tespit edilen AI ajanının id'si (gptbot / claudebot …). AI değilse "". */
  aiAgentId?: string;
  /** Tespit edilen AI ajanının kategorisi (model_egitimi / canli_getirme …). */
  aiCategory?: string;
  /** Headless tarayıcı imzası tespit edildi mi. */
  headless?: boolean;
  /** TLS/UA parmak izi uyumsuzluğu (UA tarayıcı der, TLS araç). */
  tlsUaUyumsuz?: boolean;
  /** HTTP protokol sürümü (h2 / h3 / http/1.1). */
  httpVersion?: string;
}

/** Bool bağlam alanlarını kural değeriyle kıyaslanabilir dizeye çevirir. */
function boolStr(v: boolean | undefined): string {
  return v ? "true" : "false";
}

function fieldValue(ctx: RequestContext, field: RuleField): string | number {
  switch (field) {
    case "ip": return ctx.ip;
    case "country": return ctx.country;
    case "asn": return ctx.asn;
    case "ua": return ctx.ua;
    case "path": return ctx.path;
    case "score": return ctx.score;
    case "botClass": return ctx.botClass;
    case "rate": return ctx.rate ?? 0;
    case "aiAgent": return ctx.aiAgentId ?? "";
    case "aiCategory": return ctx.aiCategory ?? "";
    case "headless": return boolStr(ctx.headless);
    case "tlsMismatch": return boolStr(ctx.tlsUaUyumsuz);
    case "httpVersion": return ctx.httpVersion ?? "";
  }
}

function matchOp(actual: string | number, op: RuleOp, expected: string): boolean {
  const a = actual;
  const eNum = parseFloat(expected);
  switch (op) {
    case "eq": return String(a).toLowerCase() === expected.toLowerCase();
    case "neq": return String(a).toLowerCase() !== expected.toLowerCase();
    case "contains": return String(a).toLowerCase().includes(expected.toLowerCase());
    case "gt": return typeof a === "number" ? a > eNum : parseFloat(String(a)) > eNum;
    case "lt": return typeof a === "number" ? a < eNum : parseFloat(String(a)) < eNum;
    case "in": return expected.split(",").map((s) => s.trim().toLowerCase()).includes(String(a).toLowerCase());
  }
}

/* ------------------------------------------------------------ Gelişmiş motor
 * VE/VEYA koşul grupları (v18). Bir kuralda kosulGrup varsa bu değerlendirilir;
 * yoksa tekil field/op/value çalışır (geriye tam uyumlu). Gruplar iç içe olabilir. */

/** Tek atomik koşulu değerlendirir (negate desteğiyle). */
function evalKosul(ctx: RequestContext, k: RuleKosul): boolean {
  const val = fieldValue(ctx, k.field);
  const sonuc = matchOp(val, k.op, k.value);
  return k.negate ? !sonuc : sonuc;
}

/**
 * Koşul grubunu değerlendirir. "and" → tüm koşullar+alt gruplar; "or" → herhangi
 * biri. Boş grup (koşulsuz) mantıksal olarak false döner (kaza eşleşmesini önler).
 */
export function evalKosulGrup(ctx: RequestContext, grup: RuleKosulGrup): boolean {
  const kosullar = grup.kosullar ?? [];
  const altGruplar = grup.gruplar ?? [];
  const toplamOge = kosullar.length + altGruplar.length;
  if (toplamOge === 0) return false;

  if (grup.birlestir === "or") {
    return (
      kosullar.some((k) => evalKosul(ctx, k)) ||
      altGruplar.some((g) => evalKosulGrup(ctx, g))
    );
  }
  // "and"
  return (
    kosullar.every((k) => evalKosul(ctx, k)) &&
    altGruplar.every((g) => evalKosulGrup(ctx, g))
  );
}

/** Bir kural eşleşiyor mu — gelişmiş grup varsa onu, yoksa tekil koşulu kullanır. */
export function ruleMatches(ctx: RequestContext, rule: Rule): boolean {
  if (rule.kosulGrup) return evalKosulGrup(ctx, rule.kosulGrup);
  return matchOp(fieldValue(ctx, rule.field), rule.op, rule.value);
}

/** Bir koşul grubunu insan-okur metne çevirir (kural önizleme/özet için). */
export function grupOzet(grup: RuleKosulGrup): string {
  const parcalar: string[] = [];
  for (const k of grup.kosullar ?? []) {
    const not = k.negate ? "DEĞİL " : "";
    parcalar.push(`${not}${FIELD_ETIKET[k.field]} ${OP_ETIKET[k.op]} "${k.value}"`);
  }
  for (const g of grup.gruplar ?? []) parcalar.push(`(${grupOzet(g)})`);
  const ayrac = grup.birlestir === "or" ? " VEYA " : " VE ";
  return parcalar.join(ayrac);
}

export interface RuleMatch {
  ruleId: string;
  ruleName: string;
  action: RuleAction;
}

export interface EvalResult {
  /** Uygulanacak nihai aksiyon. */
  action: RuleAction;
  /** Eşleşen tüm kurallar (öncelik sırasıyla; ilk allow/challenge/block kesin). */
  matched: RuleMatch[];
  /** Karar hangi kuraldan geldi. */
  decidedBy: RuleMatch | null;
}

/**
 * Kuralları önceliğe göre değerlendirir. İlk terminal aksiyon (allow/block/
 * challenge) kararı belirler; flag'ler biriktirilir ama akışı durdurmaz.
 * Hiç eşleşme yoksa varsayılan: score'a göre otomatik.
 */
export function evaluateRules(rules: Rule[], ctx: RequestContext): EvalResult {
  const sorted = [...rules].filter((r) => r.enabled).sort((a, b) => a.priority - b.priority);
  const matched: RuleMatch[] = [];
  let decidedBy: RuleMatch | null = null;

  for (const rule of sorted) {
    if (ruleMatches(ctx, rule)) {
      const m: RuleMatch = { ruleId: rule.id, ruleName: rule.name, action: rule.action };
      matched.push(m);
      if (!decidedBy && rule.action !== "flag") {
        decidedBy = m;
        break; // ilk terminal karar akışı bitirir
      }
    }
  }

  let action: RuleAction;
  if (decidedBy) {
    action = decidedBy.action;
  } else {
    // Kural yoksa skora göre otomatik karar.
    action = ctx.score < 0.2 ? "block" : ctx.score < 0.45 ? "challenge" : "allow";
  }

  return { action, matched, decidedBy };
}

export const FIELD_ETIKET: Record<RuleField, string> = {
  ip: "IP", country: "Ülke", asn: "ASN", ua: "User-Agent", path: "Yol", score: "Skor", botClass: "Bot sınıfı", rate: "Hız",
  aiAgent: "AI ajanı", aiCategory: "AI kategorisi", headless: "Headless", tlsMismatch: "TLS/UA uyumsuz", httpVersion: "HTTP sürümü",
};
export const OP_ETIKET: Record<RuleOp, string> = { eq: "eşittir", neq: "eşit değil", contains: "içerir", gt: ">", lt: "<", in: "içinde" };
export const ACTION_ETIKET: Record<RuleAction, string> = { allow: "İzin ver", challenge: "Doğrula", block: "Engelle", flag: "İşaretle" };
