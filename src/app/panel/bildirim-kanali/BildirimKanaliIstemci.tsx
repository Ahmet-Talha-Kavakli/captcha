"use client";

/**
 * Bildirim Kanalları & Kuralları (istemci)
 * =========================================
 * Kurumsal bir "ayar" ekranı: kullanıcı Specter'ın onu NEREDEN ve NE ZAMAN
 * uyaracağını belirler. Beş katman:
 *   1) Kanallar        — panel-içi / e-posta / bağlı entegrasyonlar (Slack…)
 *   2) Yönlendirme     — olay-tipi (kategori) × kanal matrisi
 *   3) Şiddet eşiği    — tümü / yüksek+ / yalnızca kritik (kanal başına)
 *   4) Sessiz saatler  — bu aralıkta yalnızca kritik uyarılar geçer
 *   5) Masaüstü izni    — GERÇEK Notification Web API opt-in + test bildirimi
 *
 * Kalıcılık: DB şemasına dokunmadığımız için tüm tercihler localStorage'da
 * ("specter_bildirim_tercih") tutulur. Mount'ta yüklenir, her değişimde
 * kaydedilir, "kaydedildi" göstergesi çıkar. Sunucu-tarafı teslimat kablolaması
 * bu ekranda kısmen temsil edilir (dürüst not aşağıda gösterilir).
 *
 * SSR güvenliği: Notification / window erişimlerinin TAMAMI
 * `typeof window !== "undefined"` ile korunur ve yalnızca effect/handler
 * içinde çağrılır — modül/rende üst seviyesinde asla. Böylece bileşen sunucuda
 * çökmez.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BellRing, Mail, MonitorSmartphone, Hash, MessageSquare, Webhook, Bell,
  Check, AlertTriangle, Moon, Send, Save, Plug, Info, ArrowRight, ShieldAlert,
  Zap, Activity, ScrollText, Gauge, ExternalLink, X, CircleCheck, CircleAlert,
} from "lucide-react";
import { Panel, StatKart, Badge, NotKutusu, useToast, Girdi } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { bkCeviri } from "./bildirim-kanali.i18n";

/** Bu modülün çeviri kısayolu tipi. */
type Ceviri = (anahtar: string) => string;

/* ------------------------------------------------------------------ Tipler */

/** Sunucudan gelen bağlı entegrasyon (teslimat hedefi). */
interface EntegrasyonOzet {
  id: string;
  tur: string; // slack | discord | teams | zapier | email | pagerduty | webhook
  ad: string;
  hedef: string;
  aktif: boolean;
}

/** Olay kategorisi — schema.ts'teki AlertCategory ile aynı kavram. */
type Kategori = "saldiri" | "anomali" | "politika" | "sistem" | "kota";

/** Şiddet eşiği: hangi seviyeden itibaren haber ver. */
type Esik = "tumu" | "yuksek" | "kritik";

/** Yerleşik (dahili) kanal kimlikleri. Entegrasyonlar dinamik id ile eklenir. */
type YerlesikKanal = "panel" | "eposta" | "masaustu";

/** Tercihlerin tam şekli — localStorage'da bu JSON tutulur. */
interface Tercihler {
  /** kanalId → açık/kapalı (kanalId: yerleşik anahtar veya entegrasyon id'si). */
  kanallar: Record<string, boolean>;
  /** kanalId → (kategori → bu kategori bu kanala gitsin mi). */
  yonlendirme: Record<string, Record<Kategori, boolean>>;
  /** kanalId → şiddet eşiği. */
  esik: Record<string, Esik>;
  /** Sessiz saatler yapılandırması. */
  sessiz: { aktif: boolean; baslangic: string; bitis: string };
  /** Masaüstü bildirimleri kullanıcı tarafından açık istendi mi (izin ayrı). */
  masaustuIstek: boolean;
  /** Şema sürümü — ileride göç gerekirse. */
  v: number;
}

const DEPO_ANAHTAR = "specter_bildirim_tercih";
const TERCIH_SURUM = 1;

/* ------------------------------------------------------------------ Sabitler */

