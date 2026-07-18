/**
 * Widget Yerelleştirme Merkezi — yerel.ts (SAF YARDIMCI)
 * ======================================================
 * Bu modül, /panel/yerellestirme panelinin TEK gerçek-kaynağıdır. Amacı,
 * ghost-font widget'ının (public/specter.js) kullanıcıya görünen metinlerini
 * ÇOK sayıda hedef dile taşımayı yönetmektir.
 *
 * /panel/dil'den FARKI (sınır): /panel/dil, widget'ın HÂLİHAZIRDA %100 çevrili
 * 8 dilini (@/lib/widget-i18n) listeler ve önizler — orada her dil tam doludur.
 * Burası ise "dünyaya açılma" katmanıdır: 12 hedef dil, GERÇEK eksiklerle
 * tamamlanma matrisi, RTL düzen çevirme, dize düzenleyici ve locale bundle
 * (JSON) dışa aktarımı. Yani /panel/dil = mevcut durum vitrini; burası =
 * genişleme/çeviri iş masası.
 *
 * ÖNEMLİ: Bu dosya SAF ve DETERMİNİSTİK'tir (React/DOM yok, yan etki yok).
 * widget-i18n.ts DEĞİŞTİRİLMEZ; oradaki gerçek çeviriler burada YENİDEN
 * kullanılır (çekirdek diller için birebir metinler kopyalanmıştır).
 */

/** Widget'ın kullanıcıya görünen dize anahtarları (gerçek widget'tan). */
export interface Anahtar {
  /** Teknik anahtar (widget I18N nesnesindeki alan adı). */
  anahtar: string;
  /** Bu dizenin ne olduğu (panelde gösterilir). */
  aciklama: string;
  /** Türkçe referans metni (çevirmene rehber). */
  ornek: string;
  /** Öbek — matris/düzenleyicide gruplama için. */
  obek: "challenge" | "durum" | "erisilebilirlik" | "altbilgi";
}

/**
 * Çekirdek widget dize anahtarları. Kaynak: public/specter.js `I18N` +
 * src/lib/widget-i18n.ts (READ-ONLY). En kritik, çevrilmesi gereken
 * kullanıcı-yüzeyli metinleri kapsar (talimat gereği "core keys").
 */
export const ANAHTARLAR: Anahtar[] = [
  { anahtar: "title", aciklama: "Kart başlığı (üst şerit)", ornek: "İnsan doğrulaması", obek: "challenge" },
  { anahtar: "secure", aciklama: "Şifreli rozeti metni", ornek: "Şifreli", obek: "challenge" },
  { anahtar: "placeholder", aciklama: "Kod giriş kutusu ipucu", ornek: "Beliren kodu girin", obek: "challenge" },
  { anahtar: "verify", aciklama: "Doğrula butonu", ornek: "Doğrula", obek: "challenge" },
  { anahtar: "reload", aciklama: "Yeni kod üret butonu", ornek: "Yeni kod üret", obek: "challenge" },
  { anahtar: "audio", aciklama: "Sesli dinle butonu (ipucu)", ornek: "Kodu sesli dinle", obek: "erisilebilirlik" },
  { anahtar: "audioLabel", aciklama: "Sesli dinle — erişilebilir etiket", ornek: "Doğrulama kodunu sesli dinle", obek: "erisilebilirlik" },
  { anahtar: "codeLabel", aciklama: "Kod girişi — erişilebilir etiket", ornek: "Doğrulama kodu", obek: "erisilebilirlik" },
  { anahtar: "canvasLabel", aciklama: "Canvas — erişilebilir açıklama (kod)", ornek: "Ghost-font doğrulama kodu — hareketli görüntüde beliren karakterleri girin", obek: "erisilebilirlik" },
  { anahtar: "success", aciklama: "Başarı mesajı", ornek: "İnsan olduğun doğrulandı", obek: "durum" },
  { anahtar: "successHint", aciklama: "Başarı alt açıklaması", ornek: "Formu gönderebilirsin", obek: "durum" },
  { anahtar: "fail", aciklama: "Hata mesajı", ornek: "Doğrulama başarısız", obek: "durum" },
  { anahtar: "failHint", aciklama: "Hata alt açıklaması", ornek: "Tekrar deneyin", obek: "durum" },
  { anahtar: "checking", aciklama: "Kontrol ediliyor mesajı", ornek: "İnsan olduğun kontrol ediliyor…", obek: "durum" },
  { anahtar: "checkingHint", aciklama: "Kontrol alt açıklaması", ornek: "Bir saniye sürebilir", obek: "durum" },
  { anahtar: "protected", aciklama: "Alt bilgi — marka koruması", ornek: "Veylify ile korunuyor", obek: "altbilgi" },
  { anahtar: "privacy", aciklama: "Gizlilik linki", ornek: "Gizlilik", obek: "altbilgi" },
  { anahtar: "terms", aciklama: "Şartlar linki", ornek: "Şartlar", obek: "altbilgi" },
  { anahtar: "reducedMotion", aciklama: "Hareket kapalı uyarısı", ornek: "Hareket kapalı — kodu sesli dinleyin", obek: "erisilebilirlik" },
  { anahtar: "wrong", aciklama: "Yanlış kod mesajı", ornek: "Yanlış kod", obek: "durum" },
] as const;

