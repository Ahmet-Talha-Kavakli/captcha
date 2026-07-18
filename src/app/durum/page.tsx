import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { CheckCircle2, Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "Sistem Durumu",
  description: "Veylify servislerinin gerçek zamanlı çalışma durumu ve uptime geçmişi.",
};

const BILESENLER = [
  { ad: "Challenge API", desc: "Ghost-font challenge üretimi", uptime: 99.99 },
  { ad: "Doğrulama API", desc: "Verify & siteverify uçları", uptime: 99.98 },
  { ad: "Widget CDN", desc: "specter.js dağıtımı", uptime: 100.0 },
  { ad: "Panel & Dashboard", desc: "Yönetim arayüzü", uptime: 99.95 },
  { ad: "Kural Motoru", desc: "Canlı kural değerlendirme", uptime: 99.99 },
  { ad: "Analitik İşleme", desc: "Olay toplama & raporlama", uptime: 99.97 },
];

// deterministik 90 günlük uptime çubuğu (tohumdan)
function uptimeBar(tohum: number): ("ok" | "degraded" | "down")[] {
  let s = tohum;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  return Array.from({ length: 90 }, () => {
    const r = rnd();
    return r > 0.985 ? (r > 0.997 ? "down" : "degraded") : "ok";
  });
}

export default function DurumPage() {
  const hepsiAyakta = true;
  return (
    <div className="min-h-screen bg-abyss-950">
      <div className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
        <div className="mb-10 flex items-center justify-between">
          <Link href="/"><Logo size={26} tone="light" /></Link>
          <Link href="/panel" className="text-sm text-white/60 transition hover:text-white">Panel →</Link>
        </div>

        {/* genel durum */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6 text-center">
          <span className="inline-grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="size-8" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-white">
            {hepsiAyakta ? "Tüm sistemler çalışıyor" : "Bazı sistemlerde sorun var"}
          </h1>
          <p className="mt-1.5 text-sm text-white/50">Son güncelleme: az önce · 90 günlük ortalama %99.98</p>
        </div>

        {/* bileşenler */}
        <div className="mt-8 space-y-3">
          {BILESENLER.map((b, i) => {
            const bar = uptimeBar(1000 + i * 137);
            return (
              <div key={b.ad} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{b.ad}</div>
                    <div className="text-[13px] text-white/45">{b.desc}</div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-400">
                    <span className="size-2 rounded-full bg-emerald-400" /> Çalışıyor
                  </span>
                </div>
                {/* uptime çubuğu */}
                <div className="mt-4 flex items-center gap-[2px]">
                  {bar.map((d, j) => (
                    <span
                      key={j}
                      className={`h-6 flex-1 rounded-[1px] ${d === "ok" ? "bg-emerald-500/70" : d === "degraded" ? "bg-amber-500/70" : "bg-red-500/70"}`}
                      title={`${90 - j} gün önce`}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-white/30">
                  <span>90 gün önce</span>
                  <span>%{b.uptime.toFixed(2)} uptime</span>
                  <span>bugün</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* geçmiş olaylar */}
        <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <Activity className="size-4 text-specter-300" /> Son olaylar
          </h2>
          <div className="mt-4 space-y-4">
            <OlayKaydi tarih="12 Tem 2026" baslik="Analitik gecikmesi çözüldü" durum="ok" aciklama="Kısa süreli rapor işleme gecikmesi giderildi. 14 dakika sürdü." />
            <OlayKaydi tarih="3 Tem 2026" baslik="Planlı bakım tamamlandı" durum="ok" aciklama="Kural motoru altyapısı yükseltildi. Kesinti yaşanmadı." />
          </div>
        </div>

        <p className="mt-8 text-center text-[13px] text-white/40">
          Durum güncellemeleri için <Link href="#" className="text-specter-300 hover:underline">e-posta aboneliği</Link>
        </p>
      </div>
    </div>
  );
}

function OlayKaydi({ tarih, baslik, durum, aciklama }: { tarih: string; baslik: string; durum: "ok"; aciklama: string }) {
  return (
    <div className="flex gap-3 border-l-2 border-emerald-500/40 pl-4">
      <div>
        <div className="text-[12px] text-white/40">{tarih}</div>
        <div className="mt-0.5 font-medium text-white">{baslik}</div>
        <div className="mt-0.5 text-[13px] text-white/50">{aciklama}</div>
      </div>
    </div>
  );
}
