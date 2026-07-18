import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Experiments, Sites, Audit } from "@/lib/db/db";
import type {
  ExperimentMetric,
  ExperimentStatus,
  ExperimentVariantConfig,
} from "@/lib/db/schema";

const METRIKLER: ExperimentMetric[] = ["surtunme", "guvenlik", "donusum"];
const DURUMLAR: ExperimentStatus[] = ["taslak", "calisiyor", "tamam", "durduruldu"];
const ZORLUKLAR = ["low", "medium", "high"] as const;

const METRIK_ETIKET: Record<ExperimentMetric, string> = {
  surtunme: "Sürtünme",
  guvenlik: "Güvenlik",
  donusum: "Dönüşüm",
};
const DURUM_ETIKET: Record<ExperimentStatus, string> = {
  taslak: "Taslak",
  calisiyor: "Çalışıyor",
  tamam: "Tamamlandı",
  durduruldu: "Durduruldu",
};

/** Bir variant yapılandırmasını doğrula + normalize et (yoksa null). */
function variantOku(v: unknown): ExperimentVariantConfig | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const difficulty = String(o.difficulty);
  if (!ZORLUKLAR.includes(difficulty as (typeof ZORLUKLAR)[number])) return null;
  const esik = Number(o.behaviorThreshold);
  if (!Number.isFinite(esik) || esik < 0 || esik > 1) return null;
  const trafik = Number(o.trafik);
  if (!Number.isFinite(trafik) || trafik < 0 || trafik > 100) return null;
  return {
    difficulty: difficulty as "low" | "medium" | "high",
    behaviorThreshold: Math.round(esik * 100) / 100,
    invisibleMode: Boolean(o.invisibleMode),
    trafik: Math.round(trafik),
  };
}

/** Yeni deneme oluştur (POST). */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { siteId, name, metric, variantA, variantB, hemenBaslat } = body;

  // Site sahibe ait olmalı (ownerId guard).
  const site = Sites.byId(siteId);
  if (!site || site.ownerId !== user.id) {
    return NextResponse.json({ error: "site bulunamadı" }, { status: 404 });
  }
  if (!METRIKLER.includes(metric)) {
    return NextResponse.json({ error: "geçersiz metrik" }, { status: 400 });
  }
  const ad = typeof name === "string" && name.trim() ? name.trim() : "";
  if (!ad) return NextResponse.json({ error: "deneme adı gerekli" }, { status: 400 });

  const A = variantOku(variantA);
  const B = variantOku(variantB);
  if (!A || !B) return NextResponse.json({ error: "geçersiz variant yapılandırması" }, { status: 400 });
  if (A.trafik + B.trafik !== 100) {
    return NextResponse.json({ error: "trafik bölünmesi A + B = 100 olmalı" }, { status: 400 });
  }

  const deney = Experiments.create(user.id, {
    siteId: site.id,
    name: ad,
    metric,
    variantA: A,
    variantB: B,
    hemenBaslat: Boolean(hemenBaslat),
  });
  Audit.log(user.id, user.name, "deneme.oluştur", ad, {
    site: site.name,
    metrik: METRIK_ETIKET[metric as ExperimentMetric],
    durum: DURUM_ETIKET[deney.status],
  });
  return NextResponse.json({ experiment: deney });
}

/** Durum değiştir veya kazanan ilan et (PATCH). */
export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { id, action, status, winner } = body;
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const mevcut = Experiments.byId(user.id, id);
  if (!mevcut) return NextResponse.json({ error: "deneme bulunamadı" }, { status: 404 });

  // Kazanan ilan et.
  if (action === "winner") {
    if (winner !== "A" && winner !== "B") {
      return NextResponse.json({ error: "geçersiz kazanan" }, { status: 400 });
    }
    const deney = Experiments.setWinner(user.id, id, winner);
    if (!deney) return NextResponse.json({ error: "işlem başarısız" }, { status: 400 });
    Audit.log(user.id, user.name, "deneme.kazanan-ilan", mevcut.name, {
      kazanan: winner === "A" ? "Variant A" : "Variant B",
    });
    return NextResponse.json({ experiment: deney });
  }

  // Durum geçişi (başlat / durdur / bitir / taslağa al).
  if (!DURUMLAR.includes(status)) {
    return NextResponse.json({ error: "geçersiz durum" }, { status: 400 });
  }
  const deney = Experiments.updateStatus(user.id, id, status);
  if (!deney) return NextResponse.json({ error: "işlem başarısız" }, { status: 400 });
  const eylem =
    status === "calisiyor"
      ? "deneme.başlat"
      : status === "durduruldu"
        ? "deneme.durdur"
        : status === "tamam"
          ? "deneme.bitir"
          : "deneme.güncelle";
  Audit.log(user.id, user.name, eylem, mevcut.name, {
    durum: DURUM_ETIKET[status as ExperimentStatus],
  });
  return NextResponse.json({ experiment: deney });
}

/** Denemeyi sil (DELETE). */
export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  const mevcut = Experiments.byId(user.id, id);
  if (!mevcut) return NextResponse.json({ error: "deneme bulunamadı" }, { status: 404 });
  const ok = Experiments.remove(user.id, id);
  if (!ok) return NextResponse.json({ error: "silinemedi" }, { status: 400 });
  Audit.log(user.id, user.name, "deneme.sil", mevcut.name);
  return NextResponse.json({ ok: true });
}
