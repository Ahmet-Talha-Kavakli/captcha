/**
 * GHOST-FONT ANALİZ LABORATUVARI
 * ==============================
 * İki metriği birlikte ölçer:
 *   1) İNSAN OKUNABİLİRLİĞİ — N kareyi ZAMAN-ORTALAR (insan gözünün flicker'ı
 *      birleştirmesi gibi) ve harf-bölgesi ile zemin arasındaki KONTRASTI ölçer.
 *      Yüksek kontrast = harf ortalama görüntüde "patlıyor" = insan okur.
 *   2) OCR KÖRLÜĞÜ — TEK kareyi (botun gördüğü) alıp harf/zemin kontrastını
 *      ölçer. Düşük = bot tek karede harfi ayırt edemez = kör.
 *
 * Kontrast metriği: harf hücrelerinin ortalama doluluğu − zemin hücrelerinin
 * ortalama doluluğu (mutlak fark, 0..1). İnsan için YÜKSEK, bot(tek kare) için
 * DÜŞÜK istiyoruz. İkisinin ORANI (insan/bot) ne kadar büyükse motor o kadar iyi.
 *
 * Kullanım: node scripts/ghost-analiz.mjs [motor]
 *   motor: "mevcut" (varsayılan) | "yeni"  — hangi render mantığını test edeceği.
 */

const CHARSET = "34679ACDEFHJKLMNPRTUVWXY";

// --- Profiller (ghostfont.ts ile aynı tutulur) ---
const PROFILLER_MEVCUT = {
  low: { cell: 5, coh: 0.97, flow: 0.9, letterBase: 0.5, bgBase: 0.5, letterAmp: 0.34, bgAmp: 0.1 },
  medium: { cell: 4, coh: 0.95, flow: 1.3, letterBase: 0.5, bgBase: 0.5, letterAmp: 0.3, bgAmp: 0.12 },
  high: { cell: 3, coh: 0.92, flow: 1.8, letterBase: 0.5, bgBase: 0.5, letterAmp: 0.26, bgAmp: 0.14 },
};

function pseudoNoise(x, y) {
  let h = (x * 374761393 + y * 668265263) & 0x7fffffff;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h & 0x7fffffff;
  return (h % 10000) / 10000;
}

/** MEVCUT render: bir hücrenin bu karede dolu olup olmadığını döndürür. */
function mevcutHucre(prof, mask, phase, cols, r, c, i, sn) {
  const harf = mask[i] === 1;
  const asagi = sn * prof.flow;
  const yukari = sn * prof.flow * 1.1;
  const akisSatir = harf ? r + yukari : r - asagi;
  const satirTam = Math.floor(akisSatir);
  const satirKesir = akisSatir - satirTam;
  const g0 = pseudoNoise(c, satirTam);
  const g1 = pseudoNoise(c, satirTam + 1);
  const gurultu = g0 * (1 - satirKesir) + g1 * satirKesir;
  const fazTemel = harf ? yukari : asagi;
  const fazHucre = (fazTemel + phase[i] * (1 - prof.coh)) % 1;
  const dalga = Math.sin(fazHucre * 6.2831853);
  const esik = harf
    ? prof.letterBase + dalga * prof.letterAmp * prof.coh
    : prof.bgBase - dalga * prof.bgAmp * prof.coh;
  return gurultu < esik ? 1 : 0;
}

/**
 * YENİ render (motion-coherence): harf hücreleri ORTAK fazda + yüksek genlik
 * → zaman-ortalamada net kontrast (insan okur). Zemin rastgele faz + düşük
 * genlik → ortalamada düz. Tek karede harf-zemin doluluğu benzer (bot kör).
 *
 *  - harf eşiği: letterBase + coherentDalga*letterAmp   (TÜM harf hücreleri
 *    aynı `ortakFaz`'ı paylaşır → senkron parlar)
 *  - zemin eşiği: bgBase + rastgeleDalga*bgAmp          (her hücre kendi fazı)
 *  Zaman-ortalama: harf hücresi ortalama letterBase+? ... aslında sinüs ortalaması
 *  0 olur; okunabilirliği sağlayan şey KONTRAST DEĞİL, insanın flicker'ı fark
 *  etmesi. Bu yüzden ölçüde "zamanla VARYANS" da ölçeriz: harf hücreleri
 *  senkron yüksek-varyans, zemin dağınık → insan farkı görür.
 */
