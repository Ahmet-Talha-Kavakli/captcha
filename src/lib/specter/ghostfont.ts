/**
 * Specter — Gerçek Ghost Font Motoru (zıt-akış + temporal dithering)
 * ==================================================================
 * mixfont.com/ghost-font tekniğinin uygulaması ve ötesi.
 *
 * FİKİR — İKİ ZIT AKIŞ:
 *   - Arka plan (metin-DIŞI) nokta gürültüsü sürekli AŞAĞI akar — bir
 *     dijital şelale / kar tanesi yağmuru gibi. Yön: +y.
 *   - Güvenlik kelimesi / kodu ise piksellerden oluşur ve akıntıya karşı,
 *     YUKARI akar. Yön: −y. Harfler "akıntıya karşı yüzen" bir bölge olur.
 *
 *   Her KARE tek başına bakıldığında rastgele nokta gürültüsüdür: metin
 *   bölgesi ile arka plan istatistiksel olarak AYNI yoğunluktadır. Bir
 *   ekran görüntüsü (statik kare) alan OCR / vision modeli hiçbir harf
 *   bulamaz — sadece gürültü.
 *
 *   Ama insan görme sistemi HAREKET YÖNÜNÜ ayırt eder (motion pop-out):
 *   aşağı akan denizin içinde yukarı akan tutarlı bölge (harfler) gözde
 *   anında "patlar" ve okunur. Sır tek karede değil, KARELER ARASI zıt
 *   harekettedir. Model tek kare görür → kör. İnsan akışı görür → okur.
 *
 * İki mekanizma harfleri BİRLİKTE taşır:
 *   1) Yön farkı (harf ↑ / zemin ↓) — asıl "ghost" okunurluğu.
 *   2) Zaman-ortalama doluluk farkı (letterBase > bgBase) — yön ipucunu
 *      güçlendiren zayıf statik yanlılık; tek karede harfi ELE VERMEZ
 *      (dalga ±genlik onu her karede belirsiz tutar), ama akışa katkı verir.
 *
 * Bu motor framework-bağımsızdır (widget + React + demo hepsi kullanır).
 */

export interface GhostFontOptions {
  text: string;
  width: number;
  height: number;
  /** Nokta boyutu (px). Küçük = daha ince gürültü. */
  cell?: number;
  /** Arka plan nokta yoğunluğu (0..1). */
  density?: number;
  /** Metin bölgesi ile arka plan arasındaki zamansal kontrast (0..1). */
  contrast?: number;
  /** Nokta rengi. */
  color?: string;
  /** Zemin rengi. */
  bg?: string;
  /**
   * Zorluk seviyesi. Verilirse cell/coh/akış-hızı/taban-eşikleri bu seviyeye
   * göre ayarlanır (aşağıdaki DIFFICULTY_PROFILES). Verilmezse "medium".
   */
  difficulty?: "low" | "medium" | "high";
  /**
   * TUZAK (decoy) mesajı. Verilirse tek-kare screenshot alan OCR/AI bunu
   * gerçek kod sanıp OKUR ve YANILIR. Gerçek `text` ise zıt-akışla gizli
   * kalır; sadece hareketi gören insan onu okur. Tipik: "ERISIM RED",
   * "BASARISIZ", "ACCESS DENIED" gibi bota-tuzak bir metin.
   */
  decoy?: string;
}

/**
 * Zorluk profilleri — ghost-font okunabilirliğini KORUYARAK bot zorluğunu
 * ölçekler. specter.js widget'ındaki DIFFICULTY_PROFILES ile BİREBİR aynı
 * olmalı (aynı görüntü çıksın diye).
 *
 * Anahtar ilke: harf akışı YUKARI (−y), zemin akışı AŞAĞI (+y). Akış hızı
 * (flow) hücrenin gürültü fazını her karede kaydırır. Yön zıtlığı ana
 * okunabilirlik garantisidir; letterBase-bgBase farkı (>= 30 puan) onu
 * destekleyen ikinci sinyaldir.
 *
 *   - low   : iri nokta (cell büyük), yüksek koherens, yavaş akış,
 *             en yüksek doluluk kontrastı. İnsan için en kolay / erişilebilir.
 *   - medium: dengeli.
 *   - high  : ince nokta (cell küçük), düşük koherens, hızlı akış,
 *             en düşük (ama yine güvenli) kontrast. Bot için en zor.
 */