/** Anahtar kodlarının düz listesi (matris/oran hesabı için). */
export const ANAHTAR_KODLARI = ANAHTARLAR.map((a) => a.anahtar);

/** Hedef dil kaydı. */
export interface Dil {
  /** ISO 639-1 iki harfli kod (widget data-lang değeri). */
  kod: string;
  /** Türkçe (panel) dil adı. */
  ad: string;
  /** Dilin kendi yazımıyla adı. */
  yerelAd: string;
  /** Sağdan-sola yazım mı. */
  rtl: boolean;
  /** Bayrak emoji. */
  bayrak: string;
}

/**
 * ~12 hedef dil kataloğu. widget-i18n.ts'te zaten olan 8 dile ek olarak,
 * "dünyaya açılma" hedefi olan diller (İbranice, Çince, Japonca, Hintçe)
 * de eklendi — bunların bazı çevirileri topluluk katkısı bekliyor (partial).
 */
export const DILLER: Dil[] = [
  { kod: "tr", ad: "Türkçe", yerelAd: "Türkçe", rtl: false, bayrak: "🇹🇷" },
  { kod: "en", ad: "İngilizce", yerelAd: "English", rtl: false, bayrak: "🇬🇧" },
  { kod: "de", ad: "Almanca", yerelAd: "Deutsch", rtl: false, bayrak: "🇩🇪" },
  { kod: "fr", ad: "Fransızca", yerelAd: "Français", rtl: false, bayrak: "🇫🇷" },
  { kod: "es", ad: "İspanyolca", yerelAd: "Español", rtl: false, bayrak: "🇪🇸" },
  { kod: "ar", ad: "Arapça", yerelAd: "العربية", rtl: true, bayrak: "🇸🇦" },
  { kod: "he", ad: "İbranice", yerelAd: "עברית", rtl: true, bayrak: "🇮🇱" },
  { kod: "ru", ad: "Rusça", yerelAd: "Русский", rtl: false, bayrak: "🇷🇺" },
  { kod: "pt", ad: "Portekizce", yerelAd: "Português", rtl: false, bayrak: "🇵🇹" },
  { kod: "zh", ad: "Çince", yerelAd: "中文", rtl: false, bayrak: "🇨🇳" },
  { kod: "ja", ad: "Japonca", yerelAd: "日本語", rtl: false, bayrak: "🇯🇵" },
  { kod: "hi", ad: "Hintçe", yerelAd: "हिन्दी", rtl: false, bayrak: "🇮🇳" },
];

/** Kod → dil hızlı erişim. */
export const DIL_HARITA: Record<string, Dil> = Object.fromEntries(DILLER.map((d) => [d.kod, d]));

/** Bir dilin çeviri sözlüğü — eksik anahtar = o dize henüz çevrilmemiş. */
export type Ceviri = Partial<Record<string, string>>;

