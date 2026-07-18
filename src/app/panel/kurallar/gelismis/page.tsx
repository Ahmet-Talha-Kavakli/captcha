import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Sites } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { GelismisKuralIstemci } from "./GelismisKuralIstemci";

export const metadata: Metadata = { title: "Gelişmiş kural oluşturucu — Veylify" };

/**
 * Gelişmiş Kural Oluşturucu (sunucu sayfası)
 * ==========================================
 * VE/VEYA koşul ağacı editörü. Kullanıcının sitelerini yükleyip istemci
 * bileşenine geçirir; asıl görsel oluşturucu client tarafında çalışır.
 */
export default async function GelismisKuralPage() {
  const user = await currentUser();
  if (!user) return null;

  // Yalnızca ad + id geçir (client'a minimum veri).
  const siteler = Sites.forOwner(user.id).map((s) => ({ id: s.id, name: s.name }));

  return (
    <>
      <PanelUst
        kirintilar={[{ ad: "Kurallar", href: "/panel/kurallar" }, { ad: "Gelişmiş oluşturucu" }]}
        baslik="Gelişmiş kural oluşturucu"
      />
      <GelismisKuralIstemci siteler={siteler} />
    </>
  );
}
