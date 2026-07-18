"use client";

/**
 * Specter — Kural Sürüm Geçmişi & Geri-Alma (istemci)
 * ===================================================
 * "Kurallar için git geçmişi" hissi: sol tarafta sürümü olan kuralların
 * aranabilir listesi; sağ tarafta seçili kuralın dikey sürüm zaman çizelgesi
 * (en yeni üstte), her sürümün anlık-görüntü özeti ve — anahtar özellik —
 * seçilen sürüm ile GÜNCEL yapılandırma arasındaki alan-alan FARK (diff).
 * "Bu sürüme geri dön" → POST /api/rules/:id/revert.
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  History, GitCommit, Search, RotateCcw, AlertTriangle, Clock,
  User as UserIcon, ArrowRight, Layers, Pencil, ShieldCheck,
  Activity, GitBranch, CheckCircle2, Sparkles,
} from "lucide-react";
import { Panel, StatKart, Badge, BosDurum, useToast } from "@/components/panel/kit";
import { Histogram, Gauge } from "@/components/panel/grafikler-ek";
import { MiniSpark } from "@/components/panel/grafikler";
import { Button } from "@/components/ui/Button";
import { FIELD_ETIKET, OP_ETIKET, grupOzet } from "@/lib/specter/rule-engine";
import type { RuleVersion, RuleField, RuleOp, RuleAction, RuleKosulGrup } from "@/lib/db/schema";
import type { Dil } from "@/lib/i18n/panel";
import { kuralSurumCeviri, YEREL_KOD } from "./kural-surum.i18n";
import { cn } from "@/lib/cn";

/** Yerel çeviri fonksiyonu tipi (alt bileşenlere geçirilir). */
type Ceviri = (anahtar: string) => string;

/* Sunucudan gelen sadeleştirilmiş kural yapısı. */
export interface KuralAyar {
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  field: RuleField;
  op: RuleOp;
  value: string;
  action: RuleAction;
  kosulGrup?: RuleKosulGrup;
}
export interface KuralVeri {
  id: string;
  siteId: string;
  siteAdi: string;
  guncel: KuralAyar;
  history: RuleVersion[];
}

/* --- yardımcılar --- */

/** Zaman damgasını "3 sa önce" gibi göreli metne çevirir (dil'e göre). */
function goreliZaman(ts: number, t: Ceviri, dil: Dil): string {
  const fark = Date.now() - ts;
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return t("zaman.azOnce");
  if (dk < 60) return t("zaman.dk").replace("{n}", String(dk));
  const sa = Math.floor(dk / 60);
  if (sa < 24) return t("zaman.sa").replace("{n}", String(sa));
  const gun = Math.floor(sa / 24);
  if (gun < 30) return t("zaman.gun").replace("{n}", String(gun));
  return new Date(ts).toLocaleDateString(YEREL_KOD[dil]);
}