/**
 * Çeviri haritası {dilKod: {anahtar: metin}}.
 *
 * DÜRÜSTLÜK: TR/EN/DE/FR/ES/AR/RU/PT çevirileri GERÇEK ve doğrudur — bunlar
 * widget-i18n.ts'teki (READ-ONLY) mevcut çevirilerden birebir alınmıştır ve
 * canlı widget'ta halihazırda çalışmaktadır. İbranice (he) tam çevrilmiştir
 * (RTL kanıtı için). Çince/Japonca/Hintçe kasıtlı olarak KISMÎ bırakılmıştır
 * (topluluk çevirisi bekliyor) — bu, tamamlanma matrisinin gerçek boşluk
 * göstermesini sağlar.
 */
export const CEVIRILER: Record<string, Ceviri> = {
  tr: {
    title: "İnsan doğrulaması", secure: "Şifreli", placeholder: "Beliren kodu girin",
    verify: "Doğrula", reload: "Yeni kod üret", audio: "Kodu sesli dinle",
    audioLabel: "Doğrulama kodunu sesli dinle", codeLabel: "Doğrulama kodu",
    canvasLabel: "Ghost-font doğrulama kodu — hareketli görüntüde beliren karakterleri girin",
    success: "İnsan olduğun doğrulandı", successHint: "Formu gönderebilirsin",
    fail: "Doğrulama başarısız", failHint: "Tekrar deneyin",
    checking: "İnsan olduğun kontrol ediliyor…", checkingHint: "Bir saniye sürebilir",
    protected: "Veylify ile korunuyor", privacy: "Gizlilik", terms: "Şartlar",
    reducedMotion: "Hareket kapalı — kodu sesli dinleyin", wrong: "Yanlış kod",
  },
  en: {
    title: "Human verification", secure: "Encrypted", placeholder: "Enter the code shown",
    verify: "Verify", reload: "New code", audio: "Listen to code",
    audioLabel: "Listen to the verification code", codeLabel: "Verification code",
    canvasLabel: "Ghost-font verification code — enter the characters that appear in the moving image",
    success: "You're verified as human", successHint: "You can submit the form",
    fail: "Verification failed", failHint: "Please try again",
    checking: "Verifying you're human…", checkingHint: "This may take a second",
    protected: "Protected by Veylify", privacy: "Privacy", terms: "Terms",
    reducedMotion: "Motion off — listen to the code", wrong: "Wrong code",
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
  },
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
  },
  he: {
    // İbranice — RTL kanıtı için tam çeviri.
    title: "אימות אנושי", secure: "מוצפן", placeholder: "הזינו את הקוד המוצג",
    verify: "אימות", reload: "קוד חדש", audio: "האזנה לקוד",
    audioLabel: "האזנה לקוד האימות", codeLabel: "קוד אימות",
    canvasLabel: "קוד אימות ghost-font — הזינו את התווים המופיעים בתמונה הנעה",
    success: "אומתת כבן אדם", successHint: "אפשר לשלוח את הטופס",
    fail: "האימות נכשל", failHint: "נסו שוב",
    checking: "בודקים שאתם בני אדם…", checkingHint: "זה עשוי לקחת רגע",
    protected: "מוגן על ידי Veylify", privacy: "פרטיות", terms: "תנאים",
    reducedMotion: "תנועה כבויה — האזינו לקוד", wrong: "קוד שגוי",
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
  },
  // KISMÎ — topluluk çevirisi bekleyen diller (kasıtlı boşluklar).
  zh: {
    // Çince — çekirdek akış çevrildi; erişilebilirlik/altbilgi bekliyor.
    title: "人机验证", secure: "已加密", placeholder: "输入显示的验证码",
    verify: "验证", reload: "换一个", audio: "语音播报",
    success: "已验证为真人", successHint: "您可以提交表单",
    fail: "验证失败", failHint: "请重试",
    checking: "正在验证您是真人…", wrong: "验证码错误",
  },
  ja: {
    // Japonca — kısmî; sadece en kritik akış.
    title: "本人確認", secure: "暗号化", placeholder: "表示されたコードを入力",
    verify: "確認", reload: "新しいコード",
    success: "本人であることを確認しました", fail: "確認に失敗しました",
    failHint: "もう一度お試しください", wrong: "コードが違います",
  },
  hi: {
    // Hintçe — henüz yalnızca temel butonlar.
    title: "मानव सत्यापन", verify: "सत्यापित करें", reload: "नया कोड",
    success: "आप मानव के रूप में सत्यापित हैं", fail: "सत्यापन विफल",
    wrong: "गलत कोड",
  },
};

