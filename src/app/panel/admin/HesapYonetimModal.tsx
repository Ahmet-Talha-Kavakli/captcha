"use client";

/**
 * Platform yönetici — Hesap Yönetim Modalı (GERÇEK işlemler).
 * ==========================================================
 * `/api/admin` (platform-admin korumalı) üzerinden GERÇEK DB mutasyonu yapar:
 * plan değiştir, rol değiştir, askıya al/aktifleştir, kredi ekle/çıkar, staff
 * ata, hesabı sil. Her işlem denetim defterine yazılır. localStorage/sahte YOK.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  CreditCard,
  ShieldCheck,
  Ban,
  Play,
  Coins,
  Star,
  Trash2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/panel/kit";
import type { Plan, Role } from "@/lib/db/schema";
import type { HesapSatir } from "./AdminIstemci";

const PLANLAR: { deger: Plan; ad: string }[] = [
  { deger: "free", ad: "Ücretsiz" },
  { deger: "pro", ad: "Pro" },
  { deger: "scale", ad: "Scale" },
];
const ROLLER: { deger: Role; ad: string }[] = [
  { deger: "owner", ad: "Sahip" },
  { deger: "admin", ad: "Yönetici" },
  { deger: "analyst", ad: "Analist" },
  { deger: "viewer", ad: "İzleyici" },
];

export function HesapYonetimModal({
  hesap,
  kapat,
}: {
  hesap: HesapSatir;
  kapat: () => void;
}) {
  const router = useRouter();
  const { goster } = useToast();
  const [mesgul, setMesgul] = useState<string | null>(null);
  const [krediMiktar, setKrediMiktar] = useState("");
  const [silOnay, setSilOnay] = useState(false);

  async function calistir(action: string, ekstra: Record<string, unknown>, basari: string) {
    setMesgul(action);
    try {
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, uid: hesap.id, ...ekstra }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        goster({ tip: "hata", baslik: "İşlem başarısız", aciklama: j.error || "Bilinmeyen hata." });
        return false;
      }
      goster({ tip: "basari", baslik: basari });
      router.refresh(); // sunucu verisini tazele (tablo güncellensin)
      return true;
    } catch {
      goster({ tip: "hata", baslik: "Ağ hatası", aciklama: "İşlem gönderilemedi." });
      return false;
    } finally {
      setMesgul(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/40 p-4"
      onClick={kapat}
      role="dialog"
      aria-modal="true"
      aria-label={`${hesap.ad} hesap yönetimi`}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold text-slate-ink">{hesap.ad}</h2>
            <p className="truncate text-[12px] text-slate-faint">{hesap.email}</p>
          </div>
          <button
            type="button"
            onClick={kapat}
            aria-label="Kapat"
            className="rounded-lg p-1.5 text-slate-faint transition hover:bg-canvas hover:text-slate-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-4">
          {/* Plan */}
          <Bolum ikon={CreditCard} baslik="Abonelik planı">
            <div className="flex flex-wrap gap-2">
              {PLANLAR.map((p) => (
                <button
                  key={p.deger}
                  type="button"
                  disabled={mesgul !== null}
                  onClick={() => calistir("setPlan", { plan: p.deger }, `Plan "${p.ad}" olarak ayarlandı`)}
                  className={secimSinif(hesap.plan === p.deger)}
                >
                  {p.ad}
                </button>
              ))}
            </div>
          </Bolum>

          {/* Rol */}
          <Bolum ikon={ShieldCheck} baslik="Rol">
            <div className="flex flex-wrap gap-2">
              {ROLLER.map((r) => (
                <button
                  key={r.deger}
                  type="button"
                  disabled={mesgul !== null}
                  onClick={() => calistir("setRole", { role: r.deger }, `Rol "${r.ad}" olarak ayarlandı`)}
                  className={secimSinif(hesap.rol === r.deger)}
                >
                  {r.ad}
                </button>
              ))}
            </div>
          </Bolum>

          {/* Kredi ekle/çıkar */}
          <Bolum ikon={Coins} baslik={`Kredi (bakiye: ${hesap.krediBakiye.toLocaleString("tr-TR")})`}>
            <div className="flex gap-2">
              <input
                type="number"
                value={krediMiktar}
                onChange={(e) => setKrediMiktar(e.target.value)}
                placeholder="örn. 500 veya -100"
                className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 py-1.5 text-[13px] text-slate-ink outline-none focus:border-brand-400"
              />
              <button
                type="button"
                disabled={mesgul !== null || !krediMiktar || Number(krediMiktar) === 0}
                onClick={async () => {
                  const ok = await calistir("addKredi", { miktar: Number(krediMiktar) }, "Kredi güncellendi");
                  if (ok) setKrediMiktar("");
                }}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-[13px] font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                Uygula
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-faint">Pozitif ekler, negatif düşürür (bonus hareketi).</p>
          </Bolum>

          {/* Hesap durumu + staff */}
          <Bolum ikon={Ban} baslik="Hesap durumu">
            <div className="flex flex-wrap gap-2">
              {hesap.hesapDurumu === "suspended" ? (
                <button
                  type="button"
                  disabled={mesgul !== null}
                  onClick={() => calistir("activate", {}, "Hesap yeniden aktifleştirildi")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-ok-soft px-3 py-1.5 text-[13px] font-medium text-green-700 transition hover:bg-green-100 disabled:opacity-50"
                >
                  <Play className="size-3.5" /> Aktifleştir
                </button>
              ) : (
                <button
                  type="button"
                  disabled={mesgul !== null}
                  onClick={() =>
                    calistir("suspend", { neden: "Yönetici tarafından askıya alındı" }, "Hesap askıya alındı")
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[13px] font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                >
                  <Ban className="size-3.5" /> Askıya al
                </button>
              )}
              <button
                type="button"
                disabled={mesgul !== null}
                onClick={() =>
                  calistir(
                    "setStaff",
                    { deger: !hesap.platformAdmin },
                    hesap.platformAdmin ? "Staff yetkisi kaldırıldı" : "Staff yetkisi verildi",
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-1.5 text-[13px] font-medium text-slate-ink transition hover:border-brand-300 disabled:opacity-50"
              >
                <Star className={`size-3.5 ${hesap.platformAdmin ? "fill-amber-400 text-amber-500" : ""}`} />
                {hesap.platformAdmin ? "Staff'ı kaldır" : "Staff yap"}
              </button>
            </div>
          </Bolum>

          {/* Tehlikeli: sil */}
          <Bolum ikon={Trash2} baslik="Tehlikeli bölge">
            {!silOnay ? (
              <button
                type="button"
                onClick={() => setSilOnay(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-danger-soft/40 px-3 py-1.5 text-[13px] font-medium text-danger2 transition hover:bg-red-100"
              >
                <Trash2 className="size-3.5" /> Hesabı sil
              </button>
            ) : (
              <div className="rounded-lg border border-red-200 bg-danger-soft/30 p-3">
                <p className="text-[12.5px] text-slate-ink">
                  <span className="font-semibold text-danger2">{hesap.email}</span> ve tüm verisi kalıcı
                  silinecek. Bu geri alınamaz.
                </p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    type="button"
                    disabled={mesgul !== null}
                    onClick={async () => {
                      const ok = await calistir("deleteUser", {}, "Hesap silindi");
                      if (ok) kapat();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-danger2 px-3 py-1.5 text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {mesgul === "deleteUser" ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    Evet, kalıcı sil
                  </button>
                  <button
                    type="button"
                    onClick={() => setSilOnay(false)}
                    className="rounded-lg border border-line bg-canvas px-3 py-1.5 text-[13px] font-medium text-slate-ink transition hover:bg-surface"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            )}
          </Bolum>
        </div>
      </div>
    </div>
  );
}

function Bolum({ ikon: Ikon, baslik, children }: { ikon: React.ElementType; baslik: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
        <Ikon className="size-3.5" />
        {baslik}
      </div>
      {children}
    </div>
  );
}

function secimSinif(aktif: boolean): string {
  return aktif
    ? "rounded-lg border border-brand-400 bg-brand-50 px-3 py-1.5 text-[13px] font-semibold text-brand-700"
    : "rounded-lg border border-line bg-canvas px-3 py-1.5 text-[13px] font-medium text-slate-ink transition hover:border-brand-300 disabled:opacity-50";
}
