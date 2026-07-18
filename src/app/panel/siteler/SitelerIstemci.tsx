"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Globe, ShieldCheck, ChevronRight, Eye, Shield, Clock, ShieldAlert, Layers, Activity } from "lucide-react";
import { PanelBaslik, Panel, StatKart, Modal, Alan, Girdi, Alan2, Secim, BosDurum, Badge, useToast } from "@/components/panel/kit";
import { Gauge } from "@/components/panel/grafikler-ek";
import { MiniSpark } from "@/components/panel/grafikler";
import { Button } from "@/components/ui/Button";
import { DogrulamaAdimi } from "./DogrulamaAdimi";
import { sitelerCeviri } from "./siteler.i18n";
import type { Dil } from "@/lib/i18n/panel";
import { cn } from "@/lib/cn";

interface SiteRow {
  id: string;
  name: string;
  domains: string[];
  difficulty: string;
  mode: string;
  invisibleMode: boolean;
  active: boolean;
  verified: boolean;
  stats: { issued: number; blocked: number };
}

/** Koruma modu enum değeri → i18n etiket anahtarı. Enum değeri asla çevrilmez. */
const MODE_ETIKET_ANAHTAR: Record<string, string> = { monitor: "st.modIzleme", challenge: "st.modDogrulama", block: "st.modEngelleme" };

/**
 * Koruma skoru — SUNUM türevi (yeni veri DEĞİL): mevcut alanlardan hesaplanır.
 * Doğrulama, aktiflik, mod sertliği, zorluk ve görünmez-mod ağırlıklandırılır.
 * Sadece kartın dairesel göstergesini beslemek için; DB'ye yazılmaz.
 */
function korumaSkoru(s: SiteRow): number {
  let p = 0;
  p += s.verified ? 34 : 8;
  p += s.active ? 22 : 4;
  p += s.mode === "block" ? 22 : s.mode === "challenge" ? 15 : 6;
  p += s.difficulty === "high" ? 14 : s.difficulty === "medium" ? 9 : 4;
  p += s.invisibleMode ? 8 : 0;
  return Math.max(0, Math.min(100, Math.round(p)));
}

/** Site ekleme sihirbazının 2. adımında ihtiyaç duyulan alanlar. */
interface YeniSite {
  id: string;
  name: string;
  domains: string[];
  verifyToken: string;
}

