import Link from "next/link";
import { cn } from "@/lib/cn";
import { ceviri, type Dil } from "@/lib/i18n/panel";

const SEKMELER = [
  { key: "hesap", anahtar: "settings.tab.account", href: "/panel/ayarlar" },
  { key: "guvenlik", anahtar: "settings.tab.security", href: "/panel/ayarlar/guvenlik" },
  { key: "plan", anahtar: "settings.tab.plan", href: "/panel/ayarlar/plan" },
] as const;

export function AyarlarSekme({ aktif, dil = "tr" }: { aktif: string; dil?: Dil }) {
  return (
    <div className="mt-6 flex gap-1 border-b border-line">
      {SEKMELER.map((s) => {
        const on = aktif === s.key;
        return (
          <Link key={s.key} href={s.href} className={cn("relative px-4 py-2.5 text-sm font-medium transition", on ? "text-brand-700" : "text-slate-muted hover:text-slate-ink")}>
            {ceviri(s.anahtar, dil)}
            {on && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />}
          </Link>
        );
      })}
    </div>
  );
}
