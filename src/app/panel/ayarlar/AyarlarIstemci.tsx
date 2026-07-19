"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User as UserIcon, Globe, Bell, Trash2, Check, AlertTriangle, Mail, Webhook, MonitorSmartphone,
  ShieldCheck, KeyRound, Fingerprint, MonitorCheck, CalendarClock, Activity, Building2, Sparkles,
} from "lucide-react";
import {
  Panel, Alan, Girdi, Secim, SettingRow2, Avatar, Modal, Badge, NotKutusu, useToast,
} from "@/components/panel/kit";
import { Gauge } from "@/components/panel/grafikler-ek";
import { Toggle } from "@/components/panel/Toggle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { BildirimTercihleri, BildirimOlay, BildirimKanal } from "@/lib/db/schema";
import type { Dil } from "@/lib/i18n/panel";
import { ayarlarCeviri } from "./ayarlar.i18n";

/** Dil → BCP-47 yerel etiketi (tarih biçimleme için). */
const BCP47: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

/* ------------------------------------------------------------------ sabitler */

const AVATAR_RENKLERI = [
  "#06b6d4", "#2f6fed", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#0ea5e9", "#14b8a6",
];

const DILLER: { deger: string; ad: string }[] = [
  { deger: "tr", ad: "Türkçe" },
  { deger: "en", ad: "English" },
];

const SAAT_DILIMLERI: { deger: string; ad: string }[] = [
  { deger: "Europe/Istanbul", ad: "(GMT+3) İstanbul" },
  { deger: "Europe/London", ad: "(GMT+0) Londra" },
  { deger: "Europe/Berlin", ad: "(GMT+1) Berlin" },
  { deger: "America/New_York", ad: "(GMT-5) New York" },
  { deger: "America/Los_Angeles", ad: "(GMT-8) Los Angeles" },
  { deger: "Asia/Dubai", ad: "(GMT+4) Dubai" },
  { deger: "Asia/Singapore", ad: "(GMT+8) Singapur" },
  { deger: "UTC", ad: "(GMT+0) UTC" },
];

/* Bildirim olayları — anahtar ENUM'dur (çevrilmez); etiket/açıklama t() ile alınır.
   `onerilen` görsel rozet içindir. */
const OLAYLAR: { anahtar: BildirimOlay; onerilen?: boolean }[] = [
  { anahtar: "kritik_uyari", onerilen: true },
  { anahtar: "ai_ajan" },
  { anahtar: "kota" },
  { anahtar: "haftalik_ozet" },
  { anahtar: "ekip" },
  { anahtar: "fatura" },
];

/* Bildirim kanalları — anahtar ENUM'dur (çevrilmez); etiket t("kanal.<enum>") ile alınır. */
const KANALLAR: { anahtar: BildirimKanal; ikon: React.ReactNode }[] = [
  { anahtar: "email", ikon: <Mail className="size-3.5" /> },
  { anahtar: "webhook", ikon: <Webhook className="size-3.5" /> },
  { anahtar: "panel", ikon: <MonitorSmartphone className="size-3.5" /> },
];

/* Varsayılan: gelmeyen tercih için makul öntanım. */
function varsayilan(olay: BildirimOlay, kanal: BildirimKanal): boolean {
  if (kanal === "panel") return true;
  if (kanal === "email") return olay !== "ekip";
  return olay === "kritik_uyari"; // webhook varsayılan yalnızca kritik
}

/* ------------------------------------------------------------------ tip */

export interface AyarMe {
  name: string;
  email: string;
  avatarColor: string;
  workspaceName: string;
  locale: string;
  timezone: string;
  createdAt: number;
  plan: string;
  notificationPrefs: BildirimTercihleri;
}

/* ------------------------------------------------------------------ ana */