/** Kategori tanımları — `ad`/`aciklama` i18n anahtarıdır (enum `key` çevrilmez). */
const KATEGORILER: { key: Kategori; adAnahtar: string; aciklamaAnahtar: string; ikon: React.ReactNode; renk: string }[] = [
  { key: "saldiri", adAnahtar: "bk.kat.saldiri", aciklamaAnahtar: "bk.kat.saldiri.aciklama", ikon: <ShieldAlert className="size-4" />, renk: "#dc2626" },
  { key: "anomali", adAnahtar: "bk.kat.anomali", aciklamaAnahtar: "bk.kat.anomali.aciklama", ikon: <Zap className="size-4" />, renk: "#d97706" },
  { key: "politika", adAnahtar: "bk.kat.politika", aciklamaAnahtar: "bk.kat.politika.aciklama", ikon: <ScrollText className="size-4" />, renk: "#2f6fed" },
  { key: "sistem", adAnahtar: "bk.kat.sistem", aciklamaAnahtar: "bk.kat.sistem.aciklama", ikon: <Activity className="size-4" />, renk: "#7c3aed" },
  { key: "kota", adAnahtar: "bk.kat.kota", aciklamaAnahtar: "bk.kat.kota.aciklama", ikon: <Gauge className="size-4" />, renk: "#0891b2" },
];

/** Eşik anahtarları — insan-okur metin i18n'den `t()` ile gelir (enum değer çevrilmez). */
const ESIK_META: Record<Esik, { adAnahtar: string; aciklamaAnahtar: string }> = {
  tumu: { adAnahtar: "bk.esik.tumu", aciklamaAnahtar: "bk.esik.tumu.aciklama" },
  yuksek: { adAnahtar: "bk.esik.yuksek", aciklamaAnahtar: "bk.esik.yuksek.aciklama" },
  kritik: { adAnahtar: "bk.esik.kritik", aciklamaAnahtar: "bk.esik.kritik.aciklama" },
};

/** Entegrasyon türü → ikon + insan-okur etiket (ürün adları çevrilmez; yalnızca "E-posta" çevrilir). */
function entegrasyonGorsel(tur: string, t?: Ceviri): { ikon: React.ReactNode; etiket: string } {
  switch (tur) {
    case "slack": return { ikon: <Hash className="size-4" />, etiket: "Slack" };
    case "discord": return { ikon: <MessageSquare className="size-4" />, etiket: "Discord" };
    case "teams": return { ikon: <MessageSquare className="size-4" />, etiket: "Microsoft Teams" };
    case "pagerduty": return { ikon: <Bell className="size-4" />, etiket: "PagerDuty" };
    case "zapier": return { ikon: <Zap className="size-4" />, etiket: "Zapier" };
    case "email": return { ikon: <Mail className="size-4" />, etiket: t ? t("bk.kanal.eposta.baslik") : "E-posta" };
    default: return { ikon: <Webhook className="size-4" />, etiket: "Webhook" };
  }
}

/* ------------------------------------------------------------------ Yardımcılar */

/** Boş/varsayılan bir kategori yönlendirme haritası (tümü açık). */
function varsayilanYonlendirme(): Record<Kategori, boolean> {
  return { saldiri: true, anomali: true, politika: true, sistem: true, kota: true };
}

/** "HH:MM" değerini dakikaya çevir (sessiz saat karşılaştırması için). */
function dakika(saat: string): number {
  const [h, m] = saat.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Verilen an sessiz saatlere düşüyor mu (gece devri destekli). */
function sessizAnda(sessiz: Tercihler["sessiz"], simdiDk: number): boolean {
  if (!sessiz.aktif) return false;
  const b = dakika(sessiz.baslangic);
  const s = dakika(sessiz.bitis);
  if (b === s) return false;
  // Aynı gün (örn 22:00 yerine 09:00 gibi normal aralık) veya gece devri (22:00→07:00).
  return b < s ? simdiDk >= b && simdiDk < s : simdiDk >= b || simdiDk < s;
}

/* ------------------------------------------------------------------ Alt bileşenler */

/** Küçük, erişilebilir aç/kapa anahtarı (kit'te yok, burada tanımlı). */
function Anahtar({ acik, onChange, etiket }: { acik: boolean; onChange: (v: boolean) => void; etiket?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={acik}
      aria-label={etiket}
      onClick={() => onChange(!acik)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-4 focus-visible:ring-brand-100",
        acik ? "bg-brand-600" : "bg-slate-300",
      )}
    >
      <span className={cn("inline-block size-5 transform rounded-full bg-white shadow transition-transform", acik ? "translate-x-[22px]" : "translate-x-0.5")} />
    </button>
  );
}

/* ------------------------------------------------------------------ Ana bileşen */

