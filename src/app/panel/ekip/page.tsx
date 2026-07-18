import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Team, Audit } from "@/lib/db/db";
import { PanelUst } from "@/components/panel/PanelUst";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { EkipIstemci, type UyeDTO, type DenetimDTO } from "./EkipIstemci";
import { ekipCeviri } from "./ekip.i18n";

export const metadata: Metadata = { title: "Ekip — Veylify" };

// Ekip & denetim ile ilgili audit aksiyonları (aktivite şeridi için).
const EKIP_AKSIYONLARI = new Set([
  "üye.davet",
  "üye.rol-değiştir",
  "üye.çıkar",
  "üye.davet-iptal",
  "üye.davet-yenile",
]);

export default async function EkipPage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const team = Team.forOwner(user.id);
  const uyeler: UyeDTO[] = team.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    role: t.role,
    avatarColor: t.avatarColor,
    status: t.status,
    lastActive: t.lastActive,
    title: t.title,
    mfaEnabled: t.mfaEnabled ?? false,
    permissions: t.permissions ?? [],
    invitedAt: t.invitedAt,
    invitedBy: t.invitedBy,
    inviteExpiresAt: t.inviteExpiresAt,
  }));

  const denetim: DenetimDTO[] = Audit.forOwner(user.id, 200)
    .filter((a) => EKIP_AKSIYONLARI.has(a.action))
    .slice(0, 12)
    .map((a) => ({
      id: a.id,
      actorName: a.actorName,
      action: a.action,
      target: a.target,
      ts: a.ts,
      meta: a.meta,
    }));

  return (
    <>
      <PanelUst kirintilar={[{ ad: ceviri("nav.team", dil) }]} baslik={ekipCeviri("ek.baslik", dil)} />
      <EkipIstemci uyeler={uyeler} denetim={denetim} benimAdim={user.name} dil={dil} />
    </>
  );
}
