/**
 * Specter — Canlı Nabız & Zaman Serisi (Live Pulse) Motoru
 * ========================================================
 *
 * NE YAPAR
 * --------
 * Dashboard'un üst şeridindeki "canlı durum" göstergesini ve saatlik ısı
 * haritasını besleyen saf/deterministik zaman-serisi motoru. Ham `BotEvent[]`
 * akışını alır ve şunları çıkarır:
 *
 *   1. saatlikSeri        — son 24 saatin her biri için kova (toplam/bot/insan/engellenen)
 *   2. son5dk             — anlık nabız: son 5 dakikadaki olay/bot/engellenen + RPS
 *   3. zirveSaat          — 24 kova içinde en yoğun saat
 *   4. sakinSaat          — en az yoğun saat
 *   5. momentum           — son 1 saat vs önceki 1 saat trafik ivmesi (yön + yüzde)
 *   6. canliVerdiktDagilim — son 100 olayda verdict (allowed/challenged/blocked/flagged) dağılımı
 *
 * NEDEN GERÇEK VERİ
 * -----------------
 * Bu motor HİÇBİR yerde rastgele üretim (Math.random) ya da wall-clock (Date.now)
 * kullanmaz. Tüm sayımlar gerçekten kaydedilmiş `BotEvent` kayıtlarının `ts`,
 * `botClass` ve `verdict` alanlarından türetilir. "Şimdi" referansı dışarıdan
 * `simdi` parametresi olarak verilir; böylece motor tamamen deterministiktir,
 * test edilebilir ve sunucu/istemci arasında aynı sonucu üretir. Dashboard'da
 * gördüğünüz her sayı, arkasında gerçek bir istek olayına dayanır — vitrin değil.
 *
 * SAFLIK GARANTİLERİ
 * ------------------
 *   - Girdi mutasyona uğramaz (kopyalar üzerinde çalışır / salt-okunur okur).
 *   - Aynı (events, simdi) çifti her zaman aynı çıktıyı verir.
 *   - Boş / bozuk girdide çökmez; güvenli sıfır-varsayılan döndürür.
 *   - Dış bağımlılık yoktur.
 */

import type { BotEvent, BotClass, Verdict } from "@/lib/db/schema";

/* ------------------------------------------------------------------ Sabitler */

/** Bir saat, milisaniye cinsinden. */
const SAAT_MS = 60 * 60 * 1000;
/** Anlık nabız penceresi: 5 dakika (ms). */
const PENCERE_5DK_MS = 5 * 60 * 1000;
/** 5 dakikalık pencerenin saniye cinsi (RPS = olay / 300). */
const PENCERE_5DK_SN = 300;
/** Canlı verdict dağılımında bakılacak en son olay sayısı. */
const CANLI_ORNEK = 100;
/** "bot" sayılan botClass değerleri — human ve good_bot dışındaki her şey. */
const BOT_SINIFLARI: ReadonlySet<BotClass> = new Set<BotClass>([
  "automation",
  "scraper",
  "credential_stuffing",
  "ai_agent",
  "ddos",
  "spam",
]);
/** Tüm verdict değerleri — dağılımın sabit sırası ve tam kapsaması için. */
const VERDICT_SIRASI: readonly Verdict[] = ["allowed", "challenged", "blocked", "flagged"];

/* ------------------------------------------------------------------ Tipler */

/**
 * Son 24 saatin tek bir saatlik kovası. `saat` etiketi kovanın başlangıç
 * saatinin yerel "HH:00" biçimidir (en eski kova ilk, en yeni kova son).
 */
export interface SaatlikKova {
  /** Kova başlangıç saatinin "HH:00" etiketi (0-23 → "00:00".."23:00"). */
  saat: string;
  /** Kova başlangıç saatinin sayısal değeri (0-23). */
  saatNo: number;
  /** Kovanın başlangıç anı (epoch ms) — hassas eşleme/tooltip için. */
  baslangic: number;
  /** Bu kovadaki toplam olay sayısı. */
  toplam: number;
  /** Bot sınıfı olay sayısı (human/good_bot hariç). */
  bot: number;
  /** İnsan (human) olay sayısı. */
  insan: number;
  /** Engellenen (verdict === "blocked") olay sayısı. */
  engellenen: number;
}

/**
 * Anlık nabız: son 5 dakikadaki (simdi - 300000'den yeni) canlı aktivite.
 * `rps`, pencere içindeki olay sayısının 300 saniyeye bölümüdür.
 */
export interface Son5dk {
  /** Son 5 dk toplam olay. */
  olay: number;
  /** Son 5 dk bot olayı. */
  bot: number;
  /** Son 5 dk engellenen olay. */
  engellenen: number;
  /** Saniyedeki istek (olay / 300). */
  rps: number;
}

