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
  /** Harf hücrelerinin senkron (koherens) oranı 0..1. */
  coh: number;
  /** Akış hızı — gürültü satır-fazının kare başına kayması (px/sn ölçeğinde). */
  flow: number;
  /** Harf hücresi zaman-ortalama doluluğu (taban eşik). */
  letterBase: number;
  /** Arka plan hücresi zaman-ortalama doluluğu (taban eşik). */
  bgBase: number;
  /** Harf dalga genliği çarpanı (titreşim gücü). */
  letterAmp: number;
  /** Arka plan dalga genliği çarpanı. */
  bgAmp: number;
}

export const DIFFICULTY_PROFILES: Record<
  "low" | "medium" | "high",
  DifficultyProfile
> = {
  // KOHERANS-TABANLI TASARIM (parametre araması ile bulundu — analiz.mjs):
  // letterBase ≈ bgBase (doluluk EŞİT → tek karede gerçek kod gizli, sadece
  // zamansal koherans onu ele verir). Gerçek kod SENKRON kırpışır (coh yüksek,
  // letterAmp>bgAmp), zemin rastgele fazlı → insan koherent bloğu okur, bot
  // (tek kare) doluluk-farkı göremez. Decoy STATİK → OCR onu okur, insan eler.
  //
  //   low   : iri nokta, yavaş akış, en yüksek koherans (erişilebilirlik dostu)
  //   medium: dengeli (arama en iyisi)
  //   high  : ince nokta, hızlı akış, daha ince koherans (bot için zor)
  low:    { cell: 5, coh: 0.97, flow: 0.9, letterBase: 0.50, bgBase: 0.50, letterAmp: 0.34, bgAmp: 0.10 },
  medium: { cell: 4, coh: 0.95, flow: 1.3, letterBase: 0.50, bgBase: 0.50, letterAmp: 0.30, bgAmp: 0.12 },
  high:   { cell: 3, coh: 0.92, flow: 1.8, letterBase: 0.50, bgBase: 0.50, letterAmp: 0.26, bgAmp: 0.14 },
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
    const coh = this.prof.coh; // harf senkron oranı (zorluğa göre)
    const { letterBase, bgBase, letterAmp, bgAmp, flow } = this.prof;

    // Akış kayması (satır cinsinden). Zemin aşağı (+), harf yukarı (−).
    // Kesirli kayma alt-piksel akıcılığı verir; noise'a tam-sayı + kesir
    // birlikte beslenir (kesir dalga fazını, tam-sayı gürültü satırını kaydırır).
    const asagi = sn * flow;        // zemin akış ofseti (satır)
    const yukari = sn * flow * 1.1; // harf akış ofseti (biraz daha hızlı → belirginlik)
    const decoy = this.decoyMask;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i = r * this.cols + c;
        const harf = (this.mask[i] === 1) !== invert;
        // TUZAK: hücre decoy'a ait mi? (gerçek kodla çakışırsa gerçek kazanır —
        // gerçek kod her zaman okunur kalmalı; decoy sadece boş bölgeleri kaplar.)
        const tuzak = decoy !== null && decoy[i] === 1 && !harf;

        if (tuzak) {
          // STATİK decoy: akış YOK. Her karede AYNI deterministik desen →
          // tek-kare OCR bunu tutarlı bir "yazı" olarak yakalar ve gerçek kod
          // sanır. İnsan gözü ise hareket eden gerçek kodu takip eder; sabit
          // decoy'u hareketsiz doku olarak eler (motion pop-out). Decoy taban
          // doluluğu bgBase ile letterBase arası orta bir değerde — OCR'a
          // "harf" gibi görünecek kadar dolu, ama akmadığı için insana kod değil.
          const gurultu = pseudoNoise(c * 2 + 1, r * 2 + 1); // decoy'a özel sabit alan
          const esik = 0.74; // yoğun sabit → tek-karede net, OCR-okunur decoy şekli
          if (gurultu < esik) ctx.fillRect(c * cell, r * cell, cell, cell);
          continue;
        }

        // Akış-kaymış satır: harf yukarı, zemin aşağı akar.
        const akisSatir = harf ? r + yukari : r - asagi;
        const satirTam = Math.floor(akisSatir);
        const satirKesir = akisSatir - satirTam;

        // Akan gürültü: kaymış satır komşularını kesir ile harmanla (dikey
        // kayma sürekli görünsün diye). Yön bilgisini bu taşır.
        const g0 = pseudoNoise(c, satirTam);
        const g1 = pseudoNoise(c, satirTam + 1);
        const gurultu = g0 * (1 - satirKesir) + g1 * satirKesir;

        // Faz: hücre başına sabit jitter + akış fazı. Koherens harfleri
        // senkronlar (birlikte parlar/söner → okunur blok), zemini dağıtır.
        const fazTemel = harf ? yukari : asagi;
        const fazHucre = (fazTemel + this.phase[i] * (1 - coh)) % 1;
        const dalga = Math.sin(fazHucre * 6.2831853); // -1..1

        // TABAN doluluk farkı yön ipucunu güçlendirir (harf ort. daha dolu).
        const esik = harf
          ? letterBase + dalga * letterAmp * coh
          : bgBase - dalga * bgAmp * coh;

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