function yeniHucre(prof, mask, phase, cols, r, c, i, sn) {
  const harf = mask[i] === 1;
  // Akış (görsel hareket) — hafif dikey kayma, okunabilirliği bozmadan canlılık.
  const kayma = harf ? -sn * prof.flow : sn * prof.flow * 0.6;
  const akisSatir = r + kayma;
  const satirTam = Math.floor(akisSatir);
  const satirKesir = akisSatir - satirTam;
  const g0 = pseudoNoise(c, satirTam);
  const g1 = pseudoNoise(c, satirTam + 1);
  const gurultu = g0 * (1 - satirKesir) + g1 * satirKesir;

  let esik;
  if (harf) {
    // AKAN KOHERENT DALGA: harf boyunca yukarı akan bir parlaklık bandı. Konuma
    // (satır) bağlı faz → her an harfin BİR KISMI açık, bir kısmı kapalı; ama
    // desen SENKRON yukarı akar. İnsan akan bandı harf-şekli olarak birleştirir.
    // Ortalama doluluk zeminle EŞİT kalır (dalga simetrik) → tek kare bot kör.
    const konumFaz = r * prof.dalgaBoyu;          // satıra bağlı → uzaysal desen
    const zamanFaz = sn * prof.pulse;             // zamanla akış
    const dalga = Math.sin((konumFaz - zamanFaz) * 6.2831853);
    esik = prof.letterBase + dalga * prof.letterAmp;
  } else {
    // Zemin: her hücre kendi rastgele fazında, düşük genlik → dağınık statik doku.
    const rastFaz = (sn * prof.pulse * 0.6 + phase[i]) % 1;
    const dalga = Math.sin(rastFaz * 6.2831853);
    esik = prof.bgBase + dalga * prof.bgAmp;
  }
  return gurultu < esik ? 1 : 0;
}

/** Bir kod + profil için mask ve faz üret (basit blok-mask; gerçek font gerekmez). */
function kur(kod, prof, W, H) {
  const cell = prof.cell;
  const cols = Math.floor(W / cell);
  const rows = Math.floor(H / cell);
  // Basit mask: her karakteri eşit dikey şeride koy, ortada ~%50 yükseklikte doldur.
  // (Gerçek font mask'i tarayıcıda üretiliyor; burada okunabilirlik oranını
  //  ölçmek için temsili bir "kalın harf bloğu" yeterli.)
  const mask = new Uint8Array(cols * rows);
  const n = kod.length;
  const seridGenis = cols / n;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const serit = Math.floor(c / seridGenis);
      const seritIci = c - serit * seridGenis;
      // harf gövdesi: şeridin ortasında, dikeyde %20-%80 arası + basit "H" hissi
      const dikeyIci = r / rows;
      const yatayOrta = seritIci > seridGenis * 0.2 && seritIci < seridGenis * 0.8;
      const govde = dikeyIci > 0.2 && dikeyIci < 0.8 && yatayOrta;
      mask[r * cols + c] = govde ? 1 : 0;
    }
  }
  const phase = new Float32Array(cols * rows);
  let s = 0x9e3779b9;
  for (let i = 0; i < phase.length; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    phase[i] = s / 0x7fffffff;
  }
  return { cell, cols, rows, mask, phase };
}