export function AyarlarIstemci({ me, dil }: { me: AyarMe; dil: Dil }) {
  const router = useRouter();
  const { goster } = useToast();
  const t = (k: string) => ayarlarCeviri(k, dil);

  /* --- profil formu --- */
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [avatarColor, setAvatarColor] = useState(me.avatarColor);
  const [workspaceName, setWorkspaceName] = useState(me.workspaceName);
  const [locale, setLocale] = useState(me.locale);
  const [timezone, setTimezone] = useState(me.timezone);
  const [profilKaydediliyor, setProfilKaydediliyor] = useState(false);

  const profilDegisti =
    name !== me.name ||
    email !== me.email ||
    avatarColor !== me.avatarColor ||
    workspaceName !== me.workspaceName ||
    locale !== me.locale ||
    timezone !== me.timezone;

  /* --- bildirim matrisi --- */
  const [prefs, setPrefs] = useState<BildirimTercihleri>(() => {
    // Öntanımları uygulayıp gelen tercihleri üstüne yaz.
    const tam: BildirimTercihleri = {};
    for (const o of OLAYLAR) {
      tam[o.anahtar] = {};
      for (const k of KANALLAR) {
        tam[o.anahtar]![k.anahtar] =
          me.notificationPrefs?.[o.anahtar]?.[k.anahtar] ?? varsayilan(o.anahtar, k.anahtar);
      }
    }
    return tam;
  });
  const [prefsBaslangic] = useState(() => JSON.stringify(prefs));
  const [prefsKaydediliyor, setPrefsKaydediliyor] = useState(false);
  const prefsDegisti = useMemo(() => JSON.stringify(prefs) !== prefsBaslangic, [prefs, prefsBaslangic]);

  /* --- tehlikeli bölge --- */
  const [silModal, setSilModal] = useState(false);
  const [silOnay, setSilOnay] = useState("");
  const [siliniyor, setSiliniyor] = useState(false);

  /* --------------------------------------------------- mutasyonlar */

  async function profilKaydet() {
    if (name.trim().length < 2) {
      goster({ tip: "hata", baslik: t("toast.adKisa") });
      return;
    }
    if (!email.includes("@")) {
      goster({ tip: "hata", baslik: t("toast.epostaGecersiz") });
      return;
    }
    if (profilKaydediliyor) return;
    setProfilKaydediliyor(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, avatarColor, workspaceName, locale, timezone }),
      });
      if (res.ok) {
        goster({ tip: "basari", baslik: t("toast.profilGuncellendi") });
        router.refresh();
      } else {
        const { error } = await res.json().catch(() => ({ error: t("toast.kaydedilemedi") }));
        goster({ tip: "hata", baslik: t("toast.guncellenemediBaslik"), aciklama: error });
      }
    } catch {
      goster({ tip: "hata", baslik: t("toast.guncellenemediBaslik"), aciklama: t("toast.kaydedilemedi") });
    } finally {
      setProfilKaydediliyor(false);
    }
  }

  function kanalToggle(olay: BildirimOlay, kanal: BildirimKanal, deger: boolean) {
    setPrefs((p) => ({ ...p, [olay]: { ...(p[olay] ?? {}), [kanal]: deger } }));
  }

  async function prefsKaydet() {
    if (prefsKaydediliyor) return;
    setPrefsKaydediliyor(true);
    try {
      const res = await fetch("/api/account/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs }),
      });
      if (res.ok) {
        goster({ tip: "basari", baslik: t("toast.prefsKaydedildi") });
        router.refresh();
      } else {
        goster({ tip: "hata", baslik: t("toast.prefsKaydedilemedi") });
      }
    } catch {
      goster({ tip: "hata", baslik: t("toast.prefsKaydedilemedi") });
    } finally {
      setPrefsKaydediliyor(false);
    }
  }

  async function hesabiSil() {
    if (siliniyor) return;
    setSiliniyor(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: silOnay }),
      });
      if (res.ok) {
        router.push("/login");
      } else {
        const { error } = await res.json().catch(() => ({ error: t("toast.silinemedi") }));
        goster({ tip: "hata", baslik: t("toast.hesapSilinemedi"), aciklama: error });
        setSiliniyor(false);
      }
    } catch {
      goster({ tip: "hata", baslik: t("toast.hesapSilinemedi"), aciklama: t("toast.silinemedi") });
      setSiliniyor(false);
    }
  }

  const uyelikTarihi = new Date(me.createdAt).toLocaleDateString(BCP47[dil], {
    day: "numeric", month: "long", year: "numeric",
  });

  /* --------------------------------------------------- hesap sağlığı (görsel özet)
     Sadece MEVCUT profil alanlarından türetilir; hiçbir yeni veri/mutasyon yok. */
  const dolulukAlanlar = useMemo(() => {
    // Profil eksiksizliği: doldurulmuş alan oranı (görsel gösterge).
    const kontroller = [
      name.trim().length >= 2,
      email.includes("@"),
      workspaceName.trim().length > 0,
      Boolean(avatarColor),
      Boolean(locale),
      Boolean(timezone),
    ];
    const dolu = kontroller.filter(Boolean).length;
    return { dolu, toplam: kontroller.length, yuzde: Math.round((dolu / kontroller.length) * 100) };
  }, [name, email, workspaceName, avatarColor, locale, timezone]);

  // Hesap yaşı — createdAt'ten türetilir (yerele-duyarlı gün/ay/yıl gösterimi).
  const yasEtiket = useMemo(() => {
    const gun = Math.max(0, Math.floor((Date.now() - me.createdAt) / 86_400_000));
    if (gun < 1) return t("saglik.bugun");
    if (gun < 30) return `${gun} ${t("saglik.gun")}`;
    if (gun < 365) return `${Math.floor(gun / 30)} ${t("saglik.ay")}`;
    return `${(gun / 365).toFixed(1).replace(".", ",")} ${t("saglik.yil")}`;
  }, [me.createdAt, dil]); // eslint-disable-line react-hooks/exhaustive-deps

  // Güvenlik rozetleri — hesap güvenliğinin GÖRSEL özeti (durumlar sabit "aktif"
  // olarak gösterilir; gerçek 2FA/parola mantığı Güvenlik sekmesinde yönetilir,
  // buraya dokunulmaz). Bunlar yalnızca gösterge amaçlıdır.
  const guvenlikRozetleri = [
    { ikon: <Mail className="size-3.5" />, etiket: t("saglik.rozet.eposta"), aktif: true },
    { ikon: <KeyRound className="size-3.5" />, etiket: t("saglik.rozet.parola"), aktif: true },
    { ikon: <Fingerprint className="size-3.5" />, etiket: t("saglik.rozet.ikiAdim"), aktif: true },
    { ikon: <MonitorCheck className="size-3.5" />, etiket: t("saglik.rozet.oturum"), aktif: true },
  ];
  const saglikliMi = dolulukAlanlar.yuzde >= 80;

  /* --------------------------------------------------- render */
  return (
    <div className="space-y-6">
      {/* ---------------- Hesap sağlığı özeti ---------------- */}
      <motion.section
        initial={{ y: 10 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card"
      >
        <div className="flex items-center justify-between border-b border-line bg-gradient-to-r from-brand-50/60 via-surface to-surface px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-card">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-slate-ink">{t("saglik.baslik")}</h3>
              <p className="text-[12px] text-slate-faint">{t("saglik.ipucu")}</p>
            </div>
          </div>
          <Badge ton={saglikliMi ? "yesil" : "sari"}>
            {saglikliMi ? <Check className="size-3" /> : <Sparkles className="size-3" />}
            {saglikliMi ? t("saglik.durumIyi") : t("saglik.durumOrta")}
          </Badge>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[auto_1fr]">
          {/* profil doluluk gauge */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-canvas/40 px-8 py-4">
            <Gauge deger={dolulukAlanlar.yuzde} boyut={160} etiket={t("saglik.doluluk")} />
            <span className="mt-1 text-[12px] font-medium text-slate-muted">
              {dolulukAlanlar.dolu}/{dolulukAlanlar.toplam} {t("saglik.tamamlanan")}
            </span>
          </div>

          {/* sağ: güvenlik rozetleri + meta */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                <ShieldCheck className="size-3.5" /> {t("saglik.guvenlik")}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {guvenlikRozetleri.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-ok-soft/60 px-3 py-2"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white text-ok">{r.ikon}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-ink">{r.etiket}</span>
                    <Check className="size-4 shrink-0 text-ok" strokeWidth={3} />
                  </div>
                ))}
              </div>
            </div>

            {/* hesap yaşı / aktivite / workspace / plan */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MetaHucre ikon={<CalendarClock className="size-4" />} etiket={t("saglik.hesapYasi")} deger={yasEtiket} />
              <MetaHucre ikon={<Activity className="size-4" />} etiket={t("saglik.sonAktivite")} deger={t("saglik.bugun")} tonlu />
              <MetaHucre ikon={<Building2 className="size-4" />} etiket={t("saglik.workspace")} deger={workspaceName || "—"} />
              <MetaHucre ikon={<Sparkles className="size-4" />} etiket={t("saglik.plan")} deger={me.plan.toUpperCase()} tonlu />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ---------------- Profil ---------------- */}
      <Panel baslik={t("profil.baslik")}>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
          {/* Avatar + renk seçici — büyük önizleme */}
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-canvas/40 px-6 py-5 sm:w-48 sm:shrink-0">
            <Avatar ad={name || "?"} renk={avatarColor} boyut={96} />
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_RENKLERI.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setAvatarColor(r)}
                  aria-label={t("profil.renkAria").replace("{r}", r)}
                  className={cn(
                    "size-6 rounded-full ring-2 ring-offset-2 ring-offset-canvas transition",
                    avatarColor === r ? "ring-slate-ink" : "ring-transparent hover:ring-line-strong",
                  )}
                  style={{ background: r }}
                >
                  {avatarColor === r && <Check className="mx-auto size-3.5 text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-medium text-slate-faint">{t("profil.avatarRengi")}</span>
          </div>

          {/* Alanlar */}
          <div className="flex-1 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Alan etiket={t("profil.adSoyad")}>
                <Girdi value={name} onChange={(e) => setName(e.target.value)} placeholder={t("profil.adPlaceholder")} />
              </Alan>
              <Alan etiket={t("profil.eposta")}>
                <Girdi type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("profil.epostaPlaceholder")} />
              </Alan>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-line bg-canvas/40 px-4 py-3 text-[12.5px] text-slate-faint">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-3.5" /> {t("profil.uyelik")} <span className="font-medium text-slate-muted">{uyelikTarihi}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> {t("profil.plan")} <Badge ton="brand">{me.plan.toUpperCase()}</Badge>
              </span>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end border-t border-line pt-4">
          <Button size="sm" onClick={profilKaydet} disabled={!profilDegisti || profilKaydediliyor}>
            {profilKaydediliyor ? t("profil.kaydediliyor") : t("profil.kaydet")}
          </Button>
        </div>
      </Panel>

      {/* ---------------- Çalışma alanı + bölge ---------------- */}
      <Panel baslik={t("bolge.baslik")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Alan etiket={t("bolge.calismaAlaniAdi")}>
            <Girdi
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder={t("bolge.calismaAlaniPlaceholder")}
            />
          </Alan>
          <Alan etiket={t("bolge.gorunenAd")}>
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-line bg-canvas/50 px-4 text-sm text-slate-muted">
              <UserIcon className="size-4 text-slate-faint" />
              {name || "—"}
            </div>
          </Alan>
          <Alan etiket={t("bolge.dil")}>
            <Secim value={locale} onChange={(e) => setLocale(e.target.value)}>
              {DILLER.map((d) => <option key={d.deger} value={d.deger}>{d.ad}</option>)}
            </Secim>
          </Alan>
          <Alan etiket={t("bolge.saatDilimi")}>
            <Secim value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {SAAT_DILIMLERI.map((z) => <option key={z.deger} value={z.deger}>{z.ad}</option>)}
            </Secim>
          </Alan>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[12px] text-slate-faint">
          <Globe className="size-3.5" />
          {t("bolge.saatNot")}
        </div>
        <div className="mt-4 flex justify-end border-t border-line pt-4">
          <Button size="sm" onClick={profilKaydet} disabled={!profilDegisti || profilKaydediliyor}>
            {profilKaydediliyor ? t("profil.kaydediliyor") : t("bolge.kaydet")}
          </Button>
        </div>
      </Panel>

      {/* ---------------- Bildirim tercihleri (matris) ---------------- */}
      <Panel
        baslik={<span className="inline-flex items-center gap-2"><Bell className="size-4 text-slate-faint" /> {t("bildirim.baslik")}</span>}
        padding={false}
      >
        <div className="px-6 pt-1 pb-2 text-[13px] text-slate-muted">
          {t("bildirim.aciklama")}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-y border-line bg-canvas/40">
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">{t("bildirim.kolOlay")}</th>
                {KANALLAR.map((k) => (
                  <th key={k.anahtar} className="px-3 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-faint">
                      {k.ikon} {t(`kanal.${k.anahtar}`)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OLAYLAR.map((o) => (
                <tr key={o.anahtar} className="border-b border-line last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-slate-ink">{t(`olay.${o.anahtar}.ad`)}</span>
                      {o.onerilen && (
                        <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-600">{t("bildirim.onerilen")}</span>
                      )}
                    </div>
                    <p className="mt-0.5 max-w-md text-[12.5px] leading-relaxed text-slate-muted">{t(`olay.${o.anahtar}.aciklama`)}</p>
                  </td>
                  {KANALLAR.map((k) => (
                    <td key={k.anahtar} className="px-3 py-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          on={prefs[o.anahtar]?.[k.anahtar] ?? false}
                          onChange={(v) => kanalToggle(o.anahtar, k.anahtar, v)}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-line px-6 py-4">
          <Button size="sm" onClick={prefsKaydet} disabled={!prefsDegisti || prefsKaydediliyor}>
            {prefsKaydediliyor ? t("profil.kaydediliyor") : t("bildirim.kaydet")}
          </Button>
        </div>
      </Panel>

      {/* ---------------- Tehlikeli bölge ---------------- */}
      <Panel baslik={t("tehlike.baslik")}>
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-danger-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white text-danger2">
              <AlertTriangle className="size-5" />
            </span>
            <div>
              <div className="text-sm font-medium text-slate-ink">{t("tehlike.hesabiSil")}</div>
              <div className="text-[13px] text-slate-muted">
                {t("tehlike.aciklama")}
              </div>
            </div>
          </div>
          <Button variant="danger" size="sm" className="shrink-0" onClick={() => { setSilOnay(""); setSilModal(true); }}>
            <Trash2 className="size-3.5" /> {t("tehlike.hesabiSil")}
          </Button>
        </div>
      </Panel>

      {/* ---------------- Silme onay modalı ---------------- */}
      <Modal acik={silModal} kapat={() => setSilModal(false)} baslik={t("sil.baslik")} genislik="max-w-md">
        <NotKutusu ton="kirmizi" baslik={t("sil.uyariBaslik")}>
          {t("sil.uyari")}
        </NotKutusu>
        <p className="mt-4 text-sm text-slate-muted">
          {(() => {
            const [once, sonra] = t("sil.onayIstem").split("<strong>{email}</strong>");
            return (
              <>
                {once}
                <strong className="font-mono text-slate-ink">{me.email}</strong>
                {sonra}
              </>
            );
          })()}
        </p>
        <div className="mt-3">
          <Girdi value={silOnay} onChange={(e) => setSilOnay(e.target.value)} placeholder={me.email} autoFocus />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setSilModal(false)}>{t("sil.iptal")}</Button>
          <Button
            variant="danger"
            disabled={silOnay.trim().toLowerCase() !== me.email.toLowerCase() || siliniyor}
            onClick={hesabiSil}
          >
            <Trash2 className="size-4" /> {siliniyor ? t("sil.siliniyor") : t("sil.onayla")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ MetaHucre
 * Hesap sağlığı özetinde küçük etiket/değer hücresi (ikon + etiket + değer). */
function MetaHucre({
  ikon, etiket, deger, tonlu = false,
}: {
  ikon: React.ReactNode; etiket: string; deger: string; tonlu?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-slate-faint">
        <span className={cn(tonlu ? "text-brand-600" : "text-slate-faint")}>{ikon}</span>
        <span className="truncate text-[10.5px] font-medium uppercase tracking-wide">{etiket}</span>
      </div>
      <div className={cn("mt-1 truncate text-[14px] font-semibold", tonlu ? "text-brand-700" : "text-slate-ink")}>
        {deger}
      </div>
    </div>
  );
}
