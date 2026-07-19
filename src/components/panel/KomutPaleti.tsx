"use client";

/**
 * Specter — Komut Paleti (⌘K)
 * ===========================
 * Linear/Raycast/Superhuman seviyesi komut paleti. Üç komut türü:
 *   - "git"    → bir sayfaya yönlendir (router.push)
 *   - "eylem"  → gerçek bir fonksiyon çalıştır (dil, tema, çıkış, sidebar…)
 *   - (dinamik) → arama yazıldıkça nav + eylemler birlikte filtrelenir
 *
 * RBAC: layout'tan gelen `rol` ile yetkisiz modül/eylem komutları gizlenir
 * (panel-nav capability + yetkiliMi). i18n: usePanelDil ile başlık/gruplar
 * seçili dile çevrilir. Son ziyaret edilen sayfalar localStorage'da tutulur
 * ve arama boşken "Son ziyaret" grubunda gösterilir.
 *
 * Klavye: ⌘K aç/kapat, ↑/↓ gezin (grup başlıklarını atlar), ↵ seç, Esc kapat.
 * Erişilebilir: role=listbox / role=option / aria-selected + aria-activedescendant.
 */

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CornerDownLeft,
  Languages,
  Moon,
  LogOut,
  PanelLeftClose,
  Keyboard,
  Plus,
  Copy,
  Clock,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { panelNav } from "@/lib/panel-nav";
import { yetkiliMi } from "@/lib/rbac";
import { usePanelDil, PANEL_DIL_COOKIE } from "@/lib/i18n/istemci";
import { useToast } from "@/components/panel/kit";
import type { Role } from "@/lib/db/schema";
import type { Dil } from "@/lib/i18n/panel";

/** Bir komut: gruba ait, ya `href` (git) ya `calistir` (eylem) taşır. */
interface Komut {
  id: string;
  ad: string;
  grup: string;
  ikon: LucideIcon;
  /** Sağda gösterilen küçük ipucu (örn. "TR → EN", "⌘K"). */
  ipucu?: string;
  /** Navigasyon komutu için hedef. */
  href?: string;
  /** Eylem komutu için çalıştırılacak fonksiyon (varsa href yerine bu koşar). */
  calistir?: () => void | Promise<void>;
  /** Aramada eşleşmeyi artıran ek anahtar kelimeler. */
  etiket?: string;
}

/** Son ziyaret edilen sayfaların localStorage anahtarı. */
const SON_KEY = "specter_son_sayfalar";
const SIDEBAR_KEY = "specter_sidebar_dar";

/** Grupların ekranda görünme sırası (tanımlı olmayanlar sona düşer). */
const GRUP_SIRA = ["Öneriler", "Son ziyaret", "Eylemler", "Git", "Ayarlar"];