/** Bir motoru ölç: harf/zemin kontrastı (tek kare = bot, N-kare ortalama = insan). */
function olc(hucreFn, prof, kareSayi = 20) {
  const W = 320, H = 90;
  const { cols, rows, mask, phase } = kur("7K3F9", prof, W, H);
  const N = cols * rows;
  const harfIdx = [], zeminIdx = [];
  for (let i = 0; i < N; i++) (mask[i] === 1 ? harfIdx : zeminIdx).push(i);

  // BOT GÖRÜŞÜ: bot birçok kare deneyip harfin EN AÇIK olduğu kareyi seçer.
  // Gerçek tehdit = kareler arasındaki MAKSİMUM harf-zemin kontrastı (worst-case).
  let botKontrast = 0;
  for (let k = 0; k < 40; k++) {
    const sn = 0.05 + k * (2.0 / 40);
    const kare = new Uint8Array(N);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        kare[i] = hucreFn(prof, mask, phase, cols, r, c, i, sn);
      }
    const kk = Math.abs(ort(harfIdx.map((i) => kare[i])) - ort(zeminIdx.map((i) => kare[i])));
    if (kk > botKontrast) botKontrast = kk;
  }

  // İNSAN GÖRÜŞÜ: insan gözü hem (a) zaman-ortalama doluluk farkını hem de
  // (b) SENKRON flicker'ı algılar. Her kareyi ayrı tutup harf-bölgesi ortalama
  // doluluğunun kareler-arası VARYANSINI ölçeriz: harf hücreleri senkron
  // parlıyorsa harf-ortalaması kareden kareye BİRLİKTE oynar (yüksek varyans);
  // zemin dağınıksa zemin-ortalaması sabit kalır (düşük varyans). Bu fark =
  // insanın gördüğü "yanıp sönen harf bloğu".
  const kareler = [];
  for (let k = 0; k < kareSayi; k++) {
    const sn = 0.1 + k * (1.5 / kareSayi);
    const kare = new Uint8Array(N);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        kare[i] = hucreFn(prof, mask, phase, cols, r, c, i, sn);
      }
    kareler.push(kare);
  }
  // İNSAN SİNYALİ = UZAYSAL-ZAMANSAL KOHERANS. İnsan gözü, harf bölgesinin
  // hücrelerinin BİRLİKTE (senkron/akan desen) davrandığını, zeminin ise
  // dağınık olduğunu fark eder. Ölçü: bir hücrenin zaman-serisi ile bölge
  // ORTALAMA zaman-serisi arasındaki korelasyon. Harf hücreleri ortak desen
  // taşırsa yüksek; zemin rastgeleyse düşük.
  const harfSeri = kareler.map((kare) => ort(harfIdx.map((i) => kare[i])));
  const zeminSeri = kareler.map((kare) => ort(zeminIdx.map((i) => kare[i])));
  // Her harf hücresinin kendi zaman-serisinin, harf-ortalama serisiyle korelasyonu.
  const harfKoh = ortKorelasyon(harfIdx, kareler, harfSeri);
  const zeminKoh = ortKorelasyon(zeminIdx, kareler, zeminSeri);
  const harfVar = varyans(harfSeri);
  const zeminVar = varyans(zeminSeri);
  const toplam = new Float32Array(N);
  for (const kare of kareler) for (let i = 0; i < N; i++) toplam[i] += kare[i];
  for (let i = 0; i < N; i++) toplam[i] /= kareSayi;
  const ortFark = Math.abs(ort(harfIdx.map((i) => toplam[i])) - ort(zeminIdx.map((i) => toplam[i])));
  // İnsan sinyali: harf-koheransı (senkron akan desen) − zemin-koheransı + statik fark.
  const insanKontrast = (harfKoh - zeminKoh) + ortFark;

  return { botKontrast, insanKontrast, harfKoh, zeminKoh, harfVar, zeminVar, ortFark, oran: insanKontrast / (botKontrast + 0.001) };
}

function ort(a) {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
}
function varyans(a) {
  const m = ort(a);
  return ort(a.map((x) => (x - m) * (x - m)));
}
/** Bir hücre grubunun her üyesinin zaman-serisi ile grup-ortalama serisinin
 *  ortalama |korelasyonu| (0..1). Senkron desen → yüksek, dağınık → düşük. */
function ortKorelasyon(idx, kareler, grupSeri) {
  if (idx.length === 0) return 0;
  const orn = idx.length > 200 ? idx.filter((_, k) => k % Math.ceil(idx.length / 200) === 0) : idx;
  let toplam = 0, say = 0;
  for (const i of orn) {
    const seri = kareler.map((kare) => kare[i]);
    const k = Math.abs(korelasyon(seri, grupSeri));
    if (Number.isFinite(k)) { toplam += k; say++; }
  }
  return say ? toplam / say : 0;
}
function korelasyon(a, b) {
  const ma = ort(a), mb = ort(b);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) { const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
  if (da === 0 || db === 0) return 0;
  return num / Math.sqrt(da * db);
}

