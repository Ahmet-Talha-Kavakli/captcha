"use client";

/**
 * Gelişmiş Kural Oluşturucu — İstemci
 * ====================================
 * VE/VEYA (and/or) koşul-ağacı editörü. Kullanıcı iç içe koşul grupları kurar,
 * her koşul [alan][operatör][değer][DEĞİL] satırıdır. Canlı önizleme grupOzet()
 * ile insan-okur metin üretir; "Kuralı test et" bölümü örnek bir istek bağlamını
 * evalKosulGrup() ile değerlendirip kuralın eşleşip eşleşmeyeceğini gösterir.
 * Kaydetme gerçek /api/rules uç noktasına kosulGrup ile POST atar.
 */

import { useMemo, useState } from "react";
import {
  GitBranch, Plus, Trash2, FlaskConical, Check, X, Save, Layers,
  ChevronDown, ChevronRight, Code2, Sparkles, Ban, History, ShieldAlert,
} from "lucide-react";
import { Panel, Badge, useToast } from "@/components/panel/kit";
import { Toggle } from "@/components/panel/Toggle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  FIELD_ETIKET, OP_ETIKET, ACTION_ETIKET, grupOzet, evalKosulGrup,
  type RequestContext,
} from "@/lib/specter/rule-engine";
import type {
  RuleKosul, RuleKosulGrup, RuleField, RuleOp, RuleAction, BotClass,
} from "@/lib/db/schema";

/* ------------------------------------------------------------------ sabitler */

/** Aksiyon → Badge tonu eşlemesi. */
const ACTION_TON: Record<RuleAction, "yesil" | "sari" | "kirmizi" | "gri"> = {
  allow: "yesil", challenge: "sari", block: "kirmizi", flag: "gri",
};

/** Alan seçenekleri iki gruba ayrılır (görsel optgroup için). */
const AG_ALANLARI: RuleField[] = ["ip", "country", "asn", "ua", "path", "score", "botClass", "rate"];
const AI_ALANLARI: RuleField[] = ["aiAgent", "aiCategory", "headless", "tlsMismatch", "httpVersion"];

/** Boolean değerli alanlar (true/false seçimi). */
const BOOL_ALANLAR = new Set<RuleField>(["headless", "tlsMismatch"]);
/** Sayısal değerli alanlar (number input). */
const SAYI_ALANLAR = new Set<RuleField>(["score", "rate"]);

/** Bot sınıfı seçenekleri (botClass alanı için). */
const BOT_SINIFLARI: BotClass[] = [
  "human", "good_bot", "automation", "scraper", "credential_stuffing", "ai_agent", "ddos", "spam",
];
const BOT_ETIKET: Record<BotClass, string> = {
  human: "İnsan", good_bot: "İyi bot", automation: "Otomasyon", scraper: "Kazıyıcı",
  credential_stuffing: "Kimlik denemesi", ai_agent: "AI ajanı", ddos: "DDoS", spam: "Spam",
};

/** HTTP sürüm seçenekleri (httpVersion alanı için). */
const HTTP_SURUMLERI = ["h2", "h3", "http/1.1"];

/** Yeni bir alan seçilince makul varsayılan operatör + değer üret. */
function alanVarsayilan(field: RuleField): { op: RuleOp; value: string } {
  if (BOOL_ALANLAR.has(field)) return { op: "eq", value: "true" };
  if (field === "botClass") return { op: "eq", value: "human" };
  if (field === "httpVersion") return { op: "eq", value: "h2" };
  if (field === "score") return { op: "lt", value: "0.3" };
  if (field === "rate") return { op: "gt", value: "60" };
  return { op: "eq", value: "" };
}

/** Boş bir atomik koşul. */
function bosKosul(): RuleKosul {
  return { field: "country", op: "eq", value: "" };
}
/** Boş bir koşul grubu (tek koşullu başlar). */
function bosGrup(birlestir: "and" | "or" = "and"): RuleKosulGrup {
  return { birlestir, kosullar: [bosKosul()], gruplar: [] };
}