export function KomutPaleti({ rol, ilkSiteKey }: { rol: Role; ilkSiteKey?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { dil, ceviri: t, degistir } = usePanelDil();
  const { goster } = useToast();

  const [acik, setAcik] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [son, setSon] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------------ gerçek eylemler */

  // Dili değiştir: cookie + hesaba kaydet (sessiz) + tazele (Sidebar mantığıyla aynı).
  const dilDegistir = useCallback(
    (yeni: Dil) => {
      degistir(yeni);
      fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: yeni }),
      }).catch(() => {});
      router.refresh();
      goster({ tip: "basari", baslik: yeni === "tr" ? "Dil: Türkçe" : "Language: English" });
    },
    [degistir, router, goster],
  );

  // Çıkış: oturumu kapat → /login.
  const cikisYap = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  }, [router]);

  // Sidebar daralt/genişlet: localStorage toggle + Sidebar'a event ile haber ver.
  const sidebarToggle = useCallback(() => {
    let dar = false;
    try {
      const v = localStorage.getItem(SIDEBAR_KEY);
      dar = !(v === "1");
      localStorage.setItem(SIDEBAR_KEY, dar ? "1" : "0");
    } catch {
      /* localStorage yoksa yut */
    }
    window.dispatchEvent(new CustomEvent("specter-sidebar-toggle", { detail: { dar } }));
    goster({ tip: "bilgi", baslik: dar ? t("sidebar.collapse") : t("sidebar.expand") });
  }, [goster, t]);

  // Kısayol yardımını aç: KisayolYardim bileşenini event ile tetikle.
  const kisayolAc = useCallback(() => {
    window.dispatchEvent(new CustomEvent("specter-kisayol-ac"));
  }, []);

  // Ürün turunu yeniden başlat: UrunTuru bileşeni bu event'i dinler.
  const turuBaslat = useCallback(() => {
    window.dispatchEvent(new CustomEvent("specter-tur-baslat"));
  }, []);

  // Site anahtarını panoya kopyala.
  const siteKeyKopyala = useCallback(() => {
    if (!ilkSiteKey) return;
    navigator.clipboard
      ?.writeText(ilkSiteKey)
      .then(() => goster({ tip: "basari", baslik: dil === "tr" ? "Site anahtarı kopyalandı" : "Site key copied" }))
      .catch(() => goster({ tip: "hata", baslik: dil === "tr" ? "Kopyalanamadı" : "Copy failed" }));
  }, [ilkSiteKey, goster, dil]);

  // Tema (henüz yok): yakında toast'u.
  const temaDegistir = useCallback(() => {
    goster({ tip: "bilgi", baslik: t("topbar.darkTheme") });
  }, [goster, t]);

  /* ------------------------------------------------------ komut kataloğu */

  const komutlar = useMemo<Komut[]>(() => {
    const list: Komut[] = [];
    const tr = dil === "tr";

    // --- Eylemler (gerçek fonksiyonlar) ---
    // Dil değiştir (mevcut dilin tersine).
    const hedefDil: Dil = dil === "tr" ? "en" : "tr";
    list.push({
      id: "act-dil",
      ad: tr ? `Dili değiştir: ${hedefDil === "tr" ? "Türkçe" : "English"}` : `Switch language: ${hedefDil === "tr" ? "Turkish" : "English"}`,
      grup: "Eylemler",
      ikon: Languages,
      ipucu: `${dil.toUpperCase()} → ${hedefDil.toUpperCase()}`,
      etiket: "language dil türkçe english locale çeviri",
      calistir: () => dilDegistir(hedefDil),
    });

    // Yeni site oluştur — sites.manage yetkisi gerekir.
    if (yetkiliMi(rol, "sites.manage")) {
      list.push({
        id: "act-yeni-site",
        ad: tr ? "Yeni site oluştur" : "Create new site",
        grup: "Eylemler",
        ikon: Plus,
        etiket: "site new create ekle oluştur",
        href: "/panel/siteler?yeni=1",
      });
    }

    // Yeni kural ekle — rules.edit yetkisi gerekir.
    if (yetkiliMi(rol, "rules.edit")) {
      list.push({
        id: "act-yeni-kural",
        ad: tr ? "Yeni kural ekle" : "Add new rule",
        grup: "Eylemler",
        ikon: Plus,
        etiket: "rule kural new create ekle",
        href: "/panel/kurallar?yeni=1",
      });
    }

    // Site anahtarını kopyala — yalnızca en az bir site varsa.
    if (ilkSiteKey && yetkiliMi(rol, "sites.manage")) {
      list.push({
        id: "act-kopya-key",
        ad: tr ? "Kopyala: Site anahtarım" : "Copy: My site key",
        grup: "Eylemler",
        ikon: Copy,
        ipucu: ilkSiteKey.slice(0, 10) + "…",
        etiket: "copy site key anahtar kopyala pano clipboard",
        calistir: siteKeyKopyala,
      });
    }

    // Kısayol yardımı.
    list.push({
      id: "act-kisayol",
      ad: tr ? "Klavye kısayollarını aç" : "Open keyboard shortcuts",
      grup: "Eylemler",
      ikon: Keyboard,
      ipucu: "?",
      etiket: "shortcut kısayol yardım help klavye keyboard",
      calistir: kisayolAc,
    });

    // Ürün turunu yeniden başlat (onboarding gezisi).
    list.push({
      id: "act-tur",
      ad: tr ? "Ürün turunu başlat" : "Start product tour",
      grup: "Eylemler",
      ikon: Sparkles,
      etiket: "tur tour onboarding gezi tanıtım walkthrough rehber başlat",
      calistir: turuBaslat,
    });

    // Sidebar daralt/genişlet.
    list.push({
      id: "act-sidebar",
      ad: tr ? "Menüyü daralt / genişlet" : "Collapse / expand menu",
      grup: "Eylemler",
      ikon: PanelLeftClose,
      etiket: "sidebar menu daralt genişlet collapse expand",
      calistir: sidebarToggle,
    });

    // Koyu tema (yakında).
    list.push({
      id: "act-tema",
      ad: tr ? "Koyu / açık tema" : "Dark / light theme",
      grup: "Eylemler",
      ikon: Moon,
      etiket: "theme tema koyu açık dark light",
      calistir: temaDegistir,
    });

    // Çıkış yap.
    list.push({
      id: "act-cikis",
      ad: t("sidebar.logout"),
      grup: "Eylemler",
      ikon: LogOut,
      etiket: "logout çıkış sign out exit",
      calistir: cikisYap,
    });

    // --- Git (RBAC ile filtrelenmiş nav modülleri) ---
    for (const item of panelNav) {
      if (!yetkiliMi(rol, item.capability)) continue;
      const ad = item.key ? t(item.key) : item.ad;
      // Ayarlar ve alt öğeleri "Ayarlar" grubunda, gerisi "Git" grubunda.
      const grup = item.href === "/panel/ayarlar" ? "Ayarlar" : "Git";
      list.push({
        id: `nav-${item.href}`,
        ad,
        grup,
        ikon: ArrowRight,
        href: item.href,
        etiket: item.href,
      });
      item.alt?.forEach((a) => {
        const altAd = a.key ? t(a.key) : a.ad;
        list.push({
          id: `nav-${a.href}-${altAd}`,
          ad: `${ad} · ${altAd}`,
          grup: "Ayarlar",
          ikon: ArrowRight,
          href: a.href,
          etiket: a.href,
        });
      });
    }

    return list;
  }, [dil, rol, ilkSiteKey, t, dilDegistir, siteKeyKopyala, kisayolAc, turuBaslat, sidebarToggle, temaDegistir, cikisYap]);

  /* ------------------------------------------------------ son ziyaretler */

  // localStorage'dan son ziyaret edilen sayfaları oku (palet açılışında).
  useEffect(() => {
    if (!acik) return;
    try {
      const raw = localStorage.getItem(SON_KEY);
      setSon(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setSon([]);
    }
  }, [acik]);

  // Rota değiştikçe geçerli sayfayı "son ziyaret" listesinin başına ekle (max 5).
  useEffect(() => {
    if (!pathname?.startsWith("/panel")) return;
    try {
      const raw = localStorage.getItem(SON_KEY);
      const eski: string[] = raw ? JSON.parse(raw) : [];
      const yeni = [pathname, ...eski.filter((h) => h !== pathname)].slice(0, 5);
      localStorage.setItem(SON_KEY, JSON.stringify(yeni));
    } catch {
      /* yut */
    }
  }, [pathname]);

  /* --------------------------------------------- görünen komut listesi */

  // Arama boşken: Öneriler (sık eylemler) + Son ziyaret; doluyken: filtreli tüm komutlar.
  const gorunen = useMemo<Komut[]>(() => {
    const alt = q.trim().toLocaleLowerCase("tr");

    if (!alt) {
      const oneriler: Komut[] = [];
      // Öne çıkan birkaç eylem "Öneriler" başlığı altında.
      const oneriId = ["act-yeni-site", "act-dil", "act-kisayol"];
      for (const id of oneriId) {
        const k = komutlar.find((c) => c.id === id);
        if (k) oneriler.push({ ...k, grup: "Öneriler", ikon: k.ikon });
      }

      // Son ziyaret edilen sayfalar (geçerli sayfa hariç).
      const sonKomut: Komut[] = [];
      for (const href of son) {
        if (href === pathname) continue;
        const nav = komutlar.find((c) => c.href === href && c.id.startsWith("nav-"));
        if (nav) sonKomut.push({ ...nav, id: `son-${href}`, grup: "Son ziyaret", ikon: Clock });
      }

      return [...oneriler, ...sonKomut, ...komutlar];
    }

    // Arama: ad + etiket üzerinde eşleşme.
    return komutlar.filter((k) => {
      const hedef = (k.ad + " " + (k.etiket ?? "")).toLocaleLowerCase("tr");
      return hedef.includes(alt);
    });
  }, [q, komutlar, son, pathname]);

  // Gruplu düzen: GRUP_SIRA'ya göre sıralı, her grup içinde eklenme sırası korunur.
  const gruplu = useMemo(() => {
    const map = new Map<string, Komut[]>();
    for (const k of gorunen) {
      if (!map.has(k.grup)) map.set(k.grup, []);
      map.get(k.grup)!.push(k);
    }
    const siraliGruplar = [...map.keys()].sort((a, b) => {
      const ia = GRUP_SIRA.indexOf(a);
      const ib = GRUP_SIRA.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return siraliGruplar.map((g) => ({ grup: g, komutlar: map.get(g)! }));
  }, [gorunen]);

  // Düz (grup başlıkları hariç) seçilebilir öğe listesi — klavye navigasyonu bunun üzerinde.
  const duzListe = useMemo(() => gruplu.flatMap((g) => g.komutlar), [gruplu]);

  /* ------------------------------------------------------ açma / kapama */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAcik((v) => !v);
      }
      if (e.key === "Escape") setAcik(false);
    };
    const onCustom = () => setAcik(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("specter-arama-ac", onCustom);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("specter-arama-ac", onCustom);
    };
  }, []);

  useEffect(() => {
    if (acik) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [acik]);

  useEffect(() => setSel(0), [q]);

  // Seçili öğeyi görünür tut.
  useEffect(() => {
    if (!acik) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${sel}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [sel, acik]);

  /* -------------------------------------------------------- seçim / git */

  const secildi = useCallback(
    async (k?: Komut) => {
      if (!k) return;
      setAcik(false);
      if (k.calistir) {
        await k.calistir();
      } else if (k.href) {
        router.push(k.href);
      }
    },
    [router],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, duzListe.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      secildi(duzListe[sel]);
    }
  }

  /* ----------------------------------------------------------- render */

  return (
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center px-4 pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAcik(false)}
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-lift"
            role="dialog"
            aria-modal="true"
            aria-label={t("ortak.ara")}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-5 text-slate-faint" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={dil === "tr" ? "Modül ara veya komut yaz…" : "Search modules or type a command…"}
                className="h-14 flex-1 bg-transparent text-[15px] text-slate-ink outline-none placeholder:text-slate-faint"
                role="combobox"
                aria-expanded="true"
                aria-controls="komut-liste"
                aria-activedescendant={duzListe[sel] ? `komut-${duzListe[sel].id}` : undefined}
                aria-autocomplete="list"
              />
              <kbd className="rounded border border-line-strong px-1.5 py-0.5 text-[10px] text-slate-faint">ESC</kbd>
            </div>
            <div ref={listRef} id="komut-liste" role="listbox" aria-label={t("ortak.ara")} className="max-h-[340px] overflow-y-auto p-2 scrollbar-thin">
              {duzListe.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-slate-faint">{t("ortak.kayitYok")}</div>
              ) : (
                gruplu.map((g) => (
                  <div key={g.grup} className="mb-1">
                    <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">{grupBaslik(g.grup, dil)}</div>
                    {g.komutlar.map((k) => {
                      const idx = duzListe.indexOf(k);
                      const secili = idx === sel;
                      const Ikon = k.ikon;
                      return (
                        <button
                          key={k.id}
                          id={`komut-${k.id}`}
                          data-idx={idx}
                          role="option"
                          aria-selected={secili}
                          onMouseEnter={() => setSel(idx)}
                          onClick={() => secildi(k)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                            secili ? "bg-brand-50 text-brand-700" : "text-slate-ink hover:bg-canvas"
                          }`}
                        >
                          <Ikon className={`size-4 shrink-0 ${secili ? "text-brand-600" : "text-slate-faint"}`} />
                          <span className="flex-1 truncate">{k.ad}</span>
                          {k.ipucu && (
                            <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${secili ? "border-brand-200 text-brand-600" : "border-line text-slate-faint"}`}>
                              {k.ipucu}
                            </span>
                          )}
                          {secili && <CornerDownLeft className="size-3.5 shrink-0 text-brand-400" />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
            {/* Alt bilgi çubuğu: klavye ipuçları */}
            <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-[11px] text-slate-faint">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-line-strong px-1 py-0.5">↑</kbd>
                <kbd className="rounded border border-line-strong px-1 py-0.5">↓</kbd>
                {dil === "tr" ? "gezin" : "navigate"}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-line-strong px-1 py-0.5">↵</kbd>
                {dil === "tr" ? "seç" : "select"}
              </span>
              <span className="ml-auto flex items-center gap-1">
                <kbd className="rounded border border-line-strong px-1 py-0.5">⌘K</kbd>
                {dil === "tr" ? "aç/kapat" : "toggle"}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Grup başlığını seçili dile göre görüntüle. */
function grupBaslik(grup: string, dil: Dil): string {
  if (dil === "tr") return grup;
  const en: Record<string, string> = {
    Öneriler: "Suggestions",
    "Son ziyaret": "Recent",
    Eylemler: "Actions",
    Git: "Go to",
    Ayarlar: "Settings",
  };
  return en[grup] ?? grup;
}
