import { currentUser } from "@/lib/auth";
import { bildirimler } from "@/lib/ozet";
import { panelDil } from "@/lib/i18n/sunucu";
import { Topbar } from "./Topbar";

/** Server wrapper: kullanıcı + bildirimleri çekip Tavily-stil Topbar'a verir. */
export async function PanelUst({ kirintilar, baslik }: { kirintilar: { ad: string; href?: string }[]; baslik: string }) {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();
  const notes = bildirimler(user.id).map((b) => ({
    id: b.id, severity: b.severity, title: b.title, message: b.message, ts: b.ts, read: b.read,
  }));
  return <Topbar kirintilar={kirintilar} baslik={baslik} bildirimler={notes} dil={dil} />;
}
