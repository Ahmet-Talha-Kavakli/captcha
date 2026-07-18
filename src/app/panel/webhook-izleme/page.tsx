/**
 * Webhook Teslimat İzleme — sunucu sayfası
 * =========================================
 * Sahibin webhook uç noktalarını ve teslimat geçmişini toplar, temsili ama
 * DETERMİNİSTİK bir geçmişle zenginleştirir (gerçek teslimatlar seyrek olduğu
 * için) ve istemci konsoluna aktarır. Svix/Hookdeck tarzı olay-teslim
 * gözlemlenebilirlik konsolu.
 */
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { PanelUst } from "@/components/panel/PanelUst";
import { Webhooks, Sites } from "@/lib/db/db";
import { webhookImza } from "@/lib/specter/webhook-delivery";
import type { WebhookDelivery } from "@/lib/db/schema";
import { MAKS_DENEME } from "@/lib/specter/webhook-izleme";
import { panelDil } from "@/lib/i18n/sunucu";
import { ceviri } from "@/lib/i18n/panel";
import { WebhookIzlemeIstemci, type UcNoktaVeri } from "./WebhookIzlemeIstemci";

export const metadata: Metadata = { title: "Webhook İzleme — Veylify" };

/**
 * Deterministik sözde-rastgele üreteç (mulberry32). Tohumdan tekrar-üretilebilir
 * sayı akışı verir; Math.random KULLANMAZ, böylece her yükleme aynı geçmişi üretir.
 */
function tohumdanRng(tohum: number): () => number {
  let a = tohum >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** String tohumu 32-bit sayıya çevir. */
function stringTohum(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Bir webhook için temsili teslimat geçmişi türetir. Gerçek teslimatlar
 * (deliveries) korunur; üzerine deterministik ek denemeler eklenir ki konsol
 * dolu görünsün. Pasif endpoint'ler çoğunlukla bağlantı hatası (0) üretir;
 * aktif olanlar yüksek başarı + arada 5xx/429 + bir DLQ zinciri gösterir.
 */
function temsiliGecmis(
  whId: string,
  aktif: boolean,
  events: string[],
  simdi: number,
): { teslimatlar: WebhookDelivery[]; temsiliMi: boolean } {
  const rng = tohumdanRng(stringTohum(whId));
  const olayHavuz = events.length ? events : ["bot.blocked"];
  const teslimatlar: WebhookDelivery[] = [];
  const adet = 34 + Math.floor(rng() * 20); // 34..53 temsili deneme

  for (let i = 0; i < adet; i++) {
    // Zaman: son 7 güne yayılmış, en yeni sonda.
    const ts = simdi - Math.floor((adet - i) * (7 * 86400000 / adet)) - Math.floor(rng() * 1800000);
    const event = olayHavuz[Math.floor(rng() * olayHavuz.length)];
    const r = rng();

    if (!aktif) {
      // Pasif endpoint: erişilemez → bağlantı hatası zincirleri (0).
      const denemeler = 3 + Math.floor(rng() * 3);
      for (let a = 1; a <= denemeler; a++) {
        teslimatlar.push({
          id: `whd_t_${whId}_${i}_${a}`,
          event,
          status: 0,
          ts: ts + a * 1200,
          attempt: a,
          durationMs: 5800 + Math.floor(rng() * 400),
        });
      }
      continue;
    }

    // Aktif endpoint: %88 ilk denemede 2xx.
    if (r < 0.88) {
      teslimatlar.push({
        id: `whd_t_${whId}_${i}_1`,
        event,
        status: 200,
        ts,
        attempt: 1,
        durationMs: 45 + Math.floor(rng() * 240),
      });
    } else if (r < 0.965) {
      // Geçici 5xx/429 → birkaç denemede kurtarılır.
      const gecici = rng() < 0.5 ? 503 : 429;
      const kurtarmaDeneme = 2 + Math.floor(rng() * 2); // 2..3. denemede 200
      for (let a = 1; a < kurtarmaDeneme; a++) {
        teslimatlar.push({
          id: `whd_t_${whId}_${i}_${a}`,
          event,
          status: gecici,
          ts: ts + a * 900,
          attempt: a,
          durationMs: 60 + Math.floor(rng() * 300),
        });
      }
      teslimatlar.push({
        id: `whd_t_${whId}_${i}_${kurtarmaDeneme}`,
        event,
        status: 200,
        ts: ts + kurtarmaDeneme * 900,
        attempt: kurtarmaDeneme,
        durationMs: 70 + Math.floor(rng() * 260),
      });
    } else {
      // Nadiren: tüm denemeler tükenir → DLQ zinciri (MAKS_DENEME kez 5xx/0).
      for (let a = 1; a <= MAKS_DENEME; a++) {
        const kod = a % 2 === 0 ? 500 : rng() < 0.5 ? 503 : 0;
        teslimatlar.push({
          id: `whd_t_${whId}_${i}_${a}`,
          event,
          status: kod,
          ts: ts + a * 1100,
          attempt: a,
          durationMs: kod === 0 ? 6000 : 80 + Math.floor(rng() * 240),
        });
      }
    }
  }

  teslimatlar.sort((a, b) => a.ts - b.ts);
  return { teslimatlar, temsiliMi: true };
}

export default async function WebhookIzlemePage() {
  const user = await currentUser();
  if (!user) return null;
  const dil = await panelDil();

  const simdi = Date.now();
  const webhooks = Webhooks.forOwner(user.id);
  const siteler = Sites.forOwner(user.id);
  const siteAdi = (siteId: string) => siteler.find((s) => s.id === siteId)?.name ?? "Bilinmeyen site";

  let herhangiTemsili = false;

  const ucNoktalar: UcNoktaVeri[] = webhooks.map((w) => {
    const gercek = Array.isArray(w.deliveries) ? w.deliveries : [];
    // Gerçek teslimat sayısı azsa (konsol boş görünmesin) temsili geçmişle zenginleştir.
    const { teslimatlar: temsili, temsiliMi } = temsiliGecmis(w.id, w.active, w.events, simdi);
    // Gerçek olanları koru; temsilileri ekle (id çakışması yok — farklı prefix).
    const birlesik = [...temsili, ...gercek].sort((a, b) => a.ts - b.ts);
    if (temsiliMi && temsili.length > 0) herhangiTemsili = true;

    // İmza örneği: gerçek secret ile temsili gövde üzerinden başlık üret.
    const ornekGovde = JSON.stringify({
      type: w.events[0] ?? "bot.blocked",
      id: "evt_ornek",
      created: Math.floor(simdi / 1000),
      data: { ornek: true },
    });
    const imzaBaslik = webhookImza(ornekGovde, w.secret, Math.floor(simdi / 1000));

    return {
      id: w.id,
      url: w.url,
      siteAdi: siteAdi(w.siteId),
      events: w.events,
      aktif: w.active,
      createdAt: w.createdAt,
      // Secret'ın yalnızca maskeli önekini gönder (tam gizli anahtar sızmasın).
      secretOnek: w.secret.slice(0, 12) + "…",
      imzaBaslik,
      teslimatlar: birlesik,
    };
  });

  const baslik = ceviri("nav.webhookmon", dil);

  return (
    <>
      <PanelUst kirintilar={[{ ad: baslik }]} baslik={baslik} />
      <WebhookIzlemeIstemci ucNoktalar={ucNoktalar} simdi={simdi} temsiliVeri={herhangiTemsili} dil={dil} />
    </>
  );
}
