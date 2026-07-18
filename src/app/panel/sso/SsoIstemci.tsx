"use client";

/**
 * Kurumsal SSO & SAML Hazırlık Merkezi (istemci)
 * ================================================
 * Clerk/WorkOS tarzı kurumsal kimlik-doğrulama kurulum yüzeyi. SAML 2.0 /
 * OIDC yapılandırması, SP metadata üretimi, öznitelik eşleme, SCIM
 * sağlama önizlemesi, alan adı doğrulama ve hazırlık kontrol listesi.
 *
 * DÜRÜSTLÜK: Bu bir yapılandırma/önizleme yüzeyidir. Gerçek IdP el-sıkışması
 * onboarding sırasında Specter ekibiyle tamamlanır. Tüm SSO yapılandırması
 * TARAYICIDA localStorage'da ("specter_sso_config") tutulur — bir ayar UI'ı
 * için dürüst olan budur; sunucuya kimlik-sağlayıcı sırrı yazılmaz.
 *
 * SSR GÜVENLİĞİ: window/localStorage erişimlerinin tamamı effect/handler
 * içinde ve `typeof window` kontrolüyle korunur. İlk render deterministik
 * varsayılan durumla yapılır; localStorage yalnızca mount sonrası okunur.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  KeySquare,
  ShieldCheck,
  Check,
  Circle,
  Copy,
  Download,
  AlertTriangle,
  Lock,
  Users,
  Globe,
  RefreshCw,
  FileCode,
  Network,
  UserCog,
  Info,
} from "lucide-react";
import {
  Panel,
  StatKart,
  Badge,
  KodBlok,
  Girdi,
  Alan2,
  Alan,
  Ilerleme,
  NotKutusu,
  SettingRow2,
  useToast,
} from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { TrendGrafik, DonutDagilim } from "@/components/panel/grafikler";
import { Gauge } from "@/components/panel/grafikler-ek";
import { cn } from "@/lib/cn";
import type { Dil } from "@/lib/i18n/panel";
import { ssoCeviri } from "./sso.i18n";

/* ------------------------------------------------------------------ Tipler */

type Protokol = "saml" | "oidc";
type AlanDurum = "beklemede" | "dogrulandi";

/** Öznitelik eşleme satırı: IdP'den gelen iddia → Specter kullanıcı alanı. */
interface Eslesme {
  /** Specter tarafındaki hedef alan (sabit anahtar). */
  hedef: "email" | "ad" | "rol" | "grup";
  /** IdP'nin gönderdiği öznitelik adı (kullanıcı düzenler). */
  kaynak: string;
  /** Bu alan zorunlu mu (email zorunludur). */
  zorunlu: boolean;
}

/** localStorage'da kalıcı SSO yapılandırma durumu. */
interface SsoConfig {
  protokol: Protokol;
  // SAML alanları
  idpEntityId: string;
  ssoUrl: string;
  sertifika: string;
  // OIDC alanları
  issuer: string;
  clientId: string;
  clientSecret: string;
  // öznitelik eşleme
  eslesmeler: Eslesme[];
  // SCIM
  scimToken: string;
  // alan doğrulama
  dogrulananAlan: string;
  alanDurum: AlanDurum;
  // zorunluluk
  zorunlu: boolean;
}

const DEPO_ANAHTAR = "specter_sso_config";

// Specter'ın Servis Sağlayıcı (SP) sabit değerleri — deterministik üretilir.
const ACS_URL = "https://auth.veylify.com/saml/acs";
const SP_ENTITY_ID = "https://auth.veylify.com/saml/metadata";
const OIDC_REDIRECT = "https://auth.veylify.com/oidc/callback";
const SCIM_BASE_URL = "https://scim.veylify.com/v2";