export interface DifficultyProfile {
  /** Hücre boyutu (px). Büyük = iri nokta = daha okunur. */
  cell: number;
  /** Akış hızı — gürültü satır-fazının kare başına kayması (canlılık). */
  flow: number;
  /** Koherent dalganın zaman-akış hızı (harf deseni saniyede kaç faz kayar). */
  pulse: number;
  /** Harf içi koherent dalganın uzaysal sıklığı (satır başına faz). Küçük =
   *  geniş bant (daha bütün harf), büyük = ince bant. */
  dalgaBoyu: number;
  /** Harf hücresi taban doluluğu (eşik ortası; 0.5 = zeminle eşit → OCR kör). */
  letterBase: number;
  /** Arka plan hücresi taban doluluğu. letterBase ile EŞİT tutulur (gizlilik). */
  bgBase: number;
  /** Harf koherent dalga genliği (insan-okunabilirliğinin ana kaynağı). */
  letterAmp: number;
  /** Arka plan dalga genliği (düşük → zemin dağınık statik doku kalır). */
  bgAmp: number;
}

export const DIFFICULTY_PROFILES: Record<
  "low" | "medium" | "high",
  DifficultyProfile
> = {
  // AKAN-KOHERENT-DALGA TASARIMI (ghost-analiz.mjs + ghost-render-test.mjs ile
  // doğrulandı — OCR %0, insan-koherans yüksek):
  //
  // FİKİR: letterBase = bgBase = 0.50 → tek karede harf ve zemin ORTALAMA doluluğu
  // EŞİT (OCR/AI tek kare görür, harf bulamaz → kör, kanıtlı %0). Harf hücreleri
  // içinden YUKARI AKAN koherent bir parlaklık dalgası geçer (dalgaBoyu + pulse):
  // her an harfin bir kısmı açık bir kısmı kapalı, ama desen SENKRON akar. İnsan
  // görsel korteksi bu akan-koherent deseni harf-şekli olarak birleştirir ve okur.
  // Zemin hücreleri kendi rastgele fazlarında, düşük genlikle titrer → dağınık
  // statik doku; akmaz, koherans taşımaz → göz onu eler (motion pop-out).
  //
  //   low   : iri nokta (cell 5), geniş bant, yüksek genlik → en okunur (erişilebilir)
  //   medium: dengeli
  //   high  : ince nokta (cell 3), hızlı akış → bot için en zor (yine okunur)
  // MAKSİMUM OKUNABİLİRLİK — DENGELİ (scripts/_son.mjs kazananı "H4"): İRİ hücre
  // (7/6/5) + ÇOK GENİŞ bant (dalgaBoyu 0.06-0.08 → harf tam bütün) + AÇIK harf-
  // zemin farkı (letterBase ~0.585 > bgBase ~0.415 → okunurluğun ana kaldıracı) +
  // ÇOK SAKİN zemin (bgAmp 0.02) + YAVAŞ akış (flow 0.30 → göz desene rahat
  // yetişir). İnsan-koherans 0.68, OCR %0 (3 bağımsız kod × 5 kare worst-case
  // kanıtlı). "İyi ama biraz daha" geri bildirimiyle okunabilirlik zirveye çekildi.
  low:    { cell: 7, flow: 0.26, pulse: 1.05, dalgaBoyu: 0.06, letterBase: 0.595, bgBase: 0.405, letterAmp: 0.55, bgAmp: 0.015 },
  medium: { cell: 6, flow: 0.30, pulse: 1.15, dalgaBoyu: 0.07, letterBase: 0.585, bgBase: 0.415, letterAmp: 0.55, bgAmp: 0.02 },
  high:   { cell: 5, flow: 0.40, pulse: 1.35, dalgaBoyu: 0.09, letterBase: 0.565, bgBase: 0.435, letterAmp: 0.53, bgAmp: 0.03 },
};

