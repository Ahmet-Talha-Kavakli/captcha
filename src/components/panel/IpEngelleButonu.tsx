"use client";

/**
 * IpEngelleButonu — Dashboard drill-down'larından GERÇEK savunma aksiyonu.
 * ======================================================================
 * Bir saldırgan IP'sini tek tıkla kural motoruna engel kuralı olarak ekler
 * (POST /api/rules, field=ip op=eq action=block). Panel'i pasif göstergeden
 * AKTİF savunma konsoluna çevirir: analist bir tehdidi görür → tek tıkla
 * gerçekten engeller → kural motoru bir sonraki istekte enforce eder.
 *
 * siteId null ise (aktif site yok) buton hiç render edilmez.
 */

import { useState } from "react";
import { Ban, Check, Undo2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function IpEngelleButonu({
  ip,
  siteId,
  aciklama,
  boyut = "md",
}: {
  ip: string;
  siteId: string | null;
  /** Kural açıklaması (nereden engellendiği). */
  aciklama?: string;
  boyut?: "sm" | "md";
}) {
  const [durum, setDurum] = useState<"bos" | "gonderiliyor" | "engellendi" | "hata" | "geri_aliniyor">("bos");
  // Engelleme başarılıysa oluşan kural id'si — geri almak (kaldırmak) için.
  const [kuralId, setKuralId] = useState<string | null>(null);

  if (!siteId) return null;

  const engelle = async () => {
    if (durum === "gonderiliyor" || durum === "engellendi") return;
    setDurum("gonderiliyor");
    try {
      const r = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          name: `Engel: ${ip}`,
          description: aciklama || `Panel'den engellendi — ${ip}`,
          field: "ip",
          op: "eq",
          value: ip,
          action: "block",
          priority: 1,
        }),
      });
      if (r.ok) {
        const data = await r.json().catch(() => ({}));
        setKuralId(data.rule?.id ?? null);
        setDurum("engellendi");
      } else {
        setDurum("hata");
      }
    } catch {
      setDurum("hata");
    }
  };

  // Geri al: oluşan block kuralını sil (yanlış engelleme düzeltme).
  const geriAl = async () => {
    if (!kuralId || durum === "geri_aliniyor") return;
    setDurum("geri_aliniyor");
    try {
      const r = await fetch(`/api/rules/${kuralId}`, { method: "DELETE" });
      if (r.ok) {
        setKuralId(null);
        setDurum("bos"); // tekrar engellenebilir
      } else {
        setDurum("engellendi"); // silinemedi, engel duruyor
      }
    } catch {
      setDurum("engellendi");
    }
  };

  const kucuk = boyut === "sm";
  const ikonBoy = kucuk ? "size-3" : "size-3.5";

  // Engellendi → yeşil rozet + "Geri al" seçeneği.
  if (durum === "engellendi" || durum === "geri_aliniyor") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className={cn(
          "inline-flex items-center gap-1.5 rounded-lg font-semibold bg-ok-soft text-green-700 ring-1 ring-inset ring-green-300",
          kucuk ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-[12px]",
        )}>
          <Check className={ikonBoy} /> Engellendi
        </span>
        <button
          type="button"
          onClick={geriAl}
          disabled={durum === "geri_aliniyor" || !kuralId}
          aria-label={`${ip} engelini geri al`}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg font-medium text-slate-muted ring-1 ring-inset ring-line transition hover:bg-canvas hover:text-slate-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
            kucuk ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-[12px]",
            durum === "geri_aliniyor" && "cursor-wait opacity-70",
          )}
        >
          <Undo2 className={ikonBoy} /> {durum === "geri_aliniyor" ? "Geri alınıyor…" : "Geri al"}
        </button>
        {durum === "engellendi" && <span className="text-[11px] text-green-700">Kural motoruna eklendi.</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={engelle}
        disabled={durum === "gonderiliyor"}
        aria-label={`${ip} adresini engelle`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
          kucuk ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-[12px]",
          durum === "gonderiliyor" && "cursor-wait opacity-70",
        )}
      >
        {durum === "gonderiliyor" ? (
          <><Ban className={cn(ikonBoy, "animate-pulse")} /> Engelleniyor…</>
        ) : (
          <><Ban className={ikonBoy} /> IP&apos;yi engelle</>
        )}
      </button>
      {durum === "hata" && (
        <span className="text-[11px] text-red-700">Eklenemedi, tekrar deneyin.</span>
      )}
    </span>
  );
}
