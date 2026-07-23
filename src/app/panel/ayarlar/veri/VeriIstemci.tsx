"use client";

import { useState, useRef } from "react";
import { Download, Upload, Database, ShieldCheck, FileJson, Check, AlertTriangle, Mail, ExternalLink } from "lucide-react";
import { Panel, StatKart, useToast, NotKutusu } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";

interface Kapsam { site: number; kural: number; ekip: number; entegrasyon: number; webhook: number; deney: number }

export function VeriIstemci({ kapsam }: { kapsam: Kapsam }) {
  const { goster } = useToast();
  const [indiriliyor, setIndiriliyor] = useState(false);
  const [onizleme, setOnizleme] = useState<{ site: number; kural: number; entegrasyon: number } | null>(null);
  const [dosyaAd, setDosyaAd] = useState("");
  const [yedekVeri, setYedekVeri] = useState<unknown>(null); // doğrulanmış ham yedek
  const [geriYukleniyor, setGeriYukleniyor] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);

  async function geriYukle() {
    if (!yedekVeri) return;
    setGeriYukleniyor(true);
    try {
      const res = await fetch("/api/backup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(yedekVeri),
      });
      const d = await res.json();
      if (d.ok) {
        goster({
          tip: "basari",
          baslik: "Geri yükleme tamamlandı",
          aciklama: `${d.geriYuklenen.kural} kural + ${d.geriYuklenen.aiPolitika} AI politikası eklendi.`,
        });
        setOnizleme(null);
        setYedekVeri(null);
        setDosyaAd("");
      } else {
        goster({ tip: "hata", baslik: "Geri yüklenemedi", aciklama: d.hata });
      }
    } catch {
      goster({ tip: "hata", baslik: "Ağ hatası", aciklama: "Geri yükleme gönderilemedi." });
    } finally {
      setGeriYukleniyor(false);
    }
  }

  async function disaAktar() {
    setIndiriliyor(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `specter-yedek-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      goster({ tip: "basari", baslik: "Yedek indirildi" });
    } catch {
      goster({ tip: "hata", baslik: "Yedek oluşturulamadı" });
    }
    setIndiriliyor(false);
  }

  async function dosyaSec(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setDosyaAd(f.name);
    try {
      const metin = await f.text();
      const veri = JSON.parse(metin);
      const res = await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(veri) });
      const d = await res.json();
      if (d.gecerli) {
        setOnizleme(d.ozet);
        setYedekVeri(veri); // gerçek geri yükleme için ham yedeği sakla
        goster({ tip: "basari", baslik: "Yedek doğrulandı" });
      } else {
        setOnizleme(null);
        setYedekVeri(null);
        goster({ tip: "hata", baslik: "Geçersiz yedek", aciklama: d.hata });
      }
    } catch {
      goster({ tip: "hata", baslik: "Dosya okunamadı — geçerli bir JSON değil" });
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Database className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">Yapılandırmanı yedekle ve taşı.</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            Sitelerin, kuralların, ekibin ve entegrasyonların taşınabilir bir JSON dosyasına aktarılır. Sırlar (secret anahtarlar) güvenlik için maskelenir.
          </p>
        </div>
      </div>

      {/* kapsam */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={kapsam.site} etiket="Site" />
        <StatKart sayi={kapsam.kural} etiket="Kural" />
        <StatKart sayi={kapsam.entegrasyon} etiket="Entegrasyon" />
        <StatKart sayi={kapsam.webhook} etiket="Webhook" />
      </div>

      {/* dışa aktar */}
      <Panel baslik="Yapılandırmayı dışa aktar">
        <p className="mb-4 text-sm text-slate-muted">
          Tüm hesap yapılandırmanı tek bir JSON dosyasına indir. Yeni bir ortama taşımak, yedeklemek veya KVKK/GDPR veri taşınabilirliği için kullan.
        </p>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-canvas/40 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><FileJson className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-slate-ink">specter-yedek-{new Date().toISOString().slice(0, 10)}.json</div>
            <div className="text-[12px] text-slate-muted">{kapsam.site} site · {kapsam.kural} kural · {kapsam.entegrasyon} entegrasyon · {kapsam.webhook} webhook · {kapsam.deney} deney</div>
          </div>
          <Button onClick={disaAktar} disabled={indiriliyor}><Download className="size-4" /> {indiriliyor ? "Hazırlanıyor…" : "İndir"}</Button>
        </div>
      </Panel>

      {/* haftalık e-posta özeti */}
      <Panel baslik="Haftalık e-posta özeti">
        <p className="mb-4 text-sm text-slate-muted">
          Her hafta sitelerinin güvenlik durumunu (engellenen tehdit, AI ajan trafiği, kampanyalar, koruma skoru) e-posta ile al. Aşağıdan bu haftanın özetini önizle.
        </p>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-canvas/40 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Mail className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-slate-ink">Güvenlik özeti</div>
            <div className="text-[12px] text-slate-muted">Gerçek verilerinle üretilen haftalık HTML e-posta önizlemesi.</div>
          </div>
          <Button variant="outline" onClick={() => window.open("/api/digest", "_blank")}><ExternalLink className="size-4" /> Önizle</Button>
        </div>
      </Panel>

      {/* içe aktar / geri yükle */}
      <Panel baslik="Yedekten geri yükle">
        <p className="mb-4 text-sm text-slate-muted">
          Daha önce aldığın bir yedeği yükleyip doğrula. Güvenlik için geri yükleme önce bir önizleme gösterir; mevcut veriler otomatik silinmez.
        </p>
        <input ref={dosyaRef} type="file" accept="application/json,.json" onChange={dosyaSec} className="hidden" aria-label="Yedek dosyası seç" />
        <button onClick={() => dosyaRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong bg-canvas/30 px-6 py-8 text-center transition hover:border-brand-300 hover:bg-brand-50/30">
          <Upload className="size-7 text-slate-faint" />
          <span className="text-[14px] font-medium text-slate-ink">{dosyaAd || "Yedek dosyasını seç veya sürükle"}</span>
          <span className="text-[12px] text-slate-faint">.json biçiminde Veylify yedeği</span>
        </button>

        {onizleme && (
          <div className="mt-4">
            <NotKutusu ton="yesil" baslik="Yedek geçerli — geri yüklenmeye hazır">
              <div className="mt-1 flex flex-wrap gap-4 text-[13px]">
                <span className="flex items-center gap-1.5"><Check className="size-3.5" /> {onizleme.site} site</span>
                <span className="flex items-center gap-1.5"><Check className="size-3.5" /> {onizleme.kural} kural</span>
                <span className="flex items-center gap-1.5"><Check className="size-3.5" /> {onizleme.entegrasyon} entegrasyon</span>
              </div>
              <div className="mt-3 flex items-start gap-2 text-[12px] text-slate-muted">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                <span>
                  Geri yükleme <strong>güvenlidir</strong>: mevcut veriler SİLİNMEZ, yedekteki
                  kurallar ve AI politikaları EKLENİR. Siteler ve webhooklar (gizli anahtarları
                  maskeli olduğu için) geri yüklenmez — onları elle yeniden eklemelisin.
                </span>
              </div>
              <Button
                variant="danger"
                size="sm"
                className="mt-3"
                onClick={geriYukle}
                disabled={geriYukleniyor}
              >
                <ShieldCheck className="size-4" />
                {geriYukleniyor ? "Geri yükleniyor…" : "Geri yüklemeyi onayla"}
              </Button>
            </NotKutusu>
          </div>
        )}
      </Panel>
    </div>
  );
}
