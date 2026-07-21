"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useOdakTuzak } from "@/lib/a11y/odak-tuzak";
import * as Icons from "lucide-react";
import { ChevronDown, LogOut, BookOpen, Globe as GlobeIcon, PanelLeftClose, PanelLeftOpen, Languages } from "lucide-react";
import { SpecterMark } from "@/components/ui/Logo";
import { MARKA } from "@/lib/marka";
import { panelNav } from "@/lib/panel-nav";
import { yetkiliMi } from "@/lib/rbac";
import { ROL_ETIKET } from "@/app/panel/ekip/roller";
import type { Role } from "@/lib/db/schema";
import { cn } from "@/lib/cn";
import { usePanelDil } from "@/lib/i18n/istemci";
import { DESTEKLENEN_DILLER, DIL_META, type Dil } from "@/lib/i18n/panel";
import { Avatar, Tooltip, useDisari } from "./kit";

/** Dil kısa kodları (dil değiştirici için). */
const DIL_ETIKET: Record<Dil, string> = { tr: "TR", en: "EN", de: "DE", fr: "FR", es: "ES" };

function LucideIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <Cmp className={className} />;
}

/** Tavily-stil sol sidebar: krem zemin, workspace switcher pill, mavi aktif menü.
 *  Küçük mod (collapse): sadece ikonlar + hover tooltip. Scrollbar gizli. */
