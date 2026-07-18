"use client";

/**
 * Kayıtlı Avlar & Zamanlanmış Tehdit Avı — İstemci
 * ================================================
 * Sigma/Elastic "kayıtlı arama" hissi veren bir tespit-kuralı kütüphanesi.
 * Avlar, /panel/tehdit-avi'nin DSL motoruyla sahibin GERÇEK olaylarına karşı
 * çalıştırılır (sonuçlar sunucudan gelir). "Zamanlanmış/uyarı" katmanı
 * TEMSİLEN gösterilir — gerçek zamanlayıcı sunucu tarafında ayrı çalışır.
 * Özel kaydedilen avlar yalnızca bu tarayıcıda (localStorage) tutulur.
 */
import { useMemo, useState, useEffect } from "react";
import {
  BookMarked,
  Bell,
  BellRing,
  Clock,
  Play,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  ExternalLink,
  Tag,
  CheckCircle2,
  Zap,
  Fingerprint,
  Bot,
  Radar,
  ShieldOff,
  Waves,
  Flame,
  AlertTriangle,
  Terminal,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import {
  Panel,
  PanelBaslik,
  StatKart,
  Badge,
  NotKutusu,
  BosDurum,
  Modal,
  Alan,
  Girdi,
  Alan2,
  Secim,
  DurumRozeti,
  useToast,
} from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { DonutDagilim } from "@/components/panel/grafikler";
import { RadarGrafik, IsiMatris, Gauge } from "@/components/panel/grafikler-ek";
import {
  sorguGecerliMi,
  type KayitliAv,
  type AvKategori,
  type AvSiddet,
} from "./avlar";
import {
  avCeviri,
  kategoriAd,
  siddetAd,
  siklikAd,
  avAd,
  avAciklama,
  KA_LOCALE,
} from "./kayitli-avlar.i18n";

/* ------------------------------------------------------------------ Tipler */

interface OrnekOlay {
  id: string;
  ts: number;
  ip: string;
  country: string;
  asn: string;
  ua: string;
  path: string;
  botClass: string;
  verdict: string;
  score: number;
}

interface AvSonucDto {
  av: KayitliAv;
  eslesme: number;
  tetiklendi: boolean;
  esik: number;
  ornekler: OrnekOlay[];
}

interface AvlarOzetDto {
  toplamAv: number;
  tetiklenen: number;
  zamanliAv: number;
  kritikTetik: number;
}

/** Kullanıcının localStorage'a kaydettiği özel av. */
interface OzelAv {
  id: string;
  ad: string;
  aciklama: string;
  sorgu: string;
  kategori: AvKategori;
}

const DEPO_ANAHTAR = "specter.kayitli-avlar.v1";

/* ------------------------------------------------------------------ Yardımcı görsel eşlemler */

const SIDDET_TON: Record<AvSiddet, "kirmizi" | "sari" | "mavi" | "gri"> = {
  kritik: "kirmizi",
  yuksek: "sari",
  orta: "mavi",
  dusuk: "gri",
};

const KATEGORI_TON: Record<AvKategori, "brand" | "kirmizi" | "sari" | "mavi" | "yesil" | "gri"> = {
  kimlik: "kirmizi",
  kazima: "sari",
  ai: "brand",
  atlatma: "mavi",
  ddos: "kirmizi",
  kesif: "yesil",
};

const KATEGORILER: AvKategori[] = ["kimlik", "kazima", "ai", "atlatma", "ddos", "kesif"];

/** Kategori → ikon (kart üst çizgisi + rozet için). */
const KATEGORI_IKON: Record<AvKategori, typeof Fingerprint> = {
  kimlik: Fingerprint,
  kazima: Radar,
  ai: Bot,
  atlatma: ShieldOff,
  ddos: Waves,
  kesif: Search,
};

/** Kategori → sol kenar aksan rengi (renk-kodlama). */
const KATEGORI_ACCENT: Record<AvKategori, string> = {
  kimlik: "#dc2626",
  kazima: "#d97706",
  ai: "#2f6fed",
  atlatma: "#7c74ff",
  ddos: "#dc2626",
  kesif: "#16a34a",
};

/** Kategori → ikon çipi sınıfı. */
const KATEGORI_CIP: Record<AvKategori, string> = {
  kimlik: "bg-danger-soft text-danger2 ring-red-200",
  kazima: "bg-warn-soft text-amber-600 ring-amber-200",
  ai: "bg-brand-50 text-brand-600 ring-brand-100",
  atlatma: "bg-blue-50 text-blue-600 ring-blue-200",
  ddos: "bg-danger-soft text-danger2 ring-red-200",
  kesif: "bg-ok-soft text-green-600 ring-green-200",
};

/** Şiddet → ikon (şiddet hapı içinde). */
const SIDDET_IKON: Record<AvSiddet, typeof Flame> = {
  kritik: Flame,
  yuksek: AlertTriangle,
  orta: ShieldAlert,
  dusuk: CheckCircle2,
};

/* ------------------------------------------------------------------ Ana bileşen */

export function KayitliAvlarIstemci({
  dil,
  sonuclar,
  ozet,
  toplamOlay,
}: {
  dil: Dil;
  sonuclar: AvSonucDto[];
  ozet: AvlarOzetDto;
  toplamOlay: number;
}) {
  const { goster } = useToast();
  const t = (k: string) => avCeviri(k, dil);
  const loc = KA_LOCALE[dil];

  const [arama, setArama] = useState("");
  const [aktifKategori, setAktifKategori] = useState<AvKategori | "hepsi">("hepsi");
  const [modalAcik, setModalAcik] = useState(false);
  const [ozelAvlar, setOzelAvlar] = useState<OzelAv[]>([]);

  // localStorage'dan özel avları yükle.
  useEffect(() => {
    try {
      const ham = localStorage.getItem(DEPO_ANAHTAR);
      if (ham) setOzelAvlar(JSON.parse(ham));
    } catch {
      /* bozuk kayıt → yok say */
    }
  }, []);

  function ozelAvlariKaydet(yeni: OzelAv[]) {
    setOzelAvlar(yeni);
    try {
      localStorage.setItem(DEPO_ANAHTAR, JSON.stringify(yeni));
    } catch {
      /* kota / gizli mod → sessiz geç */
    }
  }

  // Arama + kategori filtresi (hazır avlar). Çevrilmiş ad/açıklama da havuzda.
  const filtreli = useMemo(() => {
    const q = arama.trim().toLowerCase();
    return sonuclar.filter((s) => {
      if (aktifKategori !== "hepsi" && s.av.kategori !== aktifKategori) return false;
      if (!q) return true;
      const ad = avAd(s.av.id, dil) || s.av.ad;
      const aciklama = avAciklama(s.av.id, dil) || s.av.aciklama;
      const havuz = `${ad} ${aciklama} ${s.av.ad} ${s.av.aciklama} ${s.av.sorgu} ${s.av.etiketler.join(" ")}`.toLowerCase();
      return havuz.includes(q);
    });
  }, [sonuclar, arama, aktifKategori, dil]);

  // Kategori başına sayaç (filtre çipleri için).
  const kategoriSayac = useMemo(() => {
    const m = new Map<AvKategori, number>();
    for (const s of sonuclar) m.set(s.av.kategori, (m.get(s.av.kategori) ?? 0) + 1);
    return m;
  }, [sonuclar]);

  // Zamanlanmış + tetiklenen avlar (uyarı bölümü).
  const zamanliSonuclar = useMemo(() => sonuclar.filter((s) => s.av.zamanli), [sonuclar]);
  const tetiklenenZamanli = useMemo(() => zamanliSonuclar.filter((s) => s.tetiklendi), [zamanliSonuclar]);

  /* --------------------------------------------------- Görsel özet türetmeleri (yalnız görselleştirme) */

  // Bulgu (eşleşme) dağılımı — kategori bazında toplam eşleşme → donut.
  const bulguDonut = useMemo(() => {
    const m = new Map<AvKategori, number>();
    for (const s of sonuclar) m.set(s.av.kategori, (m.get(s.av.kategori) ?? 0) + s.eslesme);
    return KATEGORILER.filter((k) => (m.get(k) ?? 0) > 0).map((k) => ({
      etiket: kategoriAd(k, dil),
      deger: m.get(k) ?? 0,
      renk: KATEGORI_ACCENT[k],
    }));
  }, [sonuclar, dil]);

  // Av başarı (tetiklenme) oranı — gauge.
  const basariOran = sonuclar.length > 0
    ? Math.round((sonuclar.filter((s) => s.tetiklendi).length / sonuclar.length) * 100)
    : 0;

  // Kategori × şiddet yoğunluk ısı-matrisi (hücre = o gözdeki eşleşme toplamı).
  const SIDDETLER: AvSiddet[] = ["kritik", "yuksek", "orta", "dusuk"];
  const isiMatris = useMemo(() => {
    const grid = KATEGORILER.map(() => SIDDETLER.map(() => 0));
    for (const s of sonuclar) {
      const ki = KATEGORILER.indexOf(s.av.kategori);
      const si = SIDDETLER.indexOf(s.av.siddet);
      if (ki >= 0 && si >= 0) grid[ki][si] += s.eslesme;
    }
    return grid;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sonuclar]);

  // Kapsama profili radar — her kategori için "eşleşme yoğunluğu" 0-100 normalize.
  const radarEksenler = useMemo(() => {
    const m = new Map<AvKategori, number>();
    for (const s of sonuclar) m.set(s.av.kategori, (m.get(s.av.kategori) ?? 0) + s.eslesme);
    const max = Math.max(1, ...KATEGORILER.map((k) => m.get(k) ?? 0));
    return KATEGORILER.map((k) => ({
      etiket: kategoriAd(k, dil),
      deger: Math.round(((m.get(k) ?? 0) / max) * 100),
    }));
  }, [sonuclar, dil]);

  // Şerit metrikleri.
  const toplamEslesme = useMemo(() => sonuclar.reduce((a, s) => a + s.eslesme, 0), [sonuclar]);
  const ortEsik = sonuclar.length > 0
    ? Math.round(sonuclar.reduce((a, s) => a + s.esik, 0) / sonuclar.length)
    : 0;
  const enAktifKategori = useMemo(() => {
    if (bulguDonut.length === 0) return null;
    return bulguDonut.reduce((a, b) => (b.deger > a.deger ? b : a));
  }, [bulguDonut]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      <PanelBaslik
        aciklama={t("ka.serit.aciklama").replace("{n}", toplamOlay.toLocaleString(loc))}
        aksiyon={
          <Button variant="accent" size="sm" onClick={() => setModalAcik(true)}>
            <Plus className="size-4" /> {t("ka.serit.yeniAv")}
          </Button>
        }
      />

      {/* Özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={ozet.toplamAv} etiket={t("ka.ozet.toplamAv")} ikon={<BookMarked className="size-4" />} />
        <StatKart
          sayi={ozet.tetiklenen}
          etiket={t("ka.ozet.tetiklenen")}
          ikon={<BellRing className="size-4" />}
          tone={ozet.tetiklenen > 0 ? "warn" : undefined}
        />
        <StatKart sayi={ozet.zamanliAv} etiket={t("ka.ozet.zamanliAv")} ikon={<Clock className="size-4" />} />
        <StatKart
          sayi={ozet.kritikTetik}
          etiket={t("ka.ozet.kritikTetik")}
          ikon={<ShieldAlert className="size-4" />}
          tone={ozet.kritikTetik > 0 ? "danger" : undefined}
        />
      </div>

      {/* Görsel özet — ferah KPI şeridi + 3 farklı görsel dil (donut · gauge · radar/matris) */}
      {sonuclar.length > 0 && (
        <motion.div initial={{ y: 8 }} animate={{ y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <Panel padding={false} className="overflow-hidden p-0">
            {/* KPI şeridi */}
            <div className="grid grid-cols-2 divide-x divide-line border-b border-line lg:grid-cols-4">
              <SeritKPI
                deger={toplamEslesme.toLocaleString(loc)}
                etiket={t("ka.gorsel.toplamEslesme")}
                nokta="#2f6fed"
              />
              <SeritKPI
                deger={`%${basariOran}`}
                etiket={t("ka.gorsel.tetiklenenAv")}
                nokta={basariOran >= 50 ? "#d97706" : "#16a34a"}
              />
              <SeritKPI
                deger={enAktifKategori?.etiket ?? "—"}
                etiket={t("ka.gorsel.enAktifKategori")}
                nokta={enAktifKategori ? bulguDonut.find((b) => b.etiket === enAktifKategori.etiket)?.renk ?? "#7a7568" : "#7a7568"}
              />
              <SeritKPI
                deger={ortEsik.toLocaleString(loc)}
                etiket={t("ka.gorsel.ortEsik")}
                nokta="#7c74ff"
              />
            </div>

            {/* Üç sütun: bulgu donut · başarı gauge · kapsama radar */}
            <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.15fr)_auto_minmax(0,1fr)] lg:gap-8 lg:p-6">
              {/* Bulgu dağılımı donut */}
              <div className="min-w-0">
                <h3 className="mb-3 text-[13px] font-semibold text-slate-ink">{t("ka.gorsel.bulguDagilimi")}</h3>
                {bulguDonut.length > 0 ? (
                  <DonutDagilim segmentler={bulguDonut} merkezEtiket={t("ka.gorsel.bulguMerkez")} />
                ) : (
                  <p className="text-[13px] text-slate-faint">—</p>
                )}
              </div>

              {/* Av başarı gauge — dikey ayraçlı orta sütun */}
              <div className="hidden lg:block lg:w-px lg:bg-line" aria-hidden />
              <div className="flex flex-col items-center justify-center">
                <h3 className="mb-2 self-start text-[13px] font-semibold text-slate-ink lg:self-center">{t("ka.gorsel.avBasari")}</h3>
                <Gauge deger={basariOran} etiket={t("ka.gorsel.avBasariEtiket")} boyut={168} />
                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-muted">
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2 rounded-full bg-warn" /> {sonuclar.filter((s) => s.tetiklendi).length}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2 rounded-full bg-ok" /> {sonuclar.filter((s) => !s.tetiklendi).length}
                  </span>
                  <span className="text-slate-faint">/ {sonuclar.length}</span>
                </div>
              </div>
            </div>

            {/* Kategori × şiddet ısı-matrisi — alt şerit, farklı görsel dil */}
            <div className="border-t border-line bg-canvas/30 px-5 py-5 lg:px-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,0.9fr)] lg:gap-8">
                <div className="min-w-0">
                  <h3 className="mb-3 text-[13px] font-semibold text-slate-ink">{t("ka.gorsel.kategoriYogunluk")}</h3>
                  <IsiMatris
                    satirlar={KATEGORILER.map((k) => kategoriAd(k, dil))}
                    sutunlar={SIDDETLER.map((s) => siddetAd(s, dil))}
                    degerler={isiMatris}
                  />
                </div>
                <div className="hidden lg:block lg:w-px lg:bg-line" aria-hidden />
                <div className="flex flex-col items-center">
                  <h3 className="mb-1 self-start text-[13px] font-semibold text-slate-ink lg:self-center">{t("ka.gorsel.kapsamaProfili")}</h3>
                  <RadarGrafik eksenler={radarEksenler} boyut={190} />
                </div>
              </div>
            </div>
          </Panel>
        </motion.div>
      )}

      {/* Dürüstlük notu */}
      <NotKutusu ton="bilgi" baslik={t("ka.not.baslik")}>
        {t("ka.not.govde")}
      </NotKutusu>

      {/* Zamanlanmış avlar & uyarılar */}
      <Panel baslik={t("ka.zamanli.baslik")} sagUst={<Badge ton="brand">{t("ka.zamanli.rozet").replace("{n}", String(zamanliSonuclar.length))}</Badge>}>
        {zamanliSonuclar.length === 0 ? (
          <p className="text-sm text-slate-muted">{t("ka.zamanli.bos")}</p>
        ) : (
          <div className="space-y-2.5">
            {tetiklenenZamanli.length > 0 && (
              <NotKutusu ton="sari" baslik={t("ka.zamanli.tetiklenirdi").replace("{n}", String(tetiklenenZamanli.length))}>
                {t("ka.zamanli.tetiklenirdiGovde")}
              </NotKutusu>
            )}
            {zamanliSonuclar.map((s) => (
              <div
                key={s.av.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3",
                  s.tetiklendi ? "border-amber-200 bg-warn-soft/40" : "border-line bg-surface",
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-xl",
                      s.tetiklendi ? "bg-warn-soft text-amber-600" : "bg-canvas text-slate-faint",
                    )}
                  >
                    {s.tetiklendi ? <BellRing className="size-4" /> : <Bell className="size-4" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-ink">{avAd(s.av.id, dil) || s.av.ad}</span>
                      <Badge ton={SIDDET_TON[s.av.siddet]}>{siddetAd(s.av.siddet, dil)}</Badge>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-muted">
                      <Clock className="size-3" />
                      {s.av.sikligi ? siklikAd(s.av.sikligi, dil) : "—"}
                      <span className="text-slate-faint">·</span>
                      <code className="truncate rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 ring-1 ring-inset ring-slate-200">{s.av.sorgu}</code>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="num text-sm font-semibold text-slate-ink">
                    {s.eslesme.toLocaleString(loc)}
                  </span>
                  <span className="text-[12px] text-slate-faint">{t("ka.zamanli.esik").replace("{n}", String(s.esik))}</span>
                  {s.tetiklendi ? (
                    <DurumRozeti ton="warn" etiket={t("ka.zamanli.tetiklendi")} nabiz />
                  ) : (
                    <DurumRozeti ton="ok" etiket={t("ka.zamanli.sakin")} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Arama + kategori filtreleri */}
      <Panel padding={false} className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-faint" />
            <input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder={t("ka.arama.placeholder")}
              aria-label={t("ka.arama.aria")}
              className="h-10 w-full rounded-2xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <FiltreCip
              aktif={aktifKategori === "hepsi"}
              onClick={() => setAktifKategori("hepsi")}
              etiket={t("ka.filtre.hepsi")}
              sayi={sonuclar.length}
            />
            {KATEGORILER.map((k) => (
              <FiltreCip
                key={k}
                aktif={aktifKategori === k}
                onClick={() => setAktifKategori(k)}
                etiket={kategoriAd(k, dil)}
                sayi={kategoriSayac.get(k) ?? 0}
                nokta={KATEGORI_ACCENT[k]}
              />
            ))}
          </div>
        </div>
      </Panel>

      {/* Av kütüphanesi (kartlar) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-slate-ink">{t("ka.kutuphane.baslik")}</h3>
          <span className="text-[13px] text-slate-muted">{t("ka.kutuphane.sayac").replace("{n}", String(filtreli.length))}</span>
        </div>
        {filtreli.length === 0 ? (
          <BosDurum
            ikon={<Search className="size-7" />}
            baslik={t("ka.kutuphane.bosBaslik")}
            aciklama={t("ka.kutuphane.bosAciklama")}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtreli.map((s) => (
              <AvKarti key={s.av.id} sonuc={s} dil={dil} />
            ))}
          </div>
        )}
      </div>

      {/* Özel (kaydedilmiş) avlar */}
      <Panel
        baslik={t("ka.ozel.baslik")}
        sagUst={<Badge ton="gri">{t("ka.ozel.rozet").replace("{n}", String(ozelAvlar.length))}</Badge>}
      >
        {ozelAvlar.length === 0 ? (
          <p className="text-sm text-slate-muted">
            {t("ka.ozel.bos")}
          </p>
        ) : (
          <div className="space-y-2.5">
            {ozelAvlar.map((av) => (
              <div
                key={av.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-ink">{av.ad}</span>
                    <Badge ton={KATEGORI_TON[av.kategori]}>{kategoriAd(av.kategori, dil)}</Badge>
                  </div>
                  {av.aciklama && <p className="mt-0.5 truncate text-[12px] text-slate-muted">{av.aciklama}</p>}
                  <code className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 ring-1 ring-inset ring-slate-200">{av.sorgu}</code>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    href={`/panel/tehdit-avi?q=${encodeURIComponent(av.sorgu)}`}
                  >
                    <Play className="size-3.5" /> {t("ka.ozel.calistir")}
                  </Button>
                  <button
                    onClick={() => {
                      ozelAvlariKaydet(ozelAvlar.filter((x) => x.id !== av.id));
                      goster({ tip: "bilgi", baslik: t("ka.ozel.silindiBaslik"), aciklama: av.ad });
                    }}
                    aria-label={t("ka.ozel.sil")}
                    className="rounded-lg p-2 text-slate-faint transition hover:bg-danger-soft hover:text-danger2"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Yeni av kaydet modalı */}
      <YeniAvModal
        dil={dil}
        acik={modalAcik}
        kapat={() => setModalAcik(false)}
        onKaydet={(av) => {
          ozelAvlariKaydet([av, ...ozelAvlar]);
          setModalAcik(false);
          goster({ tip: "basari", baslik: t("ka.ozel.kaydedildiBaslik"), aciklama: av.ad });
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ Şerit KPI hücresi */

function SeritKPI({ deger, etiket, nokta }: { deger: string; etiket: string; nokta: string }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4">
      <span className="flex items-center gap-1.5">
        <span className="size-2 shrink-0 rounded-full" style={{ background: nokta }} aria-hidden />
        <span className="truncate text-[19px] font-bold leading-none text-slate-ink">{deger}</span>
      </span>
      <span className="text-[12px] text-slate-muted">{etiket}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ Filtre çipi */

function FiltreCip({
  aktif,
  onClick,
  etiket,
  sayi,
  nokta,
}: {
  aktif: boolean;
  onClick: () => void;
  etiket: string;
  sayi: number;
  nokta?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition",
        aktif
          ? "border-brand-200 bg-brand-50 text-brand-700"
          : "border-line-strong bg-surface text-slate-muted hover:bg-canvas",
      )}
    >
      {nokta && <span className="size-2 rounded-full" style={{ background: nokta }} aria-hidden />}
      {etiket}
      <span
        className={cn(
          "num rounded-full px-1.5 text-[11px]",
          aktif ? "bg-brand-100 text-brand-600" : "bg-canvas text-slate-faint",
        )}
      >
        {sayi}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ Av kartı */

function AvKarti({ sonuc, dil }: { sonuc: AvSonucDto; dil: Dil }) {
  const { av } = sonuc;
  const t = (k: string) => avCeviri(k, dil);
  const loc = KA_LOCALE[dil];
  const KatIkon = KATEGORI_IKON[av.kategori];
  const SidIkon = SIDDET_IKON[av.siddet];
  const accent = KATEGORI_ACCENT[av.kategori];
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border bg-surface pl-5 pr-5 pt-5 pb-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift",
        sonuc.tetiklendi ? "border-amber-200" : "border-line hover:border-line-strong",
      )}
    >
      {/* Kategori aksan çizgisi (sol kenar) */}
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} aria-hidden />

      {/* Başlık satırı — kategori ikon çipi + ad/açıklama + durum rozeti */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset", KATEGORI_CIP[av.kategori])}>
            <KatIkon className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <h4 className="truncate text-[15px] font-semibold text-slate-ink">{avAd(av.id, dil) || av.ad}</h4>
            <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-slate-muted">{avAciklama(av.id, dil) || av.aciklama}</p>
          </div>
        </div>
        {sonuc.tetiklendi ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warn-soft px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
            <BellRing className="size-3" /> {t("ka.zamanli.tetiklendi")}
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ok-soft px-2.5 py-1 text-[11px] font-semibold text-green-700 ring-1 ring-inset ring-green-200">
            <CheckCircle2 className="size-3" /> {t("ka.zamanli.sakin")}
          </span>
        )}
      </div>

      {/* Rozetler — kategori + ikonlu şiddet hapı + zamanlama */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge ton={KATEGORI_TON[av.kategori]}><KatIkon className="size-3" /> {kategoriAd(av.kategori, dil)}</Badge>
        <Badge ton={SIDDET_TON[av.siddet]}><SidIkon className="size-3" /> {siddetAd(av.siddet, dil)}</Badge>
        {av.zamanli && av.sikligi && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-100">
            <Clock className="size-3" /> {siklikAd(av.sikligi, dil)}
          </span>
        )}
      </div>

      {/* DSL sorgusu — Sigma/Elastic tarzı koyu kod bloğu */}
      <div className="mt-3.5 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-1.5">
          <Terminal className="size-3 text-slate-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t("ka.kart.dslSorgusu")}</span>
        </div>
        <div className="overflow-x-auto px-3 py-2.5">
          <code className="whitespace-nowrap font-mono text-[12px] leading-relaxed text-emerald-300">{av.sorgu}</code>
        </div>
      </div>

      {/* Eşleşme özeti — vurgulu sayaç şeridi */}
      <div className="mt-3.5 flex items-center justify-between rounded-xl border border-line bg-canvas/50 px-3.5 py-2.5">
        <span className="inline-flex items-center gap-2">
          <Zap className={cn("size-4", sonuc.tetiklendi ? "text-amber-600" : "text-slate-faint")} />
          <span className="num text-[18px] font-bold leading-none text-slate-ink">{sonuc.eslesme.toLocaleString(loc)}</span>
          <span className="text-[12px] text-slate-muted">{t("ka.kart.eslesme")}</span>
        </span>
        <span className="text-[11.5px] text-slate-faint">{t("ka.kart.tetikEsigi")} <b className="num text-slate-muted">{sonuc.esik}</b></span>
      </div>

      {/* Etiketler */}
      {av.etiketler.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Tag className="size-3 text-slate-faint" />
          {av.etiketler.map((t) => (
            <span key={t} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Aksiyonlar */}
      <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
        <Button variant="outline" size="sm" href={`/panel/tehdit-avi?q=${encodeURIComponent(av.sorgu)}`}>
          <Play className="size-3.5" /> {t("ka.kart.konsoldaCalistir")}
        </Button>
        <Button variant="ghost" size="sm" href={`/panel/tehdit-avi?q=${encodeURIComponent(av.sorgu)}`}>
          <ExternalLink className="size-3.5" /> {t("ka.kart.tehditAvindaAc")}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Yeni av modalı */

function YeniAvModal({
  dil,
  acik,
  kapat,
  onKaydet,
}: {
  dil: Dil;
  acik: boolean;
  kapat: () => void;
  onKaydet: (av: OzelAv) => void;
}) {
  const t = (k: string) => avCeviri(k, dil);
  const [ad, setAd] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [sorgu, setSorgu] = useState("");
  const [kategori, setKategori] = useState<AvKategori>("kesif");

  // Canlı sorgu doğrulaması (istemcide, gerçek DSL ayrıştırıcısıyla).
  const dogrulama = useMemo(() => sorguGecerliMi(sorgu), [sorgu]);
  const gonderilebilir = ad.trim().length > 0 && dogrulama.gecerli;

  function sifirla() {
    setAd("");
    setAciklama("");
    setSorgu("");
    setKategori("kesif");
  }

  function gonder() {
    if (!gonderilebilir) return;
    onKaydet({
      id: `ozel-${Date.now().toString(36)}`,
      ad: ad.trim(),
      aciklama: aciklama.trim(),
      sorgu: sorgu.trim(),
      kategori,
    });
    sifirla();
  }

  return (
    <Modal
      acik={acik}
      kapat={() => {
        sifirla();
        kapat();
      }}
      baslik={t("ka.modal.baslik")}
      aciklama={t("ka.modal.aciklama")}
    >
      <div className="space-y-4">
        <Alan etiket={t("ka.modal.avAdi")}>
          <Girdi value={ad} onChange={(e) => setAd(e.target.value)} placeholder={t("ka.modal.avAdiPlaceholder")} />
        </Alan>

        <Alan etiket={t("ka.modal.aciklamaEtiket")} opsiyonel>
          <Alan2
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
            placeholder={t("ka.modal.aciklamaPlaceholder")}
            rows={2}
          />
        </Alan>

        <Alan etiket={t("ka.modal.kategori")}>
          <Secim value={kategori} onChange={(e) => setKategori(e.target.value as AvKategori)}>
            {KATEGORILER.map((k) => (
              <option key={k} value={k}>
                {kategoriAd(k, dil)}
              </option>
            ))}
          </Secim>
        </Alan>

        <Alan etiket={t("ka.modal.dslSorgusu")}>
          <Girdi
            value={sorgu}
            onChange={(e) => setSorgu(e.target.value)}
            placeholder='botClass:scraper AND score<0.3'
            className="font-mono"
          />
        </Alan>

        {/* Canlı doğrulama durumu */}
        {sorgu.trim().length > 0 && (
          <div
            className={cn(
              "rounded-xl border px-3 py-2 text-[13px]",
              dogrulama.gecerli
                ? "border-green-200 bg-ok-soft text-green-700"
                : "border-red-200 bg-danger-soft text-red-700",
            )}
          >
            {dogrulama.gecerli ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" /> {t("ka.modal.sorguGecerli")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <ShieldAlert className="size-3.5" /> {dogrulama.hata}
              </span>
            )}
          </div>
        )}

        {/* DSL ipucu */}
        <NotKutusu ton="bilgi">
          <span className="text-[12px]">
            {t("ka.modal.ipucu.alanlar")} <code className="font-mono">botClass, verdict, score, country, path, ua, asn, headless, tls,
            engine, latency…</code>{" "}
            {t("ka.modal.ipucu.operatorler")} <code className="font-mono">{t("ka.modal.ipucu.deger")}</code>, <code className="font-mono">alan&lt;N</code>,{" "}
            <code className="font-mono">alan&gt;N</code>, <code className="font-mono">alan!=değer</code>, {t("ka.modal.ipucu.birlestirme")}{" "}
            <code className="font-mono">AND / OR</code>.
          </span>
        </NotKutusu>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              sifirla();
              kapat();
            }}
          >
            {t("ka.modal.iptal")}
          </Button>
          <Button variant="accent" size="sm" onClick={gonder} disabled={!gonderilebilir}>
            <BookMarked className="size-4" /> {t("ka.modal.aviKaydet")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