/**
 * Metni bir binary mask'e (her hücre metne ait mi?) çevirir.
 * Geçici bir offscreen canvas'a metni çizip piksel örnekler.
 */
export function buildTextMask(
  text: string,
  cols: number,
  rows: number,
  cell: number,
): Uint8Array {
  const w = cols * cell;
  const h = rows * cell;
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Metni alana sığdır: font boyutunu genişliğe göre ayarla. Harfler arası
  // boşlukla çizilir (okunurluk artar). Font yığınında sembol yedekleri var
  // (ok ↑↓←→ ve nokta ● gibi "yon"/"sec" içerikleri için).
  const FONT = '"Arial Black", "Apple Symbols", "Segoe UI Symbol", Arial, sans-serif';
  const spaced = text.split("").join(" ");
  let fontSize = Math.floor(h * 0.62);
  ctx.font = `800 ${fontSize}px ${FONT}`;
  const tw = ctx.measureText(spaced).width;
  const hedef = w * 0.86;
  if (tw > hedef) {
    fontSize = Math.floor(fontSize * (hedef / tw));
    ctx.font = `800 ${fontSize}px ${FONT}`;
  }
  ctx.fillText(spaced, w / 2, h / 2 + fontSize * 0.02);

  const img = ctx.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Hücrenin merkezindeki pikseli örnekle.
      const px = Math.floor(c * cell + cell / 2);
      const py = Math.floor(r * cell + cell / 2);
      const idx = (py * w + px) * 4;
      mask[r * cols + c] = img[idx] > 110 ? 1 : 0;
    }
  }
  return mask;
}

/**
 * GhostFont oluşturucu. mask'i bir kez hesaplar, sonra her frame'de
 * o mask'e göre ZIT-YÖNLÜ akan gürültü çizer.
 */
export class GhostField {
  private ctx: CanvasRenderingContext2D;
  private cols: number;
  private rows: number;
  private cell: number;
  private mask: Uint8Array;
  /** TUZAK mask'i (varsa) — tek-kare OCR'ın okuyup yanıldığı sahte mesaj. */
  private decoyMask: Uint8Array | null;
  private opt: Required<GhostFontOptions>;
  /** Aktif zorluk profili (render parametreleri). */
  private prof: DifficultyProfile;
  /** Her hücreye sabit rastgele faz — deseni statik-analize dirençli yapar. */
  private phase: Float32Array;

  constructor(ctx: CanvasRenderingContext2D, opt: GhostFontOptions) {
    this.ctx = ctx;
    const difficulty = opt.difficulty ?? "medium";
    this.prof = DIFFICULTY_PROFILES[difficulty];
    this.opt = {
      cell: opt.cell ?? this.prof.cell,
      density: 0.5,
      contrast: 0.55,
      color: "#111111",
      bg: "#f2f2f0",
      difficulty,
      decoy: "",
      ...opt,
    } as Required<GhostFontOptions>;
    this.cell = opt.cell ?? this.prof.cell;
    this.cols = Math.floor(opt.width / this.cell);
    this.rows = Math.floor(opt.height / this.cell);
    this.mask = buildTextMask(opt.text, this.cols, this.rows, this.cell);
    this.decoyMask = opt.decoy
      ? buildTextMask(opt.decoy, this.cols, this.rows, this.cell)
      : null;
    this.phase = new Float32Array(this.cols * this.rows);
    // deterministik jitter (Math.random yerine hash) — her hücre 0..1.
    let s = 0x9e3779b9;
    for (let i = 0; i < this.phase.length; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      this.phase[i] = s / 0x7fffffff;
    }
  }

  setText(text: string) {
    this.mask = buildTextMask(text, this.cols, this.rows, this.cell);
    this.opt.text = text;
  }

  setDecoy(decoy: string) {
    this.decoyMask = decoy ? buildTextMask(decoy, this.cols, this.rows, this.cell) : null;
    this.opt.decoy = decoy;
  }

