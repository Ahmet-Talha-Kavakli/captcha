"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone, Monitor, Trash2, KeyRound, ShieldCheck, Lock, Copy, Check,
  QrCode, Globe, Terminal, MessageSquare, X, AlertCircle,
} from "lucide-react";
import {
  Panel, SettingRow2, Alan, Girdi, Modal, Badge, DurumRozeti, NotKutusu, Tablo, Ulke,
  useToast, type Kolon,
} from "@/components/panel/kit";
import { Toggle } from "@/components/panel/Toggle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ statik demo verisi */

const OTURUMLAR = [
  { id: "s1", cihaz: "MacBook Pro · Chrome", os: "macOS 15", konum: "İstanbul, TR", kod: "TR", ip: "88.240.12.4", aktif: true, sonGoruldu: "Şimdi" },
  { id: "s2", cihaz: "iPhone 15 · Safari", os: "iOS 18", konum: "İstanbul, TR", kod: "TR", ip: "88.240.12.9", aktif: false, sonGoruldu: "2 saat önce" },
  { id: "s3", cihaz: "Windows · Edge", os: "Windows 11", konum: "Ankara, TR", kod: "TR", ip: "78.180.44.2", aktif: false, sonGoruldu: "3 gün önce" },
  { id: "s4", cihaz: "iPad · Safari", os: "iPadOS 18", konum: "İzmir, TR", kod: "TR", ip: "85.108.9.71", aktif: false, sonGoruldu: "1 hafta önce" },
];

interface GirisKaydi { id: string; zaman: string; sonuc: "basari" | "hata"; yontem: string; cihaz: string; konum: string; kod: string; ip: string; }
const GIRIS_GECMISI: GirisKaydi[] = [
  { id: "l1", zaman: "Bugün 09:14", sonuc: "basari", yontem: "Şifre + 2FA", cihaz: "Chrome · macOS", konum: "İstanbul", kod: "TR", ip: "88.240.12.4" },
  { id: "l2", zaman: "Dün 21:02", sonuc: "basari", yontem: "Şifre + 2FA", cihaz: "Safari · iOS", konum: "İstanbul", kod: "TR", ip: "88.240.12.9" },
  { id: "l3", zaman: "Dün 03:48", sonuc: "hata", yontem: "Şifre (yanlış)", cihaz: "curl", konum: "Frankfurt", kod: "DE", ip: "45.155.204.11" },
  { id: "l4", zaman: "2 gün önce", sonuc: "hata", yontem: "Şifre (yanlış)", cihaz: "python-requests", konum: "Moskova", kod: "RU", ip: "193.169.255.20" },
  { id: "l5", zaman: "3 gün önce", sonuc: "basari", yontem: "Şifre + 2FA", cihaz: "Edge · Windows", konum: "Ankara", kod: "TR", ip: "78.180.44.2" },
  { id: "l6", zaman: "5 gün önce", sonuc: "hata", yontem: "2FA (kod yanlış)", cihaz: "Chrome · Android", konum: "Kiev", kod: "UA", ip: "176.38.12.9" },
  { id: "l7", zaman: "1 hafta önce", sonuc: "basari", yontem: "Şifre + 2FA", cihaz: "Safari · iPadOS", konum: "İzmir", kod: "TR", ip: "85.108.9.71" },
];

interface BagliUygulama { id: string; ad: string; aciklama: string; kapsam: string; baglandi: string; ikon: React.ReactNode; }
const BAGLI_UYGULAMALAR: BagliUygulama[] = [
  { id: "gh", ad: "GitHub", aciklama: "CI dağıtımı için depo erişimi", kapsam: "repo · read", baglandi: "2 ay önce", ikon: <Terminal className="size-5" /> },
  { id: "slack", ad: "Slack", aciklama: "Kritik uyarıları #guvenlik kanalına yollar", kapsam: "chat:write", baglandi: "3 hafta önce", ikon: <MessageSquare className="size-5" /> },
  { id: "google", ad: "Google Workspace", aciklama: "SSO ile tek tıkla giriş", kapsam: "openid · email", baglandi: "5 ay önce", ikon: <Globe className="size-5" /> },
];

