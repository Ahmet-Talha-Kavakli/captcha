"use client";

/**
 * KumeEngelleButonu — bir botnet KÜMESİNİN tüm IP'lerini tek tıkla engeller.
 * ========================================================================
 * İlişki grafiği bir botnet'i (aynı fingerprint/ASN'i paylaşan çok IP) tek
 * "düşman" olarak gösterir. Bu buton kümenin HER IP'sine kural motoruna bir
 * block kuralı ekler (POST /api/rules). Tek IP değil — tüm ağı bir kerede.
 *
 * siteId null ise (aktif site yok) render edilmez. Zaten engelli IP'ler
 * atlanır (engelliSet). Sonuç: "N IP engellendi" özeti.
 */

import { useState } from "react";
import { Ban, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function KumeEngelleButonu({
  ipler,
  siteId,
  engelliSet,
  aciklama,
}: {
  ipler: string[];
  siteId: string | null;
  /** Halihazırda engelli IP'ler (tekrar engellenmez). */
  engelliSet?: Set<string>;
  aciklama?: string;
}) {
  const [durum, setDurum] = useState<"bos" | "gonderiliyor" | "bitti" | "hata">("bos");
  const [engellenen, setEngellenen] = useState(0);

  if (!siteId) return null;

  // Zaten engelli olmayan benzersiz IP'ler.
  const hedefler = [...new Set(ipler)].filter((ip) => !(engelliSet?.has(ip)));
  if (hedefler.length === 0 && durum === "bos") return null;

  const engelle = async () => {
    if (durum === "gonderiliyor" || durum === "bitti") return;
    setDurum("gonderiliyor");
    let ok = 0;
    for (const ip of hedefler) {
      try {
        const r = await fetch("/api/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId,
            name: `Engel: ${ip}`,
            description: aciklama || `Botnet kümesinden toplu engellendi — ${ip}`,
            field: "ip",
            op: "eq",
            value: ip,
            action: "block",
            priority: 1,
          }),
        });
        if (r.ok) ok += 1;
      } catch { /* tek IP hatası tümünü durdurmasın */ }
    }
    setEngellenen(ok);
    setDurum(ok > 0 ? "bitti" : "hata");
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={engelle}
        disabled={durum === "gonderiliyor" || durum === "bitti"}
        aria-label={`Botnet kümesinin ${hedefler.length} IP'sini engelle`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          durum === "bitti"
            ? "cursor-default bg-ok-soft text-green-700 ring-1 ring-inset ring-green-300"
            : "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
          durum === "gonderiliyor" && "cursor-wait opacity-70",
        )}
      >
        {durum === "bitti" ? (
          <><Check className="size-3.5" /> {engellenen} IP engellendi</>
        ) : durum === "gonderiliyor" ? (
          <><Loader2 className="size-3.5 animate-spin" /> Engelleniyor…</>
        ) : (
          <><Ban className="size-3.5" /> Tüm kümeyi engelle ({hedefler.length} IP)</>
        )}
      </button>
      {durum === "bitti" && (
        <span className="text-[11px] text-green-700">Kümenin tüm IP'leri kural motoruna eklendi.</span>
      )}
      {durum === "hata" && (
        <span className="text-[11px] text-red-700">Engellenemedi, tekrar deneyin.</span>
      )}
    </span>
  );
}
