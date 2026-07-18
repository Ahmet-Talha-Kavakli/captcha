/**
 * POST /api/oz-ayar/uygula
 * ------------------------
 * Katman öz-ayar önerisini GERÇEK bir kurala çevirir (kapalı-döngünün eylem
 * halkası). İstemci bir öneriyi (botClass + tur) "Uygula" der; sunucu geri-besleme
 * analizini KENDİ yeniden hesaplar (istemciye güvenilmez), o önerinin gerçekten
 * var olduğunu doğrular ve karşılık gelen kuralı Rules.create ile yazar.
 *
 * İnsan-onaylı (kullanıcı butona basar) + geri-alınabilir (üretilen kural
 * Kurallar ekranından silinebilir) + denetim kaydı. Üretimi otomatik değiştirmez;
 * yalnızca açık kullanıcı eylemiyle.
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Sites, Rules, Events, Audit } from "@/lib/db/db";
import { katmanGeriBesleme } from "@/lib/specter/katman-geribesleme";
import { katmanOzAyar } from "@/lib/specter/katman-ozayar";
import type { RuleAction } from "@/lib/db/schema";

/** Öneri türü → kural aksiyonu. Boşluk/güçlendir sert (block), koru yumuşak (challenge). */
const TUR_AKSIYON: Record<string, RuleAction> = {
  bosluk: "block",
  guclendir: "block",
  koru: "challenge",
};

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const siteId: string | undefined = body.siteId;
  const botClass: string | undefined = body.botClass;
  const tur: string | undefined = body.tur;

  if (!siteId || !botClass || !tur) {
    return NextResponse.json({ error: "siteId, botClass ve tur gerekli" }, { status: 400 });
  }
  // "gereksiz" bilgi amaçlıdır — uygulanamaz.
  if (!(tur in TUR_AKSIYON)) {
    return NextResponse.json({ error: "Bu öneri türü uygulanamaz" }, { status: 400 });
  }

  const site = Sites.byId(siteId);
  if (!site || site.ownerId !== user.id) {
    return NextResponse.json({ error: "Site bulunamadı" }, { status: 404 });
  }

  // Öneriyi SUNUCUDA yeniden hesapla — istemciye güvenme. Önerilen (botClass, tur)
  // gerçekten mevcut analizde var mı?
  const events = Events.forOwner(user.id, 3000);
  const gb = katmanGeriBesleme(events);
  const oz = katmanOzAyar(gb);
  const oneri = oz.oneriler.find((o) => o.botClass === botClass && o.tur === tur);
  if (!oneri) {
    return NextResponse.json({ error: "Öneri artık geçerli değil (veri değişti)" }, { status: 409 });
  }

  // Aynı kural zaten var mı? (idempotent — mükerrer kural üretme)
  const mevcut = Rules.forSite(siteId).find(
    (r) => !r.system && r.field === "botClass" && r.op === "eq" && r.value === botClass,
  );
  if (mevcut) {
    return NextResponse.json({ error: "Bu bot sınıfı için zaten bir kural var", ruleId: mevcut.id }, { status: 409 });
  }

  const aksiyon = TUR_AKSIYON[tur];
  const rule = Rules.create({
    siteId,
    name: `Öz-ayar: ${botClass} → ${aksiyon}`,
    description: `Katman geri-beslemesinden otomatik önerildi (${tur}). ${oneri.gerekce}`,
    enabled: true,
    priority: tur === "bosluk" ? 5 : 15, // boşluk kuralları öncelikli
    field: "botClass",
    op: "eq",
    value: botClass,
    action: aksiyon,
  });

  Audit.log(user.id, user.name, "kural.oluştur", `Öz-ayar önerisi uygulandı: ${rule.name}`);

  return NextResponse.json({
    rule: { id: rule.id, name: rule.name, action: aksiyon, value: botClass },
    mesaj: "Öneri kurala çevrildi. Kurallar ekranından düzenleyebilir/silebilirsin.",
  });
}
