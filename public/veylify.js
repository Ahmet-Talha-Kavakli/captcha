/**
 * Specter Widget — specter.js
 * ============================
 * Herhangi bir web sitesine <script src="…/specter.js"> ile eklenen,
 * bağımsız (framework-siz) ghost-font CAPTCHA widget'ı.
 *
 * Kullanım:
 *   <div class="specter" data-sitekey="pk_..."></div>
 *   <script src="https://veylify.com/veylify.js" async defer></script>
 *
 * Widget:
 *   1. /api/v1/challenge çağırır → seed + imzalı token alır.
 *   2. Seed'den ghost-font glyph'leri canvas'a çizer (DOM'da metin YOK).
 *   3. Kullanıcı etkileşimini (fare/tuş/zaman) toplar (davranış skoru).
 *   4. Çözümü /api/v1/verify'a gönderir → verification token'ı gizli
 *      input'a yazar; form submit'te müşteri backend'i /siteverify eder.
 *
 * NOT: Bu dosya bilinçli olarak vanilla JS'tir; hiçbir bağımlılığı
 * yoktur ve tüm ghost-font render mantığını kendi içinde barındırır
 * (cross-origin izole çalışır).
 */
(function () {
  "use strict";

  // Widget'ın konuşacağı origin (script src'inden türetilir).
  var SCRIPT = document.currentScript;
  var ORIGIN = (function () {
    try {
      return new URL(SCRIPT.src).origin;
    } catch (e) {
      return "";
    }
  })();

  // ---------------------------------------------------------------------
  // Ghost-font çekirdeği (glyphs + PRNG + render) — sunucu ile birebir.
  // ---------------------------------------------------------------------
  var CHARSET = "34679ACDEFHJKLMNPRTUVWXY".split("");

  var GLYPHS = {
    "3": [[[0.15,0.12],[0.8,0.12],[0.45,0.42],[0.82,0.6],[0.75,0.82],[0.4,0.9],[0.12,0.78]]],
    "4": [[[0.62,0.1],[0.62,0.9]],[[0.62,0.1],[0.12,0.62],[0.85,0.62]]],
    "6": [[[0.7,0.12],[0.35,0.2],[0.18,0.5],[0.16,0.75],[0.35,0.9],[0.62,0.88],[0.78,0.68],[0.68,0.5],[0.4,0.46],[0.2,0.56]]],
    "7": [[[0.14,0.12],[0.85,0.12],[0.42,0.9]]],
    "9": [[[0.78,0.5],[0.6,0.62],[0.32,0.56],[0.22,0.32],[0.38,0.14],[0.66,0.16],[0.8,0.38],[0.78,0.7],[0.6,0.88],[0.32,0.9]]],
    A: [[[0.1,0.9],[0.5,0.1],[0.9,0.9]],[[0.26,0.58],[0.74,0.58]]],
    C: [[[0.82,0.24],[0.55,0.12],[0.28,0.22],[0.15,0.5],[0.28,0.78],[0.55,0.88],[0.82,0.76]]],
    D: [[[0.18,0.1],[0.18,0.9]],[[0.18,0.1],[0.55,0.14],[0.8,0.4],[0.8,0.6],[0.55,0.86],[0.18,0.9]]],
    E: [[[0.8,0.12],[0.18,0.12],[0.18,0.9],[0.8,0.9]],[[0.18,0.5],[0.66,0.5]]],
    F: [[[0.8,0.12],[0.18,0.12],[0.18,0.9]],[[0.18,0.5],[0.66,0.5]]],
    H: [[[0.16,0.1],[0.16,0.9]],[[0.84,0.1],[0.84,0.9]],[[0.16,0.5],[0.84,0.5]]],
    J: [[[0.75,0.12],[0.75,0.72],[0.58,0.9],[0.32,0.86],[0.2,0.66]]],
    K: [[[0.18,0.1],[0.18,0.9]],[[0.82,0.1],[0.18,0.52]],[[0.4,0.44],[0.82,0.9]]],
    L: [[[0.2,0.1],[0.2,0.9],[0.8,0.9]]],
    M: [[[0.12,0.9],[0.12,0.1],[0.5,0.6],[0.88,0.1],[0.88,0.9]]],
    N: [[[0.16,0.9],[0.16,0.1],[0.84,0.9],[0.84,0.1]]],
    P: [[[0.2,0.9],[0.2,0.12],[0.62,0.14],[0.8,0.32],[0.62,0.5],[0.2,0.52]]],
    R: [[[0.2,0.9],[0.2,0.12],[0.62,0.14],[0.8,0.32],[0.62,0.5],[0.2,0.52]],[[0.42,0.5],[0.82,0.9]]],
    T: [[[0.1,0.12],[0.9,0.12]],[[0.5,0.12],[0.5,0.9]]],
    U: [[[0.16,0.1],[0.16,0.66],[0.34,0.88],[0.66,0.88],[0.84,0.66],[0.84,0.1]]],
    V: [[[0.12,0.1],[0.5,0.9],[0.88,0.1]]],
    W: [[[0.1,0.1],[0.28,0.9],[0.5,0.4],[0.72,0.9],[0.9,0.1]]],
    X: [[[0.14,0.1],[0.86,0.9]],[[0.86,0.1],[0.14,0.9]]],
    Y: [[[0.14,0.1],[0.5,0.5],[0.86,0.1]],[[0.5,0.5],[0.5,0.9]]]
  };

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function Rng(seed) { this.next = mulberry32(seed >>> 0); }
  Rng.prototype.range = function (a, b) { return a + this.next() * (b - a); };
  Rng.prototype.int = function (a, b) { return Math.floor(this.range(a, b + 1)); };
  Rng.prototype.pick = function (arr) { return arr[Math.floor(this.next() * arr.length)]; };
  Rng.prototype.bool = function (p) { return this.next() < (p == null ? 0.5 : p); };

  // Challenge türü çekirdeği — src/lib/specter/challenge.ts ile BİREBİR aynı.
  // Ghost-font koruma tekniği (temporal dithering) türden bağımsız aynıdır;
  // yalnızca İÇERİK (gösterilen) ve CEVAP (yazılan) değişir.
  var NUMERIC_CHARSET = "0123456789".split("");
  var YON_OKLAR = { U: "↑", D: "↓", L: "←", R: "→" };
  var YON_KODLAR = ["U", "D", "L", "R"];
  var SEC_MIN = 3, SEC_MAX = 7;

  function deriveAnswer(seed, len, type) {
    type = type || "kod";
    // KOD (varsayılan) — BİREBİR mevcut davranış (geriye uyum + testler).
    if (type === "kod") {
      var rng = new Rng((seed ^ 0x9e3779b9) >>> 0), out = "";
      for (var i = 0; i < len; i++) out += rng.pick(CHARSET);
      return out;
    }
    // Yeni türler AYRI PRNG akışı — "kod" çıktısını etkilemez.
    if (type === "sayi") {
      var r1 = new Rng((seed ^ 0x85ebca6b) >>> 0), o1 = "";
      for (var j = 0; j < len; j++) o1 += r1.pick(NUMERIC_CHARSET);
      return o1;
    }
    if (type === "yon") {
      var r2 = new Rng((seed ^ 0xc2b2ae35) >>> 0);
      return r2.pick(YON_KODLAR);
    }
    if (type === "sec") {
      var r3 = new Rng((seed ^ 0x27d4eb2f) >>> 0);
      return String(r3.int(SEC_MIN, SEC_MAX));
    }
    return "";
  }

  // GÖSTERİLECEK içerik (ghost-font'a çizilen). "kod"/"sayi"=cevap;
  // "yon"=ok karakteri; "sec"=N tane nokta. Cevapla aynı seed'den türer.
  function challengeContent(seed, len, type) {
    type = type || "kod";
    var answer = deriveAnswer(seed, len, type);
    if (type === "yon") return YON_OKLAR[answer] || "→";
    if (type === "sec") {
      var n = parseInt(answer, 10) || SEC_MIN, s = "";
      for (var i = 0; i < n; i++) s += "●";
      return s;
    }
    return answer;
  }

  // TUZAK metinleri — tek-kare AI/OCR'ın gerçek kod sanıp okuyacağı sahte
  // içerik. Seed'e göre deterministik seçilir (her challenge farklı tuzak).
  var DECOY_METINLER = [
    "ERISIM RED", "BASARISIZ", "GECERSIZ", "ENGELLENDI",
    "ACCESS DENIED", "BLOCKED", "ROBOT", "HATA 403", "REDDEDILDI"
  ];
  function decoyContent(seed) {
    return DECOY_METINLER[(seed >>> 3) % DECOY_METINLER.length];
  }

  // ---------------------------------------------------------------------
  // GERÇEK Ghost-Font: ZIT-AKIŞ + KOHERANS + DECOY (hareketli nokta gürültüsü).
  // Gerçek kod: senkron kırpışan hücreler AŞAĞI/YUKARI akar; doluluğu zemine
  // eşit (tek karede gizli), sadece hareket/koherans onu ele verir → insan okur.
  // Decoy: STATİK sahte metin; tek-kare OCR onu yakalar ve gerçek kod sanır.
  // Bot ekran görüntüsü alınca decoy'u okur, yanılır; gerçek kodu göremez.
  // ---------------------------------------------------------------------
  // Zorluk profilleri — src/lib/specter/ghostfont.ts'teki DIFFICULTY_PROFILES
  // ile BİREBİR aynı olmalı (aynı görüntü + aynı bot zorluğu).
  //   low   : iri nokta, yavaş akış, en yüksek koherans (erişilebilirlik dostu)
  //   medium: dengeli
  //   high  : ince nokta, hızlı akış, daha ince koherans (bota zor)
  // KOHERANS-TABANLI: letterBase≈bgBase (doluluk eşit → tek karede kod gizli),
  // ayrım sadece SENKRON kırpışmadan (coh + letterAmp>bgAmp). Decoy statik → OCR
  // tuzağı. ghostfont.ts DIFFICULTY_PROFILES ile BİREBİR aynı.
  var DIFFICULTY_PROFILES = {
    low:    { cell: 5, coh: 0.97, flow: 0.9, letterBase: 0.50, bgBase: 0.50, letterAmp: 0.34, bgAmp: 0.10 },
    medium: { cell: 4, coh: 0.95, flow: 1.3, letterBase: 0.50, bgBase: 0.50, letterAmp: 0.30, bgAmp: 0.12 },
    high:   { cell: 3, coh: 0.92, flow: 1.8, letterBase: 0.50, bgBase: 0.50, letterAmp: 0.26, bgAmp: 0.14 }
  };

  function buildMask(text, cols, rows, cell) {
    var w = cols * cell, h = rows * cell;
    var off = document.createElement("canvas");
    off.width = w; off.height = h;
    var c = off.getContext("2d");
    c.fillStyle = "#000"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle";
    var FONT = '"Arial Black", "Apple Symbols", "Segoe UI Symbol", Arial, sans-serif';
    var fs = Math.floor(h * 0.66);
    c.font = "800 " + fs + "px " + FONT;
    // harfler arası boşlukla ölç (okunurluk için hafif letter-spacing)
    var spaced = text.split("").join(" ");
    var tw = c.measureText(spaced).width, hedef = w * 0.86;
    if (tw > hedef) { fs = Math.floor(fs * (hedef / tw)); c.font = "800 " + fs + "px " + FONT; }
    c.fillText(spaced, w / 2, h / 2 + fs * 0.02);
    var img = c.getImageData(0, 0, w, h).data;
    var mask = new Uint8Array(cols * rows);
    // Her hücre için alt-örnekleme (anti-alias kenar) → daha net glyph.
    for (var r = 0; r < rows; r++) for (var col = 0; col < cols; col++) {
      var px = Math.floor(col * cell + cell / 2), py = Math.floor(r * cell + cell / 2);
      mask[r * cols + col] = img[(py * w + px) * 4] > 110 ? 1 : 0;
    }
    return mask;
  }

  // Deterministik gürültü — (x, satır) çiftinden. Akış için satır sürekli
  // kaydırılır (harf yukarı, zemin aşağı), böylece desen dikey akar.
  function pseudoNoise(x, y) {
    var h = (x * 374761393 + y * 668265263) & 0x7fffffff;
    h = ((h ^ (h >> 13)) * 1274126177) & 0x7fffffff;
    return (h % 10000) / 10000;
  }

  // GhostField: mask'i tutar, frame frame render eder.
  //
  // GERÇEK ghost-font (mixfont) tekniği: harf ve arka plan noktaları ZIT FAZda
  // titreşir. Bir anda harf hücreleri parlarken arka plan söner; yarım periyot
  // sonra tersine döner. İnsan gözü bu KOHERENT dalgalanmayı birleştirip harfi
  // okur. Tek statik kare ise ~%50 rastgele gürültüdür (OCR/screenshot kör).
  function GhostField(ctx, seed, len, diff, w, h, type) {
    this.ctx = ctx; this.w = w; this.h = h;
    // Zorluk profili: cell/coh/refresh/taban-eşikler buradan gelir (TS ile senkron).
    this.prof = DIFFICULTY_PROFILES[diff] || DIFFICULTY_PROFILES.medium;
    this.cell = this.prof.cell;
    this.cols = Math.floor(w / this.cell);
    this.rows = Math.floor(h / this.cell);
    // Cevap (yazılacak) ile içerik (çizilecek) türden bağımsız aynı seed'den.
    // Koruma tekniği (temporal dithering) DEĞİŞMEZ; sadece mask içeriği değişir.
    this.answer = deriveAnswer(seed, len, type);
    this.mask = buildMask(challengeContent(seed, len, type), this.cols, this.rows, this.cell);
    // TUZAK (decoy): tek-kare screenshot alan AI/OCR bunu gerçek kod sanıp OKUR
    // ve YANILIR. Statik çizilir → OCR yakalar, insan (koherans kanalı) eler.
    // Gerçek kod ise senkron kırpışmayla gizli; sadece hareketi gören okur.
    this.decoyMask = buildMask(decoyContent(seed), this.cols, this.rows, this.cell);
    this.coh = this.prof.coh; // harf hücrelerinin senkron oranı (zorluğa göre)
    // Her hücreye sabit bir rastgele faz kayması (kırpışmayı doğallaştırır).
    this.jitter = new Float32Array(this.cols * this.rows);
    var s = (seed ^ 0x9e3779b9) >>> 0;
    for (var i = 0; i < this.jitter.length; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      this.jitter[i] = (s / 0x7fffffff);
    }
  }
  GhostField.prototype.render = function (t) {
    var ctx = this.ctx, cell = this.cell, cols = this.cols, rows = this.rows;
    ctx.fillStyle = "#0a1220"; ctx.fillRect(0, 0, this.w, this.h);
    ctx.fillStyle = "#d4ecf7";
    var prof = this.prof;
    var coh = this.coh;
    var sn = t * 0.001; // saniye
    // ZIT-AKIŞ: zemin aşağı (+), harf yukarı (−). Akış hücrenin gürültü
    // satırını sürekli kaydırır → desen dikey akar; yön farkı harfi ele verir.
    var asagi = sn * prof.flow;         // zemin akış ofseti (satır)
    var yukari = sn * prof.flow * 1.1;  // harf akış ofseti (biraz daha hızlı)
    var decoy = this.decoyMask;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var i = r * cols + c;
      var harf = this.mask[i];
      // TUZAK: hücre decoy'a ait mi? (gerçek kod her zaman kazanır — okunur kalsın.)
      if (decoy[i] === 1 && !harf) {
        // STATİK decoy: akış yok, her karede aynı desen → tek-kare OCR "yazı"
        // olarak yakalar (gerçek kod sanır); insan hareketsiz doku olarak eler.
        if (pseudoNoise(c * 2 + 1, r * 2 + 1) < 0.74) ctx.fillRect(c * cell, r * cell, cell, cell);
        continue;
      }
      // Akış-kaymış satır: harf yukarı, zemin aşağı akar.
      var akisSatir = harf ? (r + yukari) : (r - asagi);
      var satirTam = Math.floor(akisSatir);
      var satirKesir = akisSatir - satirTam;
      // Akan gürültü: kaymış satır komşularını kesir ile harmanla (sürekli akış).
      var g0 = pseudoNoise(c, satirTam);
      var g1 = pseudoNoise(c, satirTam + 1);
      var gurultu = g0 * (1 - satirKesir) + g1 * satirKesir;
      // Faz: akış fazı + hücre jitter'ı. Koherens harfleri senkronlar.
      var fazTemel = harf ? yukari : asagi;
      var fazHucre = (fazTemel + this.jitter[i] * (1 - coh)) % 1;
      var dalga = Math.sin(fazHucre * 6.2831853); // -1..1
      var esik;
      if (harf) {
        esik = prof.letterBase + dalga * prof.letterAmp * coh;
      } else {
        esik = prof.bgBase - dalga * prof.bgAmp * coh;
      }
      if (gurultu < esik) ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  };

  // ---------------------------------------------------------------------
  // Davranış toplayıcı
  // ---------------------------------------------------------------------
  function BehaviorTracker() {
    this.reset();
  }
  BehaviorTracker.prototype.reset = function () {
    this.startedAt = Date.now();
    this.firstInteraction = 0;
    this.mouseSamples = 0;
    this.pathLen = 0;
    this.speeds = [];
    this.accels = [];
    this.lastPt = null;
    this.lastMoveT = 0;
    this.lastSpeed = 0;
    this.lastVec = null;
    this.corners = 0;
    this.keyTimes = [];
    this.keyDown = {};
    this.dwell = [];
    this.hadTouch = false;
    this.hadMouse = false;
    this.focusEvents = 0;
    this.scrollEvents = 0;
    this.visibilityChanges = 0;
    this.pasted = false;
    this.mouseBeforeKey = null; // ilk tuşa kadar fare oldu mu
  };
  BehaviorTracker.prototype.attach = function (root) {
    var self = this;
    function mark() { if (!self.firstInteraction) self.firstInteraction = Date.now() - self.startedAt; }
    root.addEventListener("mousemove", function (e) {
      mark(); self.mouseSamples++; self.hadMouse = true;
      var now = Date.now();
      if (self.lastPt) {
        var dx = e.clientX - self.lastPt[0], dy = e.clientY - self.lastPt[1];
        var dist = Math.sqrt(dx * dx + dy * dy);
        self.pathLen += dist;
        var dt = now - self.lastMoveT;
        if (dt > 0) {
          var sp = dist / dt;
          self.speeds.push(sp);
          self.accels.push(sp - self.lastSpeed); // ivme = hız değişimi
          self.lastSpeed = sp;
        }
        // köşe/yön değişimi tespiti (insan yolu çok mikro-düzeltme içerir)
        if (self.lastVec && dist > 1) {
          var d1 = self.lastVec, mag1 = Math.sqrt(d1[0] * d1[0] + d1[1] * d1[1]);
          var mag2 = dist;
          if (mag1 > 0 && mag2 > 0) {
            var cos = (d1[0] * dx + d1[1] * dy) / (mag1 * mag2);
            if (cos < 0.5) self.corners++; // ~60°'den keskin dönüş
          }
        }
        if (dist > 1) self.lastVec = [dx, dy];
      }
      self.lastPt = [e.clientX, e.clientY]; self.lastMoveT = now;
    });
    root.addEventListener("keydown", function (e) {
      mark();
      self.keyTimes.push(Date.now());
      if (self.mouseBeforeKey === null) self.mouseBeforeKey = self.hadMouse;
      if (e && e.key != null) self.keyDown[e.key] = Date.now();
    });
    root.addEventListener("keyup", function (e) {
      if (e && e.key != null && self.keyDown[e.key]) {
        self.dwell.push(Date.now() - self.keyDown[e.key]);
        delete self.keyDown[e.key];
      }
    });
    root.addEventListener("touchstart", function () { mark(); self.hadTouch = true; });
    root.addEventListener("paste", function () { self.pasted = true; });
    root.addEventListener("scroll", function () { self.scrollEvents++; }, true);
    window.addEventListener("focus", function () { self.focusEvents++; });
    window.addEventListener("scroll", function () { self.scrollEvents++; });
    document.addEventListener("visibilitychange", function () { self.visibilityChanges++; });
  };
  BehaviorTracker.prototype.snapshot = function () {
    var intervals = [];
    for (var i = 1; i < this.keyTimes.length; i++) intervals.push(this.keyTimes[i] - this.keyTimes[i - 1]);
    var mean = this.speeds.length ? this.speeds.reduce(function (a, b) { return a + b; }, 0) / this.speeds.length : 0;
    var variance = this.speeds.length
      ? this.speeds.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / this.speeds.length
      : 0;
    // ivme varyansı
    var aMean = this.accels.length ? this.accels.reduce(function (a, b) { return a + b; }, 0) / this.accels.length : 0;
    var aVar = this.accels.length
      ? this.accels.reduce(function (a, b) { return a + (b - aMean) * (b - aMean); }, 0) / this.accels.length
      : 0;
    var wd = false;
    try { wd = !!navigator.webdriver; } catch (e) { wd = false; }
    var snap = {
      mouseSamples: this.mouseSamples,
      mousePathLength: this.pathLen,
      mouseSpeedVariance: variance,
      keyIntervals: intervals,
      timeToFirstInteraction: this.firstInteraction,
      timeToSubmit: Date.now() - this.startedAt,
      hadTouch: this.hadTouch,
      focusEvents: this.focusEvents,
      pasted: this.pasted,
      // derin biyometri
      mouseCorners: this.corners,
      mouseAccelVariance: aVar,
      keyDwellTimes: this.dwell,
      scrollEvents: this.scrollEvents,
      visibilityChanges: this.visibilityChanges,
      webdriver: wd,
      mouseBeforeKey: this.mouseBeforeKey,
      interactionMix: this.hadTouch && this.hadMouse,
      // Honeypot: görünmez tuzak alanı dolduruldu mu (bot-kesin). İnsan asla
      // göremez (aria-hidden + tabindex=-1 + görsel gizleme); yalnızca DOM'u
      // otomatik dolduran botlar tetikler.
      honeypotTetik: HONEYPOT.tetik
    };
    // Tarayıcı-tutarlılık ortam sinyallerini ekle (deviceMemory, window.chrome,
    // WebGL üreticisi, CPU çekirdek, dil/eklenti sayısı...) — sunucu UA-iddiasıyla
    // çapraz-doğrular.
    var ts = tarayiciSinyalleri();
    for (var k in ts) if (Object.prototype.hasOwnProperty.call(ts, k)) snap[k] = ts[k];
    return snap;
  };

  // ---------------------------------------------------------------------
  // Tarayıcı tutarlılık sinyalleri
  // ---------------------------------------------------------------------
  // UA'nın iddia ettiği tarayıcının GERÇEK JS-ortam imzasını taşıyıp
  // taşımadığını sunucunun (tarayiciTutarlilik) çapraz-doğrulaması için
  // istemci ortam sinyallerini toplar. Her erişim try/catch ile korunur
  // (bazı tarayıcılar bazı API'leri kısıtlar) — hata halinde alan atlanır.
  function tarayiciSinyalleri() {
    var s = {};
    try { s.hardwareConcurrency = navigator.hardwareConcurrency; } catch (e) {}
    try { if ("deviceMemory" in navigator) s.deviceMemory = navigator.deviceMemory; } catch (e) {}
    try { s.dilSayisi = (navigator.languages || []).length; } catch (e) {}
    try { s.eklentiSayisi = (navigator.plugins || []).length; } catch (e) {}
    try { s.chromeNesnesi = !!window.chrome; } catch (e) {}
    try { s.pikselOrani = window.devicePixelRatio || 0; } catch (e) {}
    try { s.dokunmatik = (navigator.maxTouchPoints || 0) > 0; } catch (e) {}
    // WebGL üreticisi (yazılım render = headless işareti)
    try {
      var cnv = document.createElement("canvas");
      var gl = cnv.getContext("webgl") || cnv.getContext("experimental-webgl");
      if (gl) {
        var dbg = gl.getExtension("WEBGL_debug_renderer_info");
        if (dbg) s.webglSaticisi = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      }
    } catch (e) {}
    // AudioContext örnekleme oranı (headless'te sıklıkla eksik/0)
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { var ac = new AC(); s.sesOrnekOrani = ac.sampleRate; ac.close && ac.close(); }
    } catch (e) {}
    return s;
  }

  // Honeypot durum bayrağı (modül-seviyesi) — görünmez tuzak alanı doldurulunca
  // true olur. snapshot() bunu verify sinyallerine ekler.
  var HONEYPOT = { tetik: false };
  /** Challenge kartına görünmez, erişilebilir-güvenli honeypot tuzak alanı ekler. */
  function honeypotAlaniEkle(root) {
    try {
      var trap = document.createElement("input");
      trap.type = "text";
      trap.name = "specter_hp_email"; // otomatik doldurucuları çeken yem ad
      trap.tabIndex = -1;
      trap.setAttribute("aria-hidden", "true");
      trap.setAttribute("autocomplete", "off");
      // Görsel olarak tamamen gizle — CSP-uyumlu sınıf (inline style katı
      // style-src'de bloklanıyordu). Shadow DOM STYLE'ında tanımlı.
      trap.className = "vy-honeypot";
      trap.addEventListener("input", function () { HONEYPOT.tetik = true; });
      root.appendChild(trap);
    } catch (e) { /* sessiz — honeypot opsiyonel katmandır */ }
  }

  // ---------------------------------------------------------------------
  // İşlem-Kanıtı (Proof-of-Work) çözücü
  // ---------------------------------------------------------------------
  // Bir hex hash dizesinin baştaki-sıfır-bit sayısını sayar (verify ile aynı).
  function bastakiSifirBit(hex) {
    var bit = 0;
    for (var i = 0; i < hex.length; i++) {
      var nib = parseInt(hex[i], 16);
      if (nib === 0) { bit += 4; continue; }
      // ilk sıfır-olmayan nibble içindeki baştaki sıfır bitleri
      if (nib < 2) bit += 3; else if (nib < 4) bit += 2; else if (nib < 8) bit += 1;
      break;
    }
    return bit;
  }
  // SHA-256(seed:nonce) → hedefBit kadar baştaki-sıfır bulana dek nonce arar.
  // crypto.subtle mevcut değilse (nadir) sessizce çözümsüz döner (verify eski
  // widget'ları da tolere eder; ancak modern tarayıcıda mevcut).
  function powCoz(seed, hedefBit, bitti) {
    if (!(window.crypto && window.crypto.subtle)) { bitti(null); return; }
    var nonce = 0;
    var enc = new TextEncoder();
    function dene() {
      // Bir turda birkaç bin deneme yaparak UI'yı bloklamadan çöz.
      var tur = 0;
      function adim() {
        window.crypto.subtle.digest("SHA-256", enc.encode(seed + ":" + nonce)).then(function (buf) {
          var arr = new Uint8Array(buf);
          var hex = "";
          for (var i = 0; i < arr.length; i++) hex += ("0" + arr[i].toString(16)).slice(-2);
          if (bastakiSifirBit(hex) >= hedefBit) { bitti({ nonce: nonce, hashHex: hex }); return; }
          nonce++;
          if (tur++ < 20000) adim(); else setTimeout(dene, 0); // yield
        });
      }
      adim();
    }
    dene();
  }

  // ---------------------------------------------------------------------
  // Widget UI (Shadow DOM ile izole)
  // ---------------------------------------------------------------------
  var STYLE = [
    /* TEMA — renkler CSS custom property'lerde; koyu varsayılan :host'ta,
       açık tema :host([data-tema=light])'te SADECE property'leri override eder
       (specificity savaşı yok — aynı değişken). data-theme="light" ile açılır.
       Ghost-font canvas (.cvFrame) property'siz, KOYU sabit kalır (kontrast). */
    ':host{all:initial;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;',
    '--vy-fg:#e8eef7;--vy-bg:radial-gradient(120% 140% at 0% 0%,#16233f 0%,#0c1526 45%,#080d18 100%);',
    '--vy-title:#aebfd4;--vy-hint:#7387a0;--vy-foot:#54657f;--vy-inp-bg:rgba(9,14,26,.8);--vy-inp-bd:rgba(255,255,255,.1);--vy-inp-fg:#fff;',
    '--vy-shadow:0 1px 0 0 rgba(255,255,255,.06) inset,0 20px 60px -18px rgba(0,0,0,.65),0 0 0 1px rgba(103,232,249,.10)}',
    ':host([data-tema=light]){--vy-fg:#1a2436;--vy-bg:linear-gradient(120% 140% at 0% 0%,#ffffff 0%,#f4f6fb 60%,#eaeef6 100%);',
    '--vy-title:#334155;--vy-hint:#64748b;--vy-foot:#64748b;--vy-inp-bg:#ffffff;--vy-inp-bd:rgba(20,40,80,.18);--vy-inp-fg:#1a2436;',
    '--vy-shadow:0 1px 0 0 rgba(255,255,255,.8) inset,0 12px 40px -14px rgba(20,30,60,.25),0 0 0 1px rgba(20,40,80,.10)}',
    '*{box-sizing:border-box}',
    /* Yeni nesil "kart": derin uzay gradyanı + ince cam kenar + katmanlı glow */
    '.box{width:328px;border-radius:20px;position:relative;color:var(--vy-fg);overflow:hidden;',
    'background:var(--vy-bg);',
    'box-shadow:var(--vy-shadow)}',
    /* üst ince aydınlık şerit (glossy) */
    '.box::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(103,232,249,.5),transparent);z-index:2}',
    '.head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px}',
    '.title{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--vy-title);letter-spacing:-.01em}',
    '.title svg{width:16px;height:16px;filter:drop-shadow(0 0 6px rgba(34,211,238,.5))}',
    '.secure{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#5ad1c4}',
    '.secure .lock{width:11px;height:11px}',
    '.canvasWrap{position:relative;padding:2px 16px 0}',
    '.cvFrame{position:relative;border-radius:12px;overflow:hidden;background:#0b1120;box-shadow:0 0 0 1px rgba(255,255,255,.07),inset 0 0 30px rgba(0,0,0,.5)}',
    '.cvFrame canvas{height:104px;width:100%;display:block}', /* CSP: inline canvas.style yerine */
    'canvas{width:100%;height:104px;display:block}',
    /* canvas üstünde hafif tarama-çizgisi dokusu (yeni nesil his) */
    '.scan{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0px,rgba(255,255,255,.025) 1px,transparent 1px,transparent 3px);border-radius:12px}',
    '.reload{position:absolute;top:10px;right:26px;background:rgba(12,20,38,.72);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.09);color:#aebfd4;width:30px;height:30px;border-radius:9px;cursor:pointer;font-size:15px;line-height:1;display:grid;place-items:center;transition:.18s}',
    '.reload:hover{background:rgba(34,211,238,.16);color:#e8f9ff;border-color:rgba(34,211,238,.4);transform:rotate(-45deg)}',
    '.sesBtn{right:62px;font-size:13px}',
    '.sesBtn:hover{transform:none;background:rgba(34,211,238,.16);color:#e8f9ff;border-color:rgba(34,211,238,.4)}',
    '.sesBtn.calisiyor{background:rgba(34,211,238,.24);color:#e8f9ff;border-color:rgba(34,211,238,.6)}',
    '.row{display:flex;gap:9px;padding:13px 16px 6px}',
    /* Yön challenge'ı için ok tuş takımı (input yerine görünür) */
    '.yonPad{display:none;gap:8px;padding:13px 16px 6px}',
    '.yonPad.on{display:flex}',
    '.row.gizli{display:none}',
    '.yonBtn{flex:1;height:44px;border-radius:11px;border:1px solid rgba(255,255,255,.12);background:rgba(9,14,26,.8);color:#cfe3f2;font-size:19px;font-weight:800;cursor:pointer;transition:.16s;display:grid;place-items:center}',
    '.yonBtn:hover{border-color:#22d3ee;color:#e8f9ff;background:rgba(34,211,238,.14)}',
    '.yonBtn.sec{border-color:#22d3ee;background:rgba(34,211,238,.24);color:#e8f9ff;box-shadow:0 0 0 3px rgba(34,211,238,.18)}',
    'input{flex:1;height:44px;border-radius:11px;border:1px solid var(--vy-inp-bd);background:var(--vy-inp-bg);color:var(--vy-inp-fg);padding:0 14px;font-size:16px;font-weight:600;letter-spacing:3px;text-transform:uppercase;outline:none;transition:.18s}',
    'input:focus{border-color:#22d3ee;box-shadow:0 0 0 4px rgba(34,211,238,.18)}',
    'input::placeholder{color:#54657f;letter-spacing:.5px;text-transform:none;font-weight:500}',
    '.btn{height:44px;padding:0 20px;border-radius:11px;border:none;background:linear-gradient(180deg,#2ee0f5,#06b6d4);color:#042028;font-weight:800;font-size:14px;cursor:pointer;transition:.18s;box-shadow:0 4px 14px -4px rgba(6,182,212,.6)}',
    '.btn:hover{filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 6px 20px -4px rgba(6,182,212,.7)}',
    '.btn:active{transform:translateY(0)}',
    '.btn:disabled{opacity:.45;cursor:default;filter:none;transform:none;box-shadow:none}',
    '.foot{display:flex;align-items:center;justify-content:space-between;padding:10px 16px 13px;font-size:11px;color:var(--vy-foot)}',
    '.brand{display:flex;align-items:center;gap:6px;font-weight:700;color:#8fa8bd}',
    '.brand a{color:inherit;text-decoration:none}',
    '.dot{width:7px;height:7px;border-radius:50%;background:#22d3ee;box-shadow:0 0 10px #22d3ee;animation:pl 1.8s ease-in-out infinite}',
    '@keyframes pl{0%,100%{opacity:1}50%{opacity:.35}}',
    '.links{display:flex;gap:10px}',
    '.links a{color:#54657f;text-decoration:none}.links a:hover{color:#8fa8bd}',
    '.state{display:none;padding:30px 18px;text-align:center;flex-direction:column;align-items:center;gap:10px}',
    '.state.on{display:flex}',
    '.check{width:52px;height:52px;border-radius:50%;background:radial-gradient(circle,rgba(16,185,129,.28),rgba(16,185,129,.08));color:#34d399;display:grid;place-items:center;font-size:26px;box-shadow:0 0 0 1px rgba(52,211,153,.3),0 0 24px -4px rgba(52,211,153,.5);animation:pop .35s cubic-bezier(.2,1.4,.4,1)}',
    '@keyframes pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}',
    '.spinner{width:40px;height:40px;border-radius:50%;border:3px solid rgba(34,211,238,.16);border-top-color:#22d3ee;animation:sp .7s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}',
    '.xmark{width:52px;height:52px;border-radius:50%;background:radial-gradient(circle,rgba(220,38,38,.26),rgba(220,38,38,.08));color:#f87171;display:grid;place-items:center;font-size:26px;box-shadow:0 0 0 1px rgba(248,113,113,.3)}',
    '.msg{font-size:15px;font-weight:600;color:#e8eef7;letter-spacing:-.01em}',
    '.hint{font-size:12.5px;color:var(--vy-hint)}',
    /* CSP-UYUMLU gizleme sınıfları — inline style yerine (katı style-src 'self'
       olan müşteri sitelerinde inline style CSP ihlali yapıyordu). */
    '.vy-honeypot{position:absolute!important;left:-9999px!important;top:-9999px!important;width:1px;height:1px;opacity:0;pointer-events:none}',
    '.vy-sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}',
    '.vy-gizli{display:none!important}',
    '@media (prefers-reduced-motion:reduce){.dot,.check{animation:none}}'
  ].join("");

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === "class") el.className = attrs[k]; else el.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }

  // SVG string → canlı SVG düğümü (inline ikonlar için).
  function svg(markup) {
    var wrap = document.createElement("div");
    wrap.innerHTML = markup.trim();
    return wrap.firstChild;
  }

  function mount(target) {
    var sitekey = target.getAttribute("data-sitekey");
    if (!sitekey) { target.textContent = "[specter: data-sitekey eksik]"; return; }
    if (target.__specterMounted) return;
    target.__specterMounted = true;

    var shadow = target.attachShadow ? target.attachShadow({ mode: "open" }) : target;
    // Stil enjeksiyonu — CSP-UYUMLU: katı style-src 'self' olan sitelerde <style>
    // element'i (özellikle host'a düşerse) CSP ihlali raporluyor. Constructable
    // StyleSheet (adoptedStyleSheets) style-src'den MUAF — desteklenirse onu kullan,
    // yoksa <style>'a düş (eski tarayıcı; Shadow DOM'da zaten izole).
    var stilKondu = false;
    try {
      if (shadow.adoptedStyleSheets && typeof CSSStyleSheet === "function") {
        var sheet = new CSSStyleSheet();
        sheet.replaceSync(STYLE);
        shadow.adoptedStyleSheets = [sheet];
        stilKondu = true;
      }
    } catch (e) { stilKondu = false; }
    if (!stilKondu) { var style = h("style"); style.textContent = STYLE; shadow.appendChild(style); }

    // ----- i18n: dil algıla (data-lang > <html lang> > tarayıcı > tr) -----
    var I18N = {
      tr: {
        title: "İnsan doğrulaması", secure: "Şifreli", placeholder: "Beliren kodu girin",
        verify: "Doğrula", reload: "Yeni kod üret", audio: "Kodu sesli dinle",
        audioLabel: "Doğrulama kodunu sesli dinle", codeLabel: "Doğrulama kodu",
        canvasLabel: "Ghost-font doğrulama kodu — hareketli görüntüde beliren karakterleri girin",
        success: "İnsan olduğun doğrulandı", successHint: "Formu gönderebilirsin",
        fail: "Doğrulama başarısız", failHint: "Tekrar deneyin",
        hata: "Doğrulama şu an kullanılamıyor", hataHint: "Site yapılandırması veya bağlantı sorunu — lütfen sonra tekrar deneyin.",
        checking: "İnsan olduğun kontrol ediliyor…", checkingHint: "Bir saniye sürebilir",
        protected: "Veylify ile korunuyor", privacy: "Gizlilik", terms: "Şartlar",
        reducedMotion: "Hareket kapalı — kodu sesli dinleyin", wrong: "Yanlış kod",
        audioPlaying: "Doğrulama kodu sesli çalınıyor. ",
        // Challenge türüne göre talimat + placeholder + erişilebilir etiketler
        phSayi: "Beliren rakamları girin", phSec: "Nokta sayısını girin",
        phYon: "Okun yönünü seçin",
        canvasSayi: "Ghost-font doğrulama — hareketli görüntüde beliren rakamları girin",
        canvasSec: "Ghost-font doğrulama — hareketli görüntüde beliren noktaların sayısını girin",
        canvasYon: "Ghost-font doğrulama — hareketli görüntüde beliren okun yönünü seçin",
        yonYukari: "Yukarı", yonAsagi: "Aşağı", yonSol: "Sol", yonSag: "Sağ",
        audioSec: "Beliren nokta sayısı sesli çalınıyor.",
        audioYon: "Okun yönü sesli çalınıyor."
      },
      en: {
        title: "Human verification", secure: "Encrypted", placeholder: "Enter the code shown",
        verify: "Verify", reload: "New code", audio: "Listen to code",
        audioLabel: "Listen to the verification code", codeLabel: "Verification code",
        canvasLabel: "Ghost-font verification code — enter the characters that appear in the moving image",
        success: "You're verified as human", successHint: "You can submit the form",
        fail: "Verification failed", failHint: "Please try again",
        hata: "Verification unavailable", hataHint: "Site configuration or connection issue — please try again later.",
        checking: "Verifying you're human…", checkingHint: "This may take a second",
        protected: "Protected by Veylify", privacy: "Privacy", terms: "Terms",
        reducedMotion: "Motion off — listen to the code", wrong: "Wrong code",
        audioPlaying: "Verification code is playing. ",
        phSayi: "Enter the digits shown", phSec: "Enter the number of dots",
        phYon: "Pick the arrow's direction",
        canvasSayi: "Ghost-font verification — enter the digits that appear in the moving image",
        canvasSec: "Ghost-font verification — enter how many dots appear in the moving image",
        canvasYon: "Ghost-font verification — pick the direction the arrow points in the moving image",
        yonYukari: "Up", yonAsagi: "Down", yonSol: "Left", yonSag: "Right",
        audioSec: "The number of dots is playing.",
        audioYon: "The arrow direction is playing."
      },
      de: {
        title: "Mensch-Verifizierung", secure: "Verschlüsselt", placeholder: "Angezeigten Code eingeben",
        verify: "Bestätigen", reload: "Neuer Code", audio: "Code anhören",
        audioLabel: "Den Bestätigungscode anhören", codeLabel: "Bestätigungscode",
        canvasLabel: "Ghost-Font-Bestätigungscode — geben Sie die Zeichen ein, die im bewegten Bild erscheinen",
        success: "Als Mensch bestätigt", successHint: "Sie können das Formular absenden",
        fail: "Bestätigung fehlgeschlagen", failHint: "Bitte erneut versuchen",
        checking: "Prüfung, ob Sie ein Mensch sind…", checkingHint: "Das kann einen Moment dauern",
        protected: "Geschützt durch Veylify", privacy: "Datenschutz", terms: "Bedingungen",
        reducedMotion: "Bewegung aus — Code anhören", wrong: "Falscher Code",
        audioPlaying: "Der Bestätigungscode wird abgespielt. ",
        phSayi: "Angezeigte Ziffern eingeben", phSec: "Anzahl der Punkte eingeben",
        phYon: "Richtung des Pfeils wählen",
        canvasSayi: "Ghost-Font-Bestätigung — geben Sie die Ziffern ein, die im bewegten Bild erscheinen",
        canvasSec: "Ghost-Font-Bestätigung — geben Sie ein, wie viele Punkte im bewegten Bild erscheinen",
        canvasYon: "Ghost-Font-Bestätigung — wählen Sie die Richtung, in die der Pfeil im bewegten Bild zeigt",
        yonYukari: "Oben", yonAsagi: "Unten", yonSol: "Links", yonSag: "Rechts",
        audioSec: "Die Anzahl der Punkte wird abgespielt.",
        audioYon: "Die Pfeilrichtung wird abgespielt."
      },
      fr: {
        title: "Vérification humaine", secure: "Chiffré", placeholder: "Saisissez le code affiché",
        verify: "Vérifier", reload: "Nouveau code", audio: "Écouter le code",
        audioLabel: "Écouter le code de vérification", codeLabel: "Code de vérification",
        canvasLabel: "Code de vérification ghost-font — saisissez les caractères qui apparaissent dans l'image animée",
        success: "Vérifié en tant qu'humain", successHint: "Vous pouvez envoyer le formulaire",
        fail: "Échec de la vérification", failHint: "Veuillez réessayer",
        checking: "Vérification que vous êtes humain…", checkingHint: "Cela peut prendre un instant",
        protected: "Protégé par Veylify", privacy: "Confidentialité", terms: "Conditions",
        reducedMotion: "Animation désactivée — écoutez le code", wrong: "Code incorrect",
        audioPlaying: "Le code de vérification est en cours de lecture. ",
        phSayi: "Saisissez les chiffres affichés", phSec: "Saisissez le nombre de points",
        phYon: "Choisissez la direction de la flèche",
        canvasSayi: "Vérification ghost-font — saisissez les chiffres qui apparaissent dans l'image animée",
        canvasSec: "Vérification ghost-font — saisissez combien de points apparaissent dans l'image animée",
        canvasYon: "Vérification ghost-font — choisissez la direction indiquée par la flèche dans l'image animée",
        yonYukari: "Haut", yonAsagi: "Bas", yonSol: "Gauche", yonSag: "Droite",
        audioSec: "Le nombre de points est en cours de lecture.",
        audioYon: "La direction de la flèche est en cours de lecture."
      },
      es: {
        title: "Verificación humana", secure: "Cifrado", placeholder: "Introduce el código mostrado",
        verify: "Verificar", reload: "Nuevo código", audio: "Escuchar el código",
        audioLabel: "Escuchar el código de verificación", codeLabel: "Código de verificación",
        canvasLabel: "Código de verificación ghost-font — introduce los caracteres que aparecen en la imagen en movimiento",
        success: "Verificado como humano", successHint: "Puedes enviar el formulario",
        fail: "Verificación fallida", failHint: "Inténtalo de nuevo",
        checking: "Comprobando que eres humano…", checkingHint: "Puede tardar un momento",
        protected: "Protegido por Veylify", privacy: "Privacidad", terms: "Términos",
        reducedMotion: "Movimiento desactivado — escucha el código", wrong: "Código incorrecto",
        audioPlaying: "El código de verificación se está reproduciendo. ",
        phSayi: "Introduce los dígitos mostrados", phSec: "Introduce el número de puntos",
        phYon: "Elige la dirección de la flecha",
        canvasSayi: "Verificación ghost-font — introduce los dígitos que aparecen en la imagen en movimiento",
        canvasSec: "Verificación ghost-font — introduce cuántos puntos aparecen en la imagen en movimiento",
        canvasYon: "Verificación ghost-font — elige la dirección que señala la flecha en la imagen en movimiento",
        yonYukari: "Arriba", yonAsagi: "Abajo", yonSol: "Izquierda", yonSag: "Derecha",
        audioSec: "El número de puntos se está reproduciendo.",
        audioYon: "La dirección de la flecha se está reproduciendo."
      },
      // Arapça (RTL) — mount() içinde lang==="ar" olduğunda container'a dir="rtl" eklenir.
      ar: {
        title: "التحقق البشري", secure: "مُشفَّر", placeholder: "أدخل الرمز الظاهر",
        verify: "تحقّق", reload: "رمز جديد", audio: "استمع إلى الرمز",
        audioLabel: "استمع إلى رمز التحقق", codeLabel: "رمز التحقق",
        canvasLabel: "رمز تحقق ghost-font — أدخل الأحرف التي تظهر في الصورة المتحركة",
        success: "تم التحقق من أنك إنسان", successHint: "يمكنك إرسال النموذج",
        fail: "فشل التحقق", failHint: "يرجى المحاولة مرة أخرى",
        checking: "جارٍ التحقق من أنك إنسان…", checkingHint: "قد يستغرق هذا لحظة",
        protected: "محمي بواسطة Veylify", privacy: "الخصوصية", terms: "الشروط",
        reducedMotion: "الحركة متوقفة — استمع إلى الرمز", wrong: "رمز خاطئ",
        audioPlaying: "يتم تشغيل رمز التحقق. ",
        phSayi: "أدخل الأرقام الظاهرة", phSec: "أدخل عدد النقاط",
        phYon: "اختر اتجاه السهم",
        canvasSayi: "تحقق ghost-font — أدخل الأرقام التي تظهر في الصورة المتحركة",
        canvasSec: "تحقق ghost-font — أدخل عدد النقاط التي تظهر في الصورة المتحركة",
        canvasYon: "تحقق ghost-font — اختر الاتجاه الذي يشير إليه السهم في الصورة المتحركة",
        yonYukari: "أعلى", yonAsagi: "أسفل", yonSol: "يسار", yonSag: "يمين",
        audioSec: "يتم تشغيل عدد النقاط.",
        audioYon: "يتم تشغيل اتجاه السهم."
      },
      ru: {
        title: "Проверка на человека", secure: "Зашифровано", placeholder: "Введите показанный код",
        verify: "Проверить", reload: "Новый код", audio: "Прослушать код",
        audioLabel: "Прослушать код проверки", codeLabel: "Код проверки",
        canvasLabel: "Код проверки ghost-font — введите символы, которые появляются на движущемся изображении",
        success: "Вы подтверждены как человек", successHint: "Вы можете отправить форму",
        fail: "Проверка не пройдена", failHint: "Пожалуйста, попробуйте снова",
        checking: "Проверяем, что вы человек…", checkingHint: "Это может занять секунду",
        protected: "Защищено Veylify", privacy: "Конфиденциальность", terms: "Условия",
        reducedMotion: "Движение отключено — прослушайте код", wrong: "Неверный код",
        audioPlaying: "Воспроизводится код проверки. ",
        phSayi: "Введите показанные цифры", phSec: "Введите количество точек",
        phYon: "Выберите направление стрелки",
        canvasSayi: "Проверка ghost-font — введите цифры, которые появляются на движущемся изображении",
        canvasSec: "Проверка ghost-font — введите, сколько точек появляется на движущемся изображении",
        canvasYon: "Проверка ghost-font — выберите направление, куда указывает стрелка на движущемся изображении",
        yonYukari: "Вверх", yonAsagi: "Вниз", yonSol: "Влево", yonSag: "Вправо",
        audioSec: "Воспроизводится количество точек.",
        audioYon: "Воспроизводится направление стрелки."
      },
      pt: {
        title: "Verificação humana", secure: "Encriptado", placeholder: "Introduza o código exibido",
        verify: "Verificar", reload: "Novo código", audio: "Ouvir o código",
        audioLabel: "Ouvir o código de verificação", codeLabel: "Código de verificação",
        canvasLabel: "Código de verificação ghost-font — introduza os caracteres que aparecem na imagem em movimento",
        success: "Verificado como humano", successHint: "Pode enviar o formulário",
        fail: "Falha na verificação", failHint: "Tente novamente",
        checking: "A verificar se é humano…", checkingHint: "Isto pode demorar um instante",
        protected: "Protegido pela Veylify", privacy: "Privacidade", terms: "Termos",
        reducedMotion: "Movimento desligado — ouça o código", wrong: "Código incorreto",
        audioPlaying: "O código de verificação está a ser reproduzido. ",
        phSayi: "Introduza os dígitos exibidos", phSec: "Introduza o número de pontos",
        phYon: "Escolha a direção da seta",
        canvasSayi: "Verificação ghost-font — introduza os dígitos que aparecem na imagem em movimento",
        canvasSec: "Verificação ghost-font — introduza quantos pontos aparecem na imagem em movimento",
        canvasYon: "Verificação ghost-font — escolha a direção para onde a seta aponta na imagem em movimento",
        yonYukari: "Cima", yonAsagi: "Baixo", yonSol: "Esquerda", yonSag: "Direita",
        audioSec: "O número de pontos está a ser reproduzido.",
        audioYon: "A direção da seta está a ser reproduzida."
      }
    };
    var lang = (target.getAttribute("data-lang") ||
      (document.documentElement.getAttribute("lang") || "").slice(0, 2) ||
      (navigator.language || "tr").slice(0, 2) || "tr").toLowerCase();
    var T = I18N[lang] || I18N.tr;
    // RTL dilleri (şu an yalnızca Arapça). Widget kökü ve gövdesi sağdan-sola
    // akmalı — böylece hizalama, tuş takımı ve okun yönü doğru görünür.
    var RTL = lang === "ar";

    // TEMA: data-theme (light|dark|auto). auto → prefers-color-scheme. light
    // seçilince host'a data-tema="light" set edilir; STYLE'daki :host([data-tema=
    // light]) CSS custom property'leri override eder (dış kutu+metin+input açılır,
    // ghost-canvas koyu kalır). Varsayılan koyu (widget'ın özgün tasarımı).
    var temaAttr = (target.getAttribute("data-theme") || "auto").toLowerCase();
    var acikTema = temaAttr === "light";
    if (temaAttr === "auto") {
      try { acikTema = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches; } catch (e) { acikTema = false; }
    }
    if (acikTema) target.setAttribute("data-tema", "light");

    var canvas = h("canvas", { role: "img", "aria-label": T.canvasLabel });
    var input = h("input", { type: "text", placeholder: T.placeholder, maxlength: "8", autocomplete: "off", spellcheck: "false", "aria-label": T.codeLabel, inputmode: "text" });
    var btn = h("button", { class: "btn", type: "button", "aria-label": T.verify }, [T.verify]);
    var reload = h("button", { class: "reload", type: "button", title: T.reload, "aria-label": T.reload }, ["↻"]);
    // Erişilebilirlik: sesli okuma butonu (ghost-font'u göremeyenler için WCAG alternatifi).
    var sesBtn = h("button", { class: "reload sesBtn", type: "button", title: T.audio, "aria-label": T.audioLabel }, ["🔊"]);

    // başlık şeridi: ghost ikonu + "İnsan doğrulaması" + uçtan uca şifreli rozeti
    var ghostSvg = svg('<svg viewBox="0 0 32 32" fill="none"><defs><linearGradient id="wg" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#67e8f9"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><path d="M16 3c-5.5 0-9.5 4.2-9.5 10.2V27c0 1.1 1.3 1.7 2.2 1l1.6-1.3c.5-.4 1.2-.4 1.7 0l1.8 1.4c.5.4 1.2.4 1.7 0l1.8-1.4c.5-.4 1.2-.4 1.7 0l1.6 1.3c.9.7 2.2.1 2.2-1V13.2C25.5 7.2 21.5 3 16 3Z" fill="url(#wg)"/><circle cx="12" cy="14" r="2" fill="#04222b"/><circle cx="20" cy="14" r="2" fill="#04222b"/></svg>');
    var lockSvg = svg('<svg class="lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>');
    var head = h("div", { class: "head" }, [
      h("div", { class: "title" }, [ghostSvg, T.title]),
      h("div", { class: "secure" }, [lockSvg, T.secure])
    ]);

    // Yön tuş takımı (yalnızca "yon" türünde görünür). Her buton U/D/L/R
    // cevabını yazıp doğrular. Bot, hareketli oku tek kareden okuyamaz.
    var yonBtnU = h("button", { class: "yonBtn", type: "button", "data-yon": "U", "aria-label": T.yonYukari }, ["↑"]);
    var yonBtnL = h("button", { class: "yonBtn", type: "button", "data-yon": "L", "aria-label": T.yonSol }, ["←"]);
    var yonBtnD = h("button", { class: "yonBtn", type: "button", "data-yon": "D", "aria-label": T.yonAsagi }, ["↓"]);
    var yonBtnR = h("button", { class: "yonBtn", type: "button", "data-yon": "R", "aria-label": T.yonSag }, ["→"]);
    var yonPad = h("div", { class: "yonPad" }, [yonBtnL, yonBtnU, yonBtnD, yonBtnR]);

    var frame = h("div", { class: "cvFrame" }, [canvas, h("div", { class: "scan" })]);
    var row = h("div", { class: "row" }, [input, btn]);
    var challengeState = h("div");
    challengeState.appendChild(head);
    challengeState.appendChild(h("div", { class: "canvasWrap" }, [frame, sesBtn, reload]));
    challengeState.appendChild(row);
    challengeState.appendChild(yonPad);
    // Görünmez honeypot tuzak alanı — botların DOM'u parse edip doldurmasını
    // yakalar; insan/ekran-okuyucu asla görmez.
    honeypotAlaniEkle(challengeState);
    // ekran okuyucu için görünmez canlı-duyuru bölgesi
    challengeState.appendChild(h("div", { class: "sesDuyuru vy-sr-only", role: "status", "aria-live": "polite" }));

    var successState = h("div", { class: "state", role: "status", "aria-live": "polite" }, [
      h("div", { class: "check" }, ["✓"]),
      h("div", { class: "msg" }, [T.success]),
      h("div", { class: "hint" }, [T.successHint])
    ]);
    var failMsg = h("div", { class: "msg" }, [T.fail]);
    var failHint = h("div", { class: "hint" }, [T.failHint]);
    var failState = h("div", { class: "state", role: "alert", "aria-live": "assertive" }, [
      h("div", { class: "xmark" }, ["✕"]),
      failMsg,
      failHint
    ]);

    // Görünmez mod kontrol durumu (Turnstile tarzı "kontrol ediliyor").
    var checkingState = h("div", { class: "state", role: "status", "aria-live": "polite" }, [
      h("div", { class: "spinner" }),
      h("div", { class: "msg" }, [T.checking]),
      h("div", { class: "hint" }, [T.checkingHint])
    ]);

    var foot = h("div", { class: "foot" }, [
      h("div", { class: "brand" }, [h("span", { class: "dot" }), h("a", { href: ORIGIN, target: "_blank", rel: "noopener" }, [T.protected])]),
      h("div", { class: "links" }, [
        h("a", { href: ORIGIN + "/gizlilik", target: "_blank", rel: "noopener" }, [T.privacy]),
        h("a", { href: ORIGIN + "/sartlar", target: "_blank", rel: "noopener" }, [T.terms])
      ])
    ]);

    var box = h("div", { class: "box", role: "group", "aria-label": "Veylify insan doğrulaması" }, [challengeState, checkingState, successState, failState, foot]);
    // Arapça (ve gelecekte diğer RTL diller) için kartı sağdan-sola akıt.
    if (RTL) box.setAttribute("dir", "rtl");
    shadow.appendChild(box);

    // Müşteri formuna verification token'ı yazacak gizli input.
    var hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = target.getAttribute("data-response-field") || "veylify-token";
    target.appendChild(hidden);

    var tracker = new BehaviorTracker();
    tracker.attach(shadow);

    var state = { token: null, params: null, powCozum: null };
    var field = null, raf = 0, animStart = 0;
    var ttlTimer = 0; // TTL otomatik-yenileme zamanlayıcısı (kod süresi dolmadan tazele).

    function show(which) {
      // CSP-uyumlu: inline .style.display yerine class toggle (katı style-src).
      challengeState.classList.toggle("vy-gizli", which !== "challenge");
      checkingState.classList.toggle("on", which === "checking");
      successState.classList.toggle("on", which === "success");
      failState.classList.toggle("on", which === "fail");
      // challenge dışına çıkınca animasyonu durdur (kaynak tasarrufu).
      if (which !== "challenge" && raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    // Challenge türüne göre UI'yi ayarla (input modu, placeholder, canvas
    // etiketi, yön tuş takımı). Render tekniği DEĞİŞMEZ; sadece giriş yüzeyi.
    function applyType(type) {
      type = type || "kod";
      var yon = type === "yon";
      yonPad.classList.toggle("on", yon);
      row.classList.toggle("gizli", yon); // yon'da metin kutusu gizli, tuş takımı görünür
      // seçili yön butonunu temizle
      [yonBtnU, yonBtnD, yonBtnL, yonBtnR].forEach(function (b) { b.classList.remove("sec"); });
      if (type === "sayi") {
        input.setAttribute("inputmode", "numeric");
        input.setAttribute("placeholder", T.phSayi);
        input.setAttribute("maxlength", "8");
        canvas.setAttribute("aria-label", T.canvasSayi);
      } else if (type === "sec") {
        input.setAttribute("inputmode", "numeric");
        input.setAttribute("placeholder", T.phSec);
        input.setAttribute("maxlength", "2");
        canvas.setAttribute("aria-label", T.canvasSec);
      } else if (type === "yon") {
        canvas.setAttribute("aria-label", T.canvasYon);
      } else {
        input.setAttribute("inputmode", "text");
        input.setAttribute("placeholder", T.placeholder);
        input.setAttribute("maxlength", "8");
        canvas.setAttribute("aria-label", T.canvasLabel);
      }
    }

    // GERÇEK ghost-font: canlı animasyon döngüsü. Kod, hareketli nokta
    // gürültüsü içinde belirir; insan okur, statik ekran görüntüsü kör kalır.
    function draw() {
      var p = state.params;
      applyType(p.type);
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      var cssW = 296, cssH = 104;
      canvas.width = cssW * ratio; canvas.height = cssH * ratio;
      // Görsel yükseklik CSS'te (.cvFrame canvas) — inline canvas.style CSP ihlaliydi.
      var ctx = canvas.getContext("2d");
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      field = new GhostField(ctx, p.seed, p.length, p.difficulty, cssW, cssH, p.type);
      if (raf) cancelAnimationFrame(raf);
      animStart = 0;
      // Erişilebilirlik: kullanıcı "hareketi azalt" tercih ediyorsa ghost-font
      // (hareket gerektirir) yerine ses modunu vurgula — WCAG uyumu.
      var azMotion = false;
      try { azMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
      if (azMotion) { sesBtn.classList.add("calisiyor"); sesBtn.setAttribute("title", T.reducedMotion); }
      function loop(ts) {
        if (!animStart) animStart = ts;
        if (field) field.render(ts - animStart);
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);
    }

    function loadChallenge() {
      input.value = ""; btn.disabled = true; input.disabled = true;
      // Önceki TTL yenileme zamanlayıcısını temizle (üst üste binmesin).
      if (ttlTimer) { clearTimeout(ttlTimer); ttlTimer = 0; }
      fetch(ORIGIN + "/api/v1/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteKey: sitekey })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.error) throw new Error(data.error);
          state.token = data.token; state.params = data.params;
          // Şüpheli IP için sunucu PoW zorluğu istediyse, arka planda çöz —
          // kullanıcı challenge'ı çözerken CPU nonce'u bulur (görünmez).
          state.powCozum = null;
          if (data.pow && data.pow.hedefBit) {
            powCoz(String(data.pow.seed), data.pow.hedefBit, function (c) { state.powCozum = c; });
          }
          tracker.reset();
          draw();
          btn.disabled = false; input.disabled = false;
          show("challenge");
          // TTL OTOMATİK YENİLEME: kod süresi dolmadan ~8sn önce sessizce yeni
          // challenge çek. Böylece formu açık bırakıp geç kalan kullanıcı
          // "süresi dolmuş kod" hatası ALMAZ; challenge her zaman geçerli kalır.
          // Yalnızca challenge hâlâ görünürken (kullanıcı çözmediyse) yenilenir.
          var ttlSn = typeof data.ttl === "number" && data.ttl > 15 ? data.ttl : 120;
          ttlTimer = setTimeout(function () {
            // success/checking'e geçildiyse dokunma; sadece bekleyen challenge'ı tazele.
            if (!challengeState.classList.contains("vy-gizli")) loadChallenge();
          }, (ttlSn - 8) * 1000);
        })
        .catch(function () {
          // YAPILANDIRMA/BAĞLANTI HATASI — kullanıcı hatası DEĞİL (geçersiz
          // site-key, API erişilemez, 500). Kullanıcıya "başarısız, tekrar dene"
          // göstermek yanıltıcıydı (sonsuz döngü). Bunun yerine net "kullanılamıyor"
          // mesajı; tekrar-dene otomasyonu tetiklenmez (submit akışına girilmez).
          failMsg.textContent = T.hata || T.fail;
          failHint.textContent = T.hataHint || T.failHint;
          show("fail");
        });
    }

    // GÖRÜNMEZ MOD: önce sadece davranışla pasif doğrulama dene. Skor
    // yeterse challenge HİÇ gösterilmez (sürtünmesiz). Değilse challenge'a düş.
    function load() {
      tracker.reset();
      show("checking"); // Turnstile tarzı "kontrol ediliyor" durumu
      // kısa bir süre etkileşim topla, sonra passive dene
      setTimeout(function () {
        fetch(ORIGIN + "/api/v1/passive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteKey: sitekey, signals: tracker.snapshot() })
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.passed && res.token) {
              hidden.value = res.token;
              show("success");
              basariBildir(res);
            } else {
              loadChallenge();
            }
          })
          .catch(function () { loadChallenge(); });
      }, 1400);
    }

    function submit() {
      if (!state.token) return;
      btn.disabled = true;
      // PoW çözümü bulunduysa sinyallere ekle (sunucu token'daki powBit'i
      // bu nonce+hash ile doğrular). Yoksa alanlar tanımsız kalır.
      var sig = tracker.snapshot();
      if (state.powCozum) { sig.powNonce = state.powCozum.nonce; sig.powHashHex = state.powCozum.hashHex; }
      fetch(ORIGIN + "/api/v1/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteKey: sitekey,
          token: state.token,
          input: input.value,
          signals: sig
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.success) {
            hidden.value = res.token;
            // Doğrulandı → TTL yenileme timer'ını durdur (artık gereksiz).
            if (ttlTimer) { clearTimeout(ttlTimer); ttlTimer = 0; }
            show("success");
            basariBildir(res);
          } else {
            // Normal kullanıcı hatası (yanlış cevap) → "başarısız, tekrar dene"
            // (config-hata modundan sonra metni normale döndür).
            failMsg.textContent = T.fail;
            failHint.textContent = T.failHint;
            show("fail");
            setTimeout(load, 1200);
          }
        })
        .catch(function () { btn.disabled = false; });
    }

    // ERİŞİLEBİLİRLİK: kodu sesli oku. Ghost-font'u göremeyenler için WCAG
    // alternatifi. Her karakter, Web Audio ile karaktere özgü bir ton dizisiyle
    // (morse-benzeri ritim) çalınır — ekran okuyucudan bağımsız, evrensel.
    var audioCtx = null;
    function ton(frekans, baslangic, sure, ctx) {
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.value = frekans;
      gain.gain.setValueAtTime(0, baslangic);
      gain.gain.linearRampToValueAtTime(0.28, baslangic + 0.02);
      gain.gain.linearRampToValueAtTime(0, baslangic + sure);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(baslangic); osc.stop(baslangic + sure + 0.02);
    }
    function sesileOku() {
      var p = state.params;
      if (!p) return;
      var type = p.type || "kod";
      var cevap = deriveAnswer(p.seed, p.length, type);
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return; }
      if (audioCtx.state === "suspended") audioCtx.resume();
      sesBtn.classList.add("calisiyor");
      var t = audioCtx.currentTime + 0.1;
      var duyuru = shadow.querySelector(".sesDuyuru");
      if (type === "yon") {
        // Yön: her yön farklı bir ton çifti (U yüksek → R alçak). Cevap tek harf.
        var yonFrek = { U: 900, D: 400, L: 550, R: 750 };
        var f = yonFrek[cevap] || 600;
        ton(f, t, 0.22, audioCtx); ton(f, t + 0.3, 0.22, audioCtx);
        t += 0.7;
        if (duyuru) duyuru.textContent = T.audioYon;
      } else if (type === "sec") {
        // Say: nokta sayısı kadar eşit tonlu bip (kullanıcı sayar).
        var n = parseInt(cevap, 10) || 0;
        for (var k = 0; k < n; k++) { ton(660, t, 0.16, audioCtx); t += 0.42; }
        if (duyuru) duyuru.textContent = T.audioSec;
      } else {
        // kod / sayi — ERİŞİLEBİLİRLİK: görme engelli kullanıcının kodu GERÇEKTEN
        // anlaması için karakterleri KONUŞARAK oku (speechSynthesis). Yükselen
        // frekans tonu tek başına kodu iletmez (kimse ton dizisinden "TXY44"
        // çıkaramaz) — o yüzden konuşma asıl kanaldır; ton, konuşma yoksa
        // (tarayıcı desteklemiyorsa) geri-bildirim fallback'i olarak kalır.
        var pool = type === "sayi" ? NUMERIC_CHARSET : CHARSET;
        var konusmaVar = false;
        try {
          if (window.speechSynthesis && typeof window.SpeechSynthesisUtterance === "function") {
            window.speechSynthesis.cancel();
            // Harfleri tek tek, aralarında kısa duraklamayla oku: "T. X. Y. 4. 4."
            var seslendir = cevap.split("").join(". ") + ".";
            var u = new window.SpeechSynthesisUtterance(seslendir);
            u.lang = lang === "tr" ? "tr-TR" : lang === "en" ? "en-US" : lang;
            u.rate = 0.7;   // yavaş — her karakter net duyulsun
            u.pitch = 1;
            window.speechSynthesis.speak(u);
            konusmaVar = true;
          }
        } catch (e) { konusmaVar = false; }
        // Ton: konuşma desteği yoksa kod-taşıyıcı; varsa yalnızca ritim eşliği.
        if (!konusmaVar) {
          for (var i = 0; i < cevap.length; i++) {
            var idx = pool.indexOf(cevap[i]); if (idx < 0) idx = 0;
            var frekans = 300 + (idx / pool.length) * 800;
            ton(frekans, t, 0.18, audioCtx);
            ton(frekans, t + 0.24, 0.18, audioCtx);
            t += 0.62;
          }
        }
        // Karakter sayısı son eki: tr/en için mevcut davranış korunur; diğer
        // dillerde T.audioPlaying zaten tam bir cümledir, sayı eki eklenmez.
        var sonEk = lang === "tr" ? " karakter." : lang === "en" ? " characters." : "";
        if (duyuru) duyuru.textContent = T.audioPlaying + (sonEk ? cevap.length + sonEk : "");
      }
      setTimeout(function () { sesBtn.classList.remove("calisiyor"); }, (t - audioCtx.currentTime) * 1000);
    }

    // Doğrulama başarılı olduğunda: (1) event dispatch (mevcut), (2) data-callback
    // ile belirtilen GLOBAL fonksiyonu token'la çağır (reCAPTCHA/Turnstile deseni —
    // event dinlemeden kolay entegrasyon: <div class="veylify" data-callback="onOk">
    // + window.onOk = function(token){...}). Callback token'ı argüman olarak alır.
    function basariBildir(res) {
      target.dispatchEvent(new CustomEvent("veylify-verified", { detail: res, bubbles: true }));
      target.dispatchEvent(new CustomEvent("specter-verified", { detail: res, bubbles: true }));
      var cbAd = target.getAttribute("data-callback");
      if (cbAd && typeof window[cbAd] === "function") {
        try { window[cbAd](res.token, res); } catch (e) { /* müşteri callback'i patlarsa widget'ı bozma */ }
      }
    }

    btn.addEventListener("click", submit);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
    reload.addEventListener("click", load);
    sesBtn.addEventListener("click", sesileOku);

    // Yön challenge'ı: bir ok butonuna basmak cevabı (U/D/L/R) yazıp doğrular.
    [yonBtnU, yonBtnD, yonBtnL, yonBtnR].forEach(function (b) {
      b.addEventListener("click", function () {
        [yonBtnU, yonBtnD, yonBtnL, yonBtnR].forEach(function (x) { x.classList.remove("sec"); });
        b.classList.add("sec");
        input.value = b.getAttribute("data-yon");
        submit();
      });
    });

    load();
  }

  function init() {
    var nodes = document.querySelectorAll(".veylify[data-sitekey], .specter[data-sitekey], [data-veylify], [data-specter]");
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  // Global API — programatik montaj için.
  window.Veylify = { render: mount, init: init };
  window.Specter = window.Veylify;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