// YENİ profiller — motion-coherence. pulse: akış hızı, dalgaBoyu: uzaysal desen sıklığı.
const PROFILLER_YENI = {
  low: { cell: 5, flow: 0.6, pulse: 1.6, dalgaBoyu: 0.14, letterBase: 0.5, bgBase: 0.5, letterAmp: 0.46, bgAmp: 0.06 },
  medium: { cell: 4, flow: 0.9, pulse: 2.0, dalgaBoyu: 0.18, letterBase: 0.5, bgBase: 0.5, letterAmp: 0.42, bgAmp: 0.09 },
  high: { cell: 3, flow: 1.2, pulse: 2.4, dalgaBoyu: 0.22, letterBase: 0.5, bgBase: 0.5, letterAmp: 0.36, bgAmp: 0.12 },
};

// --- Çalıştır ---
console.log("\n=== GHOST-FONT ANALİZ ===");
console.log("İnsan kontrastı YÜKSEK (>0.15 iyi, >0.25 net), bot kontrastı DÜŞÜK (<0.05 kör).\n");
function tablo(baslik, hucreFn, profiller) {
  console.log(`\n### ${baslik}`);
  console.log("profil   | insan(oku) | bot(kör) | harfKoh | zeminKoh | ortFark | durum");
  console.log("---------|------------|----------|---------|----------|---------|------");
  for (const [ad, prof] of Object.entries(profiller)) {
    const r = olc(hucreFn, prof);
    // İYİ = insan koheransı yüksek (harf senkron) VE bot tek-kare farkı düşük.
    const durum = r.insanKontrast > 0.3 && r.botKontrast < 0.12 ? "✓ İYİ" : r.insanKontrast < 0.2 ? "✗ insan zayıf" : "~ orta";
    console.log(
      `${ad.padEnd(8)} | ${r.insanKontrast.toFixed(3).padStart(10)} | ${r.botKontrast.toFixed(3).padStart(8)} | ${r.harfKoh.toFixed(3).padStart(7)} | ${r.zeminKoh.toFixed(3).padStart(8)} | ${r.ortFark.toFixed(3).padStart(7)} | ${durum}`,
    );
  }
}

tablo("MEVCUT MOTOR", mevcutHucre, PROFILLER_MEVCUT);
tablo("YENİ MOTOR (motion-coherence)", yeniHucre, PROFILLER_YENI);
console.log("");

// --- PARAMETRE TARAMASI (en iyi letterAmp/dalgaBoyu/bgAmp) ---
if (process.argv[2] === "tara") {
  console.log("\n### TARAMA (medium taban) — insan>0.30 & bot<0.10 hedef");
  let enIyi = null;
  for (const letterAmp of [0.38, 0.42, 0.46, 0.5]) {
    for (const dalgaBoyu of [0.14, 0.18, 0.22, 0.26, 0.3]) {
      for (const bgAmp of [0.06, 0.09, 0.12]) {
        const prof = { cell: 4, flow: 0.9, pulse: 2.0, dalgaBoyu, letterBase: 0.5, bgBase: 0.5, letterAmp, bgAmp };
        const r = olc(yeniHucre, prof);
        const skor = r.insanKontrast - r.botKontrast * 2; // insan yüksek, bot düşük
        if (r.botKontrast < 0.1 && (!enIyi || skor > enIyi.skor)) {
          enIyi = { letterAmp, dalgaBoyu, bgAmp, ...r, skor };
        }
      }
    }
  }
  if (enIyi) console.log(`EN İYİ: letterAmp=${enIyi.letterAmp} dalgaBoyu=${enIyi.dalgaBoyu} bgAmp=${enIyi.bgAmp} → insan=${enIyi.insanKontrast.toFixed(3)} bot=${enIyi.botKontrast.toFixed(3)}`);
  else console.log("bot<0.10 sağlayan bulunamadı");
}
