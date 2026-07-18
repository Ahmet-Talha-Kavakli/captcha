"use client";

/**
 * Bot sınıfı & verdict görsel kimliği — TEK KAYNAK.
 * Her bot sınıfının kendi ikonu + rengi olur; düz yazı yerine ikon+etiket
 * kullanılır (premium his). Hem BotClass anahtarı hem Türkçe etiket ("DDoS",
 * "Kazıyıcı" …) kabul edilir, böylece dağılım listeleri de eşleşir.
 */
import {
  User,
  ShieldCheck,
  Bot,
  Worm,
  KeyRound,
  Sparkles,
  Zap,
  Mailbox,
  CircleHelp,
  type LucideIcon,
} from "lucide-react";

export interface BotSinifGorsel {
  ikon: LucideIcon;
  /** Ana renk (bar dolgusu, ikon). */
  renk: string;
  /** Yumuşak zemin (ikon çipi). */
  soft: string;
}

/** BotClass anahtarı → görsel. */
const ANAHTAR: Record<string, BotSinifGorsel> = {
  human: { ikon: User, renk: "#2f6fed", soft: "#eaf1fe" },
  good_bot: { ikon: ShieldCheck, renk: "#16a34a", soft: "#e7f6ec" },
  automation: { ikon: Bot, renk: "#7c3aed", soft: "#f1ebfe" },
  scraper: { ikon: Worm, renk: "#d97706", soft: "#fdf1e3" },
  credential_stuffing: { ikon: KeyRound, renk: "#db2777", soft: "#fce8f1" },
  ai_agent: { ikon: Sparkles, renk: "#0891b2", soft: "#e2f5f9" },
  ddos: { ikon: Zap, renk: "#dc2626", soft: "#fdeaea" },
  spam: { ikon: Mailbox, renk: "#ca8a04", soft: "#fbf3da" },
};

/** Türkçe etiket → BotClass anahtarı (dağılım listeleri metinle gelir). */
const ETIKET_ANAHTAR: Record<string, string> = {
  "insan": "human",
  "iyi bot": "good_bot",
  "otomasyon": "automation",
  "kazıyıcı": "scraper",
  "kaziyici": "scraper",
  "kimlik doldurma": "credential_stuffing",
  "ai ajan": "ai_agent",
  "ai ajanı": "ai_agent",
  "ddos": "ddos",
  "spam": "spam",
};

const VARSAYILAN: BotSinifGorsel = { ikon: CircleHelp, renk: "#6b6a63", soft: "#efeee8" };

/** Bir bot sınıfı (anahtar VEYA Türkçe etiket) için görsel kimliği döndür. */
export function botSinifGorsel(sinif: string): BotSinifGorsel {
  const ham = (sinif ?? "").trim();
  if (ANAHTAR[ham]) return ANAHTAR[ham];
  const anahtar = ETIKET_ANAHTAR[ham.toLowerCase()];
  if (anahtar && ANAHTAR[anahtar]) return ANAHTAR[anahtar];
  return VARSAYILAN;
}

/**
 * Hazır rozet: ikon çipi + etiket. Listelerde düz yazı yerine bunu kullan.
 */
export function BotSinifRozet({
  sinif,
  etiket,
  boyut = 20,
}: {
  sinif: string;
  etiket: string;
  boyut?: number;
}) {
  const g = botSinifGorsel(sinif);
  const Ikon = g.ikon;
  return (
    <span className="flex items-center gap-2">
      <span
        className="grid shrink-0 place-items-center rounded-lg"
        style={{ width: boyut, height: boyut, background: g.soft, color: g.renk }}
      >
        <Ikon style={{ width: boyut * 0.6, height: boyut * 0.6 }} strokeWidth={2.2} />
      </span>
      <span className="truncate">{etiket}</span>
    </span>
  );
}