/** En yoğun / en sakin saat kovasının özeti. */
export interface SaatOzet {
  /** Kova "HH:00" etiketi. */
  saat: string;
  /** Kova başlangıç saati (0-23). */
  saatNo: number;
  /** Bu kovadaki toplam olay. */
  toplam: number;
}

/** Momentum yönü — trafik yükseliyor mu, düşüyor mu, sabit mi. */
export type MomentumYon = "yukseliyor" | "dusuyor" | "sabit";

/**
 * Trafik ivmesi: son 1 saatteki olay sayısı ile ondan önceki 1 saatteki
 * olay sayısının karşılaştırması.
 */
export interface Momentum {
  /** Trend yönü. */
  yon: MomentumYon;
  /** Değişim yüzdesi (mutlak, tam sayıya yuvarlı). Örn 40 = %40 değişim. */
  yuzde: number;
  /** Son 1 saatteki olay sayısı. */
  son1s: number;
  /** Önceki 1 saatteki olay sayısı (2s-1s arası). */
  onceki1s: number;
}

/** Son N olaydaki tek bir verdict için sayı + oran. */
export interface VerdiktPay {
  /** Verdict değeri. */
  verdict: Verdict;
  /** Bu verdict'e sahip olay sayısı (örneklem içinde). */
  sayi: number;
  /** Örneklem içindeki oran (0..1). */
  oran: number;
}

/** Motorun tam çıktısı. */
export interface CanliNabiz {
  /** Son 24 saat, saatlik kovalar (en eski → en yeni). Her zaman 24 eleman. */
  saatlikSeri: SaatlikKova[];
  /** Anlık nabız (son 5 dakika). */
  son5dk: Son5dk;
  /** En yoğun saat kovası. */
  zirveSaat: SaatOzet;
  /** En sakin saat kovası. */
  sakinSaat: SaatOzet;
  /** Trafik momentumu (son 1s vs önceki 1s). */
  momentum: Momentum;
  /** Son 100 olayda verdict dağılımı (sabit sıra: allowed, challenged, blocked, flagged). */
  canliVerdiktDagilim: VerdiktPay[];
  /** Motorun temel aldığı toplam olay sayısı (girdi büyüklüğü). */
  toplamOlay: number;
}

/* ------------------------------------------------------------------ Yardımcılar */

/** Bir olayın bot sınıfı olup olmadığı (human/good_bot değilse bottur). */
function botMu(e: BotEvent): boolean {
  return BOT_SINIFLARI.has(e.botClass);
}

/** İki basamaklı "HH:00" saat etiketi. */
function saatEtiketi(saatNo: number): string {
  return `${String(saatNo).padStart(2, "0")}:00`;
}

/** Geçerli, sayısal `ts`'e sahip bir BotEvent mi. */
function gecerliOlay(e: unknown): e is BotEvent {
  return (
    !!e &&
    typeof e === "object" &&
    typeof (e as BotEvent).ts === "number" &&
    Number.isFinite((e as BotEvent).ts)
  );
}

/* ------------------------------------------------------------------ Ana motor */

/**
 * Ham bot olaylarından canlı nabız & zaman serisini hesaplar.
 *
 * @param events Ham bot olayları (herhangi bir siteye ait; çağıran filtreler).
 *               Sıralı olması gerekmez; motor `ts` ile kendi hizalamasını yapar.
 * @param simdi  "Şimdi" referansı (epoch ms). Tüm pencereler bundan geriye kurulur.
 *               Date.now() yerine dışarıdan verilir → deterministik.
 * @returns      {@link CanliNabiz} — dashboard şeridi + saatlik ısı için hazır veri.
 */