/** Bir dilin belirli anahtardaki çevirisi (yoksa undefined). */
export function cevir(dilKod: string, anahtar: string): string | undefined {
  return CEVIRILER[dilKod]?.[anahtar];
}

/**
 * Bir dilin tamamlanma oranı (%). Dolu (boş olmayan) anahtar sayısı /
 * toplam anahtar. 0–100 arası tam sayı döndürür.
 */
export function tamamlanmaOrani(dilKod: string): number {
  const ceviri = CEVIRILER[dilKod] ?? {};
  const dolu = ANAHTAR_KODLARI.filter((k) => {
    const v = ceviri[k];
    return typeof v === "string" && v.trim().length > 0;
  }).length;
  return Math.round((dolu / ANAHTAR_KODLARI.length) * 100);
}

/** Bir dilde eksik (çevrilmemiş) anahtar sayısı. */
export function eksikSayisi(dilKod: string): number {
  const ceviri = CEVIRILER[dilKod] ?? {};
  return ANAHTAR_KODLARI.filter((k) => {
    const v = ceviri[k];
    return !(typeof v === "string" && v.trim().length > 0);
  }).length;
}

/** Bir dilde eksik anahtarların kod listesi (düzenleyicide vurgulanır). */
export function eksikAnahtarlar(dilKod: string): string[] {
  const ceviri = CEVIRILER[dilKod] ?? {};
  return ANAHTAR_KODLARI.filter((k) => {
    const v = ceviri[k];
    return !(typeof v === "string" && v.trim().length > 0);
  });
}

/** Yerelleştirme genel özeti (StatKart'lar için). */
export function yerellestirmeOzet(): {
  toplamDil: number;
  tamDil: number;
  rtlDil: number;
  eksikCeviriToplam: number;
  ortTamamlanma: number;
} {
  const toplamDil = DILLER.length;
  const tamDil = DILLER.filter((d) => tamamlanmaOrani(d.kod) === 100).length;
  const rtlDil = DILLER.filter((d) => d.rtl).length;
  const eksikCeviriToplam = DILLER.reduce((acc, d) => acc + eksikSayisi(d.kod), 0);
  const ortTamamlanma = Math.round(
    DILLER.reduce((acc, d) => acc + tamamlanmaOrani(d.kod), 0) / toplamDil,
  );
  return { toplamDil, tamDil, rtlDil, eksikCeviriToplam, ortTamamlanma };
}

/** Locale bundle nesnesi — meta alanları (_ önekli) + dolu dize anahtarları. */
export interface LocaleBundle {
  _kod: string;
  _yerelAd: string;
  _rtl: boolean;
  _tamamlanma: number;
  /** Dolu widget dizeleri (anahtar → çeviri). */
  [anahtar: string]: string | boolean | number;
}

/**
 * Bir dilin locale bundle'ı (dışa aktarım için düz JSON nesnesi).
 * Yalnızca dolu anahtarları içerir; meta olarak dil kodu/RTL de eklenir.
 */
export function localeBundle(dilKod: string): LocaleBundle {
  const dil = DIL_HARITA[dilKod];
  const ceviri = CEVIRILER[dilKod] ?? {};
  const bundle: LocaleBundle = {
    _kod: dilKod,
    _yerelAd: dil?.yerelAd ?? dilKod,
    _rtl: dil?.rtl ?? false,
    _tamamlanma: tamamlanmaOrani(dilKod),
  };
  for (const k of ANAHTAR_KODLARI) {
    const v = ceviri[k];
    if (typeof v === "string" && v.trim().length > 0) bundle[k] = v;
  }
  return bundle;
}
