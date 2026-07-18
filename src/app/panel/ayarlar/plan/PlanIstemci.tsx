"use client";

import { useMemo, useState } from "react";
import {
  Check, X, CreditCard, Download, TrendingUp, Zap, Globe, Users, ArrowUpRight, Sparkles, Ticket, Loader2,
} from "lucide-react";
import { Panel, Badge, Ilerleme, Modal, NotKutusu, useToast, Girdi } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Plan } from "@/lib/db/schema";

/* ------------------------------------------------------------------ plan tanımları */

interface PlanTanim {
  key: Plan;
  ad: string;
  fiyat: number | null; // aylık ₺ (null = özel)
  fiyatEtiket: string;
  ozet: string;
  kotalar: { dogrulama: number; site: number; ekip: number };
}

const PLANLAR: PlanTanim[] = [
  { key: "free", ad: "Free", fiyat: 0, fiyatEtiket: "₺0", ozet: "Kişisel projeler ve deneme için.", kotalar: { dogrulama: 1000, site: 1, ekip: 1 } },
  { key: "pro", ad: "Pro", fiyat: 490, fiyatEtiket: "₺490", ozet: "Büyüyen ekipler ve üretim trafiği.", kotalar: { dogrulama: 100000, site: 999, ekip: 10 } },
  { key: "scale", ad: "Scale", fiyat: null, fiyatEtiket: "Özel", ozet: "Yüksek hacim, SLA ve kurumsal gereksinimler.", kotalar: { dogrulama: 1000000, site: 9999, ekip: 999 } },
];

/* Özellik karşılaştırma matrisi. */
const OZELLIKLER: { ad: string; free: boolean | string; pro: boolean | string; scale: boolean | string }[] = [
  { ad: "Ghost-font CAPTCHA koruması", free: true, pro: true, scale: true },
  { ad: "Aylık doğrulama", free: "1.000", pro: "100.000", scale: "Sınırsız" },
  { ad: "Korunan site", free: "1 site", pro: "Sınırsız", scale: "Sınırsız" },
  { ad: "Ekip üyesi", free: "1", pro: "10", scale: "Sınırsız" },
  { ad: "Davranışsal analiz", free: false, pro: true, scale: true },
  { ad: "Kural motoru", free: false, pro: true, scale: true },
  { ad: "AI ajan istihbaratı", free: "Temel", pro: "Gelişmiş", scale: "Gelişmiş + özel model" },
  { ad: "Webhook & API erişimi", free: false, pro: true, scale: true },
  { ad: "Denetim günlüğü saklama", free: "7 gün", pro: "90 gün", scale: "1 yıl+" },
  { ad: "SSO / SAML", free: false, pro: false, scale: true },
  { ad: "SLA garantisi", free: false, pro: false, scale: "%99,99" },
  { ad: "Destek", free: "Topluluk", pro: "Öncelikli", scale: "Adanmış yönetici" },
];

const FATURALAR = [
  { id: "f1", tarih: "01.07.2026", aciklama: "Pro plan — Temmuz", tutar: 490, no: "SPC-2026-0007" },
  { id: "f2", tarih: "01.06.2026", aciklama: "Pro plan — Haziran", tutar: 490, no: "SPC-2026-0006" },
  { id: "f3", tarih: "01.05.2026", aciklama: "Pro plan — Mayıs", tutar: 490, no: "SPC-2026-0005" },
  { id: "f4", tarih: "01.04.2026", aciklama: "Free → Pro yükseltme", tutar: 490, no: "SPC-2026-0004" },
];

/* ------------------------------------------------------------------ ana */

