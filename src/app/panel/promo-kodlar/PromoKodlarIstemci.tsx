"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ticket, Plus, Percent, BadgePercent, Tag, TrendingDown, Trash2, Copy, Check,
} from "lucide-react";
import {
  Panel, StatKart, Badge, Modal, Alan, Girdi, Alan2, Secim, Ilerleme, BosDurum, useToast, SatirMenu,
} from "@/components/panel/kit";
import { Toggle } from "@/components/panel/Toggle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { PromoKod, PromoTur, Plan } from "@/lib/db/schema";

/* ------------------------------------------------------------------ yardımcılar */

function tarihEtiket(iso: string | null): { metin: string; gecmis: boolean } {
  if (!iso) return { metin: "Süresiz", gecmis: false };
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return { metin: "—", gecmis: false };
  const gecmis = t < Date.now();
  const d = new Date(t);
  const metin = d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
  return { metin, gecmis };
}

function planEtiket(p: "hepsi" | Plan): string {
  return p === "hepsi" ? "Tüm planlar" : p.toUpperCase();
}

/* ------------------------------------------------------------------ ana */

export function PromoKodlarIstemci({
  baslangic,
  toplamIndirim,
}: {
  baslangic: PromoKod[];
  toplamIndirim: number;
}) {
  const router = useRouter();
  const { goster } = useToast();
  const [kodlar, setKodlar] = useState<PromoKod[]>(baslangic);
  const [modalAcik, setModalAcik] = useState(false);
  const [silHedef, setSilHedef] = useState<PromoKod | null>(null);
  const [kopyalanan, setKopyalanan] = useState<string | null>(null);

  const istatistik = useMemo(() => {
    const aktif = kodlar.filter((k) => k.aktif).length;
    const toplamKullanim = kodlar.reduce((a, k) => a + k.kullanilan, 0);
    return { toplam: kodlar.length, aktif, toplamKullanim };
  }, [kodlar]);

  async function durumDegistir(promo: PromoKod, yeni: boolean) {
    // İyimser güncelle
    setKodlar((p) => p.map((k) => (k.id === promo.id ? { ...k, aktif: yeni } : k)));
    const res = await fetch(`/api/promo/${promo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktif: yeni }),
    });
    if (!res.ok) {
      // Geri al
      setKodlar((p) => p.map((k) => (k.id === promo.id ? { ...k, aktif: !yeni } : k)));
      goster({ tip: "hata", baslik: "Durum güncellenemedi" });
      return;
    }
    goster({ tip: "basari", baslik: `${promo.kod} ${yeni ? "aktifleştirildi" : "pasifleştirildi"}` });
    router.refresh();
  }

  async function sil() {
    if (!silHedef) return;
    const hedef = silHedef;
    const res = await fetch(`/api/promo/${hedef.id}`, { method: "DELETE" });
    if (res.ok) {
      setKodlar((p) => p.filter((k) => k.id !== hedef.id));
      setSilHedef(null);
      goster({ tip: "basari", baslik: `${hedef.kod} silindi` });
      router.refresh();
    } else {
      goster({ tip: "hata", baslik: "Silinemedi" });
    }
  }

  function kopyala(kod: string) {
    navigator.clipboard?.writeText(kod).catch(() => {});
    setKopyalanan(kod);
    setTimeout(() => setKopyalanan((c) => (c === kod ? null : c)), 1500);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* Bilgi şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
          <Ticket className="size-5" />
        </span>
        <div className="text-[13.5px] text-brand-900/80">
          <span className="font-semibold text-brand-900">İndirim kuponları.</span> Yüzde veya sabit tutar
          indirimler oluşturun; checkout&apos;ta uygulanır. Süre, kullanım limiti ve plan kısıtı gerçek zamanlı
          doğrulanır.
        </div>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={istatistik.toplam} etiket="Toplam kod" ikon={<Ticket className="size-5" />} />
        <StatKart sayi={istatistik.aktif} etiket="Aktif kod" ikon={<BadgePercent className="size-5" />} tone="ok" />
        <StatKart
          sayi={istatistik.toplamKullanim.toLocaleString("tr-TR")}
          etiket="Toplam kullanım"
          ikon={<Tag className="size-5" />}
        />
        <StatKart
          sayi={`₺${toplamIndirim.toLocaleString("tr-TR")}`}
          etiket="Toplam indirim"
          ikon={<TrendingDown className="size-5" />}
          tone="warn"
        />
      </div>

      {/* Tablo */}
      <Panel
        baslik="Kuponlar"
        padding={false}
        sagUst={
          <Button size="sm" onClick={() => setModalAcik(true)}>
            <Plus className="size-4" /> Yeni kod
          </Button>
        }
      >
        {kodlar.length === 0 ? (
          <div className="p-6">
            <BosDurum
              ikon={<Ticket className="size-7" />}
              baslik="Henüz promo kodu yok"
              aciklama="İlk indirim kuponunuzu oluşturun; checkout ekranında hemen kullanılabilir olsun."
              aksiyon={
                <Button onClick={() => setModalAcik(true)}>
                  <Plus className="size-4" /> Yeni kod oluştur
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas/40 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                  <th className="px-6 py-3">Kod</th>
                  <th className="px-4 py-3">İndirim</th>
                  <th className="px-4 py-3">Kullanım</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Son kullanma</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-6 py-3 text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {kodlar.map((k) => {
                  const t = tarihEtiket(k.sonKullanma);
                  const limitDolu = k.maxKullanim != null && k.kullanilan >= k.maxKullanim;
                  const oran = k.maxKullanim != null ? Math.min(100, (k.kullanilan / Math.max(1, k.maxKullanim)) * 100) : 0;
                  return (
                    <tr key={k.id} className="border-b border-line last:border-0 align-top">
                      {/* Kod */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => kopyala(k.kod)}
                            title="Kopyala"
                            className="group inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 font-mono text-[13px] font-semibold text-slate-ink transition hover:bg-slate-200"
                          >
                            {k.kod}
                            {kopyalanan === k.kod ? (
                              <Check className="size-3.5 text-ok" />
                            ) : (
                              <Copy className="size-3.5 text-slate-faint group-hover:text-slate-muted" />
                            )}
                          </button>
                        </div>
                        {k.aciklama && (
                          <div className="mt-1 max-w-[240px] truncate text-[12px] text-slate-muted" title={k.aciklama}>
                            {k.aciklama}
                          </div>
                        )}
                      </td>

                      {/* İndirim rozeti */}
                      <td className="px-4 py-4">
                        {k.tur === "yuzde" ? (
                          <Badge ton="brand">
                            <Percent className="size-3" /> %{k.deger}
                          </Badge>
                        ) : (
                          <Badge ton="mavi">₺{k.deger} indirim</Badge>
                        )}
                      </td>

                      {/* Kullanım barı */}
                      <td className="px-4 py-4">
                        <div className="min-w-[120px]">
                          <div className="mb-1 flex items-center justify-between text-[12px]">
                            <span className="num font-semibold text-slate-ink">{k.kullanilan.toLocaleString("tr-TR")}</span>
                            <span className="text-slate-faint">
                              {k.maxKullanim == null ? "/ ∞" : `/ ${k.maxKullanim.toLocaleString("tr-TR")}`}
                            </span>
                          </div>
                          {k.maxKullanim != null ? (
                            <Ilerleme deger={oran} ton={oran >= 100 ? "danger" : oran > 80 ? "warn" : "brand"} />
                          ) : (
                            <div className="h-2 w-full rounded-full bg-gradient-to-r from-brand-100 to-brand-50" />
                          )}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-4">
                        <span className="text-[13px] text-slate-muted">{planEtiket(k.planKisiti)}</span>
                      </td>

                      {/* Son kullanma */}
                      <td className="px-4 py-4">
                        <span className={cn("text-[13px]", t.gecmis ? "font-medium text-red-600" : "text-slate-muted")}>
                          {t.metin}
                          {t.gecmis && " (doldu)"}
                        </span>
                      </td>

                      {/* Durum */}
                      <td className="px-4 py-4">
                        {!k.aktif ? (
                          <Badge ton="gri">Pasif</Badge>
                        ) : t.gecmis ? (
                          <Badge ton="kirmizi">Süresi doldu</Badge>
                        ) : limitDolu ? (
                          <Badge ton="sari">Limit doldu</Badge>
                        ) : (
                          <Badge ton="yesil">Aktif</Badge>
                        )}
                      </td>

                      {/* Aksiyon */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <Toggle on={k.aktif} onChange={(v) => durumDegistir(k, v)} />
                          <SatirMenu
                            aksiyonlar={[
                              { ad: "Kodu kopyala", onClick: () => kopyala(k.kod) },
                              { ad: k.aktif ? "Pasifleştir" : "Aktifleştir", onClick: () => durumDegistir(k, !k.aktif) },
                              { ad: "Sil", onClick: () => setSilHedef(k), tehlike: true },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Oluşturma modalı */}
      <OlusturModal
        acik={modalAcik}
        kapat={() => setModalAcik(false)}
        eklendi={(promo) => {
          setKodlar((p) => [promo, ...p]);
          setModalAcik(false);
          goster({ tip: "basari", baslik: `${promo.kod} oluşturuldu` });
          router.refresh();
        }}
      />

      {/* Silme onay modalı */}
      <Modal acik={!!silHedef} kapat={() => setSilHedef(null)} baslik="Promo kodunu sil" genislik="max-w-md">
        {silHedef && (
          <div className="space-y-4">
            <p className="text-sm text-slate-muted">
              <span className="font-mono font-semibold text-slate-ink">{silHedef.kod}</span> kodunu kalıcı olarak
              silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSilHedef(null)}>
                Vazgeç
              </Button>
              <Button variant="danger" onClick={sil}>
                <Trash2 className="size-4" /> Sil
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ oluşturma modalı */

function OlusturModal({
  acik,
  kapat,
  eklendi,
}: {
  acik: boolean;
  kapat: () => void;
  eklendi: (promo: PromoKod) => void;
}) {
  const { goster } = useToast();
  const [kod, setKod] = useState("");
  const [tur, setTur] = useState<PromoTur>("yuzde");
  const [deger, setDeger] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [maxKullanim, setMaxKullanim] = useState("");
  const [sonKullanma, setSonKullanma] = useState("");
  const [planKisiti, setPlanKisiti] = useState<"hepsi" | Plan>("hepsi");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const degerNum = Number(deger);
  const gecerli =
    /^[A-Z0-9]{3,24}$/.test(kod) &&
    isFinite(degerNum) &&
    degerNum > 0 &&
    (tur === "sabit" || degerNum <= 100);

  function sifirla() {
    setKod(""); setTur("yuzde"); setDeger(""); setAciklama("");
    setMaxKullanim(""); setSonKullanma(""); setPlanKisiti("hepsi");
  }

  async function olustur() {
    if (!gecerli) return;
    setGonderiliyor(true);
    const res = await fetch("/api/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kod,
        tur,
        deger: degerNum,
        aciklama,
        maxKullanim: maxKullanim.trim() === "" ? null : Number(maxKullanim),
        sonKullanma: sonKullanma || null,
        planKisiti,
      }),
    });
    setGonderiliyor(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.promo) {
      sifirla();
      eklendi(data.promo);
    } else {
      goster({ tip: "hata", baslik: "Oluşturulamadı", aciklama: data.error ?? "" });
    }
  }

  return (
    <Modal
      acik={acik}
      kapat={() => {
        sifirla();
        kapat();
      }}
      baslik="Yeni promo kodu"
      aciklama="İndirim kuponu oluştur — checkout'ta hemen kullanılabilir."
      genislik="max-w-lg"
    >
      <div className="space-y-4">
        <Alan etiket="Kod">
          <Girdi
            value={kod}
            onChange={(e) => setKod(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 24))}
            placeholder="LANSMAN30"
            className="font-mono uppercase"
          />
          {kod && !/^[A-Z0-9]{3,24}$/.test(kod) && (
            <span className="mt-1 block text-[12px] text-red-600">Kod 3-24 karakter, yalnızca harf/rakam.</span>
          )}
        </Alan>

        <div className="grid grid-cols-2 gap-3">
          <Alan etiket="İndirim türü">
            <Secim value={tur} onChange={(e) => setTur(e.target.value as PromoTur)}>
              <option value="yuzde">Yüzde (%)</option>
              <option value="sabit">Sabit tutar (₺)</option>
            </Secim>
          </Alan>
          <Alan etiket={tur === "yuzde" ? "Yüzde (1-100)" : "Tutar (₺)"}>
            <Girdi
              value={deger}
              onChange={(e) => setDeger(e.target.value.replace(/[^\d]/g, "").slice(0, tur === "yuzde" ? 3 : 6))}
              placeholder={tur === "yuzde" ? "30" : "50"}
              inputMode="numeric"
              className="num"
            />
            {tur === "yuzde" && degerNum > 100 && (
              <span className="mt-1 block text-[12px] text-red-600">Yüzde 100&apos;ü aşamaz.</span>
            )}
          </Alan>
        </div>

        <Alan etiket="Açıklama" opsiyonel>
          <Alan2
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value.slice(0, 120))}
            placeholder="Lansman kampanyası — tüm planlarda geçerli"
            rows={2}
          />
        </Alan>

        <div className="grid grid-cols-2 gap-3">
          <Alan etiket="Maks. kullanım" opsiyonel>
            <Girdi
              value={maxKullanim}
              onChange={(e) => setMaxKullanim(e.target.value.replace(/[^\d]/g, "").slice(0, 7))}
              placeholder="Sınırsız"
              inputMode="numeric"
              className="num"
            />
          </Alan>
          <Alan etiket="Son kullanma" opsiyonel>
            <Girdi type="date" value={sonKullanma} onChange={(e) => setSonKullanma(e.target.value)} />
          </Alan>
        </div>

        <Alan etiket="Plan kısıtı">
          <Secim value={planKisiti} onChange={(e) => setPlanKisiti(e.target.value as "hepsi" | Plan)}>
            <option value="hepsi">Tüm planlar</option>
            <option value="free">Yalnızca Free</option>
            <option value="pro">Yalnızca Pro</option>
            <option value="scale">Yalnızca Scale</option>
          </Secim>
        </Alan>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="outline"
            onClick={() => {
              sifirla();
              kapat();
            }}
          >
            İptal
          </Button>
          <Button disabled={!gecerli || gonderiliyor} onClick={olustur}>
            {gonderiliyor ? "Oluşturuluyor…" : "Kod oluştur"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