export function Sidebar({ me, dil: baslangicDil }: { me: { name: string; email: string; avatarColor: string; rol: Role; gercekRol: Role; krediBakiye?: number }; dil?: Dil }) {
  const pathname = usePathname();
  const router = useRouter();
  const [wsAcik, setWsAcik] = useState(false);
  const [dar, setDar] = useState(false);
  const [mobilAcik, setMobilAcik] = useState(false);
  const wsRef = useDisari<HTMLDivElement>(() => setWsAcik(false));

  // i18n: etkin dil + çeviri yardımcısı. Sunucudan gelen dil başlangıç değeri.
  const { dil, ceviri: t, degistir } = usePanelDil(baslangicDil);

  // Dili değiştir: cookie + hesaba kaydet (varsa) + sayfayı tazele (server metinleri).
  async function dilDegistir(yeni: Dil) {
    if (yeni === dil) return;
    degistir(yeni);
    // Kullanıcı tercihini de sakla (varsa) — sessiz, hata yut.
    fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: yeni }),
    }).catch(() => {});
    router.refresh();
  }

  // Rota değişince mobil drawer'ı kapat.
  useEffect(() => { setMobilAcik(false); }, [pathname]);

  // Mobil drawer açıkken Esc ile kapan (WCAG 2.1.2 klavye tuzağı önlemi).
  useEffect(() => {
    if (!mobilAcik) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobilAcik(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobilAcik]);

  // WCAG 2.4.3: mobil drawer açıkken odak tuzağı — Tab döngüsü drawer içinde
  // kalır, açılışta ilk öğeye odak, kapanınca odak hamburger'a geri döner.
  // Masaüstünde (mobilAcik=false) hook hiçbir şey yapmaz.
  const drawerRef = useRef<HTMLElement>(null);
  useOdakTuzak(drawerRef, mobilAcik);

  // RBAC: efektif role göre erişilebilir modülleri filtrele.
  const gorunurNav = panelNav.filter((item) => yetkiliMi(me.rol, item.capability));

  // Rol önizleme (sadece gerçek sahip/yönetici deneyebilir): cookie'yi ayarla.
  async function rolOnizle(rol: Role) {
    if (rol === me.gercekRol) document.cookie = "specter_rol_onizleme=; path=/; max-age=0";
    else document.cookie = `specter_rol_onizleme=${rol}; path=/; max-age=86400`;
    router.refresh();
  }

  // collapse tercihini hatırla + komut paletinden gelen toggle event'ini dinle
  useEffect(() => {
    const v = localStorage.getItem("specter_sidebar_dar");
    if (v === "1") setDar(true);
    // KomutPaleti "Menüyü daralt/genişlet" eylemi localStorage'ı ayarlar ve
    // bu event'i yayar; state'i yeni değere senkronla.
    const onToggle = (e: Event) => {
      const dar = (e as CustomEvent<{ dar: boolean }>).detail?.dar;
      if (typeof dar === "boolean") setDar(dar);
    };
    window.addEventListener("specter-sidebar-toggle", onToggle);
    return () => window.removeEventListener("specter-sidebar-toggle", onToggle);
  }, []);
  function toggleDar() {
    setDar((v) => {
      localStorage.setItem("specter_sidebar_dar", v ? "0" : "1");
      return !v;
    });
  }

  const aktifMi = (href: string) => {
    const clean = href.split("?")[0];
    return clean === "/panel" ? pathname === "/panel" : pathname.startsWith(clean);
  };

  async function cikis() {
    // 1) Kendi cookie-oturumumuzu kapat (specter_session sil).
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ağ hatası olsa bile Clerk/yönlendirme adımına devam et */
    }
    // 2) Clerk oturumunu da kapat. Google/Clerk ile giriş yapıldıysa yalnız
    //    kendi cookie'mizi silmek YETMEZ — Clerk oturumu açık kalır ve /login'e
    //    gidince kullanıcı otomatik yeniden içeri alınır (çıkış "çalışmıyor"
    //    görünür). Clerk global nesnesi varsa signOut ile tam çıkış yapılır.
    try {
      const clerk = (window as unknown as { Clerk?: { signOut?: (o?: { redirectUrl?: string }) => Promise<void> } }).Clerk;
      if (clerk?.signOut) {
        await clerk.signOut({ redirectUrl: "/login" });
        return; // signOut yönlendirmeyi kendi yapar
      }
    } catch {
      /* Clerk yoksa/başarısızsa aşağıdaki sabit yönlendirmeye düş */
    }
    // 3) Clerk yoksa (demo/cookie-auth) — tam sayfa yenilemesiyle /login'e git
    //    (router.push yerine: sunucu state'i temiz okunur).
    window.location.href = "/login";
  }

  return (
    <>
      {/* Mobil hamburger butonu (sadece < lg) */}
      <button
        onClick={() => setMobilAcik(true)}
        aria-label={t("sidebar.openMenu")}
        aria-expanded={mobilAcik}
        aria-controls="mobil-sidebar-drawer"
        className="fixed left-3 top-3 z-40 grid size-10 place-items-center rounded-xl border border-line bg-surface text-slate-ink shadow-card lg:hidden"
      >
        <Icons.Menu className="size-5" />
      </button>

      {/* Mobil overlay backdrop */}
      {mobilAcik && (
        <div
          onClick={() => setMobilAcik(false)}
          className="fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm lg:hidden"
          aria-hidden
        />
      )}

    <aside
      ref={drawerRef}
      id="mobil-sidebar-drawer"
      // Mobilde açık drawer bir modal gibi davranır; masaüstünde normal gezinme paneli.
      role={mobilAcik ? "dialog" : undefined}
      aria-modal={mobilAcik ? true : undefined}
      aria-label={mobilAcik ? t("sidebar.openMenu") : undefined}
      className={cn(
        "z-40 flex h-screen shrink-0 flex-col bg-surface py-4 transition-transform duration-300",
        // Masaüstü: viewport-kilitli konteynerde TAM sabit (relative + h-screen).
        // Mobil: sabit drawer, kaydırarak aç/kapa.
        "fixed inset-y-0 left-0 w-[280px] px-3.5 shadow-lift lg:relative lg:z-30 lg:shadow-none lg:transition-[width]",
        mobilAcik ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        dar ? "lg:w-[76px] lg:px-2.5" : "lg:w-[260px] lg:px-3.5",
      )}
    >
      {/* logo */}
      <Link href="/panel" className={cn("mb-5 flex items-center gap-2.5", dar ? "justify-center" : "px-1.5")}>
        <SpecterMark size={30} />
        {!dar && <span className="text-[22px] font-bold tracking-tight text-slate-ink">{MARKA.ad}</span>}
      </Link>

      {/* workspace switcher pill */}
      {!dar ? (
        <div ref={wsRef} className="relative mb-4">
          <button
            onClick={() => setWsAcik((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-2xl bg-brand-50 px-3 py-2.5 text-left transition hover:bg-brand-100"
          >
            <Avatar ad={me.name} renk={me.avatarColor} boyut={26} />
            <span className="flex-1 truncate text-[15px] font-semibold text-brand-700">{t("sidebar.workspace")}</span>
            <ChevronDown className="size-4 text-brand-600" />
          </button>
          {wsAcik && (
            <div className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-lift animate-fade-up">
              <div className="flex items-center gap-2.5 rounded-xl bg-brand-50 px-3 py-2">
                <Avatar ad={me.name} renk={me.avatarColor} boyut={24} />
                <span className="flex-1 text-sm font-medium text-brand-700">{t("sidebar.workspace")}</span>
                <Icons.Check className="size-4 text-brand-600" />
              </div>
              <button className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-muted transition hover:bg-canvas">
                <Icons.Plus className="size-4" /> {t("sidebar.createWorkspace")}
              </button>
              {/* Rol önizleme — erişim kontrolünü farklı rollerle deneyimle */}
              <div className="mt-1.5 border-t border-line pt-1.5">
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-faint">{t("sidebar.rolePreview")}</div>
                {(["owner", "admin", "analyst", "viewer"] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => rolOnizle(r)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[13px] transition hover:bg-canvas",
                      me.rol === r ? "font-semibold text-brand-700" : "text-slate-muted",
                    )}
                  >
                    <span>{ROL_ETIKET[r]}</span>
                    {me.rol === r && <Icons.Check className="size-3.5 text-brand-600" />}
                    {r === me.gercekRol && me.rol !== r && <span className="text-[10px] text-slate-faint">{t("sidebar.roleReal")}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 flex justify-center">
          <Tooltip metin={t("sidebar.personalWorkspace")} yon="sag">
            <Avatar ad={me.name} renk={me.avatarColor} boyut={34} />
          </Tooltip>
        </div>
      )}

      {/* menü */}
      <nav className="scrollbar-none flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {gorunurNav.map((item) => {
          const aktif = aktifMi(item.href);
          const etiket = item.key ? t(item.key) : item.ad;
          const link = (
            <Link
              href={item.href}
              className={cn(
                "group/nav flex items-center gap-3 rounded-xl text-[14.5px] font-medium transition-colors duration-150",
                dar ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
                aktif
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-700 hover:bg-canvas hover:text-slate-ink",
              )}
            >
              <LucideIcon name={item.icon} className={cn("size-[18px] shrink-0 transition-colors", aktif ? "text-brand-600" : "text-slate-500 group-hover/nav:text-slate-700")} />
              {!dar && <span className="truncate">{etiket}</span>}
            </Link>
          );
          return (
            <div key={item.href}>
              {dar ? (
                <Tooltip metin={etiket} yon="sag" className="w-full [&>a]:w-full">
                  {link}
                </Tooltip>
              ) : (
                link
              )}
              {!dar && item.alt && aktif && (
                <div className="ml-[30px] mt-0.5 space-y-0.5">
                  {item.alt.map((a) => (
                    <Link
                      key={a.href}
                      href={a.href}
                      className="block rounded-lg px-3 py-1.5 text-[13.5px] text-slate-muted transition hover:text-slate-ink"
                    >
                      {a.key ? t(a.key) : a.ad}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* dış bağlantılar (Tavily'deki gibi) */}
        {!dar && (
          <div className="mt-1 space-y-0.5 border-t border-line pt-2">
            <Link href="/panel/gelistirici" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium text-slate-700 transition hover:bg-canvas hover:text-slate-ink">
              <BookOpen className="size-[18px] shrink-0 text-slate-faint" /> {t("sidebar.docs")}
              <Icons.ExternalLink className="ml-auto size-3.5 text-slate-faint" />
            </Link>
            <a href="/ornek.html" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium text-slate-700 transition hover:bg-canvas hover:text-slate-ink">
              <GlobeIcon className="size-[18px] shrink-0 text-slate-faint" /> {t("sidebar.widgetExample")}
              <Icons.ExternalLink className="ml-auto size-3.5 text-slate-faint" />
            </a>
          </div>
        )}
      </nav>

      {/* dil değiştirici (TR / EN) */}
      <div className={cn("mt-2", dar ? "flex justify-center" : "px-1")}>
        {dar ? (
          <Tooltip metin={t("sidebar.language")} yon="sag">
            <button
              onClick={() => dilDegistir(dil === "tr" ? "en" : "tr")}
              aria-label={t("sidebar.language")}
              className="grid size-8 place-items-center rounded-lg text-slate-faint transition hover:bg-canvas hover:text-slate-ink"
            >
              <Languages className="size-[18px]" />
            </button>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-slate-faint">
            <Languages className="size-[18px] shrink-0" />
            <div className="grid flex-1 grid-cols-5 items-center gap-0.5 rounded-lg bg-canvas p-0.5">
              {DESTEKLENEN_DILLER.map((d) => (
                <button
                  key={d}
                  onClick={() => dilDegistir(d)}
                  title={DIL_META[d].yerelAd}
                  className={cn(
                    "rounded-md py-1 text-[11.5px] font-semibold transition",
                    dil === d ? "bg-surface text-brand-600 shadow-card" : "text-slate-muted hover:text-slate-ink",
                  )}
                >
                  {DIL_ETIKET[d]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* küçük mod düğmesi */}
      <div className={cn("mt-2 flex", dar ? "justify-center" : "justify-end px-1")}>
        <Tooltip metin={dar ? t("sidebar.expand") : t("sidebar.collapse")} yon={dar ? "sag" : "ust"}>
          <button
            onClick={toggleDar}
            aria-label={dar ? t("sidebar.expand") : t("sidebar.collapse")}
            className="grid size-8 place-items-center rounded-lg text-slate-faint transition hover:bg-canvas hover:text-slate-ink"
          >
            {dar ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          </button>
        </Tooltip>
      </div>

      {/* alt: kredi bakiyesi (yalnızca geniş mod) */}
      {!dar && typeof me.krediBakiye === "number" && (
        <Link
          href="/panel/ayarlar/plan"
          className="mt-1 flex items-center justify-between gap-2 rounded-xl border border-line bg-canvas/50 px-3 py-2 transition hover:border-brand-200 hover:bg-brand-50/50"
        >
          <span className="flex items-center gap-2 text-[12.5px] font-medium text-slate-muted">
            <Icons.Wallet className="size-4 text-brand-600" /> Kredi
          </span>
          <span className="num text-[13px] font-semibold text-slate-ink">{me.krediBakiye.toLocaleString("tr-TR")}</span>
        </Link>
      )}

      {/* alt: kullanıcı */}
      <div className={cn("mt-1 flex items-center gap-2.5 border-t border-line pt-3", dar && "flex-col")}>
        {dar ? (
          <>
            <Tooltip metin={me.name} yon="sag">
              <Avatar ad={me.name} renk={me.avatarColor} boyut={32} />
            </Tooltip>
            <Tooltip metin={t("sidebar.logout")} yon="sag">
              <button onClick={cikis} aria-label={t("sidebar.logout")} className="grid size-8 place-items-center rounded-lg text-slate-faint transition hover:bg-canvas hover:text-slate-ink">
                <LogOut className="size-4" />
              </button>
            </Tooltip>
          </>
        ) : (
          <>
            <Avatar ad={me.name} renk={me.avatarColor} boyut={32} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-ink">{me.name}</div>
              <div className="truncate text-[12px] text-slate-faint">{me.email}</div>
            </div>
            <Tooltip metin={t("sidebar.logout")} yon="ust">
              <button onClick={cikis} aria-label={t("sidebar.logout")} className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-faint transition hover:bg-canvas hover:text-slate-ink">
                <LogOut className="size-4" />
              </button>
            </Tooltip>
          </>
        )}
      </div>
    </aside>
    </>
  );
}
