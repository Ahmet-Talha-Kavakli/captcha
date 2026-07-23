/**
 * GET  /api/backup  → hesabın yapılandırma yedeğini JSON olarak indir.
 * POST /api/backup  → bir yedek dosyasını doğrula (geri yükleme önizlemesi).
 * currentUser guard'lı. Sırlar dışa aktarımda maskelenir.
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Audit } from "@/lib/db/db";
import { yedekOlustur, yedekDogrula, yedektenGeriYukle } from "@/lib/specter/backup";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const yedek = yedekOlustur(user.id);
  Audit.log(user.id, user.name, "veri.disa-aktar", "yapılandırma yedeği", { site: String(yedek.meta.kapsam.site) });
  const tarih = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(yedek, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="specter-yedek-${tarih}.json"`,
    },
  });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const veri = await req.json().catch(() => null);
  const sonuc = yedekDogrula(veri);
  if (sonuc.gecerli) {
    Audit.log(user.id, user.name, "veri.geri-yukle-onizleme", "yedek doğrulandı");
  }
  return NextResponse.json(sonuc, { status: sonuc.gecerli ? 200 : 400 });
}

/**
 * PUT /api/backup → yedeği GERÇEKTEN geri yükle (güvenli: kural + AI politikası
 * EKLER, yıkıcı değil). Siteler/webhooklar sırları maskeli olduğu için atlanır.
 */
export async function PUT(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const veri = await req.json().catch(() => null);
  const sonuc = yedektenGeriYukle(user.id, veri);
  if (sonuc.ok) {
    Audit.log(user.id, user.name, "veri.geri-yukle", "yedekten geri yüklendi", {
      kural: String(sonuc.geriYuklenen.kural),
      aiPolitika: String(sonuc.geriYuklenen.aiPolitika),
    }, { critical: true });
  }
  return NextResponse.json(sonuc, { status: sonuc.ok ? 200 : 400 });
}