export function PlanIstemci({
  plan,
  kullanim,
}: {
  plan: Plan;
  kullanim: { dogrulama: number; siteSayisi: number; ekipSayisi: number };
}) {
  const { goster } = useToast();
  const [yukseltModal, setYukseltModal] = useState<PlanTanim | null>(null);
  const [kartModal, setKartModal] = useState(false);

  const mevcut = PLANLAR.find((p) => p.key === plan)!;
  const kota = mevcut.kotalar;

  // Kullanım-bazlı maliyet öngörüsü: ayın ne kadarı geçti → tam ay tahmini.
  const gunGecti = new Date().getDate();
  const aydakiGun = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const tahminiDogrulama = Math.round((kullanim.dogrulama / Math.max(1, gunGecti)) * aydakiGun);
  const asimVar = tahminiDogrulama > kota.dogrulama;

  const kullanimlar = [
    { ad: "Doğrulama", ikon: <Zap className="size-4" />, deger: kullanim.dogrulama, limit: kota.dogrulama, birim: "" },
    { ad: "Korunan site", ikon: <Globe className="size-4" />, deger: kullanim.siteSayisi, limit: kota.site === 999 ? Infinity : kota.site, birim: "site" },
    { ad: "Ekip üyesi", ikon: <Users className="size-4" />, deger: kullanim.ekipSayisi, limit: kota.ekip === 999 ? Infinity : kota.ekip, birim: "üye" },
  ];

  function ozellikHucre(v: boolean | string) {
    if (v === true) return <span className="inline-grid size-6 place-items-center rounded-full bg-ok-soft text-ok"><Check className="size-3.5" strokeWidth={3} /></span>;
    if (v === false) return <span className="inline-grid size-6 place-items-center rounded-full bg-slate-100 text-slate-300"><X className="size-3.5" strokeWidth={2.5} /></span>;
    return <span className="text-[13px] font-medium text-slate-ink">{v}</span>;
  }

  return (
    <div className="space-y-6">
      {/* ---------------- Mevcut plan + kullanım ölçümleri ---------------- */}
      <Panel baslik="Mevcut plan">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Sparkles className="size-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-slate-ink">{mevcut.ad}</span>
                <Badge ton="brand">Aktif</Badge>
              </div>
              <div className="text-[13px] text-slate-muted">{mevcut.ozet}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[26px] font-bold text-slate-ink num">
              {mevcut.fiyatEtiket}<span className="text-[13px] font-normal text-slate-faint">{mevcut.fiyat ? " /ay" : ""}</span>
            </div>
            {plan !== "scale" && (
              <button
                onClick={() => setYukseltModal(PLANLAR.find((p) => p.key === (plan === "free" ? "pro" : "scale"))!)}
                className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
              >
                Planı yükselt →
              </button>
            )}
          </div>
        </div>

        {/* Kullanım çubukları */}
        <div className="mt-6 space-y-5 border-t border-line pt-5">
          {kullanimlar.map((k) => {
            const sinirsiz = !isFinite(k.limit);
            const oran = sinirsiz ? 0 : Math.min(100, (k.deger / k.limit) * 100);
            return (
              <div key={k.ad}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 text-slate-muted">
                    <span className="text-slate-faint">{k.ikon}</span> {k.ad}
                  </span>
                  <span className="num font-semibold text-slate-ink">
                    {k.deger.toLocaleString("tr-TR")}
                    {sinirsiz ? <span className="font-normal text-slate-faint"> / Sınırsız</span> : <span className="font-normal text-slate-faint"> / {k.limit.toLocaleString("tr-TR")}</span>}
                  </span>
                </div>
                {!sinirsiz && <Ilerleme deger={oran} ton={oran > 90 ? "danger" : oran > 75 ? "warn" : "brand"} />}
                {sinirsiz && <div className="h-2 w-full rounded-full bg-gradient-to-r from-brand-100 to-brand-50" />}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ---------------- Maliyet öngörüsü ---------------- */}
      <Panel baslik="Kullanım-bazlı öngörü">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={cn("grid size-11 place-items-center rounded-2xl", asimVar ? "bg-warn-soft text-amber-700" : "bg-ok-soft text-ok")}>
              <TrendingUp className="size-5" />
            </span>
            <div>
              <div className="text-sm text-slate-muted">Bu ay sonu tahmini doğrulama</div>
              <div className="text-[17px] font-semibold text-slate-ink num">
                {tahminiDogrulama.toLocaleString("tr-TR")}
                <span className="text-[13px] font-normal text-slate-faint"> / {kota.dogrulama.toLocaleString("tr-TR")} kota</span>
              </div>
            </div>
          </div>
          {asimVar ? (
            <Badge ton="sari">Kota aşımı bekleniyor</Badge>
          ) : (
            <Badge ton="yesil">Kota içinde</Badge>
          )}
        </div>
        {asimVar && (
          <NotKutusu ton="sari" baslik="Mevcut hızla kotayı aşacaksınız">
            Ay sonuna kadar tahmini {tahminiDogrulama.toLocaleString("tr-TR")} doğrulama gerçekleşecek. Kesintisiz koruma için bir üst plana yükseltmeyi değerlendirin.
          </NotKutusu>
        )}
      </Panel>

      {/* ---------------- Plan karşılaştırma matrisi ---------------- */}
      <Panel baslik="Planları karşılaştır" padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">Özellik</th>
                {PLANLAR.map((p) => (
                  <th key={p.key} className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-slate-ink">
                        {p.ad}
                        {p.key === plan && <Badge ton="brand">Mevcut</Badge>}
                      </span>
                      <span className="text-[12px] font-normal text-slate-faint">{p.fiyatEtiket}{p.fiyat ? "/ay" : ""}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OZELLIKLER.map((o) => (
                <tr key={o.ad} className="border-b border-line last:border-0">
                  <td className="px-6 py-3.5 text-[13.5px] text-slate-ink">{o.ad}</td>
                  <td className="px-4 py-3.5 text-center">{ozellikHucre(o.free)}</td>
                  <td className="px-4 py-3.5 text-center">{ozellikHucre(o.pro)}</td>
                  <td className="px-4 py-3.5 text-center">{ozellikHucre(o.scale)}</td>
                </tr>
              ))}
              <tr>
                <td className="px-6 py-4" />
                {PLANLAR.map((p) => (
                  <td key={p.key} className="px-4 py-4 text-center">
                    {p.key === plan ? (
                      <span className="text-[13px] font-medium text-slate-faint">Mevcut plan</span>
                    ) : (
                      <Button
                        variant={p.key === "pro" ? "accent" : "outline"}
                        size="sm"
                        onClick={() => setYukseltModal(p)}
                      >
                        {p.key === "free" ? "Düşür" : p.key === "scale" ? "İletişime geç" : "Yükselt"}
                      </Button>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ---------------- Ödeme yöntemi ---------------- */}
      <Panel baslik="Ödeme yöntemi">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-ink-900 text-white"><CreditCard className="size-5" /></span>
            <div>
              <div className="num text-sm font-semibold text-slate-ink">•••• •••• •••• 4242</div>
              <div className="text-[12px] text-slate-muted">Son kullanma 08/28 · Visa</div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setKartModal(true)}>Değiştir</Button>
        </div>
      </Panel>

      {/* ---------------- Fatura geçmişi ---------------- */}
      <Panel baslik="Fatura geçmişi" padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/40 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                <th className="px-6 py-3">Tarih</th>
                <th className="px-4 py-3">Açıklama</th>
                <th className="px-4 py-3">Fatura no</th>
                <th className="px-4 py-3">Tutar</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-6 py-3 text-right">İndir</th>
              </tr>
            </thead>
            <tbody>
              {FATURALAR.map((f) => (
                <tr key={f.id} className="border-b border-line last:border-0">
                  <td className="px-6 py-3.5 num text-slate-ink">{f.tarih}</td>
                  <td className="px-4 py-3.5 text-slate-muted">{f.aciklama}</td>
                  <td className="px-4 py-3.5 num text-[12px] text-slate-faint">{f.no}</td>
                  <td className="px-4 py-3.5 num font-semibold text-slate-ink">₺{f.tutar.toLocaleString("tr-TR")},00</td>
                  <td className="px-4 py-3.5"><Badge ton="yesil">Ödendi</Badge></td>
                  <td className="px-6 py-3.5 text-right">
                    <FaturaIndir no={f.no} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ================= Modaller ================= */}
      <YukseltModal tanim={yukseltModal} mevcut={mevcut} kapat={() => setYukseltModal(null)} />
      <KartModal acik={kartModal} kapat={() => setKartModal(false)} />
    </div>
  );

  function FaturaIndir({ no }: { no: string }) {
    return (
      <button
        onClick={() => goster({ tip: "basari", baslik: "Fatura indiriliyor", aciklama: `${no}.pdf` })}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 hover:text-brand-700"
      >
        <Download className="size-3.5" /> PDF
      </button>
    );
  }
}

/* ------------------------------------------------------------------ Yükselt/düşür modalı */

interface UygulananPromo {
  id: string;
  kod: string;
  tur: "yuzde" | "sabit";
  deger: number;
  indirimTutari: number;
}

function YukseltModal({
  tanim, mevcut, kapat,
}: {
  tanim: PlanTanim | null;
  mevcut: PlanTanim;
  kapat: () => void;
}) {
  const { goster } = useToast();
  const yukseltme = tanim ? (tanim.fiyat ?? Infinity) > (mevcut.fiyat ?? 0) : true;

  // Promo durumu
  const [kodGiris, setKodGiris] = useState("");
  const [promo, setPromo] = useState<UygulananPromo | null>(null);
  const [promoHata, setPromoHata] = useState<string | null>(null);
  const [kontrolEdiliyor, setKontrolEdiliyor] = useState(false);

  if (!tanim) return <Modal acik={false} kapat={kapat}>{null}</Modal>;

  const scaleMi = tanim.key === "scale";
  const hamFiyat = tanim.fiyat ?? 0;
  // Ücretli plan + yükseltme durumunda indirim uygulanabilir.
  const promoUygun = !scaleMi && hamFiyat > 0 && yukseltme;
  const indirim = promo?.indirimTutari ?? 0;
  const yeniFiyat = Math.max(0, hamFiyat - indirim);

  function temizle() {
    setKodGiris(""); setPromo(null); setPromoHata(null); setKontrolEdiliyor(false);
  }
  function kapatVeTemizle() {
    temizle();
    kapat();
  }

  async function kodUygula() {
    const kod = kodGiris.trim();
    if (!kod || !tanim) return;
    setKontrolEdiliyor(true);
    setPromoHata(null);
    try {
      const res = await fetch("/api/promo/dogrula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kod, planId: tanim.key, hamFiyat }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.gecerli) {
        setPromo({
          id: data.id,
          kod: data.kod,
          tur: data.tur,
          deger: data.deger,
          indirimTutari: data.indirimTutari ?? 0,
        });
        setPromoHata(null);
      } else {
        setPromo(null);
        setPromoHata(data?.sebep ?? "Bu kod geçersiz.");
      }
    } catch {
      setPromo(null);
      setPromoHata("Kod doğrulanamadı, tekrar deneyin.");
    } finally {
      setKontrolEdiliyor(false);
    }
  }

  async function satinAl() {
    // İndirim uygulandıysa kullanımı gerçekten kaydet (sayaç + log).
    if (promo) {
      await fetch("/api/promo/kullan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoId: promo.id, planId: tanim!.key, indirimTutari: promo.indirimTutari }),
      }).catch(() => {});
    }
    kapatVeTemizle();
    goster({
      tip: "basari",
      baslik: scaleMi ? "Talebiniz alındı" : yukseltme ? "Plan yükseltildi (demo)" : "Plan düşürüldü (demo)",
      aciklama: scaleMi
        ? "Satış ekibi en kısa sürede iletişime geçecek."
        : promo
          ? `${tanim!.ad} planı · ${promo.kod} uygulandı (₺${indirim.toLocaleString("tr-TR")} indirim)`
          : `${tanim!.ad} planı`,
    });
  }

  return (
    <Modal
      acik={!!tanim}
      kapat={kapatVeTemizle}
      baslik={scaleMi ? "Scale planı" : yukseltme ? `${tanim.ad} planına yükselt` : `${tanim.ad} planına düşür`}
      genislik="max-w-md"
    >
      <div className="space-y-4">
        {/* Fiyat — indirim varsa üstü çizili eski + yeni */}
        <div className="flex items-baseline gap-2">
          {promo && promoUygun ? (
            <>
              <span className="text-[20px] font-semibold text-slate-faint line-through num">{tanim.fiyatEtiket}</span>
              <span className="text-[32px] font-bold text-slate-ink num">₺{yeniFiyat.toLocaleString("tr-TR")}</span>
              <span className="text-slate-faint">/ay</span>
              <Badge ton="yesil">
                {promo.kod} · {promo.tur === "yuzde" ? `-%${promo.deger}` : `-₺${promo.deger}`}
              </Badge>
            </>
          ) : (
            <>
              <span className="text-[32px] font-bold text-slate-ink num">{tanim.fiyatEtiket}</span>
              {tanim.fiyat ? <span className="text-slate-faint">/ay</span> : null}
            </>
          )}
        </div>
        <p className="text-sm text-slate-muted">{tanim.ozet}</p>
        <div className="rounded-2xl border border-line bg-canvas/40 p-4 text-[13px]">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-semibold text-slate-ink num">{tanim.kotalar.dogrulama.toLocaleString("tr-TR")}</div>
              <div className="text-slate-faint">doğrulama/ay</div>
            </div>
            <div>
              <div className="font-semibold text-slate-ink">{tanim.kotalar.site >= 999 ? "Sınırsız" : tanim.kotalar.site}</div>
              <div className="text-slate-faint">site</div>
            </div>
            <div>
              <div className="font-semibold text-slate-ink">{tanim.kotalar.ekip >= 999 ? "Sınırsız" : tanim.kotalar.ekip}</div>
              <div className="text-slate-faint">ekip üyesi</div>
            </div>
          </div>
        </div>

        {/* Promo kod alanı — yalnızca ücretli yükseltmede */}
        {promoUygun && (
          <div className="rounded-2xl border border-line p-4">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-slate-ink">
              <Ticket className="size-4 text-brand-600" /> İndirim kodun var mı?
            </div>
            {promo ? (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-ok-soft px-3 py-2.5">
                <div className="flex items-center gap-2 text-[13px] text-green-800">
                  <Check className="size-4 shrink-0" strokeWidth={3} />
                  <span>
                    <span className="font-mono font-semibold">{promo.kod}</span> uygulandı —{" "}
                    <span className="font-semibold">
                      {promo.tur === "yuzde" ? `%${promo.deger} indirim` : `₺${promo.deger} indirim`}
                    </span>
                    {" "}(₺{indirim.toLocaleString("tr-TR")})
                  </span>
                </div>
                <button
                  onClick={temizle}
                  className="shrink-0 rounded-lg p-1 text-green-700 transition hover:bg-green-100"
                  title="Kaldır"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Girdi
                  value={kodGiris}
                  onChange={(e) => {
                    setKodGiris(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 24));
                    if (promoHata) setPromoHata(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && kodUygula()}
                  placeholder="KODUNUZ"
                  className="h-10 font-mono uppercase"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={kodUygula}
                  disabled={!kodGiris.trim() || kontrolEdiliyor}
                  className="shrink-0"
                >
                  {kontrolEdiliyor ? <Loader2 className="size-4 animate-spin" /> : "Uygula"}
                </Button>
              </div>
            )}
            {promoHata && <div className="mt-2 text-[12.5px] text-red-600">{promoHata}</div>}
          </div>
        )}

        {scaleMi ? (
          <NotKutusu ton="bilgi">Scale planı özel fiyatlandırılır. Satış ekibimiz gereksinimlerinize göre teklif hazırlar.</NotKutusu>
        ) : !yukseltme ? (
          <NotKutusu ton="sari" baslik="Plan düşürülüyor">Kotanız düşecek; mevcut kullanımınız yeni limiti aşarsa bazı özellikler kısıtlanabilir.</NotKutusu>
        ) : null}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={kapatVeTemizle}>Vazgeç</Button>
          <Button variant={yukseltme ? "accent" : "outline"} onClick={satinAl}>
            {scaleMi ? <><ArrowUpRight className="size-4" /> İletişime geç</> : yukseltme ? `${tanim.ad}'a geç` : `${tanim.ad}'a düş`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ Kart değiştir modalı */
function KartModal({ acik, kapat }: { acik: boolean; kapat: () => void }) {
  const { goster } = useToast();
  const [numara, setNumara] = useState("");
  const [sonKullanma, setSonKullanma] = useState("");
  const [cvc, setCvc] = useState("");

  const gecerli = numara.replace(/\s/g, "").length >= 15 && /^\d{2}\/\d{2}$/.test(sonKullanma) && cvc.length >= 3;

  return (
    <Modal acik={acik} kapat={kapat} baslik="Ödeme yöntemini güncelle" genislik="max-w-md">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-ink">Kart numarası</span>
          <input
            value={numara}
            onChange={(e) => setNumara(e.target.value.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").slice(0, 19))}
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            className="h-11 w-full rounded-2xl border border-line-strong bg-surface px-4 font-mono text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-ink">Son kullanma</span>
            <input
              value={sonKullanma}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                setSonKullanma(v);
              }}
              placeholder="AA/YY"
              className="h-11 w-full rounded-2xl border border-line-strong bg-surface px-4 font-mono text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-ink">CVC</span>
            <input
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="123"
              inputMode="numeric"
              className="h-11 w-full rounded-2xl border border-line-strong bg-surface px-4 font-mono text-sm text-slate-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={kapat}>İptal</Button>
          <Button
            disabled={!gecerli}
            onClick={() => { kapat(); goster({ tip: "basari", baslik: "Ödeme yöntemi güncellendi (demo)" }); }}
          >
            Kartı kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
}