export function SitelerIstemci({ sites, dil }: { sites: SiteRow[]; dil: Dil }) {
  const t = (k: string) => sitelerCeviri(k, dil);
  const router = useRouter();
  const { goster } = useToast();
  const [open, setOpen] = useState(false);
  // "form" = domain girişi (adım 1), "verify" = sahiplik doğrulaması (adım 2)
  const [adim, setAdim] = useState<"form" | "verify">("form");
  const [yeni, setYeni] = useState<YeniSite | null>(null);
  const [form, setForm] = useState({ name: "", domains: "", difficulty: "medium", mode: "challenge" });
  const [busy, setBusy] = useState(false);

  // Üst özet — sadece görüntüleme türevi (mevcut verilerin toplamı/sayımı).
  const ozet = useMemo(() => {
    const korunan = sites.filter((s) => s.active && s.verified).length;
    const dogrulanan = sites.filter((s) => s.verified).length;
    const engellenen = sites.reduce((a, s) => a + s.stats.blocked, 0);
    return { toplam: sites.length, korunan, dogrulanan, engellenen };
  }, [sites]);

  function kapat() {
    setOpen(false);
    // Modal kapanış animasyonundan sonra durumu sıfırla.
    setTimeout(() => {
      setAdim("form");
      setYeni(null);
      setForm({ name: "", domains: "", difficulty: "medium", mode: "challenge" });
    }, 200);
  }

  // Adım 1 → siteyi "beklemede" oluştur, doğrulama adımına geç.
  async function olustur() {
    if (!form.name.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const { site } = await res.json();
        setYeni({ id: site.id, name: site.name, domains: site.domains, verifyToken: site.verifyToken });
        setAdim("verify");
        router.refresh();
      } else {
        goster({ tip: "hata", baslik: t("st.hataOlusturulamadi") });
      }
    } catch {
      goster({ tip: "hata", baslik: t("st.hataOlusturulamadi") });
    } finally {
      setBusy(false);
    }
  }

  // Adım 2 başarılı → detaya git.
  function dogrulandi() {
    goster({ tip: "basari", baslik: t("st.basariDogrulandi"), aciklama: t("st.basariKorumaAktif") });
    const id = yeni?.id;
    kapat();
    if (id) router.push(`/panel/siteler/${id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      <PanelBaslik
        baslik={t("st.baslik")}
        aciklama={t("st.aciklama")}
        aksiyon={<Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> {t("st.yeniSite")}</Button>}
      />

      {sites.length === 0 ? (
        <BosDurum ikon={<Globe className="size-8" />} baslik={t("st.bosBaslik")} aciklama={t("st.bosAciklama")} aksiyon={<Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> {t("st.ilkSite")}</Button>} />
      ) : (
        <>
          {/* Üst özet KPI */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatKart sayi={ozet.toplam} etiket={t("st.ozetToplam")} ikon={<Layers className="size-5" />} />
            <StatKart sayi={ozet.korunan} etiket={t("st.ozetKorunan")} ikon={<ShieldCheck className="size-5" />} tone="ok" />
            <StatKart sayi={ozet.dogrulanan} etiket={t("st.ozetDogrulanan")} ikon={<Activity className="size-5" />} tone="brand" />
            <StatKart sayi={ozet.engellenen.toLocaleString("tr-TR")} etiket={t("st.ozetEngellenen")} ikon={<ShieldAlert className="size-5" />} tone={ozet.engellenen > 0 ? "warn" : undefined} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {sites.map((s) => {
              const rate = s.stats.issued ? (s.stats.blocked / s.stats.issued) * 100 : 0;
              const skor = korumaSkoru(s);
              const sparkRenk = s.mode === "block" ? "#dc2626" : s.mode === "monitor" ? "#64748b" : "#2f6fed";
              return (
                <Link key={s.id} href={`/panel/siteler/${s.id}`}>
                  <Panel className="group h-full transition hover:-translate-y-0.5 hover:shadow-lift">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", s.verified ? "bg-brand-50 text-brand-600" : "bg-warn-soft text-amber-600")}>
                          {s.verified ? <ShieldCheck className="size-5" /> : <Clock className="size-5" />}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-ink group-hover:text-brand-700">{s.name}</div>
                          <div className="truncate text-[13px] text-slate-faint">{s.domains.join(", ")}</div>
                        </div>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-slate-faint transition group-hover:translate-x-0.5" />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {s.verified ? (
                        <Badge ton={s.active ? "yesil" : "gri"}>{s.active ? t("st.aktif") : t("st.pasif")}</Badge>
                      ) : (
                        <Badge ton="sari"><Clock className="size-3" /> {t("st.dogrulamaBekliyor")}</Badge>
                      )}
                      <Badge ton={s.mode === "block" ? "kirmizi" : s.mode === "monitor" ? "gri" : "sari"}>
                        <Shield className="size-3" /> {t(MODE_ETIKET_ANAHTAR[s.mode] ?? "st.modDogrulama")}
                      </Badge>
                      {s.verified && (
                        <Badge ton="brand"><ShieldCheck className="size-3" /> {t("st.dogrulandi")}</Badge>
                      )}
                      {s.invisibleMode && <Badge ton="mavi"><Eye className="size-3" /> {t("st.gorunmez")}</Badge>}
                    </div>

                    {/* Gösterge + trafik sparkline. Doğrulanmamış sitede koruma
                        PASİF olduğundan skor GÖSTERİLMEZ (yanıltıcı olur — bu bir
                        doğrulama yüzdesi DEĞİLDİR). Doğrulama tamamlanınca gerçek
                        koruma skoru belirir. */}
                    <div className="mt-4 flex items-center gap-4 border-t border-line pt-4">
                      <div className="flex shrink-0 flex-col items-center">
                        {s.verified ? (
                          <Gauge deger={skor} boyut={112} etiket={t("st.korumaSkoru")} />
                        ) : (
                          <div className="flex h-[112px] w-[112px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-warn/40 bg-warn-soft/40 text-center">
                            <Clock className="size-5 text-amber-600" />
                            <span className="px-1 text-[11px] font-semibold leading-tight text-amber-700">{t("st.dogrulamaBekliyor")}</span>
                            <span className="px-1 text-[9.5px] leading-tight text-amber-600/80">{t("st.korumaPasif")}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between text-[12px] text-slate-faint">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={cn("size-1.5 rounded-full", s.active ? "bg-ok" : "bg-slate-300")} />
                            {s.active ? t("st.widgetAktif") : t("st.widgetPasif")}
                          </span>
                          <span>{t("st.trafik30g")}</span>
                        </div>
                        <MiniSpark tohum={s.id} renk={sparkRenk} yukseklik={44} />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
                      <Mini ad={t("st.statDogrulama")} deger={s.stats.issued.toLocaleString("tr-TR")} />
                      <Mini ad={t("st.statEngellenen")} deger={s.stats.blocked.toLocaleString("tr-TR")} renk="text-danger2" />
                      <Mini ad={t("st.statBotOrani")} deger={`%${rate.toFixed(0)}`} />
                    </div>
                  </Panel>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <Modal
        acik={open}
        kapat={kapat}
        baslik={adim === "form" ? t("st.modalOlusturBaslik") : t("st.modalDogrulaBaslik")}
        aciklama={adim === "verify" ? t("st.modalDogrulaAciklama") : undefined}
        genislik={adim === "verify" ? "max-w-2xl" : "max-w-lg"}
      >
        {adim === "form" ? (
          <div className="space-y-4">
            <Alan etiket={t("st.siteAdi")}>
              <Girdi value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="acme-shop.com" autoFocus />
            </Alan>
            <Alan etiket={t("st.izinliAlanlar")} opsiyonel>
              <Alan2 rows={3} value={form.domains} onChange={(e) => setForm({ ...form, domains: e.target.value })} placeholder={"acme-shop.com\nwww.acme-shop.com"} />
            </Alan>
            <div className="grid grid-cols-2 gap-3">
              <Alan etiket={t("st.zorluk")}>
                <Secim value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="low">{t("st.zorlukDusuk")}</option>
                  <option value="medium">{t("st.zorlukOrta")}</option>
                  <option value="high">{t("st.zorlukYuksek")}</option>
                </Secim>
              </Alan>
              <Alan etiket={t("st.korumaModu")}>
                <Secim value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                  <option value="monitor">{t("st.modIzleme")}</option>
                  <option value="challenge">{t("st.modDogrulama")}</option>
                  <option value="block">{t("st.modEngelleme")}</option>
                </Secim>
              </Alan>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={kapat}>{t("st.iptal")}</Button>
              <Button onClick={olustur} disabled={busy || !form.name.trim()}>{busy ? t("st.olusturuluyor") : t("st.devamEt")}</Button>
            </div>
          </div>
        ) : (
          yeni && <DogrulamaAdimi site={yeni} onDogrulandi={dogrulandi} onSonra={kapat} dil={dil} />
        )}
      </Modal>
    </div>
  );
}

function Mini({ ad, deger, renk }: { ad: string; deger: string; renk?: string }) {
  return (
    <div>
      <div className="text-[12px] text-slate-faint">{ad}</div>
      <div className={cn("mt-0.5 text-[17px] font-semibold num", renk || "text-slate-ink")}>{deger}</div>
    </div>
  );
}
