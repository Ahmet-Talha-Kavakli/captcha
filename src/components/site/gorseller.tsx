"use client";

/**
 * Landing görselleri — hepsi elle çizilmiş, offline, keskin SVG.
 * Beyaz tema + Veylify indigo/violet marka rengi. Foto-gerçekçi görsel
 * yerine premium vektör illüstrasyon dili (Stripe/Linear kalitesinde).
 */

/* ---------------------------------------------------- Hero: koruma sahnesi
 * İnsan trafiği geçer (yeşil), AI botları kalkanda durur (kırmızı). Sağda
 * canlı bir "karar akışı" görseli — ürünün ne yaptığını tek bakışta anlatır. */
export function HeroGorsel() {
  return (
    <div className="relative">
      {/* zemin ışıması */}
      <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-veylify-100/60 via-violet-100/40 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-3xl border border-veylify-100 bg-white shadow-[0_30px_80px_-30px_rgba(79,70,229,0.35)]">
        {/* pencere çubuğu */}
        <div className="flex items-center gap-2 border-b border-veylify-100/70 bg-veylify-50/50 px-4 py-3">
          <span className="size-3 rounded-full bg-red-300" />
          <span className="size-3 rounded-full bg-amber-300" />
          <span className="size-3 rounded-full bg-emerald-300" />
          <span className="ml-3 rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-veylify-100">
            veylify.com/panel
          </span>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-[1.1fr_1fr]">
          {/* sol: gerçek-zamanlı karar akışı */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-veylify-950">Canlı karar akışı</span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                canlı
              </span>
            </div>
            {[
              { ip: "91.10.4.18", tur: "İnsan", karar: "izin", renk: "emerald" },
              { ip: "GPTBot", tur: "AI ajan", karar: "engel", renk: "red" },
              { ip: "45.2.9.71", tur: "İnsan", karar: "izin", renk: "emerald" },
              { ip: "ClaudeBot", tur: "AI ajan", karar: "engel", renk: "red" },
              { ip: "Scrapy/2.11", tur: "Kazıyıcı", karar: "engel", renk: "red" },
              { ip: "77.8.1.30", tur: "İnsan", karar: "izin", renk: "emerald" },
            ].map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-xl border border-veylify-100/80 bg-white px-3 py-2 text-[11.5px]"
                style={{ animation: `zn-slide-in 0.5s ${i * 0.08}s both` }}
              >
                <span className={`size-2 shrink-0 rounded-full ${r.renk === "emerald" ? "bg-emerald-500" : "bg-red-500"}`} />
                <span className="font-mono font-medium text-veylify-950">{r.ip}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{r.tur}</span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    r.renk === "emerald"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {r.karar === "izin" ? "İzin verildi" : "Engellendi"}
                </span>
              </div>
            ))}
          </div>
          {/* sağ: özet metrik + mini kalkan */}
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-veylify-100 bg-gradient-to-br from-veylify-600 to-violet-600 p-4 text-white">
              <div className="text-[11px] font-medium text-white/70">Bugün engellenen bot</div>
              <div className="mt-1 text-3xl font-bold tabular-nums">12.480</div>
              <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-white/80">
                <span className="rounded-full bg-white/20 px-1.5 py-0.5">↑ %18</span>
                <span>dünden</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat etiket="İnsan geçti" deger="%99.4" ton="ok" />
              <MiniStat etiket="Yanıt süresi" deger="48ms" ton="brand" />
            </div>
            <MiniSparkKart />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ etiket, deger, ton }: { etiket: string; deger: string; ton: "ok" | "brand" }) {
  return (
    <div className="rounded-2xl border border-veylify-100 bg-white p-3">
      <div className="text-[10.5px] font-medium text-slate-400">{etiket}</div>
      <div
        className={`mt-0.5 text-lg font-bold tabular-nums ${
          ton === "ok" ? "text-emerald-600" : "text-veylify-600"
        }`}
      >
        {deger}
      </div>
    </div>
  );
}

function MiniSparkKart() {
  return (
    <div className="rounded-2xl border border-veylify-100 bg-white p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10.5px] font-medium text-slate-400">24 saat trafiği</span>
        <span className="text-[10px] font-semibold text-veylify-600">insan / bot</span>
      </div>
      <div className="flex h-10 items-end gap-1">
        {[40, 55, 45, 70, 60, 80, 65, 90, 75, 95, 85, 100].map((h, i) => (
          <div key={i} className="flex-1 overflow-hidden rounded-sm bg-veylify-100">
            <div
              className="w-full rounded-sm bg-gradient-to-t from-veylify-600 to-violet-500"
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------- Ghost-font demo görseli
 * "İnsan görür, makine göremez" — tek karede gürültü, hareket koheransıyla okunur.
 * Statik SVG olduğu için burada iki kare yan yana: makinenin gördüğü (gürültü) vs
 * insanın algıladığı (net kod). */
export function GhostFontGorsel() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* makine görüşü — gürültü */}
      <div className="rounded-2xl border border-veylify-100 bg-veylify-950 p-5">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-red-300">
          <span className="size-1.5 rounded-full bg-red-400" /> Makinenin gördüğü
        </div>
        <div className="grid grid-cols-12 gap-[3px]">
          {Array.from({ length: 96 }).map((_, i) => (
            <span
              key={i}
              className="aspect-square rounded-[1px]"
              style={{ background: `rgba(199,210,254,${0.08 + ((i * 37) % 20) / 60})` }}
            />
          ))}
        </div>
        <div className="mt-3 text-center text-[11px] font-medium text-red-300/80">
          OCR sonucu: okunamadı ✕
        </div>
      </div>
      {/* insan görüşü — net */}
      <div className="rounded-2xl border border-veylify-100 bg-veylify-950 p-5">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-400" /> İnsanın gördüğü
        </div>
        <div className="flex h-[132px] items-center justify-center rounded-xl bg-veylify-900">
          <span className="font-mono text-4xl font-bold tracking-[0.25em] text-veylify-100">
            7K4Q
          </span>
        </div>
        <div className="mt-3 text-center text-[11px] font-medium text-emerald-300/80">
          İnsan doğrulaması: geçti ✓
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------- Dekoratif ızgara arka plan */
export function IzgaraArka({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 -z-10 h-full w-full ${className}`}
      aria-hidden
    >
      <defs>
        <pattern id="zn-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0H0V48" fill="none" stroke="#e0e7ff" strokeWidth="1" />
        </pattern>
        <radialGradient id="zn-fade" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#zn-grid)" />
      <rect width="100%" height="100%" fill="url(#zn-fade)" />
    </svg>
  );
}