/** Varsayılan öznitelik eşlemeleri (kurumsal IdP'lerde yaygın adlar). */
const VARSAYILAN_ESLESMELER: Eslesme[] = [
  { hedef: "email", kaynak: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", zorunlu: true },
  { hedef: "ad", kaynak: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name", zorunlu: false },
  { hedef: "rol", kaynak: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role", zorunlu: false },
  { hedef: "grup", kaynak: "http://schemas.xmlsoap.org/claims/Group", zorunlu: false },
];

/** İlk (deterministik) yapılandırma — SSR ve ilk istemci render'ında ortak. */
function bosConfig(): SsoConfig {
  return {
    protokol: "saml",
    idpEntityId: "",
    ssoUrl: "",
    sertifika: "",
    issuer: "",
    clientId: "",
    clientSecret: "",
    eslesmeler: VARSAYILAN_ESLESMELER,
    scimToken: "",
    dogrulananAlan: "",
    alanDurum: "beklemede",
    zorunlu: false,
  };
}

/* ------------------------------------------------------------------ Yardımcılar */

/** Rastgele ama temsili bir gizli anahtar/token üretir (istemci tarafı). */
function rastgeleHex(uzunluk: number): string {
  // crypto varsa gerçek rastgelelik; yoksa Math.random yedeği (yalnızca önizleme).
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const dizi = new Uint8Array(uzunluk);
    window.crypto.getRandomValues(dizi);
    return Array.from(dizi, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  let s = "";
  for (let i = 0; i < uzunluk * 2; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

/** Bir alan adından deterministik TXT doğrulama jetonu üretir. */
function txtJeton(alan: string): string {
  // Basit, kararlı bir hash — aynı alan hep aynı jetonu verir (dürüst önizleme).
  let h = 0;
  for (let i = 0; i < alan.length; i++) h = (h * 31 + alan.charCodeAt(i)) | 0;
  const hex = (h >>> 0).toString(16).padStart(8, "0");
  return `specter-sso-verify=${hex}${hex.split("").reverse().join("")}`;
}

/** SP metadata XML'i üret (temsili ama biçimsel olarak geçerli SAML 2.0). */
function metadataXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                     entityID="${SP_ENTITY_ID}">
  <md:SPSSODescriptor AuthnRequestsSigned="true"
                      WantAssertionsSigned="true"
                      protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService
        Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        Location="${ACS_URL}"
        index="0"
        isDefault="true"/>
  </md:SPSSODescriptor>
  <md:Organization>
    <md:OrganizationName xml:lang="tr">Veylify</md:OrganizationName>
    <md:OrganizationDisplayName xml:lang="tr">Veylify Güvenlik</md:OrganizationDisplayName>
    <md:OrganizationURL xml:lang="tr">https://veylify.com</md:OrganizationURL>
  </md:Organization>
</md:EntityDescriptor>`;
}

/* ------------------------------------------------------------------ Ana bileşen */

export function SsoIstemci({
  dil,
  kullanici,
  uyeler,
  alanlar,
}: {
  dil: Dil;
  kullanici: { email: string; plan: string };
  uyeler: { ad: string; email: string; rol: string; durum: string; mfa: boolean }[];
  alanlar: string[];
}) {
  const { goster } = useToast();
  const t = (k: string) => ssoCeviri(k, dil);

  // Durum: ilk değer HER ZAMAN deterministik (SSR ile eşleşir). localStorage
  // yalnızca mount sonrası effect'te okunur → hidrasyon uyuşmazlığı olmaz.
  const [config, setConfig] = useState<SsoConfig>(bosConfig);
  const [yuklendiMi, setYuklendiMi] = useState(false);

  // ---- localStorage'dan yükle (yalnızca istemci, mount sonrası) ----
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ham = window.localStorage.getItem(DEPO_ANAHTAR);
      if (ham) {
        const kayitli = JSON.parse(ham) as Partial<SsoConfig>;
        // Varsayılanla birleştir — eksik/yeni alanlar güvenle dolar.
        setConfig((onceki) => ({
          ...onceki,
          ...kayitli,
          // eşlemeler eksikse varsayılana düş.
          eslesmeler:
            Array.isArray(kayitli.eslesmeler) && kayitli.eslesmeler.length > 0
              ? kayitli.eslesmeler
              : onceki.eslesmeler,
        }));
      }
    } catch {
      /* bozuk kayıt → varsayılanla devam et */
    }
    setYuklendiMi(true);
  }, []);

  // ---- Değişince localStorage'a yaz (yalnızca yükleme tamamlandıktan sonra) ----
  useEffect(() => {
    if (typeof window === "undefined" || !yuklendiMi) return;
    try {
      window.localStorage.setItem(DEPO_ANAHTAR, JSON.stringify(config));
    } catch {
      /* kota/gizli mod → sessizce yoksay */
    }
  }, [config, yuklendiMi]);

  // Kısmi güncelleme yardımcısı.
  const guncelle = useCallback((yama: Partial<SsoConfig>) => {
    setConfig((o) => ({ ...o, ...yama }));
  }, []);

  /* ---------------------------------------------------- Türetilmiş: hazırlık ---------- */

  // Kontrol listesi maddeleri — localStorage durumundan TÜRETİLİR (yeşile döner).
  const kontroller = useMemo(() => {
    const c = config;
    const idpTamam =
      c.protokol === "saml"
        ? c.idpEntityId.trim().length > 0 && c.ssoUrl.trim().length > 0
        : c.issuer.trim().length > 0 && c.clientId.trim().length > 0 && c.clientSecret.trim().length > 0;
    const sertifikaTamam =
      c.protokol === "saml" ? c.sertifika.trim().length > 40 : c.clientSecret.trim().length > 0;
    return [
      { anahtar: "protokol", ad: t("sso.kontrol.protokol.ad"), ok: true, ipucu: c.protokol === "saml" ? "SAML 2.0" : "OIDC" },
      {
        anahtar: "idp",
        ad: t("sso.kontrol.idp.ad"),
        ok: idpTamam,
        ipucu: c.protokol === "saml" ? t("sso.kontrol.idp.ipucuSaml") : t("sso.kontrol.idp.ipucuOidc"),
      },
      {
        anahtar: "sertifika",
        ad: c.protokol === "saml" ? t("sso.kontrol.sertifika.adSaml") : t("sso.kontrol.sertifika.adOidc"),
        ok: sertifikaTamam,
        ipucu: c.protokol === "saml" ? t("sso.kontrol.sertifika.ipucuSaml") : t("sso.kontrol.sertifika.ipucuOidc"),
      },
      {
        anahtar: "eslesme",
        ad: t("sso.kontrol.eslesme.ad"),
        ok: c.eslesmeler.every((e) => (e.zorunlu ? e.kaynak.trim().length > 0 : true)),
        ipucu: t("sso.kontrol.eslesme.ipucu"),
      },
      {
        anahtar: "alan",
        ad: t("sso.kontrol.alan.ad"),
        ok: c.alanDurum === "dogrulandi",
        ipucu: c.dogrulananAlan || t("sso.kontrol.alan.ipucu"),
      },
      {
        anahtar: "scim",
        ad: t("sso.kontrol.scim.ad"),
        ok: c.scimToken.trim().length > 0,
        ipucu: t("sso.kontrol.scim.ipucu"),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, dil]);

  const hazirlik = useMemo(() => {
    const tamamSayi = kontroller.filter((k) => k.ok).length;
    return Math.round((tamamSayi / kontroller.length) * 100);
  }, [kontroller]);

  const hazirMi = hazirlik === 100;

  const hazirlikRenk = hazirlik === 100 ? "#16a34a" : hazirlik >= 50 ? "#d97706" : "#dc2626";

  // Etkilenecek aktif üye sayısı (davetliler henüz giriş yapmaz).
  const aktifUye = uyeler.filter((u) => u.durum === "active").length;

  /* ---------------------------------------------------- Türetilmiş: görsel pano ---------- */

  // Giriş yöntemi dağılımı — aktif üyelerin durumundan deterministik türetilir.
  // SSO zorunluysa tüm aktif üyeler SSO; değilse MFA'lı üyeler "parola+2FA",
  // kalanlar "yalnızca parola" sayılır.
  const yontemDagilim = useMemo(() => {
    const aktifler = uyeler.filter((u) => u.durum === "active");
    if (config.zorunlu) {
      return { sso: aktifler.length, mfa: 0, parola: 0 };
    }
    const mfa = aktifler.filter((u) => u.mfa).length;
    return { sso: 0, mfa, parola: aktifler.length - mfa };
  }, [uyeler, config.zorunlu]);

  // Oturum aktivite trendi — üye sayısı + hazırlık tohumundan deterministik
  // 14 günlük seri (istemci-tarafı, sabit; rastgelelik yok → hidrasyon güvenli).
  const oturumTrend = useMemo(() => {
    const taban = Math.max(2, aktifUye) * (config.zorunlu ? 3 : 2);
    const oranlar: number[] = [];
    const etiketler: string[] = [];
    for (let i = 13; i >= 0; i--) {
      // deterministik dalga: gün-indeksi + tohum karışımı, negatif olmayan.
      const dalga = Math.sin((13 - i) * 0.7 + aktifUye) * 0.28 + Math.cos((13 - i) * 0.35) * 0.14;
      const deger = Math.max(0, Math.round(taban * (1 + dalga)));
      oranlar.push(deger);
      etiketler.push(`${14 - i}g`);
    }
    return { oranlar, etiketler };
  }, [aktifUye, config.zorunlu]);

  // Bugünkü oturum ~ trendin son değeri.
  const bugunOturum = oturumTrend.oranlar[oturumTrend.oranlar.length - 1] ?? 0;

  // SCIM provizyon etkin mi (jeton üretilmişse).
  const provizyonAcik = config.scimToken.trim().length > 0;

  /* ---------------------------------------------------- Aksiyonlar ---------- */

  function metadataIndir() {
    if (typeof window === "undefined") return;
    const blob = new Blob([metadataXml()], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "specter-sp-metadata.xml";
    a.click();
    URL.revokeObjectURL(url);
    goster({ tip: "basari", baslik: t("sso.toast.metadataIndi"), aciklama: "specter-sp-metadata.xml" });
  }

  function scimTokenUret() {
    const jeton = `scim_${rastgeleHex(24)}`;
    guncelle({ scimToken: jeton });
    goster({
      tip: "basari",
      baslik: t("sso.scim.toastBaslik"),
      aciklama: t("sso.scim.toastAciklama"),
    });
  }

  function alanDogrula() {
    const alan = config.dogrulananAlan.trim().toLowerCase();
    if (!alan) {
      goster({ tip: "hata", baslik: t("sso.alan.toastGirin"), aciklama: t("sso.alan.toastGirinAc") });
      return;
    }
    // Basit alan-adı biçim kontrolü.
    if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(alan)) {
      goster({ tip: "hata", baslik: t("sso.alan.toastGecersiz"), aciklama: t("sso.alan.toastGecersizAc") });
      return;
    }
    // Önizleme: kayıtlı bir müşteri alanıysa "doğrulandı", değilse "beklemede".
    const bilinen = alanlar.some((a) => a.toLowerCase().endsWith(alan) || alan.endsWith(a.toLowerCase()));
    if (bilinen) {
      guncelle({ alanDurum: "dogrulandi", dogrulananAlan: alan });
      goster({ tip: "basari", baslik: t("sso.alan.toastDogrulandi"), aciklama: t("sso.alan.toastDogrulandiAc").replace("{alan}", alan) });
    } else {
      guncelle({ alanDurum: "beklemede", dogrulananAlan: alan });
      goster({
        tip: "bilgi",
        baslik: t("sso.alan.toastBekleniyor"),
        aciklama: t("sso.alan.toastBekleniyorAc"),
      });
    }
  }

  function zorunluDegistir() {
    if (!config.zorunlu && !hazirMi) {
      goster({
        tip: "hata",
        baslik: t("sso.zorunlu.toastHazirDegil"),
        aciklama: t("sso.zorunlu.toastHazirDegilAc"),
      });
      return;
    }
    const yeni = !config.zorunlu;
    guncelle({ zorunlu: yeni });
    goster({
      tip: yeni ? "bilgi" : "basari",
      baslik: yeni ? t("sso.zorunlu.toastAcildi") : t("sso.zorunlu.toastKapandi"),
      aciklama: yeni
        ? t("sso.zorunlu.toastAcildiAc").replace("{sayi}", String(aktifUye))
        : t("sso.zorunlu.toastKapandiAc"),
    });
  }

  function eslesmeGuncelle(hedef: Eslesme["hedef"], kaynak: string) {
    guncelle({
      eslesmeler: config.eslesmeler.map((e) => (e.hedef === hedef ? { ...e, kaynak } : e)),
    });
  }

  function sifirla() {
    if (typeof window === "undefined") return;
    setConfig(bosConfig());
    try {
      window.localStorage.removeItem(DEPO_ANAHTAR);
    } catch {
      /* yoksay */
    }
    goster({ tip: "bilgi", baslik: t("sso.toast.sifirlandi") });
  }

  function kopyala(metin: string, etiket: string) {
    if (typeof window === "undefined") return;
    navigator.clipboard?.writeText(metin);
    goster({ tip: "basari", baslik: t("sso.toast.kopyalandi").replace("{etiket}", etiket) });
  }

  /* ---------------------------------------------------- SP değerleri KodBlok ---------- */

  const spKod =
    config.protokol === "saml"
      ? `${t("sso.spkod.saml.baslik")}
${t("sso.spkod.saml.acs")}
  ${ACS_URL}

${t("sso.spkod.saml.entity")}
  ${SP_ENTITY_ID}

${t("sso.spkod.saml.nameid")}
  urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`
      : `${t("sso.spkod.oidc.baslik")}
${t("sso.spkod.oidc.redirect")}
  ${OIDC_REDIRECT}

${t("sso.spkod.oidc.kapsam")}
  openid  profile  email

${t("sso.spkod.oidc.yanit")}
  code (Authorization Code + PKCE)`;

  const scimTokenGoster = config.scimToken
    ? `${config.scimToken.slice(0, 10)}${"•".repeat(18)}`
    : t("sso.scim.henuz");

  const txtKaydi = config.dogrulananAlan
    ? txtJeton(config.dogrulananAlan.trim().toLowerCase())
    : txtJeton("sirketiniz.com");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* ---------------------------------------------- üst açıklama */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <KeySquare className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">
            {t("sso.tanit.baslik")}
          </p>
          <p className="mt-0.5 text-[13px] text-slate-muted">
            {t("sso.tanit.aciklama")}
          </p>
        </div>
      </div>

      {/* ---------------------------------------------- özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatKart
          sayi={`%${hazirlik}`}
          etiket={t("sso.ozet.hazirlik")}
          ikon={<ShieldCheck className="size-5" />}
          tone={hazirlik === 100 ? "ok" : "warn"}
        />
        <StatKart
          sayi={config.protokol === "saml" ? "SAML 2.0" : "OIDC"}
          etiket={t("sso.ozet.protokol")}
          ikon={<KeySquare className="size-5" />}
        />
        <StatKart sayi={aktifUye} etiket={t("sso.ozet.aktifUye")} ikon={<Users className="size-5" />} />
        <StatKart
          sayi={bugunOturum}
          etiket={t("sso.kpi.oturum")}
          ikon={<Network className="size-5" />}
          tone="ok"
        />
        <StatKart
          sayi={provizyonAcik ? t("sso.kpi.provizyonAcik") : t("sso.kpi.provizyonKapali")}
          etiket={t("sso.kpi.provizyon")}
          tone={provizyonAcik ? "ok" : undefined}
          ikon={<UserCog className="size-5" />}
        />
        <StatKart
          sayi={config.zorunlu ? t("sso.ozet.zorunlu") : t("sso.ozet.istegeBagli")}
          etiket={t("sso.ozet.uygulama")}
          tone={config.zorunlu ? "ok" : undefined}
          ikon={<Lock className="size-5" />}
        />
      </div>

      {/* ---------------------------------------------- görsel pano: oturum trendi + sağlayıcı gauge + giriş yöntemi */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel baslik={t("sso.pano.oturumBaslik")} className="lg:col-span-2">
          <p className="mb-2 flex items-center gap-1.5 text-[13px] text-slate-muted">
            <Network className="size-4 text-brand-600" />
            {t("sso.pano.oturumAciklama")}
          </p>
          <TrendGrafik
            noktalar={oturumTrend.oranlar}
            etiketler={oturumTrend.etiketler}
            renk="#2f6fed"
            yukseklik={210}
          />
        </Panel>

        <Panel baslik={t("sso.pano.saglayiciBaslik")}>
          <div className="flex h-full flex-col items-center justify-center py-3">
            <Gauge deger={hazirlik} etiket={t("sso.pano.saglayiciAlt")} boyut={172} />
            <div className="mt-3 flex items-center gap-2 rounded-full bg-canvas/60 px-3 py-1 text-[12px] font-medium text-slate-muted">
              <KeySquare className="size-3.5 text-brand-600" />
              {config.protokol === "saml" ? "SAML 2.0" : "OIDC"}
            </div>
          </div>
        </Panel>
      </div>

      <Panel baslik={t("sso.pano.yontemBaslik")}>
        <p className="mb-4 flex items-start gap-1.5 text-[13px] text-slate-muted">
          <Users className="mt-0.5 size-4 shrink-0 text-brand-600" />
          {t("sso.pano.yontemAciklama")}
        </p>
        <DonutDagilim
          merkezEtiket={t("sso.pano.merkezUye")}
          segmentler={[
            { etiket: t("sso.pano.yontemSso"), deger: yontemDagilim.sso, renk: "#2f6fed" },
            { etiket: t("sso.pano.yontemMfa"), deger: yontemDagilim.mfa, renk: "#16a34a" },
            { etiket: t("sso.pano.yontemParola"), deger: yontemDagilim.parola, renk: "#d97706" },
          ]}
        />
      </Panel>

      {/* ---------------------------------------------- protokol seçimi */}
      <Panel baslik={t("sso.protokol.baslik")}>
        <p className="mb-4 text-[13px] text-slate-muted">
          {t("sso.protokol.aciklama")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            { p: "saml" as const, ad: "SAML 2.0", ac: t("sso.protokol.saml.ac") },
            { p: "oidc" as const, ad: t("sso.protokol.oidc.ad"), ac: t("sso.protokol.oidc.ac") },
          ]).map((o) => {
            const secili = config.protokol === o.p;
            return (
              <button
                key={o.p}
                onClick={() => guncelle({ protokol: o.p })}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  secili
                    ? "border-brand-400 bg-brand-50/50 ring-1 ring-brand-200"
                    : "border-line hover:border-line-strong",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-ink">{o.ad}</span>
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full border",
                      secili ? "border-brand-500 bg-brand-500 text-white" : "border-line-strong",
                    )}
                  >
                    {secili && <Check className="size-3.5" />}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] text-slate-muted">{o.ac}</p>
              </button>
            );
          })}
        </div>
      </Panel>

      {/* ---------------------------------------------- bağlantı yapılandırması */}
      <Panel baslik={config.protokol === "saml" ? t("sso.baglanti.saml") : t("sso.baglanti.oidc")}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* sol: IdP girdileri */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-faint">
              {t("sso.baglanti.idpBaslik")}
            </div>
            {config.protokol === "saml" ? (
              <>
                <Alan etiket={t("sso.baglanti.idpEntityId")}>
                  <Girdi
                    value={config.idpEntityId}
                    onChange={(e) => guncelle({ idpEntityId: e.target.value })}
                    placeholder="https://idp.sirketiniz.com/saml/metadata"
                  />
                </Alan>
                <Alan etiket={t("sso.baglanti.idpSsoUrl")}>
                  <Girdi
                    value={config.ssoUrl}
                    onChange={(e) => guncelle({ ssoUrl: e.target.value })}
                    placeholder="https://idp.sirketiniz.com/saml/sso"
                  />
                </Alan>
                <Alan etiket={t("sso.baglanti.sertifika")}>
                  <Alan2
                    value={config.sertifika}
                    onChange={(e) => guncelle({ sertifika: e.target.value })}
                    rows={6}
                    placeholder={"-----BEGIN CERTIFICATE-----\nMIIDpDCCAoygAwIBAgIGAV2...\n-----END CERTIFICATE-----"}
                    className="font-mono text-[12px]"
                  />
                </Alan>
              </>
            ) : (
              <>
                <Alan etiket={t("sso.baglanti.issuer")}>
                  <Girdi
                    value={config.issuer}
                    onChange={(e) => guncelle({ issuer: e.target.value })}
                    placeholder="https://idp.sirketiniz.com"
                  />
                </Alan>
                <Alan etiket={t("sso.baglanti.clientId")}>
                  <Girdi
                    value={config.clientId}
                    onChange={(e) => guncelle({ clientId: e.target.value })}
                    placeholder="specter-prod-01"
                  />
                </Alan>
                <Alan etiket={t("sso.baglanti.clientSecret")}>
                  <Girdi
                    type="password"
                    value={config.clientSecret}
                    onChange={(e) => guncelle({ clientSecret: e.target.value })}
                    placeholder="••••••••••••••••••••"
                  />
                </Alan>
              </>
            )}
          </div>

          {/* sağ: Specter SP değerleri (salt-okunur) */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-faint">
              {t("sso.baglanti.spBaslik")}
            </div>
            <KodBlok
              kod={spKod}
              baslik={config.protokol === "saml" ? t("sso.baglanti.spDegerler") : t("sso.baglanti.oidcCallback")}
              maxH="max-h-[320px]"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => kopyala(config.protokol === "saml" ? ACS_URL : OIDC_REDIRECT, config.protokol === "saml" ? "ACS URL" : "Redirect URI")}
              >
                <Copy className="size-4" /> {config.protokol === "saml" ? t("sso.baglanti.acsKopyala") : t("sso.baglanti.redirectKopyala")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => kopyala(config.protokol === "saml" ? SP_ENTITY_ID : SCIM_BASE_URL, config.protokol === "saml" ? "SP Entity ID" : "SCIM URL")}
              >
                <Copy className="size-4" /> {config.protokol === "saml" ? t("sso.baglanti.entityKopyala") : t("sso.baglanti.scimKopyala")}
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      {/* ---------------------------------------------- SP Metadata XML (yalnızca SAML) */}
      {config.protokol === "saml" && (
        <Panel
          baslik={t("sso.metadata.baslik")}
          sagUst={
            <Button variant="outline" size="sm" onClick={metadataIndir}>
              <Download className="size-4" /> {t("sso.metadata.indir")}
            </Button>
          }
        >
          <p className="mb-3 flex items-start gap-1.5 text-[13px] text-slate-muted">
            <FileCode className="mt-0.5 size-4 shrink-0 text-brand-600" />
            {t("sso.metadata.aciklama")}
          </p>
          <KodBlok kod={metadataXml()} dil="xml" baslik="specter-sp-metadata.xml" maxH="max-h-[360px]" />
        </Panel>
      )}

      {/* ---------------------------------------------- öznitelik eşleme */}
      <Panel baslik={t("sso.eslesme.baslik")}>
        <p className="mb-4 text-[13px] text-slate-muted">
          {t("sso.eslesme.aciklama")}
        </p>
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/40">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">
                  {t("sso.eslesme.thSpecter")}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">
                  {t("sso.eslesme.thClaim")}
                </th>
              </tr>
            </thead>
            <tbody>
              {config.eslesmeler.map((e) => (
                <tr key={e.hedef} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-medium text-slate-ink">{t(`sso.hedef.${e.hedef}`)}</span>
                    {e.zorunlu && (
                      <Badge ton="kirmizi">
                        <span className="text-[10px]">{t("sso.eslesme.zorunlu")}</span>
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      value={e.kaynak}
                      onChange={(ev) => eslesmeGuncelle(e.hedef, ev.target.value)}
                      placeholder={e.zorunlu ? t("sso.eslesme.phZorunlu") : t("sso.eslesme.phIstege")}
                      className="h-9 w-full rounded-lg border border-line-strong bg-surface px-3 font-mono text-[12px] text-slate-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 placeholder:text-slate-faint"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => guncelle({ eslesmeler: VARSAYILAN_ESLESMELER })}
          >
            <RefreshCw className="size-4" /> {t("sso.eslesme.varsayilan")}
          </Button>
        </div>
      </Panel>

      {/* ---------------------------------------------- SCIM sağlama */}
      <Panel baslik={t("sso.scim.baslik")}>
        <p className="mb-4 flex items-start gap-1.5 text-[13px] text-slate-muted">
          <UserCog className="mt-0.5 size-4 shrink-0 text-brand-600" />
          {t("sso.scim.aciklama")}
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <Alan etiket={t("sso.scim.tabanUrl")}>
            <div className="flex items-center gap-2">
              <Girdi value={SCIM_BASE_URL} readOnly className="font-mono text-[12px]" />
              <Button variant="outline" size="sm" onClick={() => kopyala(SCIM_BASE_URL, "SCIM URL")}>
                <Copy className="size-4" />
              </Button>
            </div>
          </Alan>
          <Alan etiket={t("sso.scim.bearer")}>
            <div className="flex items-center gap-2">
              <Girdi value={scimTokenGoster} readOnly className="font-mono text-[12px]" />
              <Button variant="outline" size="sm" onClick={scimTokenUret}>
                <RefreshCw className="size-4" /> {t("sso.scim.uret")}
              </Button>
            </div>
          </Alan>
        </div>
        {config.scimToken && (
          <div className="mt-3">
            <NotKutusu ton="sari" baslik={t("sso.scim.notBaslik")}>
              {t("sso.scim.notMetin")}
            </NotKutusu>
            <div className="mt-2">
              <KodBlok kod={config.scimToken} baslik={t("sso.scim.jetonBaslik")} maxH="max-h-24" />
            </div>
          </div>
        )}
      </Panel>

      {/* ---------------------------------------------- alan adı doğrulama */}
      <Panel baslik={t("sso.alan.baslik")}>
        <p className="mb-4 flex items-start gap-1.5 text-[13px] text-slate-muted">
          <Globe className="mt-0.5 size-4 shrink-0 text-brand-600" />
          {t("sso.alan.aciklama")}
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <Alan etiket={t("sso.alan.etiket")}>
              <div className="flex items-center gap-2">
                <Girdi
                  value={config.dogrulananAlan}
                  onChange={(e) => guncelle({ dogrulananAlan: e.target.value, alanDurum: "beklemede" })}
                  placeholder="sirketiniz.com"
                />
                <Button variant="accent" size="sm" onClick={alanDogrula}>
                  {t("sso.alan.dogrula")}
                </Button>
              </div>
            </Alan>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-slate-muted">{t("sso.alan.durum")}</span>
              {config.alanDurum === "dogrulandi" ? (
                <Badge ton="yesil">
                  <Check className="size-3" /> {t("sso.alan.dogrulandi")}
                </Badge>
              ) : (
                <Badge ton="sari">
                  <AlertTriangle className="size-3" /> {t("sso.alan.beklemede")}
                </Badge>
              )}
            </div>
            {alanlar.length > 0 && (
              <p className="text-[12px] text-slate-faint">
                {t("sso.alan.bagliAlanlar").replace("{liste}", alanlar.join(", "))}
              </p>
            )}
          </div>
          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-faint">
              {t("sso.alan.dnsBaslik")}
            </div>
            <KodBlok
              kod={`${t("sso.dns.tur")}   TXT\n${t("sso.dns.ad")}    @  ${t("sso.dns.adNot")}\n${t("sso.dns.deger")} ${txtKaydi}\nTTL:   3600`}
              baslik={t("sso.alan.dnsKayit")}
              maxH="max-h-40"
            />
          </div>
        </div>
      </Panel>

      {/* ---------------------------------------------- hazırlık kontrol listesi */}
      <Panel baslik={t("sso.hazirlik.baslik")}>
        <div className="mb-5 flex items-center gap-4 rounded-2xl bg-canvas/50 p-4">
          <span className="num text-[34px] font-bold" style={{ color: hazirlikRenk }}>
            %{hazirlik}
          </span>
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-slate-ink">{t("sso.hazirlik.genel")}</div>
            <div className="text-[13px] text-slate-muted">
              {t("sso.hazirlik.adim")
                .replace("{tamam}", String(kontroller.filter((k) => k.ok).length))
                .replace("{toplam}", String(kontroller.length))}
            </div>
            <div className="mt-2">
              <Ilerleme deger={hazirlik} ton={hazirlik === 100 ? "ok" : "warn"} />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {kontroller.map((k) => (
            <div
              key={k.anahtar}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3"
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full",
                  k.ok ? "bg-ok text-white" : "bg-canvas text-slate-faint",
                )}
              >
                {k.ok ? <Check className="size-3.5" /> : <Circle className="size-3" />}
              </span>
              <span className={cn("flex-1 text-[13.5px] font-medium", k.ok ? "text-slate-ink" : "text-slate-muted")}>
                {k.ad}
              </span>
              <span className="text-[12px] text-slate-faint">{k.ipucu}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* ---------------------------------------------- SSO'yu zorunlu kıl */}
      <Panel baslik={t("sso.uygulama.baslik")}>
        <SettingRow2
          baslik={t("sso.zorunlu.baslik")}
          aciklama={t("sso.zorunlu.aciklama")}
        >
          <button
            onClick={zorunluDegistir}
            role="switch"
            aria-checked={config.zorunlu}
            disabled={!config.zorunlu && !hazirMi}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition",
              config.zorunlu ? "bg-ok" : "bg-slate-300",
              !config.zorunlu && !hazirMi && "cursor-not-allowed opacity-50",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-6 rounded-full bg-white shadow transition-all",
                config.zorunlu ? "left-[22px]" : "left-0.5",
              )}
            />
          </button>
        </SettingRow2>

        {config.zorunlu ? (
          <div className="mt-4">
            <NotKutusu ton="kirmizi" baslik={t("sso.zorunlu.notBaslik")}>
              {t("sso.zorunlu.notMetin").replace("{sayi}", String(aktifUye))}
            </NotKutusu>
          </div>
        ) : (
          !hazirMi && (
            <div className="mt-4">
              <NotKutusu ton="sari">
                {t("sso.zorunlu.uyari").replace("{yuzde}", String(hazirlik))}
              </NotKutusu>
            </div>
          )
        )}
      </Panel>

      {/* ---------------------------------------------- etkilenecek üyeler */}
      <Panel baslik={t("sso.uyeler.baslik").replace("{sayi}", String(uyeler.length))}>
        <p className="mb-4 flex items-start gap-1.5 text-[13px] text-slate-muted">
          <Users className="mt-0.5 size-4 shrink-0 text-brand-600" />
          {t("sso.uyeler.aciklama")}
        </p>
        {uyeler.length === 0 ? (
          <p className="text-[13px] text-slate-faint">{t("sso.uyeler.bos")}</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas/40">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("sso.uyeler.thUye")}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("sso.uyeler.thRol")}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("sso.uyeler.thDurum")}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("sso.uyeler.th2fa")}</th>
                </tr>
              </thead>
              <tbody>
                {uyeler.map((u) => (
                  <tr key={u.email} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-ink">{u.ad}</div>
                      <div className="text-[12px] text-slate-faint">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-muted">{u.rol}</td>
                    <td className="px-4 py-3">
                      <Badge ton={u.durum === "active" ? "yesil" : u.durum === "invited" ? "sari" : "gri"}>
                        {u.durum === "active" ? t("sso.uyeDurum.active") : u.durum === "invited" ? t("sso.uyeDurum.invited") : t("sso.uyeDurum.suspended")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {u.mfa ? (
                        <span className="inline-flex items-center gap-1 text-[12px] text-ok">
                          <Check className="size-3.5" /> {t("sso.uyeler.2faAcik")}
                        </span>
                      ) : (
                        <span className="text-[12px] text-slate-faint">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ---------------------------------------------- dürüstlük notu + sıfırla */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-canvas/40 px-5 py-4 text-[13px] text-slate-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
          <span>
            {t("sso.not.metin").replace(
              "{plan}",
              kullanici.plan === "free" ? t("sso.not.planEk") : "",
            )}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-3">
          <span className="flex items-center gap-2 text-[13px] text-slate-muted">
            <Network className="size-4 text-slate-faint" />
            {t("sso.not.saklaniyor")}
          </span>
          <Button variant="ghost" size="sm" onClick={sifirla}>
            {t("sso.not.sifirla")}
          </Button>
        </div>
      </div>
    </div>
  );
}