export function BildirimKanaliIstemci({ entegrasyonlar, eposta, dil }: { entegrasyonlar: EntegrasyonOzet[]; eposta: string; dil: Dil }) {
  const { goster } = useToast();
  const t = useCallback<Ceviri>((anahtar) => bkCeviri(anahtar, dil), [dil]);

  // Aktif entegrasyonları teslimat kanalı olarak kullan (pasifleri de göster ama işaretle).
  const entKanallar = useMemo(() => entegrasyonlar, [entegrasyonlar]);

  /** Tüm kanal kimliklerinin sırası: yerleşikler + entegrasyonlar. */
  const kanalIdler = useMemo<string[]>(
    () => ["panel", "eposta", "masaustu", ...entKanallar.map((e) => e.id)],
    [entKanallar],
  );

  /** Varsayılan tercihler — hiç kayıt yoksa bunlarla başla. */
  const varsayilan = useMemo<Tercihler>(() => {
    const kanallar: Record<string, boolean> = { panel: true, eposta: true, masaustu: false };
    const yonlendirme: Record<string, Record<Kategori, boolean>> = {
      panel: varsayilanYonlendirme(),
      eposta: { saldiri: true, anomali: true, politika: false, sistem: false, kota: true },
      masaustu: { saldiri: true, anomali: false, politika: false, sistem: false, kota: false },
    };
    const esik: Record<string, Esik> = { panel: "tumu", eposta: "yuksek", masaustu: "kritik" };
    for (const e of entKanallar) {
      kanallar[e.id] = e.aktif;
      yonlendirme[e.id] = { saldiri: true, anomali: true, politika: false, sistem: false, kota: false };
      esik[e.id] = "yuksek";
    }
    return {
      kanallar,
      yonlendirme,
      esik,
      sessiz: { aktif: false, baslangic: "22:00", bitis: "07:00" },
      masaustuIstek: false,
      v: TERCIH_SURUM,
    };
  }, [entKanallar]);

  const [tercih, setTercih] = useState<Tercihler>(varsayilan);
  const [yuklendi, setYuklendi] = useState(false);
  const [kaydedildi, setKaydedildi] = useState(false);

  // --- Mount'ta localStorage'dan yükle (SSR-güvenli: effect içinde) ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ham = window.localStorage.getItem(DEPO_ANAHTAR);
      if (ham) {
        const kayit = JSON.parse(ham) as Partial<Tercihler>;
        // Varsayılanla derin birleştir: yeni kanallar/kategoriler eksikse tamamla.
        setTercih((eski) => {
          const birlesik: Tercihler = {
            ...varsayilan,
            ...kayit,
            kanallar: { ...varsayilan.kanallar, ...(kayit.kanallar ?? {}) },
            esik: { ...varsayilan.esik, ...(kayit.esik ?? {}) },
            sessiz: { ...varsayilan.sessiz, ...(kayit.sessiz ?? {}) },
            yonlendirme: { ...varsayilan.yonlendirme },
            v: TERCIH_SURUM,
          };
          for (const id of kanalIdler) {
            birlesik.yonlendirme[id] = {
              ...varsayilanYonlendirme(),
              ...(varsayilan.yonlendirme[id] ?? {}),
              ...((kayit.yonlendirme ?? {})[id] ?? {}),
            };
          }
          void eski;
          return birlesik;
        });
      }
    } catch {
      // Bozuk kayıt: varsayılanla devam et (sessiz).
    }
    setYuklendi(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Her değişimde kaydet (yalnızca ilk yükleme sonrası) ---
  useEffect(() => {
    if (!yuklendi || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(DEPO_ANAHTAR, JSON.stringify(tercih));
      setKaydedildi(true);
      const t = setTimeout(() => setKaydedildi(false), 1800);
      return () => clearTimeout(t);
    } catch {
      // Kota/gizli mod: sessiz geç.
    }
  }, [tercih, yuklendi]);

  /* --------------------------------------------------------- Değiştiriciler */

  const kanalAc = useCallback((id: string, v: boolean) => {
    setTercih((t) => ({ ...t, kanallar: { ...t.kanallar, [id]: v } }));
  }, []);

  const yonlendirmeAc = useCallback((id: string, kat: Kategori, v: boolean) => {
    setTercih((t) => ({
      ...t,
      yonlendirme: { ...t.yonlendirme, [id]: { ...(t.yonlendirme[id] ?? varsayilanYonlendirme()), [kat]: v } },
    }));
  }, []);

  const esikAyarla = useCallback((id: string, e: Esik) => {
    setTercih((t) => ({ ...t, esik: { ...t.esik, [id]: e } }));
  }, []);

  /* --------------------------------------------------------- Masaüstü izni */

  // Notification API'nin varlığı + mevcut izin durumu (yalnızca istemcide anlamlı).
  const [destekli, setDestekli] = useState(false);
  const [izin, setIzin] = useState<NotificationPermission | "yok">("yok");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setDestekli(false);
      return;
    }
    setDestekli(true);
    setIzin(Notification.permission);
  }, []);

  const izinIste = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      goster({ tip: "hata", baslik: t("bk.toast.desteksizBaslik"), aciklama: t("bk.toast.desteksizAciklama") });
      return;
    }
    try {
      const sonuc = await Notification.requestPermission();
      setIzin(sonuc);
      if (sonuc === "granted") {
        // Kullanıcı izin verdi → masaüstü kanalını da otomatik aç.
        setTercih((eski) => ({ ...eski, masaustuIstek: true, kanallar: { ...eski.kanallar, masaustu: true } }));
        goster({ tip: "basari", baslik: t("bk.toast.verildiBaslik"), aciklama: t("bk.toast.verildiAciklama") });
      } else if (sonuc === "denied") {
        goster({ tip: "hata", baslik: t("bk.toast.reddedildiBaslik"), aciklama: t("bk.toast.reddedildiAciklama") });
      } else {
        goster({ tip: "bilgi", baslik: t("bk.toast.beklemedeBaslik"), aciklama: t("bk.toast.beklemedeAciklama") });
      }
    } catch {
      goster({ tip: "hata", baslik: t("bk.toast.alinamadiBaslik"), aciklama: t("bk.toast.alinamadiAciklama") });
    }
  }, [goster, t]);

  const testGonder = useCallback(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      goster({ tip: "hata", baslik: t("bk.toast.desteksizBaslik"), aciklama: t("bk.toast.desteksizAciklama") });
      return;
    }
    if (Notification.permission !== "granted") {
      goster({ tip: "bilgi", baslik: t("bk.toast.onceIzinBaslik"), aciklama: t("bk.toast.onceIzinAciklama") });
      return;
    }
    try {
      // GERÇEK tarayıcı bildirimi — kritik saldırı örneği.
      const bildirim = new Notification(t("bk.bildirim.baslik"), {
        body: t("bk.bildirim.govde"),
        tag: "specter-test",
      });
      // 6 sn sonra kendiliğinden kapat (destekliyorsa).
      window.setTimeout(() => { try { bildirim.close(); } catch { /* yoksay */ } }, 6000);
      goster({ tip: "basari", baslik: t("bk.toast.testGonderildiBaslik"), aciklama: t("bk.toast.testGonderildiAciklama") });
    } catch {
      goster({ tip: "hata", baslik: t("bk.toast.gonderilemediBaslik"), aciklama: t("bk.toast.gonderilemediAciklama") });
    }
  }, [goster, t]);

  /* --------------------------------------------------------- Önizleme mantığı */

  // Şu anın dakikası (sessiz saat testi için) — istemcide hesaplanır.
  const [simdiDk, setSimdiDk] = useState<number | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const d = new Date();
    setSimdiDk(d.getHours() * 60 + d.getMinutes());
  }, []);

  // Kanalın insan-okur adı.
  const kanalAdi = useCallback((id: string): string => {
    if (id === "panel") return t("bk.kanalAd.panelIci");
    if (id === "eposta") return t("bk.kanalAd.epostaTam").replace("{eposta}", eposta);
    if (id === "masaustu") return t("bk.kanalAd.masaustuTam");
    const e = entKanallar.find((x) => x.id === id);
    return e ? `${entegrasyonGorsel(e.tur, t).etiket} · ${e.ad}` : id;
  }, [entKanallar, eposta, t]);

  /**
   * Örnek "kritik saldırı" uyarısı ŞU AN nereye giderdi?
   * Kural: kanal açık + kategori(saldırı) yönlendirmesi açık + eşik kritik'i
   * kapsıyor + (sessiz saatteyse yalnızca kritik geçer → kritik olduğu için geçer).
   */
  const ornekTeslimat = useMemo(() => {
    const sessizMi = simdiDk != null && sessizAnda(tercih.sessiz, simdiDk);
    const sonuc: { id: string; gecti: boolean; neden?: string }[] = [];
    for (const id of kanalIdler) {
      const kanalAcik = tercih.kanallar[id];
      if (!kanalAcik) { sonuc.push({ id, gecti: false, neden: t("bk.neden.kanalKapali") }); continue; }
      // Entegrasyon pasifse teslim edilemez.
      const ent = entKanallar.find((x) => x.id === id);
      if (ent && !ent.aktif) { sonuc.push({ id, gecti: false, neden: t("bk.neden.entPasif") }); continue; }
      const yon = (tercih.yonlendirme[id] ?? varsayilanYonlendirme()).saldiri;
      if (!yon) { sonuc.push({ id, gecti: false, neden: t("bk.neden.saldiriKapali") }); continue; }
      // Kritik uyarı her eşiği geçer (tümü/yüksek+/kritik hepsi kritik'i kapsar).
      // Sessiz saatte yalnızca kritik geçer → kritik olduğu için sorun yok.
      const neden = sessizMi ? t("bk.neden.sessizKritik") : undefined;
      // masaüstü kanalı için ek: tarayıcı izni yoksa gerçekten teslim edilemez.
      if (id === "masaustu" && izin !== "granted") {
        sonuc.push({ id, gecti: false, neden: t("bk.neden.izinYok") });
        continue;
      }
      sonuc.push({ id, gecti: true, neden });
    }
    return { sessizMi, sonuc };
  }, [tercih, kanalIdler, entKanallar, simdiDk, izin, t]);

  const acikKanalSayisi = kanalIdler.filter((id) => tercih.kanallar[id]).length;
  const teslimEdilecek = ornekTeslimat.sonuc.filter((s) => s.gecti).length;

  /* --------------------------------------------------------- Render */

  const izinRozet = () => {
    if (!destekli) return <Badge ton="gri">{t("bk.masaustu.rozet.desteksiz")}</Badge>;
    if (izin === "granted") return <Badge ton="yesil"><Check className="size-3" /> {t("bk.masaustu.rozet.verildi")}</Badge>;
    if (izin === "denied") return <Badge ton="kirmizi"><X className="size-3" /> {t("bk.masaustu.rozet.reddedildi")}</Badge>;
    return <Badge ton="sari">{t("bk.masaustu.rozet.beklemede")}</Badge>;
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* Giriş şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <BellRing className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-ink">{t("bk.giris.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("bk.giris.aciklama")}{" "}
            <a href="/panel/bildirimler" className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800">
              {t("bk.giris.gelenBildirimler")}
            </a>
          </p>
        </div>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={acikKanalSayisi} etiket={t("bk.ozet.etkinKanal")} ikon={<BellRing className="size-5" />} tone={acikKanalSayisi > 0 ? "brand" : "warn"} />
        <StatKart sayi={entKanallar.length} etiket={t("bk.ozet.bagliEntegrasyon")} ikon={<Plug className="size-5" />} />
        <StatKart sayi={tercih.sessiz.aktif ? `${tercih.sessiz.baslangic}–${tercih.sessiz.bitis}` : t("bk.ozet.sessizKapali")} etiket={t("bk.ozet.sessizSaatler")} ikon={<Moon className="size-5" />} tone={tercih.sessiz.aktif ? "warn" : undefined} />
        <StatKart sayi={destekli ? (izin === "granted" ? t("bk.ozet.acik") : t("bk.ozet.kapali")) : "—"} etiket={t("bk.ozet.masaustu")} ikon={<MonitorSmartphone className="size-5" />} tone={izin === "granted" ? "ok" : undefined} />
      </div>

      {/* Kaydet göstergesi (sabit) */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-5 py-3">
        <div className="flex items-center gap-2 text-[13px] text-slate-muted">
          <Save className="size-4 text-slate-faint" />
          {t("bk.kaydet.oto")}
        </div>
        <div className="flex items-center gap-3">
          {kaydedildi && (
            <span className="flex items-center gap-1.5 text-[13px] font-medium text-ok animate-fade-up">
              <CircleCheck className="size-4" /> {t("bk.kaydet.kaydedildi")}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Elle kaydet: aynı veriyi tekrar yaz + onay ver.
              if (typeof window !== "undefined") {
                try { window.localStorage.setItem(DEPO_ANAHTAR, JSON.stringify(tercih)); } catch { /* yoksay */ }
              }
              setKaydedildi(true);
              goster({ tip: "basari", baslik: t("bk.kaydet.toast") });
            }}
          >
            <Save className="size-4" /> {t("bk.kaydet.btn")}
          </Button>
        </div>
      </div>

      {/* 1) KANALLAR */}
      <Panel baslik={t("bk.kanallar.baslik")}>
        <p className="mb-4 text-[13px] text-slate-muted">{t("bk.kanallar.aciklama")}</p>

        <div className="space-y-2.5">
          {/* Yerleşik: panel içi */}
          <KanalSatir
            ikon={<Bell className="size-4" />}
            baslik={t("bk.kanal.panel.baslik")}
            aciklama={t("bk.kanal.panel.aciklama")}
            acik={!!tercih.kanallar.panel}
            onToggle={(v) => kanalAc("panel", v)}
            esik={tercih.esik.panel ?? "tumu"}
            onEsik={(e) => esikAyarla("panel", e)}
            t={t}
          />
          {/* Yerleşik: e-posta */}
          <KanalSatir
            ikon={<Mail className="size-4" />}
            baslik={t("bk.kanal.eposta.baslik")}
            aciklama={t("bk.kanal.eposta.aciklama").replace("{eposta}", eposta)}
            acik={!!tercih.kanallar.eposta}
            onToggle={(v) => kanalAc("eposta", v)}
            esik={tercih.esik.eposta ?? "yuksek"}
            onEsik={(e) => esikAyarla("eposta", e)}
            t={t}
          />
          {/* Yerleşik: masaüstü */}
          <KanalSatir
            ikon={<MonitorSmartphone className="size-4" />}
            baslik={t("bk.kanal.masaustu.baslik")}
            aciklama={t("bk.kanal.masaustu.aciklama")}
            acik={!!tercih.kanallar.masaustu}
            onToggle={(v) => {
              if (v && izin !== "granted") {
                goster({ tip: "bilgi", baslik: t("bk.kanal.masaustu.oncekiIzin"), aciklama: t("bk.kanal.masaustu.oncekiIzinAciklama") });
              }
              kanalAc("masaustu", v);
            }}
            esik={tercih.esik.masaustu ?? "kritik"}
            onEsik={(e) => esikAyarla("masaustu", e)}
            uyari={tercih.kanallar.masaustu && izin !== "granted" ? t("bk.kanal.masaustu.izinYok") : undefined}
            t={t}
          />

          {/* Entegrasyon kanalları */}
          {entKanallar.map((e) => {
            const g = entegrasyonGorsel(e.tur, t);
            return (
              <KanalSatir
                key={e.id}
                ikon={g.ikon}
                baslik={`${g.etiket} · ${e.ad}`}
                aciklama={e.hedef}
                acik={!!tercih.kanallar[e.id]}
                onToggle={(v) => kanalAc(e.id, v)}
                esik={tercih.esik[e.id] ?? "yuksek"}
                onEsik={(ev) => esikAyarla(e.id, ev)}
                rozet={e.aktif ? undefined : t("bk.kanal.rozet.pasif")}
                uyari={!e.aktif ? t("bk.kanal.entPasif") : undefined}
                t={t}
              />
            );
          })}
        </div>

        {entKanallar.length === 0 && (
          <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line-strong bg-canvas/40 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Plug className="size-4" /></span>
              <div>
                <p className="text-[14px] font-medium text-slate-ink">{t("bk.bos.baslik")}</p>
                <p className="text-[13px] text-slate-muted">{t("bk.bos.aciklama")}</p>
              </div>
            </div>
            <Button href="/panel/entegrasyonlar" variant="outline" size="sm">
              <Plug className="size-4" /> {t("bk.bos.btn")}
            </Button>
          </div>
        )}
      </Panel>

      {/* 2) YÖNLENDİRME MATRİSİ */}
      <Panel baslik={t("bk.matris.baslik")}>
        <p className="mb-4 text-[13px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("bk.matris.aciklama") }} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("bk.matris.kategori")}</th>
                {kanalIdler.map((id) => (
                  <th key={id} className="px-3 py-2.5 text-center text-xs font-semibold text-slate-faint">
                    <div className={cn("flex flex-col items-center gap-1", !tercih.kanallar[id] && "opacity-40")}>
                      <span className="grid size-7 place-items-center rounded-lg bg-canvas text-slate-muted">{kanalIkon(id, entKanallar)}</span>
                      <span className="max-w-[84px] truncate text-[11px] font-medium normal-case text-slate-muted" title={kanalKisaAd(id, entKanallar, t)}>{kanalKisaAd(id, entKanallar, t)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {KATEGORILER.map((kat) => (
                <tr key={kat.key} className="border-b border-line last:border-0">
                  <td className="px-3 py-3">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-white" style={{ background: kat.renk }}>{kat.ikon}</span>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-slate-ink">{t(kat.adAnahtar)}</div>
                        <div className="text-[11.5px] leading-snug text-slate-faint">{t(kat.aciklamaAnahtar)}</div>
                      </div>
                    </div>
                  </td>
                  {kanalIdler.map((id) => {
                    const aktifKanal = !!tercih.kanallar[id];
                    const isaretli = (tercih.yonlendirme[id] ?? varsayilanYonlendirme())[kat.key];
                    return (
                      <td key={id} className="px-3 py-3 text-center">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isaretli}
                          aria-label={`${t(kat.adAnahtar)} → ${kanalKisaAd(id, entKanallar, t)}`}
                          disabled={!aktifKanal}
                          onClick={() => yonlendirmeAc(id, kat.key, !isaretli)}
                          className={cn(
                            "inline-grid size-6 place-items-center rounded-md border transition outline-none focus-visible:ring-4 focus-visible:ring-brand-100",
                            !aktifKanal
                              ? "cursor-not-allowed border-line bg-canvas/50 opacity-40"
                              : isaretli
                                ? "border-brand-600 bg-brand-600 text-white"
                                : "border-line-strong bg-surface hover:border-brand-400",
                          )}
                        >
                          {isaretli && aktifKanal && <Check className="size-4" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* 3) SESSİZ SAATLER */}
      <Panel baslik={t("bk.sessiz.baslik")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Moon className="size-4" /></span>
            <div>
              <p className="text-[14px] font-medium text-slate-ink">{t("bk.sessiz.aralikBaslik")}</p>
              <p className="text-[13px] text-slate-muted" dangerouslySetInnerHTML={{ __html: t("bk.sessiz.aralikAciklama") }} />
            </div>
          </div>
          <Anahtar acik={tercih.sessiz.aktif} onChange={(v) => setTercih((eski) => ({ ...eski, sessiz: { ...eski.sessiz, aktif: v } }))} etiket={t("bk.sessiz.baslik")} />
        </div>

        {tercih.sessiz.aktif && (
          <div className="mt-4 flex flex-wrap items-end gap-4 rounded-2xl bg-canvas/40 p-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-ink">{t("bk.sessiz.baslangic")}</span>
              <Girdi type="time" value={tercih.sessiz.baslangic} onChange={(e) => setTercih((eski) => ({ ...eski, sessiz: { ...eski.sessiz, baslangic: e.target.value } }))} className="h-10 w-36" />
            </label>
            <ArrowRight className="mb-2.5 size-4 text-slate-faint" />
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-ink">{t("bk.sessiz.bitis")}</span>
              <Girdi type="time" value={tercih.sessiz.bitis} onChange={(e) => setTercih((eski) => ({ ...eski, sessiz: { ...eski.sessiz, bitis: e.target.value } }))} className="h-10 w-36" />
            </label>
            {ornekTeslimat.sessizMi && (
              <span className="mb-2.5 flex items-center gap-1.5 text-[13px] font-medium text-warn">
                <Moon className="size-4" /> {t("bk.sessiz.suAnda")}
              </span>
            )}
          </div>
        )}
      </Panel>

      {/* 4) MASAÜSTÜ BİLDİRİMLERİ */}
      <Panel baslik={t("bk.masaustu.baslik")}>
        <div className="flex flex-col gap-4 rounded-2xl bg-canvas/40 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600"><MonitorSmartphone className="size-5" /></span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-medium text-slate-ink">{t("bk.masaustu.altBaslik")}</p>
                {izinRozet()}
              </div>
              <p className="mt-0.5 max-w-md text-[13px] text-slate-muted">
                {destekli ? t("bk.masaustu.destekli") : t("bk.masaustu.desteksiz")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              variant="accent"
              size="sm"
              onClick={izinIste}
              disabled={!destekli || izin === "granted" || izin === "denied"}
            >
              <BellRing className="size-4" /> {t("bk.masaustu.etkinlestir")}
            </Button>
            <Button variant="outline" size="sm" onClick={testGonder} disabled={!destekli || izin !== "granted"}>
              <Send className="size-4" /> {t("bk.masaustu.test")}
            </Button>
          </div>
        </div>

        {izin === "denied" && (
          <div className="mt-3">
            <NotKutusu ton="kirmizi" baslik={t("bk.masaustu.reddedildiBaslik")}>
              {t("bk.masaustu.reddedildiAciklama")}
            </NotKutusu>
          </div>
        )}
      </Panel>

      {/* 5) ÖNİZLEME */}
      <Panel baslik={t("bk.onizleme.baslik")}>
        <p className="mb-4 flex items-center gap-2 text-[13px] text-slate-muted">
          <Info className="size-4 shrink-0 text-slate-faint" />
          <span dangerouslySetInnerHTML={{ __html: t("bk.onizleme.aciklama") }} />
        </p>
        <div className="space-y-2">
          {ornekTeslimat.sonuc.map((s) => (
            <div key={s.id} className={cn("flex items-center justify-between gap-3 rounded-xl border px-4 py-3", s.gecti ? "border-ok/30 bg-ok-soft/40" : "border-line bg-canvas/30")}>
              <div className="flex min-w-0 items-center gap-2.5">
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", s.gecti ? "bg-ok text-white" : "bg-slate-200 text-slate-500")}>
                  {kanalIkon(s.id, entKanallar)}
                </span>
                <span className="truncate text-[13px] font-medium text-slate-ink">{kanalAdi(s.id)}</span>
              </div>
              {s.gecti ? (
                <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-ok">
                  <CircleCheck className="size-4" /> {t("bk.onizleme.teslimEdilir")}{s.neden ? ` · ${s.neden}` : ""}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[12.5px] text-slate-faint">
                  <CircleAlert className="size-4" /> {t("bk.onizleme.teslimEdilmez")} · {s.neden}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-canvas/50 px-4 py-3 text-[13px] text-slate-muted">
          <ArrowRight className="size-4 shrink-0 text-brand-600" />
          <span>
            <span dangerouslySetInnerHTML={{ __html: t("bk.onizleme.ozet").replace("{sayi}", `<b class="mx-1 text-slate-ink">${teslimEdilecek}</b>`) }} />
            {ornekTeslimat.sessizMi && <span className="ml-1 text-warn">{t("bk.onizleme.sessizNot")}</span>}.
          </span>
        </div>
      </Panel>

      {/* Dürüst not */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
        <span>
          <span dangerouslySetInnerHTML={{ __html: t("bk.not.metin") }} />{" "}
          <a href="/panel/entegrasyonlar" className="inline-flex items-center gap-0.5 font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800">
            {t("bk.not.entegrasyonlar")} <ExternalLink className="size-3" />
          </a>{" "}
          {t("bk.not.sonEk")}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ KanalSatir */

/** Tek bir kanal satırı: ikon + açıklama + eşik seçici + aç/kapa. */
function KanalSatir({
  ikon, baslik, aciklama, acik, onToggle, esik, onEsik, rozet, uyari, t,
}: {
  ikon: React.ReactNode;
  baslik: string;
  aciklama: string;
  acik: boolean;
  onToggle: (v: boolean) => void;
  esik: Esik;
  onEsik: (e: Esik) => void;
  rozet?: string;
  uyari?: string;
  t: Ceviri;
}) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border px-4 py-3.5 transition sm:flex-row sm:items-center sm:justify-between", acik ? "border-line bg-surface" : "border-line bg-canvas/30")}>
      <div className="flex min-w-0 items-start gap-3">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", acik ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-400")}>{ikon}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-slate-ink">{baslik}</span>
            {rozet && <Badge ton="gri">{rozet}</Badge>}
          </div>
          <p className="truncate text-[12.5px] text-slate-muted" title={aciklama}>{aciklama}</p>
          {uyari && <p className="mt-0.5 flex items-center gap-1 text-[12px] font-medium text-warn"><AlertTriangle className="size-3" /> {uyari}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 pl-12 sm:pl-0">
        {/* Şiddet eşiği — kanal başına */}
        <div className={cn("flex items-center gap-1 rounded-xl bg-canvas p-0.5", !acik && "opacity-50")}>
          {(Object.keys(ESIK_META) as Esik[]).map((e) => (
            <button
              key={e}
              type="button"
              disabled={!acik}
              onClick={() => onEsik(e)}
              title={t(ESIK_META[e].aciklamaAnahtar)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[12px] font-medium transition disabled:cursor-not-allowed",
                esik === e ? "bg-surface text-slate-ink shadow-sm" : "text-slate-muted hover:text-slate-ink",
              )}
            >
              {t(ESIK_META[e].adAnahtar)}
            </button>
          ))}
        </div>
        <Anahtar acik={acik} onChange={onToggle} etiket={baslik} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Kanal görsel yardımcıları */

/** Bir kanal id'si için (matris/önizleme başlıklarında) ikon döndür. */
function kanalIkon(id: string, ent: EntegrasyonOzet[]): React.ReactNode {
  if (id === "panel") return <Bell className="size-3.5" />;
  if (id === "eposta") return <Mail className="size-3.5" />;
  if (id === "masaustu") return <MonitorSmartphone className="size-3.5" />;
  const e = ent.find((x) => x.id === id);
  return e ? entegrasyonGorsel(e.tur).ikon : <Webhook className="size-3.5" />;
}

/** Matris başlığı için kısa kanal adı. */
function kanalKisaAd(id: string, ent: EntegrasyonOzet[], t: Ceviri): string {
  if (id === "panel") return t("bk.kanalAd.panelIci");
  if (id === "eposta") return t("bk.kanalAd.eposta");
  if (id === "masaustu") return t("bk.kanalAd.masaustu");
  const e = ent.find((x) => x.id === id);
  return e ? e.ad : id;
}