/** Tam tarih-saat (tooltip / ikincil gösterim) — BCP-47 yerelleştirmeli. */
function tamZaman(ts: number, dil: Dil): string {
  return new Date(ts).toLocaleString(YEREL_KOD[dil], {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/**
 * Bir yapılandırmanın koşulunu insan-okur metne çevirir (grup varsa onu).
 * Not: koşul özeti lib'in FIELD_ETIKET/OP_ETIKET çıktısıdır — teknik kural-DSL
 * metnidir, veri gibi ele alınır (kural-lab deseniyle tutarlı).
 */
function kosulMetni(a: KuralAyar): string {
  if (a.kosulGrup) return grupOzet(a.kosulGrup);
  return `${FIELD_ETIKET[a.field]} ${OP_ETIKET[a.op]} "${a.value}"`;
}

/** Aksiyon rozetinin tonu. */
function aksiyonTon(action: RuleAction): "yesil" | "sari" | "kirmizi" | "mavi" {
  return action === "allow" ? "yesil" : action === "challenge" ? "sari" : action === "block" ? "kirmizi" : "mavi";
}

/** Aksiyon etiketi — enum id sabittir, etiket key-map'ten türetilir (ENUM GÜVENLİĞİ). */
function aksiyonEtiket(action: RuleAction, t: Ceviri): string {
  return t(`aksiyon.${action}`);
}

/* --- diff modeli ---
 * Seçili sürümün snapshot'ı ile kuralın GÜNCEL yapılandırmasını alan-alan
 * karşılaştırır. Değişen alanlar "eski → yeni" biçiminde vurgulanır. */
interface DiffSatir {
  etiket: string;
  eski: string;
  yeni: string;
  degisti: boolean;
}

function ayarMetin(a: KuralAyar, alan: string, t: Ceviri): string {
  switch (alan) {
    case "name": return a.name;
    case "priority": return String(a.priority);
    case "enabled": return a.enabled ? t("durum.aktif") : t("durum.pasif");
    case "action": return aksiyonEtiket(a.action, t);
    case "kosul": return kosulMetni(a);
    case "description": return a.description || "—";
    default: return "";
  }
}

function diffHesapla(eski: KuralAyar, yeni: KuralAyar, t: Ceviri): DiffSatir[] {
  const alanlar: { alan: string; etiketKey: string }[] = [
    { alan: "name", etiketKey: "alan.ad" },
    { alan: "action", etiketKey: "alan.aksiyon" },
    { alan: "kosul", etiketKey: "alan.kosul" },
    { alan: "priority", etiketKey: "alan.oncelik" },
    { alan: "enabled", etiketKey: "alan.durum" },
    { alan: "description", etiketKey: "alan.aciklama" },
  ];
  return alanlar.map(({ alan, etiketKey }) => {
    const e = ayarMetin(eski, alan, t);
    const y = ayarMetin(yeni, alan, t);
    return { etiket: t(etiketKey), eski: e, yeni: y, degisti: e !== y };
  });
}

/* ================================================================= Ana bileşen */

export function KuralSurumIstemci({ dil, kurallar }: { dil: Dil; kurallar: KuralVeri[] }) {
  const { goster } = useToast();
  const t: Ceviri = (anahtar) => kuralSurumCeviri(anahtar, dil);
  const [sorgu, setSorgu] = useState("");
  // Geri-alma çalışırken kuralların yerel geçmişini iyimser güncellemek için.
  const [yerel, setYerel] = useState<KuralVeri[]>(kurallar);
  // Seçili kural id'si.
  const surumluKurallar = useMemo(() => yerel.filter((k) => k.history.length > 0), [yerel]);
  const [seciliId, setSeciliId] = useState<string | null>(surumluKurallar[0]?.id ?? null);
  // Seçili sürüm numarası (diff için). null → en son geçmiş sürümü.
  const [seciliSurum, setSeciliSurum] = useState<number | null>(null);
  // Geri-alma onay durumu: hangi sürüm için onay bekleniyor.
  const [onayBekleyen, setOnayBekleyen] = useState<number | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState<number | null>(null);

  /* --- istatistikler --- */
  const toplamSurumluKural = surumluKurallar.length;
  const toplamSurumKaydi = useMemo(
    () => surumluKurallar.reduce((a, k) => a + k.history.length, 0),
    [surumluKurallar],
  );
  const enCokDuzenlenen = useMemo(() => {
    let en: KuralVeri | null = null;
    for (const k of surumluKurallar) if (!en || k.history.length > en.history.length) en = k;
    return en;
  }, [surumluKurallar]);

  // Kural başına sürüm-derinlik dağılımı (histogram): 1 / 2 / 3 / 4 / 5+ sürüm.
  const derinlikDagilim = useMemo(() => {
    const kova = [0, 0, 0, 0, 0]; // 1,2,3,4,5+
    for (const k of surumluKurallar) {
      const n = k.history.length;
      const i = n >= 5 ? 4 : Math.max(0, n - 1);
      kova[i]++;
    }
    return kova.map((deger, i) => ({ etiket: i === 4 ? "5+" : String(i + 1), deger }));
  }, [surumluKurallar]);

  // Ortalama sürüm derinliği (kural başına kaç sürüm) — gauge için 0-100'e ölçekle.
  const ortDerinlik = toplamSurumluKural ? toplamSurumKaydi / toplamSurumluKural : 0;
  const ortDerinlikYuzde = Math.min(100, Math.round((ortDerinlik / 8) * 100));

  /* --- arama --- */
  const filtreli = useMemo(() => {
    const q = sorgu.trim().toLowerCase();
    if (!q) return surumluKurallar;
    return surumluKurallar.filter(
      (k) => k.guncel.name.toLowerCase().includes(q) || k.siteAdi.toLowerCase().includes(q),
    );
  }, [surumluKurallar, sorgu]);

  const secili = useMemo(() => yerel.find((k) => k.id === seciliId) ?? null, [yerel, seciliId]);

  // Geçmiş: en yeni üstte.
  const surumlerYeniUstte = useMemo(
    () => (secili ? [...secili.history].sort((a, b) => b.surum - a.surum) : []),
    [secili],
  );

  // Diff için baz alınacak sürüm: seçili yoksa en yeni geçmiş sürümü.
  const diffSurum = useMemo(() => {
    if (!secili) return null;
    const num = seciliSurum ?? surumlerYeniUstte[0]?.surum ?? null;
    return surumlerYeniUstte.find((v) => v.surum === num) ?? null;
  }, [secili, seciliSurum, surumlerYeniUstte]);

  const diff = useMemo(
    () => (secili && diffSurum ? diffHesapla(diffSurum.snapshot, secili.guncel, t) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [secili, diffSurum, dil],
  );
  const degisenSayisi = diff.filter((d) => d.degisti).length;

  function kuralSec(id: string) {
    setSeciliId(id);
    setSeciliSurum(null);
    setOnayBekleyen(null);
  }

  /* --- geri-alma --- */
  async function geriDon(surum: number) {
    if (!secili) return;
    setGonderiliyor(surum);
    try {
      const res = await fetch(`/api/rules/${secili.id}/revert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surum }),
      });
      if (!res.ok) {
        const durum = res.status;
        const mesaj =
          durum === 404 ? t("geri.bulunamadi")
          : durum === 403 ? t("geri.yetkiYok")
          : durum === 400 ? t("geri.gecersiz")
          : t("geri.basarisiz");
        goster({ tip: "hata", baslik: t("toast.alinamadi.baslik"), aciklama: mesaj });
        setOnayBekleyen(null);
        return;
      }
      // İyimser güncelleme: seçili sürümün snapshot'ını güncel yap ve mevcut
      // durumu yeni bir "geri döndürüldü" sürümü olarak geçmişe ekle
      // (API'nin yaptığının aynısı) — böylece sayfa yenilenmeden tutarlı görünür.
      const hedef = secili.history.find((v) => v.surum === surum);
      if (hedef) {
        setYerel((prev) =>
          prev.map((k) => {
            if (k.id !== secili.id) return k;
            const yeniSurumNo = k.history.length + 1;
            const yeniKayit: RuleVersion = {
              surum: yeniSurumNo,
              ts: Date.now(),
              actor: t("kayit.siz"),
              ozet: t("kayit.geriDonuldu").replace("{v}", String(surum)),
              snapshot: { ...k.guncel },
            };
            return {
              ...k,
              guncel: { ...hedef.snapshot },
              history: [...k.history, yeniKayit],
            };
          }),
        );
      }
      goster({
        tip: "basari",
        baslik: t("toast.donuldu.baslik").replace("{v}", String(surum)),
        aciklama: t("toast.donuldu.aciklama"),
      });
      setOnayBekleyen(null);
      setSeciliSurum(null);
    } catch {
      goster({ tip: "hata", baslik: t("toast.alinamadi.baslik"), aciklama: t("geri.aglHata") });
      setOnayBekleyen(null);
    } finally {
      setGonderiliyor(null);
    }
  }

  /* ----------------------------------------------------------------- render */

  // Hiçbir kuralın geçmişi yoksa: açıklayıcı boş durum.
  if (toplamSurumluKural === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
        <TanitimBandi t={t} />
        <BosDurum
          ikon={<History className="size-8" />}
          baslik={t("bos.baslik")}
          aciklama={t("bos.metin")}
          aksiyon={
            <Button variant="outline" size="sm" href="/panel/kurallar">
              <Pencil className="size-4" /> {t("bos.aksiyon")}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      <TanitimBandi t={t} />

      {/* özet istatistikleri — ferah KPI şeridi + görsel dağılım */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1.4fr]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-2">
          <StatKart sayi={toplamSurumluKural} etiket={t("ozet.surumluKural")} ikon={<GitCommit className="size-5" />} />
          <StatKart sayi={toplamSurumKaydi} etiket={t("ozet.toplamKayit")} ikon={<Layers className="size-5" />} tone="brand" />
          <StatKart
            sayi={enCokDuzenlenen ? enCokDuzenlenen.history.length : 0}
            etiket={enCokDuzenlenen ? t("ozet.enCokDuzenlenenAd").replace("{ad}", enCokDuzenlenen.guncel.name) : t("ozet.enCokDuzenlenen")}
            ikon={<Pencil className="size-5" />}
            tone="warn"
          />
          {/* ortalama sürüm derinliği — yarım-daire gauge */}
          <motion.div
            initial={{ y: 8 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-6 shadow-card"
          >
            <Gauge deger={ortDerinlikYuzde} boyut={128} renk="#2f6fed" />
            <div className="min-w-0">
              <div className="num text-2xl font-bold leading-none text-slate-ink">{ortDerinlik.toFixed(1)}</div>
              <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-slate-muted">
                <Activity className="size-3.5 text-brand-600" /> {t("ozet.ortDerinlik")}
              </p>
            </div>
          </motion.div>
        </div>

        {/* sürüm-derinlik dağılımı — histogram (kaç kuralın kaç sürümü var) */}
        <motion.div
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col rounded-3xl border border-line bg-surface p-6 shadow-card"
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <GitBranch className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-slate-ink">{t("ozet.derinlikBaslik")}</div>
              <div className="text-[11px] text-slate-faint">{t("ozet.derinlikAlt")}</div>
            </div>
          </div>
          <div className="mt-auto pt-3">
            <Histogram kovalar={derinlikDagilim} yukseklik={72} renk="#2f6fed" />
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* SOL: sürümlü kural listesi */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
            <input
              value={sorgu}
              onChange={(e) => setSorgu(e.target.value)}
              placeholder={t("liste.ara")}
              aria-label={t("liste.araLabel")}
              className="h-11 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
            />
          </div>

          <div className="space-y-2">
            {filtreli.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-slate-faint">
                {t("liste.eslesmeYok")}
              </div>
            ) : (
              filtreli.map((k) => {
                const sonDegisim = k.history.reduce((m, v) => Math.max(m, v.ts), 0);
                const aktifMi = k.id === seciliId;
                return (
                  <button
                    key={k.id}
                    onClick={() => kuralSec(k.id)}
                    className={cn(
                      "w-full rounded-2xl border bg-surface px-4 py-3 text-left transition",
                      aktifMi
                        ? "border-brand-400 shadow-card ring-1 ring-brand-200"
                        : "border-line hover:border-line-strong hover:bg-canvas",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-[14px] font-semibold text-slate-ink">{k.guncel.name}</span>
                      <span className="shrink-0">
                        <Badge ton={aktifMi ? "brand" : "gri"}>
                          <GitCommit className="size-3" /> {k.history.length}
                        </Badge>
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-slate-muted">
                      <span className="truncate">{k.siteAdi}</span>
                    </div>
                    {/* sürüm-aktivite izi — kural id tohumlu mini sparkline */}
                    <div className="mt-2 h-6 opacity-80">
                      <MiniSpark tohum={k.id + k.history.length} renk={aktifMi ? "#2f6fed" : "#93b4f0"} yukseklik={24} />
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-faint">
                      <Clock className="size-3" /> {t("liste.sonDegisim").replace("{zaman}", goreliZaman(sonDegisim, t, dil))}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* SAĞ: seçili kuralın zaman çizelgesi + diff */}
        <div className="space-y-6">
          {!secili ? (
            <Panel>
              <div className="py-16 text-center text-sm text-slate-faint">{t("liste.kuralSec")}</div>
            </Panel>
          ) : (
            <>
              {/* güncel durum başlığı */}
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                        <ShieldCheck className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold text-slate-ink">{secili.guncel.name}</div>
                        <div className="text-[12px] text-slate-muted">{secili.siteAdi}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge ton={aksiyonTon(secili.guncel.action)}>{aksiyonEtiket(secili.guncel.action, t)}</Badge>
                    <Badge ton={secili.guncel.enabled ? "yesil" : "gri"}>
                      {secili.guncel.enabled ? t("durum.aktif") : t("durum.pasif")}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-canvas/50 px-3.5 py-2.5 text-[13px] text-slate-ink">
                  <span className="font-mono">{kosulMetni(secili.guncel)}</span>
                </div>
              </Panel>

              {/* DIFF görünümü — anahtar özellik */}
              {diffSurum && (
                <Panel
                  baslik={
                    <span className="flex items-center gap-2">
                      <ArrowRight className="size-4 text-brand-600" />
                      {t("diff.baslik").replace("{v}", String(diffSurum.surum))}
                    </span>
                  }
                  sagUst={
                    <Badge ton={degisenSayisi > 0 ? "sari" : "yesil"}>
                      {degisenSayisi > 0 ? t("diff.degisti").replace("{n}", String(degisenSayisi)) : t("diff.farkYok")}
                    </Badge>
                  }
                >
                  {/* görsel diff özeti — değişen/aynı alan oranı şeridi */}
                  <div className="mb-4 flex items-center gap-4 rounded-2xl border border-line bg-canvas/40 px-4 py-3">
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={cn("grid size-9 place-items-center rounded-xl", degisenSayisi > 0 ? "bg-warn-soft text-amber-700" : "bg-ok-soft text-ok")}>
                        {degisenSayisi > 0 ? <Sparkles className="size-[18px]" /> : <CheckCircle2 className="size-[18px]" />}
                      </span>
                      <div>
                        <div className="num text-[17px] font-bold leading-none text-slate-ink">
                          {degisenSayisi}<span className="text-[13px] font-medium text-slate-faint">/{diff.length}</span>
                        </div>
                        <div className="text-[11px] text-slate-muted">{t("diff.ozet.alan")}</div>
                      </div>
                    </div>
                    {/* alan-alan segment şeridi: değişen amber, aynı yeşil-ince */}
                    <div className="flex flex-1 gap-1">
                      {diff.map((d) => (
                        <span
                          key={d.etiket}
                          title={d.etiket}
                          className={cn("h-2.5 flex-1 rounded-full transition-all", d.degisti ? "bg-amber-400" : "bg-emerald-200")}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {diff.map((d) => (
                      <div
                        key={d.etiket}
                        className={cn(
                          "rounded-xl border px-3.5 py-2.5",
                          d.degisti ? "border-amber-200 bg-warn-soft/40" : "border-line bg-surface",
                        )}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-faint">{d.etiket}</span>
                          {d.degisti && (
                            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              {t("diff.rozet.degisti")}
                            </span>
                          )}
                        </div>
                        {d.degisti ? (
                          <div className="flex flex-wrap items-center gap-2 text-[13px]">
                            <span className="rounded-lg bg-danger-soft px-2 py-1 font-mono text-[12.5px] text-red-700 line-through decoration-red-400/50">
                              {d.eski}
                            </span>
                            <ArrowRight className="size-3.5 shrink-0 text-slate-faint" />
                            <span className="rounded-lg bg-ok-soft px-2 py-1 font-mono text-[12.5px] text-green-700">
                              {d.yeni}
                            </span>
                          </div>
                        ) : (
                          <div className="font-mono text-[12.5px] text-slate-muted">{d.yeni}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 flex items-start gap-1.5 text-[12px] text-slate-muted">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warn" />
                    {t("diff.dipnot").replace("{v}", String(diffSurum.surum))}
                  </p>
                </Panel>
              )}

              {/* SÜRÜM ZAMAN ÇİZELGESİ */}
              <Panel baslik={<span className="flex items-center gap-2"><History className="size-4 text-brand-600" /> {t("zaman.baslik")}</span>}>
                <div className="relative space-y-4 pl-6">
                  {/* dikey çizgi */}
                  <span className="absolute left-[7px] top-1 bottom-1 w-px bg-line" aria-hidden />
                  {surumlerYeniUstte.map((v, i) => {
                    const enYeniGecmis = i === 0;
                    const seciliMi = (seciliSurum ?? surumlerYeniUstte[0]?.surum) === v.surum;
                    return (
                      <SurumSatiri
                        key={v.surum}
                        v={v}
                        t={t}
                        dil={dil}
                        seciliMi={seciliMi}
                        enYeniGecmis={enYeniGecmis}
                        onayBekleyen={onayBekleyen === v.surum}
                        gonderiliyor={gonderiliyor === v.surum}
                        onSec={() => { setSeciliSurum(v.surum); setOnayBekleyen(null); }}
                        onGeriDonIste={() => setOnayBekleyen(v.surum)}
                        onGeriDonIptal={() => setOnayBekleyen(null)}
                        onGeriDonOnayla={() => geriDon(v.surum)}
                      />
                    );
                  })}
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- alt parçalar */

function TanitimBandi({ t }: { t: Ceviri }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
      <History className="mt-0.5 size-5 shrink-0 text-brand-600" />
      <div>
        <p className="text-sm font-semibold text-slate-ink">{t("band.baslik")}</p>
        <p className="mt-0.5 text-[13px] text-slate-muted">{t("band.metin")}</p>
      </div>
    </div>
  );
}

function SurumSatiri({
  v, t, dil, seciliMi, enYeniGecmis, onayBekleyen, gonderiliyor,
  onSec, onGeriDonIste, onGeriDonIptal, onGeriDonOnayla,
}: {
  v: RuleVersion;
  t: Ceviri;
  dil: Dil;
  seciliMi: boolean;
  enYeniGecmis: boolean;
  onayBekleyen: boolean;
  gonderiliyor: boolean;
  onSec: () => void;
  onGeriDonIste: () => void;
  onGeriDonIptal: () => void;
  onGeriDonOnayla: () => void;
}) {
  const s = v.snapshot;
  const kosul = s.kosulGrup ? grupOzet(s.kosulGrup) : `${FIELD_ETIKET[s.field]} ${OP_ETIKET[s.op]} "${s.value}"`;
  return (
    <div className="relative">
      {/* zaman çizelgesi noktası */}
      <span
        className={cn(
          "absolute -left-6 top-1.5 grid size-3.5 place-items-center rounded-full ring-4 ring-surface",
          enYeniGecmis ? "bg-brand-600" : "bg-slate-300",
        )}
        aria-hidden
      />
      <button
        onClick={onSec}
        className={cn(
          "w-full rounded-2xl border px-4 py-3 text-left transition",
          seciliMi ? "border-brand-400 bg-brand-50/40 ring-1 ring-brand-200" : "border-line hover:border-line-strong hover:bg-canvas",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[12px] font-bold text-slate-ink">{t("surum.no").replace("{v}", String(v.surum))}</span>
          {enYeniGecmis && <Badge ton="brand">{t("surum.enYeni")}</Badge>}
          <Badge ton={aksiyonTon(s.action)}>{aksiyonEtiket(s.action, t)}</Badge>
          <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-faint" title={tamZaman(v.ts, dil)}>
            <Clock className="size-3" /> {goreliZaman(v.ts, t, dil)}
          </span>
        </div>
        <div className="mt-1.5 text-[13px] font-medium text-slate-ink">{v.ozet}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-muted">
          <span className="flex items-center gap-1"><UserIcon className="size-3" /> {v.actor}</span>
          <span className="truncate font-mono text-[11.5px]">{s.name}</span>
        </div>
        <div className="mt-1.5 rounded-lg bg-canvas/60 px-2.5 py-1.5 font-mono text-[11.5px] text-slate-ink">{kosul}</div>
      </button>

      {/* geri-alma aksiyonu */}
      <div className="mt-2 flex items-center gap-2 pl-1">
        {onayBekleyen ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-warn-soft/50 px-3 py-2">
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-amber-800">
              <AlertTriangle className="size-3.5" /> {t("surum.geriDonSor").replace("{v}", String(v.surum))}
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={onGeriDonOnayla}
              disabled={gonderiliyor}
            >
              {gonderiliyor ? t("surum.geriDonuluyor") : <><RotateCcw className="size-3.5" /> {t("surum.geriDonOnay")}</>}
            </Button>
            <Button variant="ghost" size="sm" onClick={onGeriDonIptal} disabled={gonderiliyor}>
              {t("surum.iptal")}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={onGeriDonIste}>
            <RotateCcw className="size-3.5" /> {t("surum.geriDonMe")}
          </Button>
        )}
      </div>
    </div>
  );
}