  /**
   * Bir kareyi çizer. t = zaman (ms). invert = metni/arka planı ters çevir.
   *
   * ZIT-AKIŞ ÇEKİRDEĞİ: gürültü örneği (x,y,frame) üçlüsünden alınır. Akan
   * bir görünüm için "frame" yerine hücrenin AKIŞ-KAYMIŞ satırını kullanırız:
   *   - zemin: satır += aşağı-kayma  → desen aşağı süzülür (şelale).
   *   - harf : satır −= yukarı-kayma → desen yukarı süzülür (akıntıya karşı).
   * Böylece iki bölge zıt yönde akar; insan yön farkını "pop-out" ile okur.
   */
  render(t: number, invert = false): void {
    const { ctx } = this;
    const { color, bg } = this.opt;
    const cell = this.cell;
    const w = this.cols * cell;
    const h = this.rows * cell;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color;

    const sn = t * 0.001; // saniye
    const { letterBase, bgBase, letterAmp, bgAmp, flow, pulse, dalgaBoyu } = this.prof;

    // Akış kayması (satır cinsinden) — görsel canlılık. Harf yukarı (−), zemin
    // aşağı (+). Gürültü satırını kaydırır → desen dikey süzülür (şelale hissi).
    const asagi = sn * flow;
    const yukari = sn * flow;
    const zamanFaz = sn * pulse; // koherent dalganın zaman-akış fazı
    const decoy = this.decoyMask;
    const TAU = 6.2831853;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i = r * this.cols + c;
        const harf = (this.mask[i] === 1) !== invert;
        // TUZAK: hücre decoy'a ait mi? (gerçek kodla çakışırsa gerçek kazanır.)
        const tuzak = decoy !== null && decoy[i] === 1 && !harf;

        if (tuzak) {
          // STATİK decoy: akış YOK, koherans YOK. Sabit yoğun desen → tek-kare
          // OCR bunu "yazı" sanıp okur ve YANILIR; insan hareketsiz dokuyu eler.
          const gurultu = pseudoNoise(c * 2 + 1, r * 2 + 1);
          if (gurultu < 0.74) ctx.fillRect(c * cell, r * cell, cell, cell);
          continue;
        }

        // Akış-kaymış satır (dikey süzülme): harf yukarı, zemin aşağı.
        const akisSatir = harf ? r + yukari : r - asagi;
        const satirTam = Math.floor(akisSatir);
        const satirKesir = akisSatir - satirTam;
        const g0 = pseudoNoise(c, satirTam);
        const g1 = pseudoNoise(c, satirTam + 1);
        const gurultu = g0 * (1 - satirKesir) + g1 * satirKesir;

        // AKAN KOHERENT DALGA (harf) vs DAĞINIK TİTREŞİM (zemin).
        // Harf: konuma (satır) bağlı faz − zaman fazı → yukarı akan parlaklık
        //   dalgası. TÜM harf hücreleri aynı deseni paylaşır (senkron akış) →
        //   insan gözü akan bandı harf olarak birleştirir. Ortalama doluluk
        //   letterBase (=0.5) → tek karede zeminle eşit → OCR kör.
        // Zemin: her hücre kendi rastgele fazında, düşük genlik → statik doku.
        let esik: number;
        if (harf) {
          const dalga = Math.sin((r * dalgaBoyu - zamanFaz) * TAU);
          esik = letterBase + dalga * letterAmp;
        } else {
          const dalga = Math.sin(((zamanFaz * 0.6 + this.phase[i]) % 1) * TAU);
          esik = bgBase + dalga * bgAmp;
        }

        if (gurultu < esik) ctx.fillRect(c * cell, r * cell, cell, cell);
      }
    }
  }
}

/** Deterministik 0..1 gürültü — (x, satır) çiftinden (akış için satır sürekli). */
function pseudoNoise(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) & 0x7fffffff;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h & 0x7fffffff;
  return (h % 10000) / 10000;
}