/* 2FA yedek kodları — deterministik değil, kurulumda üretilir. */
function yedekKodUret(): string[] {
  const kodlar: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = Math.random().toString(36).slice(2, 6);
    const b = Math.random().toString(36).slice(2, 6);
    kodlar.push(`${a}-${b}`.toUpperCase());
  }
  return kodlar;
}

/* ------------------------------------------------------------------ ana */

export function GuvenlikIstemci({
  email,
  twoFactorEnabled,
  passwordChangedAt,
}: {
  email: string;
  twoFactorEnabled: boolean;
  passwordChangedAt: number | null;
}) {
  const router = useRouter();
  const { goster } = useToast();

  const [twoFa, setTwoFa] = useState(twoFactorEnabled);
  const [twoFaModal, setTwoFaModal] = useState(false);
  const [sifreModal, setSifreModal] = useState(false);
  const [silModal, setSilModal] = useState(false);
  const [silOnay, setSilOnay] = useState("");
  const [siliniyor, setSiliniyor] = useState(false);
  const [oturumlar, setOturumlar] = useState(OTURUMLAR);

  const sifreYasi = useMemo(() => {
    if (!passwordChangedAt) return "bilinmiyor";
    const gun = Math.round((Date.now() - passwordChangedAt) / 86400000);
    if (gun < 1) return "bugün";
    return `${gun} gün önce`;
  }, [passwordChangedAt]);

  const basarisizGiris = GIRIS_GECMISI.filter((g) => g.sonuc === "hata").length;

  /* --------------------------------------------------- 2FA aç/kapat */
  async function twoFaKapat() {
    const res = await fetch("/api/account/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: false }),
    });
    if (res.ok) {
      setTwoFa(false);
      goster({ tip: "bilgi", baslik: "İki adımlı doğrulama kapatıldı" });
      router.refresh();
    } else {
      goster({ tip: "hata", baslik: "İşlem başarısız" });
    }
  }

  /* --------------------------------------------------- oturumlar */
  function tumOturumlariKapat() {
    setOturumlar((p) => p.filter((o) => o.aktif));
    goster({ tip: "basari", baslik: "Diğer tüm oturumlar sonlandırıldı" });
  }
  function oturumKapat(id: string) {
    setOturumlar((p) => p.filter((x) => x.id !== id));
    goster({ tip: "basari", baslik: "Oturum sonlandırıldı" });
  }

  /* --------------------------------------------------- hesap sil */
  async function hesabiSil() {
    setSiliniyor(true);
    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: silOnay }),
    });
    setSiliniyor(false);
    if (res.ok) router.push("/giris");
    else {
      const { error } = await res.json().catch(() => ({ error: "Silinemedi" }));
      goster({ tip: "hata", baslik: "Hesap silinemedi", aciklama: error });
    }
  }

  /* --------------------------------------------------- giriş geçmişi kolonları */
  const girisKolon: Kolon<GirisKaydi>[] = [
    { baslik: "Zaman", render: (g) => <span className="text-slate-ink">{g.zaman}</span> },
    {
      baslik: "Sonuç",
      render: (g) =>
        g.sonuc === "basari"
          ? <DurumRozeti ton="ok" etiket="Başarılı" />
          : <DurumRozeti ton="danger" etiket="Başarısız" />,
    },
    { baslik: "Yöntem", render: (g) => <span className="text-[13px] text-slate-muted">{g.yontem}</span> },
    { baslik: "Cihaz", render: (g) => <span className="text-[13px] text-slate-muted">{g.cihaz}</span> },
    { baslik: "Konum", render: (g) => <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-muted"><Ulke kod={g.kod} /> {g.konum}</span> },
    { baslik: "IP", render: (g) => <span className="num text-[13px] text-slate-muted">{g.ip}</span> },
  ];

  return (
    <div className="space-y-6">
      {/* ---------------- Güvenlik özeti ---------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <OzetKart
          ikon={<ShieldCheck className="size-5" />}
          etiket="İki adımlı doğrulama"
          deger={twoFa ? "Etkin" : "Kapalı"}
          ton={twoFa ? "ok" : "danger"}
        />
        <OzetKart
          ikon={<Lock className="size-5" />}
          etiket="Şifre yaşı"
          deger={sifreYasi}
          ton={passwordChangedAt && Date.now() - passwordChangedAt > 90 * 86400000 ? "warn" : "ok"}
        />
        <OzetKart
          ikon={<Monitor className="size-5" />}
          etiket="Aktif oturum"
          deger={`${oturumlar.length}`}
          ton="brand"
        />
      </div>

      {/* ---------------- 2FA ---------------- */}
      <Panel baslik="İki faktörlü doğrulama (2FA)">
        <SettingRow2
          baslik="Kimlik doğrulayıcı uygulama (TOTP)"
          aciklama="Girişte Google Authenticator / 1Password gibi bir uygulamadan 6 haneli kod iste. Hesabını ele geçirmeyi çok zorlaştırır."
          onerilen
        >
          <div className="flex items-center gap-3">
            {twoFa && <Badge ton="yesil"><Check className="size-3" /> Aktif</Badge>}
            <Toggle
              on={twoFa}
              onChange={(v) => {
                if (v) setTwoFaModal(true); // etkinleştirme wizard'ı
                else twoFaKapat();
              }}
            />
          </div>
        </SettingRow2>
        <SettingRow2 baslik="Kurtarma kodları" aciklama="Kimlik doğrulayıcı cihazına erişemezsen hesabına girmek için tek kullanımlık 10 kod.">
          <Button variant="outline" size="sm" disabled={!twoFa} onClick={() => setTwoFaModal(true)}>
            <KeyRound className="size-4" /> {twoFa ? "Yeniden üret" : "Önce 2FA'yı aç"}
          </Button>
        </SettingRow2>
      </Panel>

      {/* ---------------- Şifre ---------------- */}
      <Panel baslik="Şifre">
        <SettingRow2 baslik="Hesap şifresi" aciklama={`Son değişiklik: ${sifreYasi}`}>
          <Button variant="outline" size="sm" onClick={() => setSifreModal(true)}>
            <KeyRound className="size-4" /> Değiştir
          </Button>
        </SettingRow2>
      </Panel>

      {/* ---------------- Aktif oturumlar ---------------- */}
      <Panel
        baslik="Aktif oturumlar"
        sagUst={oturumlar.length > 1 && <Button variant="ghost" size="sm" onClick={tumOturumlariKapat}>Diğerlerini kapat</Button>}
        padding={false}
      >
        <div className="divide-y divide-line">
          {oturumlar.map((o) => (
            <div key={o.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-canvas text-slate-muted">
                  {o.cihaz.includes("iPhone") || o.cihaz.includes("iPad") ? <Smartphone className="size-4.5" /> : <Monitor className="size-4.5" />}
                </span>
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-ink">
                    {o.cihaz}
                    {o.aktif && <Badge ton="yesil">Bu cihaz</Badge>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-slate-faint">
                    <Ulke kod={o.kod} /> {o.konum} · {o.ip} · {o.sonGoruldu}
                  </div>
                </div>
              </div>
              {!o.aktif && (
                <button
                  onClick={() => oturumKapat(o.id)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-danger2 hover:underline"
                >
                  <X className="size-3.5" /> Sonlandır
                </button>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* ---------------- Oturum açma geçmişi ---------------- */}
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="text-[15px] font-semibold text-slate-ink">Oturum açma geçmişi</h3>
          {basarisizGiris > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-amber-700">
              <AlertCircle className="size-4" /> Son dönemde {basarisizGiris} başarısız deneme
            </span>
          )}
        </div>
        <Tablo kolonlar={girisKolon} veri={GIRIS_GECMISI} sayfaBoyu={5} bosMesaj="Kayıt yok." />
      </div>

      {/* ---------------- Bağlı uygulamalar / OAuth ---------------- */}
      <Panel baslik="Bağlı uygulamalar" padding={false}>
        <div className="divide-y divide-line">
          {BAGLI_UYGULAMALAR.map((u) => (
            <BagliUygulamaSatir key={u.id} u={u} />
          ))}
        </div>
      </Panel>

      {/* ---------------- Tehlikeli bölge ---------------- */}
      <Panel baslik="Tehlikeli bölge">
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-danger-soft px-4 py-3">
          <div>
            <div className="text-sm font-medium text-slate-ink">Hesabı sil</div>
            <div className="text-[13px] text-slate-muted">Tüm siteler, kurallar ve veriler kalıcı olarak silinir.</div>
          </div>
          <Button variant="danger" size="sm" onClick={() => { setSilOnay(""); setSilModal(true); }}>
            <Trash2 className="size-3.5" /> Hesabı sil
          </Button>
        </div>
      </Panel>

      {/* ================= Modaller ================= */}
      <TwoFaModal
        acik={twoFaModal}
        kapat={() => setTwoFaModal(false)}
        email={email}
        onEtkin={() => { setTwoFa(true); router.refresh(); }}
      />

      <SifreModal acik={sifreModal} kapat={() => setSifreModal(false)} />

      <Modal acik={silModal} kapat={() => setSilModal(false)} baslik="Hesabı kalıcı olarak sil" genislik="max-w-md">
        <NotKutusu ton="kirmizi" baslik="Bu işlem geri alınamaz">
          Hesabın ve tüm bağlı verisi kalıcı olarak silinecek.
        </NotKutusu>
        <p className="mt-4 text-sm text-slate-muted">
          Onaylamak için <strong className="font-mono text-slate-ink">{email}</strong> adresini yaz.
        </p>
        <div className="mt-3"><Girdi value={silOnay} onChange={(e) => setSilOnay(e.target.value)} placeholder={email} autoFocus /></div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setSilModal(false)}>İptal</Button>
          <Button variant="danger" disabled={silOnay.trim().toLowerCase() !== email.toLowerCase() || siliniyor} onClick={hesabiSil}>
            <Trash2 className="size-4" /> {siliniyor ? "Siliniyor…" : "Kalıcı olarak sil"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ Özet kart */
function OzetKart({
  ikon, etiket, deger, ton,
}: {
  ikon: React.ReactNode;
  etiket: string;
  deger: string;
  ton: "ok" | "warn" | "danger" | "brand";
}) {
  const renk = {
    ok: "text-ok bg-ok-soft",
    warn: "text-amber-700 bg-warn-soft",
    danger: "text-danger2 bg-danger-soft",
    brand: "text-brand-600 bg-brand-50",
  }[ton];
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-5">
      <span className={cn("grid size-11 place-items-center rounded-2xl", renk)}>{ikon}</span>
      <div>
        <div className="text-[13px] text-slate-muted">{etiket}</div>
        <div className="text-[17px] font-semibold text-slate-ink">{deger}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Bağlı uygulama satırı */
function BagliUygulamaSatir({ u }: { u: BagliUygulama }) {
  const { goster } = useToast();
  const [bagli, setBagli] = useState(true);
  if (!bagli) return null;
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-canvas text-slate-ink">{u.ikon}</span>
        <div>
          <div className="text-sm font-medium text-slate-ink">{u.ad}</div>
          <div className="text-[12.5px] text-slate-muted">{u.aciklama}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-faint">
            <span className="rounded bg-canvas px-1.5 py-0.5 font-mono">{u.kapsam}</span>
            <span>· {u.baglandi} bağlandı</span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-danger2 hover:bg-danger-soft"
        onClick={() => { setBagli(false); goster({ tip: "basari", baslik: `${u.ad} erişimi kaldırıldı` }); }}
      >
        Erişimi kaldır
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ 2FA kurulum wizard'ı */
function TwoFaModal({
  acik, kapat, email, onEtkin,
}: {
  acik: boolean;
  kapat: () => void;
  email: string;
  onEtkin: () => void;
}) {
  const { goster } = useToast();
  const [adim, setAdim] = useState<1 | 2 | 3>(1);
  const [kod, setKod] = useState("");
  const [yedekKodlar, setYedekKodlar] = useState<string[]>([]);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);

  // TOTP secret (görsel — gerçek kripto değil).
  const secret = useMemo(() => "JBSW Y3DP EHPK 3PXP", []);
  const otpauth = `otpauth://totp/Veylify:${email}?secret=JBSWY3DPEHPK3PXP&issuer=Veylify`;

  function sifirla() {
    setAdim(1); setKod(""); setYedekKodlar([]); setKopyalandi(false);
  }

  async function dogrula() {
    if (!/^\d{6}$/.test(kod.trim())) {
      goster({ tip: "hata", baslik: "6 haneli kodu girin" });
      return;
    }
    setGonderiliyor(true);
    const res = await fetch("/api/account/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: true, code: kod.trim() }),
    });
    setGonderiliyor(false);
    if (res.ok) {
      setYedekKodlar(yedekKodUret());
      setAdim(3);
    } else {
      const { error } = await res.json().catch(() => ({ error: "Kod doğrulanamadı" }));
      goster({ tip: "hata", baslik: "Doğrulama başarısız", aciklama: error });
    }
  }

  function bitir() {
    goster({ tip: "basari", baslik: "İki adımlı doğrulama etkinleştirildi" });
    onEtkin();
    kapat();
    setTimeout(sifirla, 300);
  }

  function kopyalaKodlar() {
    navigator.clipboard.writeText(yedekKodlar.join("\n"));
    setKopyalandi(true);
    goster({ tip: "basari", baslik: "Yedek kodlar kopyalandı" });
    setTimeout(() => setKopyalandi(false), 1600);
  }

  return (
    <Modal acik={acik} kapat={kapat} baslik="İki adımlı doğrulamayı kur" genislik="max-w-md">
      {/* adım göstergesi */}
      <div className="mb-5 flex items-center gap-2">
        {[1, 2, 3].map((a) => (
          <div key={a} className="flex flex-1 items-center gap-2">
            <span className={cn(
              "grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold",
              adim >= a ? "bg-brand-600 text-white" : "bg-canvas text-slate-faint",
            )}>
              {adim > a ? <Check className="size-3.5" /> : a}
            </span>
            {a < 3 && <span className={cn("h-0.5 flex-1 rounded-full", adim > a ? "bg-brand-600" : "bg-line")} />}
          </div>
        ))}
      </div>

      {adim === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-muted">
            Kimlik doğrulayıcı uygulamanla (Google Authenticator, 1Password, Authy) aşağıdaki QR kodu tara.
          </p>
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-canvas/40 p-6">
            <div className="grid size-40 place-items-center rounded-xl border border-line-strong bg-white text-slate-300">
              <QrCode className="size-24" strokeWidth={1} />
            </div>
            <div className="text-center">
              <div className="text-[12px] text-slate-faint">Manuel giriş anahtarı</div>
              <div className="mt-0.5 font-mono text-sm font-semibold tracking-wide text-slate-ink">{secret}</div>
            </div>
          </div>
          <p className="break-all rounded-lg bg-canvas px-3 py-2 font-mono text-[11px] text-slate-faint">{otpauth}</p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={kapat}>İptal</Button>
            <Button onClick={() => setAdim(2)}>Devam</Button>
          </div>
        </div>
      )}

      {adim === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-muted">Uygulamanın gösterdiği 6 haneli kodu gir. (Demo: <span className="font-mono text-slate-ink">herhangi 6 hane</span>)</p>
          <Alan etiket="Doğrulama kodu">
            <Girdi
              value={kod}
              onChange={(e) => setKod(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              className="text-center font-mono text-lg tracking-[0.4em]"
              autoFocus
            />
          </Alan>
          <div className="flex justify-between gap-2 pt-1">
            <Button variant="ghost" onClick={() => setAdim(1)}>← Geri</Button>
            <Button onClick={dogrula} disabled={kod.length !== 6 || gonderiliyor}>
              {gonderiliyor ? "Doğrulanıyor…" : "Doğrula ve etkinleştir"}
            </Button>
          </div>
        </div>
      )}

      {adim === 3 && (
        <div className="space-y-4">
          <NotKutusu ton="yesil" baslik="2FA etkinleştirildi">
            Bu yedek kodları güvenli bir yerde sakla. Kimlik doğrulayıcına erişemezsen her kod bir kez giriş için kullanılabilir.
          </NotKutusu>
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-canvas/40 p-4">
            {yedekKodlar.map((k) => (
              <span key={k} className="rounded-lg bg-white px-3 py-2 text-center font-mono text-[13px] font-semibold tracking-wide text-slate-ink ring-1 ring-line">
                {k}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={kopyalaKodlar}>
              {kopyalandi ? <Check className="size-4 text-ok" /> : <Copy className="size-4" />} Kodları kopyala
            </Button>
            <Button size="sm" onClick={bitir}>Bitir</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ Şifre değiştir modalı */
function SifreModal({ acik, kapat }: { acik: boolean; kapat: () => void }) {
  const { goster } = useToast();
  const [eski, setEski] = useState("");
  const [yeni, setYeni] = useState("");
  const [tekrar, setTekrar] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  // Basit güç göstergesi.
  const guc = useMemo(() => {
    let s = 0;
    if (yeni.length >= 8) s++;
    if (/[A-Z]/.test(yeni) && /[a-z]/.test(yeni)) s++;
    if (/\d/.test(yeni)) s++;
    if (/[^A-Za-z0-9]/.test(yeni)) s++;
    return s; // 0..4
  }, [yeni]);
  const gucEtiket = ["Çok zayıf", "Zayıf", "Orta", "İyi", "Güçlü"][guc];
  const gucRenk = ["bg-danger2", "bg-danger2", "bg-warn", "bg-brand-500", "bg-ok"][guc];

  const gecerli =
    eski.length > 0 && yeni.length >= 8 && yeni === tekrar && yeni !== eski;

  function kapatSifirla() {
    kapat();
    setTimeout(() => { setEski(""); setYeni(""); setTekrar(""); }, 300);
  }

  async function kaydet() {
    if (yeni !== tekrar) { goster({ tip: "hata", baslik: "Yeni şifreler eşleşmiyor" }); return; }
    if (yeni.length < 8) { goster({ tip: "hata", baslik: "Yeni şifre en az 8 karakter olmalı" }); return; }
    setGonderiliyor(true);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword: eski, newPassword: yeni }),
    });
    setGonderiliyor(false);
    if (res.ok) {
      goster({ tip: "basari", baslik: "Şifre güncellendi" });
      kapatSifirla();
    } else {
      const { error } = await res.json().catch(() => ({ error: "Şifre değiştirilemedi" }));
      goster({ tip: "hata", baslik: "Değiştirilemedi", aciklama: error });
    }
  }

  return (
    <Modal acik={acik} kapat={kapatSifirla} baslik="Şifre değiştir">
      <div className="space-y-4">
        <Alan etiket="Mevcut şifre">
          <Girdi type="password" value={eski} onChange={(e) => setEski(e.target.value)} placeholder="••••••••" autoFocus />
        </Alan>
        <Alan etiket="Yeni şifre">
          <Girdi type="password" value={yeni} onChange={(e) => setYeni(e.target.value)} placeholder="En az 8 karakter" />
        </Alan>
        {yeni.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex h-1.5 flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={cn("h-full flex-1 rounded-full transition-colors", i < guc ? gucRenk : "bg-canvas")} />
              ))}
            </div>
            <span className="w-16 shrink-0 text-right text-[12px] font-medium text-slate-muted">{gucEtiket}</span>
          </div>
        )}
        <Alan etiket="Yeni şifre (tekrar)">
          <Girdi type="password" value={tekrar} onChange={(e) => setTekrar(e.target.value)} placeholder="••••••••" />
        </Alan>
        {tekrar.length > 0 && yeni !== tekrar && (
          <p className="text-[13px] text-danger2">Şifreler eşleşmiyor.</p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={kapatSifirla}>İptal</Button>
          <Button onClick={kaydet} disabled={!gecerli || gonderiliyor}>
            {gonderiliyor ? "Kaydediliyor…" : "Şifreyi güncelle"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