/* ------------------------------------------------------------------ ID yardımcısı
 * React key'leri için grup ağacında konum-yolu (index dizisi) kullanılır; bu
 * yol aynı zamanda değişiklikleri ilgili düğüme uygulamak için de kullanılır. */
type Yol = number[];

/** Ağacı immutable şekilde güncelleyen yardımcı: verilen yoldaki gruba dokunur. */
function grubaUygula(
  grup: RuleKosulGrup,
  yol: Yol,
  degistir: (g: RuleKosulGrup) => RuleKosulGrup,
): RuleKosulGrup {
  if (yol.length === 0) return degistir(grup);
  const [bas, ...kalan] = yol;
  const gruplar = [...(grup.gruplar ?? [])];
  gruplar[bas] = grubaUygula(gruplar[bas], kalan, degistir);
  return { ...grup, gruplar };
}

/* ------------------------------------------------------------------ ana bileşen */

export function GelismisKuralIstemci({ siteler }: { siteler: { id: string; name: string }[] }) {
  const { goster } = useToast();

  // Kural meta bilgileri.
  const [ad, setAd] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [siteId, setSiteId] = useState(siteler[0]?.id ?? "");
  const [oncelik, setOncelik] = useState(10);
  const [aksiyon, setAksiyon] = useState<RuleAction>("challenge");

  // Koşul ağacı (kök grup).
  const [kokGrup, setKokGrup] = useState<RuleKosulGrup>(() => bosGrup("and"));

  const [jsonAcik, setJsonAcik] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [kaydedildi, setKaydedildi] = useState(false);

  // Geçmiş trafiğe karşı backtest sonucu.
  const [backtestYukleniyor, setBacktestYukleniyor] = useState(false);
  const [backtest, setBacktest] = useState<{
    toplam: number; eslesme: number; oran: number; aksiyon: string;
    insanYakalanan: number; yanlisPozitifRiski: boolean;
    sinifDagilimi: { botClass: string; sayi: number }[];
  } | null>(null);

  /* --- ağaç mutasyonları (hepsi kök grubu immutable günceller) --- */

  const kokGuncelle = (yol: Yol, fn: (g: RuleKosulGrup) => RuleKosulGrup) =>
    setKokGrup((k) => grubaUygula(k, yol, fn));

  function birlestirDegistir(yol: Yol, birlestir: "and" | "or") {
    kokGuncelle(yol, (g) => ({ ...g, birlestir }));
  }
  function kosulEkle(yol: Yol) {
    kokGuncelle(yol, (g) => ({ ...g, kosullar: [...g.kosullar, bosKosul()] }));
  }
  function altGrupEkle(yol: Yol) {
    kokGuncelle(yol, (g) => ({ ...g, gruplar: [...(g.gruplar ?? []), bosGrup(g.birlestir === "and" ? "or" : "and")] }));
  }
  function kosulSil(yol: Yol, idx: number) {
    kokGuncelle(yol, (g) => ({ ...g, kosullar: g.kosullar.filter((_, i) => i !== idx) }));
  }
  function altGrupSil(yol: Yol, idx: number) {
    kokGuncelle(yol, (g) => ({ ...g, gruplar: (g.gruplar ?? []).filter((_, i) => i !== idx) }));
  }
  function kosulDegistir(yol: Yol, idx: number, yama: Partial<RuleKosul>) {
    kokGuncelle(yol, (g) => ({
      ...g,
      kosullar: g.kosullar.map((k, i) => (i === idx ? { ...k, ...yama } : k)),
    }));
  }

  /* --- türetilmiş değerler --- */

  // Ağaçta en az bir koşul var mı (kaydetme/önizleme için).
  const kosulSayisi = useMemo(() => sayKosul(kokGrup), [kokGrup]);
  const ozet = useMemo(() => (kosulSayisi > 0 ? grupOzet(kokGrup) : ""), [kokGrup, kosulSayisi]);
  const jsonMetin = useMemo(() => JSON.stringify(kokGrup, null, 2), [kokGrup]);

  /* --- kaydet --- */

  async function kaydet() {
    if (!siteId) {
      goster({ tip: "hata", baslik: "Site seçilmedi", aciklama: "Kuralı bir siteye bağlamalısın." });
      return;
    }
    if (kosulSayisi === 0) {
      goster({ tip: "hata", baslik: "Koşul yok", aciklama: "En az bir koşul ekle — boş kural kaydedilemez." });
      return;
    }
    if (!ad.trim()) {
      goster({ tip: "hata", baslik: "Kural adı gerekli" });
      return;
    }
    setKaydediliyor(true);
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          name: ad.trim(),
          description: aciklama.trim(),
          priority: oncelik,
          action: aksiyon,
          kosulGrup: kokGrup,
        }),
      });
      if (res.ok) {
        setKaydedildi(true);
        goster({ tip: "basari", baslik: "Kural kaydedildi", aciklama: "Kurallar listesinde artık aktif." });
      } else {
        goster({ tip: "hata", baslik: "Kaydedilemedi", aciklama: "Sunucu isteği reddetti — girdileri kontrol et." });
      }
    } catch {
      goster({ tip: "hata", baslik: "Ağ hatası", aciklama: "Kural gönderilemedi." });
    } finally {
      setKaydediliyor(false);
    }
  }

  /** Taslak kuralı geçmiş GERÇEK trafiğe karşı çalıştır — kaydetmeden etki gör. */
  async function backtestCalistir() {
    if (!siteId) {
      goster({ tip: "hata", baslik: "Site seçilmedi", aciklama: "Backtest için bir site seç." });
      return;
    }
    if (kosulSayisi === 0) {
      goster({ tip: "hata", baslik: "Koşul yok", aciklama: "Test etmek için en az bir koşul ekle." });
      return;
    }
    setBacktestYukleniyor(true);
    setBacktest(null);
    try {
      const res = await fetch("/api/rules/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, action: aksiyon, kosulGrup: kokGrup }),
      });
      if (!res.ok) throw new Error();
      setBacktest(await res.json());
    } catch {
      goster({ tip: "hata", baslik: "Backtest başarısız", aciklama: "Geçmiş trafik testi yapılamadı." });
    } finally {
      setBacktestYukleniyor(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* açıklama şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <GitBranch className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">Görsel VE/VEYA koşul ağacı kur.</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            Birden çok sinyali VE/VEYA mantığıyla birleştir, iç içe gruplarla karmaşık koşullar tanımla.
            Kaydetmeden önce örnek bir istek üzerinde test et — kural gerçekten çalışır.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* --- sol: editör --- */}
        <div className="space-y-6">
          {/* meta */}
          <Panel baslik="Kural bilgileri">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <MetaAlan etiket="Kural adı">
                  <input
                    value={ad}
                    onChange={(e) => setAd(e.target.value)}
                    placeholder="Örn. RU + düşük skor engeli"
                    className={girdiCls}
                  />
                </MetaAlan>
                <MetaAlan etiket="Site">
                  <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className={girdiCls} aria-label="Site seç">
                    {siteler.length === 0 && <option value="">Site yok</option>}
                    {siteler.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </MetaAlan>
              </div>
              <MetaAlan etiket="Açıklama" opsiyonel>
                <input
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  placeholder="Bu kural ne işe yarıyor?"
                  className={girdiCls}
                />
              </MetaAlan>
              <div className="grid gap-4 sm:grid-cols-2">
                <MetaAlan etiket="Aksiyon">
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(ACTION_ETIKET) as RuleAction[]).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAksiyon(a)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-[13px] font-medium transition",
                          aksiyon === a
                            ? a === "allow" ? "border-green-300 bg-ok-soft text-green-700"
                              : a === "block" ? "border-red-300 bg-danger-soft text-red-700"
                                : a === "challenge" ? "border-amber-300 bg-warn-soft text-amber-700"
                                  : "border-brand-300 bg-brand-50 text-brand-700"
                            : "border-line-strong bg-surface text-slate-muted hover:border-line-strong hover:bg-canvas",
                        )}
                      >
                        {ACTION_ETIKET[a]}
                      </button>
                    ))}
                  </div>
                </MetaAlan>
                <MetaAlan etiket="Öncelik">
                  <input
                    type="number"
                    value={oncelik}
                    onChange={(e) => setOncelik(Number(e.target.value))}
                    className={girdiCls}
                  />
                </MetaAlan>
              </div>
            </div>
          </Panel>

          {/* koşul ağacı */}
          <Panel
            baslik={
              <span className="flex items-center gap-2">
                <Layers className="size-4 text-brand-600" /> Koşul ağacı
              </span>
            }
          >
            <GrupEditor
              grup={kokGrup}
              yol={[]}
              derinlik={0}
              kok
              onBirlestir={birlestirDegistir}
              onKosulEkle={kosulEkle}
              onAltGrupEkle={altGrupEkle}
              onKosulSil={kosulSil}
              onAltGrupSil={altGrupSil}
              onKosulDegistir={kosulDegistir}
            />
          </Panel>

          {/* test */}
          <KuralTest kokGrup={kokGrup} aksiyon={aksiyon} kosulSayisi={kosulSayisi} />
        </div>

        {/* --- sağ: canlı önizleme + kaydet (sticky) --- */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Panel
            baslik={
              <span className="flex items-center gap-2">
                <Sparkles className="size-4 text-brand-600" /> Canlı önizleme
              </span>
            }
          >
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">Mantık</div>
                <div className="rounded-xl border border-line bg-canvas/50 px-4 py-3 text-[13px] leading-relaxed text-slate-ink">
                  {ozet ? (
                    <span className="font-medium">{ozet}</span>
                  ) : (
                    <span className="text-slate-faint">Henüz koşul yok — bir koşul ekleyince özet burada belirir.</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-slate-muted">Eşleşince:</span>
                <Badge ton={ACTION_TON[aksiyon]}>{ACTION_ETIKET[aksiyon]}</Badge>
              </div>

              {/* JSON önizleme (katlanabilir) */}
              <div className="rounded-xl border border-line">
                <button
                  type="button"
                  onClick={() => setJsonAcik((v) => !v)}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-[13px] font-medium text-slate-muted transition hover:text-slate-ink"
                >
                  {jsonAcik ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  <Code2 className="size-3.5" /> JSON çıktısı
                </button>
                {jsonAcik && (
                  <pre className="max-h-64 overflow-auto border-t border-line bg-[#0c1424] p-3.5 text-[11.5px] leading-relaxed">
                    <code className="font-mono text-[#dbe4f0]">{jsonMetin}</code>
                  </pre>
                )}
              </div>
            </div>
          </Panel>

          {/* geçmiş trafiğe karşı backtest */}
          <div className="rounded-3xl border border-line bg-surface p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-brand-50 text-brand-600"><History className="size-4" /></span>
              <div>
                <h3 className="text-[14px] font-semibold text-slate-ink">Geçmiş trafiğe karşı test</h3>
                <p className="text-[12px] text-slate-muted">Kuralı kaydetmeden, son 1000 gerçek olayda etkisini gör.</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={backtestCalistir} disabled={backtestYukleniyor}>
              <History className="size-4" /> {backtestYukleniyor ? "Çalıştırılıyor…" : "Backtest çalıştır"}
            </Button>
            {backtest && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-line bg-canvas/40 py-2.5">
                    <div className="num text-[20px] font-bold text-slate-ink">{backtest.eslesme.toLocaleString("tr-TR")}</div>
                    <div className="text-[11px] text-slate-faint">eşleşen olay</div>
                  </div>
                  <div className="rounded-xl border border-line bg-canvas/40 py-2.5">
                    <div className="num text-[20px] font-bold text-brand-700">%{(backtest.oran * 100).toFixed(1)}</div>
                    <div className="text-[11px] text-slate-faint">trafik oranı</div>
                  </div>
                  <div className="rounded-xl border border-line bg-canvas/40 py-2.5">
                    <div className="num text-[20px] font-bold text-slate-ink">{backtest.toplam.toLocaleString("tr-TR")}</div>
                    <div className="text-[11px] text-slate-faint">incelenen</div>
                  </div>
                </div>
                {backtest.yanlisPozitifRiski ? (
                  <div className="flex items-start gap-2 rounded-xl border border-danger-soft bg-danger-soft/40 px-3 py-2.5 text-[12.5px] text-danger2">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                    <span><b>Yanlış-pozitif riski:</b> bu kural {backtest.insanYakalanan.toLocaleString("tr-TR")} insan trafiğini de yakalıyor. Aksiyon <b>{ACTION_ETIKET[aksiyon]}</b> gerçek kullanıcıları etkileyebilir — koşulları daralt.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-ok-soft px-3 py-2.5 text-[12.5px] text-green-700">
                    <Check className="mt-0.5 size-4 shrink-0" />
                    <span>İnsan trafiği yakalanmıyor — bu kural güvenli görünüyor.</span>
                  </div>
                )}
                {backtest.sinifDagilimi.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">Yakalanan sınıf dağılımı</div>
                    <div className="flex flex-wrap gap-1.5">
                      {backtest.sinifDagilimi.slice(0, 6).map((s) => (
                        <span key={s.botClass} className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-[11.5px] text-slate-muted">
                          {BOT_ETIKET[s.botClass as BotClass] ?? s.botClass} <b className="num text-slate-ink">{s.sayi}</b>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* kaydet */}
          <div className="rounded-3xl border border-line bg-surface p-5">
            <Button className="w-full" onClick={kaydet} disabled={kaydediliyor}>
              <Save className="size-4" /> {kaydediliyor ? "Kaydediliyor…" : "Kuralı kaydet"}
            </Button>
            {kaydedildi && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-green-200 bg-ok-soft px-3.5 py-2.5 text-[13px] text-green-700">
                <span className="flex items-center gap-1.5"><Check className="size-4" /> Kaydedildi</span>
                <a href="/panel/kurallar" className="font-semibold underline underline-offset-2 hover:text-green-800">
                  Kurallara dön
                </a>
              </div>
            )}
            <p className="mt-3 text-[12px] leading-relaxed text-slate-faint">
              {kosulSayisi} koşul · öncelik #{oncelik}. Kural kaydedilince önceliğine göre canlı trafikte değerlendirilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ MetaAlan */
function MetaAlan({ etiket, opsiyonel, children }: { etiket: string; opsiyonel?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-slate-ink">
        {etiket} {opsiyonel && <span className="text-slate-faint">(opsiyonel)</span>}
      </span>
      {children}
    </label>
  );
}

const girdiCls =
  "h-11 w-full rounded-2xl border border-line-strong bg-surface px-4 text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-slate-faint";
const kucukGirdiCls =
  "h-10 rounded-xl border border-line-strong bg-surface px-3 text-[13px] text-slate-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 placeholder:text-slate-faint";

/* ------------------------------------------------------------------ GrupEditor
 * Bir koşul grubunu (ve alt gruplarını, özyinelemeli) render eder. Kök grup
 * kutusuzdur; alt gruplar sol kenarlıkla girintili. */
interface GrupEditorProps {
  grup: RuleKosulGrup;
  yol: Yol;
  derinlik: number;
  kok?: boolean;
  onBirlestir: (yol: Yol, b: "and" | "or") => void;
  onKosulEkle: (yol: Yol) => void;
  onAltGrupEkle: (yol: Yol) => void;
  onKosulSil: (yol: Yol, idx: number) => void;
  onAltGrupSil: (yol: Yol, idx: number) => void;
  onKosulDegistir: (yol: Yol, idx: number, yama: Partial<RuleKosul>) => void;
  onKendiSil?: () => void;
}

function GrupEditor(props: GrupEditorProps) {
  const { grup, yol, derinlik, kok, onKendiSil } = props;
  // En fazla 3 seviye (0,1,2) — 2. seviyede daha fazla alt grup eklenmesin.
  const altGrupEklenebilir = derinlik < 2;

  return (
    <div
      className={cn(
        "space-y-2.5",
        !kok && "rounded-2xl border-l-2 border-brand-200 bg-canvas/30 pl-4 pr-3 py-3",
      )}
    >
      {/* grup başlığı: VE/VEYA segment + (alt grupsa) sil */}
      <div className="flex items-center justify-between">
        <VeVeyaSecim birlestir={grup.birlestir} onChange={(b) => props.onBirlestir(yol, b)} />
        {!kok && onKendiSil && (
          <button
            type="button"
            onClick={onKendiSil}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-slate-faint transition hover:bg-danger-soft hover:text-red-600"
          >
            <Trash2 className="size-3.5" /> Grubu sil
          </button>
        )}
      </div>

      {/* atomik koşullar */}
      <div className="space-y-2">
        {grup.kosullar.map((k, i) => (
          <KosulSatiri
            key={i}
            kosul={k}
            tekMi={grup.kosullar.length === 1 && (grup.gruplar ?? []).length === 0}
            onDegistir={(yama) => props.onKosulDegistir(yol, i, yama)}
            onSil={() => props.onKosulSil(yol, i)}
          />
        ))}
      </div>

      {/* alt gruplar (özyinelemeli) */}
      {(grup.gruplar ?? []).map((alt, i) => (
        <GrupEditor
          key={`g${i}`}
          {...props}
          grup={alt}
          yol={[...yol, i]}
          derinlik={derinlik + 1}
          kok={false}
          onKendiSil={() => props.onAltGrupSil(yol, i)}
        />
      ))}

      {/* ekleme aksiyonları */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => props.onKosulEkle(yol)}
          className="flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3 py-1.5 text-[12.5px] font-medium text-slate-muted transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        >
          <Plus className="size-3.5" /> Koşul ekle
        </button>
        {altGrupEklenebilir && (
          <button
            type="button"
            onClick={() => props.onAltGrupEkle(yol)}
            className="flex items-center gap-1.5 rounded-xl border border-dashed border-brand-300 bg-brand-50/40 px-3 py-1.5 text-[12.5px] font-medium text-brand-600 transition hover:bg-brand-50"
          >
            <GitBranch className="size-3.5" /> Alt grup ekle
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ VeVeyaSecim
 * VE / VEYA segmented kontrol. */
function VeVeyaSecim({ birlestir, onChange }: { birlestir: "and" | "or"; onChange: (b: "and" | "or") => void }) {
  return (
    <div className="inline-flex rounded-xl border border-line-strong bg-canvas/60 p-0.5">
      {(["and", "or"] as const).map((b) => (
        <button
          key={b}
          type="button"
          onClick={() => onChange(b)}
          className={cn(
            "rounded-lg px-3 py-1 text-[12.5px] font-bold transition",
            birlestir === b
              ? b === "and" ? "bg-brand-600 text-white shadow-sm" : "bg-amber-500 text-white shadow-sm"
              : "text-slate-muted hover:text-slate-ink",
          )}
        >
          {b === "and" ? "VE" : "VEYA"}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ KosulSatiri
 * Tek atomik koşul: [alan][operatör][değer][DEĞİL][sil]. */
function KosulSatiri({
  kosul, tekMi, onDegistir, onSil,
}: {
  kosul: RuleKosul;
  tekMi: boolean;
  onDegistir: (yama: Partial<RuleKosul>) => void;
  onSil: () => void;
}) {
  // Alan değişince operatör + değeri makul varsayılana çek.
  function alanSec(field: RuleField) {
    onDegistir({ field, ...alanVarsayilan(field) });
  }

  const boolMu = BOOL_ALANLAR.has(kosul.field);
  const sayiMi = SAYI_ALANLAR.has(kosul.field);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
      {/* alan */}
      <select
        value={kosul.field}
        onChange={(e) => alanSec(e.target.value as RuleField)}
        className={cn(kucukGirdiCls, "w-[130px]")}
        aria-label="Alan"
      >
        <optgroup label="Ağ / istek">
          {AG_ALANLARI.map((f) => <option key={f} value={f}>{FIELD_ETIKET[f]}</option>)}
        </optgroup>
        <optgroup label="AI ajanı & parmak izi">
          {AI_ALANLARI.map((f) => <option key={f} value={f}>{FIELD_ETIKET[f]}</option>)}
        </optgroup>
      </select>

      {/* operatör (bool alanlarda sadece eşittir/eşit değil anlamlı) */}
      <select
        value={kosul.op}
        onChange={(e) => onDegistir({ op: e.target.value as RuleOp })}
        className={cn(kucukGirdiCls, "w-[120px]")}
        aria-label="Operatör"
      >
        {(Object.keys(OP_ETIKET) as RuleOp[]).map((o) => <option key={o} value={o}>{OP_ETIKET[o]}</option>)}
      </select>

      {/* değer — alan türüne göre girdi */}
      {boolMu ? (
        <select
          value={kosul.value}
          onChange={(e) => onDegistir({ value: e.target.value })}
          className={cn(kucukGirdiCls, "min-w-[120px] flex-1")}
          aria-label="Değer"
        >
          <option value="true">Evet (true)</option>
          <option value="false">Hayır (false)</option>
        </select>
      ) : kosul.field === "botClass" ? (
        <select
          value={kosul.value}
          onChange={(e) => onDegistir({ value: e.target.value })}
          className={cn(kucukGirdiCls, "min-w-[140px] flex-1")}
          aria-label="Değer"
        >
          {BOT_SINIFLARI.map((b) => <option key={b} value={b}>{BOT_ETIKET[b]} ({b})</option>)}
        </select>
      ) : kosul.field === "httpVersion" ? (
        <select
          value={kosul.value}
          onChange={(e) => onDegistir({ value: e.target.value })}
          className={cn(kucukGirdiCls, "min-w-[120px] flex-1")}
          aria-label="Değer"
        >
          {HTTP_SURUMLERI.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      ) : (
        <input
          type={sayiMi ? "number" : "text"}
          step={sayiMi ? "0.05" : undefined}
          value={kosul.value}
          onChange={(e) => onDegistir({ value: e.target.value })}
          placeholder={sayiMi ? "0.3" : kosul.field === "country" ? "RU" : "değer"}
          className={cn(kucukGirdiCls, "min-w-[120px] flex-1")}
          aria-label="Değer"
        />
      )}

      {/* DEĞİL (negate) */}
      <button
        type="button"
        onClick={() => onDegistir({ negate: !kosul.negate })}
        className={cn(
          "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition",
          kosul.negate
            ? "border-red-300 bg-danger-soft text-red-600"
            : "border-line-strong bg-surface text-slate-faint hover:text-slate-ink",
        )}
        title="Koşulu tersine çevir (DEĞİL)"
      >
        <Ban className="size-3.5" /> DEĞİL
      </button>

      {/* sil (son koşulsa devre dışı) */}
      <button
        type="button"
        onClick={onSil}
        disabled={tekMi}
        className="rounded-lg p-1.5 text-slate-faint transition hover:bg-danger-soft hover:text-red-600 disabled:pointer-events-none disabled:opacity-30"
        title={tekMi ? "Grupta en az bir koşul olmalı" : "Koşulu sil"}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ KuralTest
 * Örnek bir RequestContext doldurup evalKosulGrup ile eşleşmeyi gösterir. */
function KuralTest({
  kokGrup, aksiyon, kosulSayisi,
}: {
  kokGrup: RuleKosulGrup;
  aksiyon: RuleAction;
  kosulSayisi: number;
}) {
  const [ornek, setOrnek] = useState({
    ip: "185.220.101.5",
    country: "RU",
    score: 0.15,
    botClass: "automation" as BotClass,
    headless: false,
    rate: 90,
  });

  // Örnek bağlamı RequestContext'e çevir (motorun beklediği alanlar).
  const ctx: RequestContext = useMemo(() => ({
    ip: ornek.ip,
    country: ornek.country,
    asn: "",
    ua: "",
    path: "/",
    score: ornek.score,
    botClass: ornek.botClass,
    rate: ornek.rate,
    headless: ornek.headless,
  }), [ornek]);

  const eslesir = kosulSayisi > 0 && evalKosulGrup(ctx, kokGrup);

  return (
    <Panel
      baslik={
        <span className="flex items-center gap-2">
          <FlaskConical className="size-4 text-brand-600" /> Kuralı test et
        </span>
      }
    >
      <p className="mb-4 text-[13px] text-slate-muted">
        Örnek bir isteğin sinyallerini gir; kural bu isteğe uygulanır mıydı gör. Kaydetmeden önce kanıtla.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <TestAlan etiket="IP">
          <input value={ornek.ip} onChange={(e) => setOrnek({ ...ornek, ip: e.target.value })} className={kucukGirdiCls + " w-full"} />
        </TestAlan>
        <TestAlan etiket="Ülke">
          <input value={ornek.country} onChange={(e) => setOrnek({ ...ornek, country: e.target.value })} className={kucukGirdiCls + " w-full"} />
        </TestAlan>
        <TestAlan etiket="Skor (0–1)">
          <input type="number" step="0.05" min="0" max="1" value={ornek.score} onChange={(e) => setOrnek({ ...ornek, score: parseFloat(e.target.value) || 0 })} className={kucukGirdiCls + " w-full"} />
        </TestAlan>
        <TestAlan etiket="Bot sınıfı">
          <select value={ornek.botClass} onChange={(e) => setOrnek({ ...ornek, botClass: e.target.value as BotClass })} className={kucukGirdiCls + " w-full"}>
            {BOT_SINIFLARI.map((b) => <option key={b} value={b}>{BOT_ETIKET[b]}</option>)}
          </select>
        </TestAlan>
        <TestAlan etiket="Hız (istek/dk)">
          <input type="number" value={ornek.rate} onChange={(e) => setOrnek({ ...ornek, rate: Number(e.target.value) })} className={kucukGirdiCls + " w-full"} />
        </TestAlan>
        <TestAlan etiket="Headless">
          <div className="flex h-10 items-center gap-2">
            <Toggle on={ornek.headless} onChange={() => setOrnek({ ...ornek, headless: !ornek.headless })} />
            <span className="text-[13px] text-slate-muted">{ornek.headless ? "Evet" : "Hayır"}</span>
          </div>
        </TestAlan>
      </div>

      {/* sonuç */}
      <div
        className={cn(
          "mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3.5",
          kosulSayisi === 0
            ? "border-line bg-canvas/40"
            : eslesir
              ? "border-green-200 bg-ok-soft"
              : "border-line bg-canvas/40",
        )}
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            kosulSayisi === 0 ? "bg-slate-100 text-slate-400" : eslesir ? "bg-ok text-white" : "bg-slate-200 text-slate-500",
          )}
        >
          {eslesir ? <Check className="size-5" /> : <X className="size-5" />}
        </span>
        <div>
          {kosulSayisi === 0 ? (
            <span className="text-[13px] text-slate-faint">Test için önce en az bir koşul ekle.</span>
          ) : eslesir ? (
            <span className="flex items-center gap-2 text-[14px] font-semibold text-green-700">
              Eşleşir → aksiyon uygulanır <Badge ton={ACTION_TON[aksiyon]}>{ACTION_ETIKET[aksiyon]}</Badge>
            </span>
          ) : (
            <span className="text-[14px] font-semibold text-slate-muted">Eşleşmez — bu isteğe kural uygulanmaz.</span>
          )}
        </div>
      </div>
    </Panel>
  );
}

function TestAlan({ etiket, children }: { etiket: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-slate-muted">{etiket}</span>
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------ yardımcı */
/** Ağaçtaki toplam atomik koşul sayısı (özyinelemeli). */
function sayKosul(grup: RuleKosulGrup): number {
  return (grup.kosullar?.length ?? 0) + (grup.gruplar ?? []).reduce((s, g) => s + sayKosul(g), 0);
}
