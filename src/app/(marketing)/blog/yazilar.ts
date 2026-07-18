/**
 * Blog yazıları — tek kaynak. Liste ve detay sayfaları bu veriyi kullanır.
 * icerik: her bölüm { baslik?, paragraflar[] } şeklinde. baslik yoksa
 * yalnızca paragraflar render edilir (giriş bölümü).
 */

export type YaziBolum = {
  baslik?: string;
  paragraflar: string[];
  liste?: string[];
};

export type Yazi = {
  slug: string;
  baslik: string;
  ozet: string;
  tarih: string; // görüntülenecek biçim
  isoTarih: string; // metadata için
  okumaSuresi: string;
  kategori: string;
  icerik: YaziBolum[];
};

export const YAZILAR: Yazi[] = [
  {
    slug: "ai-bot-tehditleri-2026",
    baslik: "2026'da AI bot tehditleri: web trafiğinin sessiz çoğunluğu",
    ozet:
      "İnternet trafiğinin giderek artan bir bölümü otomasyon. AI ajanları, kazıyıcılar ve botnet'ler sitenizi nasıl hedefliyor ve neden klasik önlemler yetersiz kalıyor?",
    tarih: "12 Temmuz 2026",
    isoTarih: "2026-07-12",
    okumaSuresi: "6 dk",
    kategori: "Tehdit istihbaratı",
    icerik: [
      {
        paragraflar: [
          "Web'e bakışımız hâlâ büyük ölçüde insan merkezli: bir kullanıcı sayfayı açar, okur, tıklar. Oysa bugün trafiğin önemli bir kısmı hiçbir zaman bir insanın gözüne değmiyor. Fiyat kazıyıcılar, içerik hırsızları, AI eğitim crawler'ları ve kimlik doldurma botları; sitenizi siz farkında olmadan, gece gündüz tarıyor.",
          "Bu yazıda 2026'nın en yaygın bot tehditlerini, nasıl çalıştıklarını ve neden geleneksel savunmaların artık yetmediğini ele alıyoruz.",
        ],
      },
      {
        baslik: "Tehdit haritası",
        paragraflar: [
          "Modern bot trafiği tek tip değil. Her biri farklı bir amaca hizmet eden, farklı teknik izler bırakan sınıflar var:",
        ],
        liste: [
          "Fiyat ve envanter kazıyıcılar — rakip istihbaratı için katalogunuzu tarar.",
          "AI eğitim crawler'ları — içeriğinizi model eğitimi için toplu indirir.",
          "Kimlik doldurma botları — çalıntı parola listeleriyle login formlarını dener.",
          "Scalper ve stok botları — sınırlı ürünleri insandan hızlı kapar.",
          "Hacimsel saldırılar — API'nizi istekle boğarak maliyet ve kesinti üretir.",
        ],
      },
      {
        baslik: "Neden klasik önlemler yetmiyor?",
        paragraflar: [
          "robots.txt bir kibarlık ricasıdır; kötü niyetli bir crawler onu görmezden gelir. IP kara listeleri, datacenter havuzları ve konut proxy ağları karşısında hızla eskir. Klasik görsel CAPTCHA'lar ise artık modern görü modelleri tarafından rahatça çözülüyor — üstelik gerçek kullanıcıyı yorarak.",
          "Sorun şu ki botlar giderek daha çok gerçek tarayıcı gibi davranıyor: baş headless tarayıcılar, gerçekçi fare hareketleri, döner kimlikler. Tek bir sinyale güvenen her savunma er ya da geç aşılıyor.",
        ],
      },
      {
        baslik: "Doğru yaklaşım: katmanlı savunma",
        paragraflar: [
          "Çözüm, tek bir hile değil; birbirini tamamlayan katmanlardır. Davranış biyometrisi, TLS parmak izi, coğrafi/ASN istihbaratı ve insanın okuyabildiği ama makinenin okuyamadığı bir doğrulama katmanı bir araya geldiğinde, bir katmanı aşan bot bir sonrakine takılır.",
          "Veylify tam olarak bunu yapar: sürtünmeyi bota yükler, ziyaretçiye görünmez kalır. Bir sonraki yazımızda bu katmanların kalbindeki ghost-font tekniğini inceleyeceğiz.",
        ],
      },
    ],
  },
  {
    slug: "ghost-font-nasil-calisir",
    baslik: "Ghost-font nasıl çalışır? Makineyi kör eden, insanı yormayan doğrulama",
    ozet:
      "Temporal dithering ile OCR'ı %100 kör eden, insan gözünün ise sorunsuz okuduğu bir yazı tipi tekniği. Ghost-font'un arkasındaki fikri açıklıyoruz.",
    tarih: "9 Temmuz 2026",
    isoTarih: "2026-07-09",
    okumaSuresi: "7 dk",
    kategori: "Teknoloji",
    icerik: [
      {
        paragraflar: [
          "Klasik CAPTCHA'ların temel çelişkisi şudur: bir testi makine için ne kadar zorlaştırırsanız, insan için de o kadar zorlaştırırsınız. Bulanık harfler, çarpık ızgaralar, sonu gelmeyen \"trafik ışığını seçin\" turları… Sonuç, hem kullanıcıyı yoran hem de modern AI'nın çözebildiği bir deneyim.",
          "Ghost-font bu çelişkiyi kırar. İnsan görü sistemi ile makine görü sistemi arasındaki temel bir farktan yararlanır.",
        ],
      },
      {
        baslik: "Temel fikir: zamanı bir boyut olarak kullanmak",
        paragraflar: [
          "İnsan gözü, hızlı değişen kareleri zihinde birleştirir — sinemanın çalışma prensibi budur. Bir metni tek bir karede değil, zaman içinde dağıtılmış kareler boyunca gösterirseniz, insan beyni bunları tek bir okunabilir görüntüde birleştirir.",
          "OCR ve görü modelleri ise tek tek karelere bakar. Her kare, kendi başına anlamsız bir gürültü desenidir. Zamansal birleştirme yapmadıkları için metni asla toparlayamazlar. İşte 'temporal dithering' budur.",
        ],
      },
      {
        baslik: "Neden statik bir görüntü yakalanamaz?",
        paragraflar: [
          "Bir bot ekran görüntüsü alsa bile eline yalnızca tek bir kare — yani gürültü — geçer. Kareleri toplayıp ortalasa, insanın algıladığı zamansal bütünü elde edemez; çünkü desen kare kare kasıtlı olarak dengelenir. Bu, OCR'ın önündeki duvarı pratikte aşılmaz kılar.",
          "Testlerimizde hiçbir yaygın OCR motoru ya da görü modeli ghost-font ile işlenmiş metni çözemedi; buna karşın gerçek kullanıcılar metni anında ve rahatça okudu.",
        ],
      },
      {
        baslik: "Sürtünmesiz doğrulama",
        paragraflar: [
          "Ghost-font tek başına da güçlüdür; ancak Veylify'de bir katman olarak çalışır. Çoğu ziyaretçi challenge'ı hiç görmez — davranış ve ağ sinyalleri zaten insan olduklarını gösterir. Yalnızca şüpheli durumlarda ghost-font devreye girer ve botu tam da en kritik noktada durdurur.",
          "Sonuç: gerçek kullanıcı için görünmez, bot için aşılmaz bir doğrulama katmanı.",
        ],
      },
    ],
  },
  {
    slug: "captchanin-olumu",
    baslik: "CAPTCHA'nın ölümü: neden 'trafik ışığı seç' çağı bitti",
    ozet:
      "Modern AI ajanları görsel bulmacaları insandan daha hızlı çözüyor. Klasik CAPTCHA neden artık hem güvensiz hem de kullanıcıya zararlı? Ve yerine ne geçmeli?",
    tarih: "5 Temmuz 2026",
    isoTarih: "2026-07-05",
    okumaSuresi: "5 dk",
    kategori: "Görüş",
    icerik: [
      {
        paragraflar: [
          "Yıllarca CAPTCHA, insan ile bot arasındaki sınır çizgisiydi. Ama o çizgi çoktan silindi. Bugün bir dil-görü modeli, bulanık harfleri de trafik ışıklarını da ortalama bir insandan daha hızlı ve daha doğru çözebiliyor.",
          "Bu, güvenlik için kötü bir haber; ama asıl kötü haber, faturayı kimin ödediği: gerçek kullanıcı.",
        ],
      },
      {
        baslik: "Çifte başarısızlık",
        paragraflar: [
          "Klasik CAPTCHA iki cephede birden kaybediyor. Bir yandan botları durduramıyor — çünkü otomatik çözüm servisleri ve görü modelleri bulmacaları saniyeler içinde geçiyor. Öte yandan gerçek kullanıcıyı cezalandırıyor: her ek tıklama, her başarısız deneme dönüşüm kaybı demek.",
          "Erişilebilirlik açısından durum daha da vahim. Görme engelli kullanıcılar, yaşlılar ve mobil ziyaretçiler için görsel bulmacalar ciddi bir engel oluşturuyor.",
        ],
      },
      {
        baslik: "Yeni paradigma: pasif ve katmanlı",
        paragraflar: [
          "Doğrulamanın geleceği, kullanıcıya bir görev yüklemekten değil, arka planda karar vermekten geçiyor. Davranış sinyalleri, ağ istihbaratı ve TLS parmak izi çoğu ziyaretçiyi hiç rahatsız etmeden geçirir.",
          "Yalnızca gerçekten şüpheli durumlarda bir doğrulama gerekir — ve o an bile, insanın okuyabildiği ama makinenin okuyamadığı bir katman kullanılırsa, sürtünme yalnızca bota biner.",
        ],
      },
      {
        baslik: "Sonuç",
        paragraflar: [
          "\"Trafik ışığı seç\" çağı bitti. Kullanıcıyı yormadan botu durduran, pasif ve katmanlı bir doğrulama artık bir lüks değil, bir zorunluluk. Veylify bu geçişi tek satırlık bir kurulumla mümkün kılar.",
        ],
      },
    ],
  },
  {
    slug: "eticaret-bot-korumasi",
    baslik: "E-ticarette bot koruması: fiyatınızı, stokunuzu ve marjınızı savunun",
    ozet:
      "Fiyat kazıyıcılar, scalper botları ve sahte hesaplar e-ticaret gelirini sessizce aşındırır. Gerçek alıcıyı yormadan bu tehditleri nasıl durdurursunuz?",
    tarih: "1 Temmuz 2026",
    isoTarih: "2026-07-01",
    okumaSuresi: "6 dk",
    kategori: "Sektör",
    icerik: [
      {
        paragraflar: [
          "E-ticaret, botların en yoğun hedeflediği alanlardan biri. Çünkü burada bilgi doğrudan paraya dönüşüyor: fiyatınız, stok durumunuz, kampanya zamanlamanız… Hepsi rakip botları için değerli veri.",
          "Bu yazıda e-ticarete özgü bot tehditlerini ve bunları gerçek alıcının deneyimini bozmadan nasıl durduracağınızı ele alıyoruz.",
        ],
      },
      {
        baslik: "Üç sessiz düşman",
        paragraflar: ["E-ticarette en çok zarar veren üç bot türü şunlardır:"],
        liste: [
          "Fiyat kazıyıcılar — dinamik fiyat ve kampanya stratejinizi daha yayınlanmadan sızdırır.",
          "Scalper / stok botları — sınırlı ürünleri insan alıcıdan hızlı kapar, spekülatif satışa açar.",
          "Sahte hesap ve kupon botları — promosyonları suistimal eder, sadakat programını çürütür.",
        ],
      },
      {
        baslik: "Koruma, satışı yavaşlatmamalı",
        paragraflar: [
          "E-ticarette en büyük tuzak, korumayı gerçek alıcının üstüne yıkmaktır. Ödeme adımına eklenen bir CAPTCHA, sepetten dönüş oranını doğrudan artırır. Amaç, sürtünmeyi yalnızca şüpheli trafiğe uygulamaktır.",
          "Veylify, ürün ve arama uç noktalarına kural motorlu hız sınırı uygular, datacenter kaynaklı toplu taramayı engeller ve otomatik sepet botlarını yakalar — gerçek alıcı ise hiçbir ek adım görmeden alışverişine devam eder.",
        ],
      },
      {
        baslik: "Ölçülebilir sonuç",
        paragraflar: [
          "Doğru kurgulanmış bir bot korumasıyla kazıma girişimlerinin büyük çoğunluğu engellenirken sunucu yükü belirgin biçimde düşer ve gerçek dönüşüm oranı korunur. Koruma, bir maliyet değil; marjınızı savunan bir yatırımdır.",
          "E-ticaret senaryonuza özel kurulum için Çözümler sayfamıza göz atın veya ücretsiz bir hesapla bugün başlayın.",
        ],
      },
    ],
  },
];

export function yaziBul(slug: string): Yazi | undefined {
  return YAZILAR.find((y) => y.slug === slug);
}