export function canliNabiz(events: BotEvent[], simdi: number): CanliNabiz {
  // Girdiyi güvene al: dizi değilse ya da simdi sayısal değilse boş varsayılan.
  const guvenliSimdi = Number.isFinite(simdi) ? simdi : 0;
  const kaynak: BotEvent[] = Array.isArray(events) ? events.filter(gecerliOlay) : [];

  /* --- 1) Saatlik seri: 24 kova, en eski → en yeni --------------------- */
  // Kova indeksi 0 = en eski (23 saat önce), 23 = içinde bulunulan saat.
  // Kova sınırları `simdi`ye çıpalanır; her kova [baslangic, baslangic+SAAT_MS).
  // İçinde bulunulan saatin bitişi (guvenliSimdi + SAAT_MS) alınarak simdi de dahil edilir.
  const enYeniKovaBaslangic = guvenliSimdi - (guvenliSimdi % SAAT_MS); // simdi'nin saat başı (yaklaşık; ms epoch UTC hizalı)
  // Not: saat etiketi için kovanın gerçek başlangıç anını yerel saate çeviriyoruz.
  const kovalar: SaatlikKova[] = [];
  for (let i = 23; i >= 0; i--) {
    const baslangic = enYeniKovaBaslangic - i * SAAT_MS;
    const saatNo = new Date(baslangic).getHours();
    kovalar.push({
      saat: saatEtiketi(saatNo),
      saatNo,
      baslangic,
      toplam: 0,
      bot: 0,
      insan: 0,
      engellenen: 0,
    });
  }
  const seriBas = kovalar[0].baslangic; // 24 kovalık pencerenin başı
  const seriSon = enYeniKovaBaslangic + SAAT_MS; // pencerenin (açık) bitişi

  /* --- Pencere sayaçları (tek geçişte toplanır) ------------------------ */
  let son5dk_olay = 0;
  let son5dk_bot = 0;
  let son5dk_engellenen = 0;

  let son1s = 0; // [simdi - 1s, simdi]
  let onceki1s = 0; // [simdi - 2s, simdi - 1s)

  const bes_dk_esik = guvenliSimdi - PENCERE_5DK_MS;
  const bir_s_esik = guvenliSimdi - SAAT_MS;
  const iki_s_esik = guvenliSimdi - 2 * SAAT_MS;

  for (const e of kaynak) {
    const ts = e.ts;

    // Saatlik kovaya yerleştir (pencere içindeyse).
    if (ts >= seriBas && ts < seriSon) {
      let idx = Math.floor((ts - seriBas) / SAAT_MS);
      if (idx < 0) idx = 0;
      if (idx > 23) idx = 23;
      const kova = kovalar[idx];
      kova.toplam++;
      if (e.botClass === "human") kova.insan++;
      else if (botMu(e)) kova.bot++;
      if (e.verdict === "blocked") kova.engellenen++;
    }

    // Son 5 dk (anlık nabız).
    if (ts > bes_dk_esik && ts <= guvenliSimdi) {
      son5dk_olay++;
      if (botMu(e)) son5dk_bot++;
      if (e.verdict === "blocked") son5dk_engellenen++;
    }

    // Momentum pencereleri.
    if (ts > bir_s_esik && ts <= guvenliSimdi) {
      son1s++;
    } else if (ts > iki_s_esik && ts <= bir_s_esik) {
      onceki1s++;
    }
  }

  /* --- 2) Anlık nabız -------------------------------------------------- */
  const son5dk: Son5dk = {
    olay: son5dk_olay,
    bot: son5dk_bot,
    engellenen: son5dk_engellenen,
    rps: son5dk_olay / PENCERE_5DK_SN,
  };

  /* --- 3+4) Zirve / sakin saat ---------------------------------------- */
  // Boş girdi güvenli: ilk kova varsayılanı (toplam 0) döner.
  let zirve = kovalar[0];
  let sakin = kovalar[0];
  for (const k of kovalar) {
    if (k.toplam > zirve.toplam) zirve = k;
    if (k.toplam < sakin.toplam) sakin = k;
  }
  const zirveSaat: SaatOzet = { saat: zirve.saat, saatNo: zirve.saatNo, toplam: zirve.toplam };
  const sakinSaat: SaatOzet = { saat: sakin.saat, saatNo: sakin.saatNo, toplam: sakin.toplam };

  /* --- 5) Momentum ----------------------------------------------------- */
  let yon: MomentumYon;
  let yuzde: number;
  if (onceki1s === 0) {
    // Önceki saatte hiç trafik yoksa: şimdi varsa yükseliş (%100), yoksa sabit.
    yon = son1s > 0 ? "yukseliyor" : "sabit";
    yuzde = son1s > 0 ? 100 : 0;
  } else {
    const oran = (son1s - onceki1s) / onceki1s;
    yuzde = Math.round(Math.abs(oran) * 100);
    if (yuzde === 0) yon = "sabit";
    else yon = oran > 0 ? "yukseliyor" : "dusuyor";
  }
  const momentum: Momentum = { yon, yuzde, son1s, onceki1s };

  /* --- 6) Canlı verdict dağılımı (son 100 olay) ----------------------- */
  // "Son" = en yüksek ts. Girdiyi mutasyona uğratmadan kopya üzerinde sırala.
  const enYeniler = [...kaynak].sort((a, b) => b.ts - a.ts).slice(0, CANLI_ORNEK);
  const ornekBoyut = enYeniler.length;
  const sayimlar: Record<Verdict, number> = {
    allowed: 0,
    challenged: 0,
    blocked: 0,
    flagged: 0,
  };
  for (const e of enYeniler) {
    if (e.verdict in sayimlar) sayimlar[e.verdict]++;
  }
  const canliVerdiktDagilim: VerdiktPay[] = VERDICT_SIRASI.map((v) => ({
    verdict: v,
    sayi: sayimlar[v],
    oran: ornekBoyut > 0 ? sayimlar[v] / ornekBoyut : 0,
  }));

  return {
    saatlikSeri: kovalar,
    son5dk,
    zirveSaat,
    sakinSaat,
    momentum,
    canliVerdiktDagilim,
    toplamOlay: kaynak.length,
  };
}
