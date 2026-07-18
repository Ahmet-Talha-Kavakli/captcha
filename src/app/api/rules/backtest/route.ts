/**
 * Specter — Kural Geriye-Dönük Testi (Backtest)
 * =============================================
 * Bir TASLAK kuralı (tekil koşul VEYA gelişmiş koşul grubu) sitenin GERÇEK
 * geçmiş trafiğine karşı çalıştırır ve kaydetmeden önce etkisini gösterir:
 * "Bu kural son N olayın kaçını yakalardı, hangilerini?" — böylece kullanıcı
 * bir kuralı canlıya almadan önce yanlış-pozitif riskini görür.
 *
 *   POST /api/rules/backtest
 *   { siteId, kosulGrup?, field?, op?, value?, action }
 *
 * Not: SADECE değerlendirir; hiçbir kural KAYDETMEZ, hiçbir olayı DEĞİŞTİRMEZ.
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Events, Sites } from "@/lib/db/db";
import { ruleMatches } from "@/lib/specter/rule-engine";
import { aiAjanTespit } from "@/lib/specter/ai-agents";
import { fingerprintUret } from "@/lib/specter/fingerprint";
import type { Rule, RuleField, RuleOp, RuleAction, BotClass, RuleKosulGrup } from "@/lib/db/schema";

const GECERLI_FIELD = new Set(["ip", "country", "asn", "ua", "path", "score", "botClass", "rate", "aiAgent", "aiCategory", "headless", "tlsMismatch", "httpVersion"]);
const GECERLI_OP = new Set(["eq", "neq", "contains", "gt", "lt", "in"]);

function gecerliKosulGrup(g: unknown, derinlik = 0): g is RuleKosulGrup {
  if (!g || typeof g !== "object" || derinlik > 4) return false;
  const grup = g as Record<string, unknown>;
  if (grup.birlestir !== "and" && grup.birlestir !== "or") return false;
  const kosullar = Array.isArray(grup.kosullar) ? grup.kosullar : [];
  const gruplar = Array.isArray(grup.gruplar) ? grup.gruplar : [];
  if (kosullar.length + gruplar.length === 0) return false;
  for (const k of kosullar) {
    const kk = k as Record<string, unknown>;
    if (!GECERLI_FIELD.has(String(kk.field)) || !GECERLI_OP.has(String(kk.op)) || typeof kk.value !== "string") return false;
  }
  for (const alt of gruplar) if (!gecerliKosulGrup(alt, derinlik + 1)) return false;
  return true;
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const site = Sites.byId(body.siteId);
  if (!site || site.ownerId !== user.id) return NextResponse.json({ error: "site" }, { status: 400 });

  // Taslak kuralı kur — gelişmiş grup varsa onu, yoksa tekil koşulu kullan.
  const kosulGrup = gecerliKosulGrup(body.kosulGrup) ? body.kosulGrup : undefined;
  if (!kosulGrup && (!GECERLI_FIELD.has(String(body.field)) || !GECERLI_OP.has(String(body.op)))) {
    return NextResponse.json({ error: "koşul" }, { status: 400 });
  }
  const taslak: Rule = {
    id: "backtest", siteId: site.id, name: "backtest", description: "", enabled: true, priority: 1,
    field: (body.field as RuleField) ?? "score", op: (body.op as RuleOp) ?? "lt", value: String(body.value ?? ""),
    action: (body.action as RuleAction) ?? "block", kosulGrup, hits: 0, createdAt: 0, system: false,
  };

  // Sitenin geçmiş olayları — her biri için sinyalleri türet ve kuralı dene.
  const olaylar = Events.forSite(site.id, 1000);
  let eslesme = 0;
  const ornekler: { ts: number; ip: string; country: string; botClass: string; verdict: string; path: string; score: number }[] = [];
  const sinifSay: Record<string, number> = {};

  for (const e of olaylar) {
    const aiAjan = aiAjanTespit(e.ua.toLowerCase());
    const fp = fingerprintUret(e.ua, e.botClass, e.ip);
    const eslesirMi = ruleMatches(
      {
        ip: e.ip, country: e.country, asn: e.asn, ua: e.ua, path: e.path,
        score: e.score, botClass: e.botClass as BotClass, rate: 0,
        aiAgentId: aiAjan?.id ?? "", aiCategory: aiAjan?.kategori ?? "",
        headless: fp.headless, tlsUaUyumsuz: fp.tlsUaUyumsuz, httpVersion: fp.httpVersion,
      },
      taslak,
    );
    if (eslesirMi) {
      eslesme++;
      sinifSay[e.botClass] = (sinifSay[e.botClass] || 0) + 1;
      if (ornekler.length < 12) {
        ornekler.push({ ts: e.ts, ip: e.ip, country: e.country, botClass: e.botClass, verdict: e.verdict, path: e.path, score: e.score });
      }
    }
  }

  const toplam = olaylar.length;
  const oran = toplam ? eslesme / toplam : 0;

  // İnsan trafiğini yakalıyor mu? (yanlış-pozitif riski uyarısı)
  const insanEslesme = ornekler.filter((o) => o.botClass === "human").length;
  const insanTahmin = eslesme > 0 ? Math.round((sinifSay["human"] || 0)) : 0;

  return NextResponse.json({
    toplam,
    eslesme,
    oran,
    aksiyon: taslak.action,
    // Yanlış-pozitif uyarısı: kural insan trafiğini de yakalıyorsa.
    insanYakalanan: insanTahmin,
    yanlisPozitifRiski: insanTahmin > 0,
    sinifDagilimi: Object.entries(sinifSay).map(([k, v]) => ({ botClass: k, sayi: v })).sort((a, b) => b.sayi - a.sayi),
    ornekler,
    insanOrnek: insanEslesme,
  });
}
