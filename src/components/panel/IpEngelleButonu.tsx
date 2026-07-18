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
import { Ban, Check } from "lucide-react";
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
  const [durum, setDurum] = useState<"bos" | "gonderiliyor" | "engellendi" | "hata">("bos");

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
      setDurum(r.ok ? "engellendi" : "hata");
    } catch {
      setDurum("hata");
    }
  };

  const kucuk = boyut === "sm";

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={engelle}
        disabled={durum === "gonderiliyor" || durum === "engellendi"}
        aria-label={`${ip} adresini engelle`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          kucuk ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-[12px]",
          durum === "engellendi"
            ? "cursor-default bg-ok-soft text-green-700 ring-1 ring-inset ring-green-300"
            : "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
          durum === "gonderiliyor" && "cursor-wait opacity-70",
        )}
      >
        {durum === "engellendi" ? (
          <><Check className={kucuk ? "size-3" : "size-3.5"} /> Engellendi</>
        ) : durum === "gonderiliyor" ? (
          <><Ban className={cn(kucuk ? "size-3" : "size-3.5", "animate-pulse")} /> Engelleniyor…</>
        ) : (
          <><Ban className={kucuk ? "size-3" : "size-3.5"} /> IP&apos;yi engelle</>
        )}
      </button>
      {durum === "engellendi" && (
        <span className="text-[11px] text-green-700">Kural motoruna eklendi.</span>
      )}
      {durum === "hata" && (
        <span className="text-[11px] text-red-700">Eklenemedi, tekrar deneyin.</span>
      )}
    </span>
  );
}
