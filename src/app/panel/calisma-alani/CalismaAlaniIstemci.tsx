"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users as UsersIcon,
  ShieldCheck,
  BarChart3,
  Crown,
  Plus,
  Check,
  Info,
  Database,
  ArrowRight,
} from "lucide-react";
import { Panel, StatKart, Badge, Avatar, Girdi, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Plan, Role } from "@/lib/db/schema";
import type { Dil } from "@/lib/i18n/panel";
import { calismaAlaniCeviri } from "./calisma-alani.i18n";

/* --- Etiket anahtarları (enum→anahtar; değer çevrilmez, görüntü çevrilir) --- */
const PLAN_ANAHTAR: Record<Plan, string> = {
  free: "ca.plan.free",
  pro: "ca.plan.pro",
  scale: "ca.plan.scale",
};
const ROL_ANAHTAR: Record<Role, string> = {
  owner: "ca.rol.owner",
  admin: "ca.rol.admin",
  analyst: "ca.rol.analyst",
  viewer: "ca.rol.viewer",
};

/** Dil kodu → Intl yerel etiketi (sayı/tarih biçimleme için). */
const YEREL: Record<Dil, string> = { tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES" };

interface Uye {
  id: string;
  ad: string;
  eposta: string;
  rol: Role;
  avatarRenk: string;
  durum: "active" | "invited" | "suspended";
}

interface Props {
  /** Aktif panel dili (sunucudan). */
  dil: Dil;
  /** Görüntülenen çalışma alanı adı (workspaceName ya da kullanıcı adı). */
  calismaAlaniAdi: string;
  /** workspaceName boşsa geri düşülecek varsayılan (kullanıcı adı). */
  varsayilanAd: string;
  /** Çalışma alanı kimliği (şimdilik kullanıcı id'si — tek alan). */
  calismaAlaniId: string;
  plan: Plan;
  avatarRenk: string;
  /** Çalışma alanının oluşturulma anı (epoch ms). */
  olusturuldu: number;
  uyeler: Uye[];
  siteSayisi: number;
  dogrulama30g: number;
}

/**
 * Çalışma Alanı yönetim ekranı (istemci).
 * ========================================
 * Cilalı bir ayar sayfası: başlık kartı (düzenlenebilir ad), istatistik
 * kartları, salt-okunur üye listesi, çalışma-alanları bölümü ve tehlike
 * bölgesi notu. Ad değişikliği /api/workspace'e POST edilir.
 */
export function CalismaAlaniIstemci({
  dil,
  calismaAlaniAdi,
  varsayilanAd,
  calismaAlaniId,
  plan,
  avatarRenk,
  olusturuldu,
  uyeler,
  siteSayisi,
  dogrulama30g,
}: Props) {
  const t = (anahtar: string) => calismaAlaniCeviri(anahtar, dil);
  const { goster } = useToast();
  const [ad, setAd] = useState(calismaAlaniAdi);
  const [kayitliAd, setKayitliAd] = useState(calismaAlaniAdi);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  // Ad değişti mi + geçerli mi (kaydet butonu durumu).
  const kirpik = ad.trim();
  const degisti = kirpik !== kayitliAd && kirpik.length >= 2;

  async function kaydet() {
    if (!degisti || kaydediliyor) return;
    setKaydediliyor(true);
    try {
      const yanit = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceName: kirpik }),
      });
      const veri = await yanit.json().catch(() => ({}));
      if (!yanit.ok) {
        goster({ tip: "hata", baslik: t("ca.toast.kaydedilemedi.baslik"), aciklama: veri.error ?? t("ca.toast.kaydedilemedi.aciklama") });
        return;
      }
      const yeni = (veri.workspaceName as string) || kirpik;
      setKayitliAd(yeni);
      setAd(yeni);
      goster({ tip: "basari", baslik: t("ca.toast.basari.baslik"), aciklama: yeni });
    } catch {
      goster({ tip: "hata", baslik: t("ca.toast.aghatasi.baslik"), aciklama: t("ca.toast.aghatasi.aciklama") });
    } finally {
      setKaydediliyor(false);
    }
  }

  // Avatar için ilk harf.
  const basHarf = (kayitliAd.trim()[0] ?? varsayilanAd[0] ?? "S").toUpperCase();

  const olusturuldemTarih = olusturuldu
    ? new Date(olusturuldu).toLocaleDateString(YEREL[dil], { day: "numeric", month: "long", year: "numeric" })
    : null;

  const aktifUye = uyeler.filter((u) => u.durum === "active").length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* Bilgi şeridi */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <Building2 className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-ink">{t("ca.serit.baslik")}</p>
          <p className="mt-0.5 text-[13px] text-slate-muted">{t("ca.serit.aciklama")}</p>
        </div>
      </div>

      {/* Başlık kartı: avatar + düzenlenebilir ad */}
      <Panel padding>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span
              className="grid size-16 shrink-0 place-items-center rounded-2xl text-[28px] font-bold text-white shadow-card"
              style={{ background: avatarRenk || "#4a41e8" }}
            >
              {basHarf}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-bold text-slate-ink">{kayitliAd}</h2>
                <Badge ton="brand">{t(PLAN_ANAHTAR[plan])} {t("ca.plan.suffix")}</Badge>
              </div>
              <p className="mt-1 font-mono text-[12px] text-slate-faint">{calismaAlaniId}</p>
              {olusturuldemTarih && (
                <p className="mt-0.5 text-[13px] text-slate-muted">{t("ca.olusturuldu").replace("{t}", olusturuldemTarih)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Ad düzenleme */}
        <div className="mt-6 border-t border-line pt-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-ink">{t("ca.ad.etiket")}</label>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <Girdi
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              maxLength={60}
              placeholder={varsayilanAd}
              aria-label={t("ca.ad.etiket")}
              className="sm:max-w-md"
              onKeyDown={(e) => {
                if (e.key === "Enter") kaydet();
              }}
            />
            <Button onClick={kaydet} disabled={!degisti || kaydediliyor}>
              {kaydediliyor ? t("ca.ad.kaydediliyor") : <><Check className="size-4" /> {t("ca.ad.kaydet")}</>}
            </Button>
          </div>
          <p className="mt-2 text-[12.5px] text-slate-muted">
            {t("ca.ad.yardim").replace("{ad}", varsayilanAd)}
          </p>
        </div>
      </Panel>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart
          sayi={uyeler.length}
          etiket={t("ca.stat.uye")}
          ikon={<UsersIcon className="size-5" />}
          href="/panel/ekip"
        />
        <StatKart sayi={siteSayisi} etiket={t("ca.stat.site")} ikon={<ShieldCheck className="size-5" />} href="/panel/sites" />
        <StatKart
          sayi={dogrulama30g.toLocaleString(YEREL[dil])}
          etiket={t("ca.stat.dogrulama")}
          ikon={<BarChart3 className="size-5" />}
        />
        <StatKart sayi={t(PLAN_ANAHTAR[plan])} etiket={t("ca.stat.plan")} tone="brand" />
      </div>

      {/* Üyeler (salt-okunur) */}
      <Panel
        baslik={t("ca.uyeler.baslik")}
        sagUst={
          <Button variant="outline" size="sm" href="/panel/ekip">
            {t("ca.uyeler.ekibiYonet")} <ArrowRight className="size-4" />
          </Button>
        }
      >
        <p className="mb-4 text-[13px] text-slate-muted">
          {t("ca.uyeler.ozet").replace("{n}", String(uyeler.length)).replace("{aktif}", String(aktifUye))}
        </p>
        <div className="space-y-2">
          {uyeler.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar ad={u.ad} renk={u.avatarRenk} boyut={36} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-slate-ink">{u.ad}</span>
                    {u.durum === "invited" && <Badge ton="sari">{t("ca.uyeler.davetBekliyor")}</Badge>}
                    {u.durum === "suspended" && <Badge ton="kirmizi">{t("ca.uyeler.askida")}</Badge>}
                  </div>
                  <div className="truncate text-[12.5px] text-slate-muted">{u.eposta}</div>
                </div>
              </div>
              <Badge ton={u.rol === "owner" ? "brand" : "gri"}>
                {u.rol === "owner" && <Crown className="size-3" />} {t(ROL_ANAHTAR[u.rol])}
              </Badge>
            </div>
          ))}
        </div>
      </Panel>

      {/* Çalışma alanları bölümü */}
      <Panel baslik={t("ca.alanlar.baslik")}>
        <div className="space-y-3">
          {/* Mevcut (aktif) çalışma alanı */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50/50 px-4 py-3.5 ring-1 ring-brand-100">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl text-[16px] font-bold text-white"
                style={{ background: avatarRenk || "#4a41e8" }}
              >
                {basHarf}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-slate-ink">{kayitliAd}</div>
                <div className="text-[12.5px] text-slate-muted">
                  {t("ca.alanlar.ozet").replace("{plan}", t(PLAN_ANAHTAR[plan])).replace("{n}", String(uyeler.length))}
                </div>
              </div>
            </div>
            <Badge ton="yesil">
              <Check className="size-3" /> {t("ca.alanlar.aktif")}
            </Badge>
          </div>

          {/* Yeni çalışma alanı — dürüstçe "Yakında" */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-line-strong px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-canvas text-slate-faint">
                <Plus className="size-5" />
              </span>
              <div>
                <div className="text-[14px] font-medium text-slate-ink">{t("ca.alanlar.yeni.baslik")}</div>
                <div className="text-[12.5px] text-slate-muted">{t("ca.alanlar.yeni.aciklama")}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge ton="sari">{t("ca.alanlar.yakinda")}</Badge>
              <button
                disabled
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-[13px] font-medium text-slate-faint",
                  "cursor-not-allowed opacity-60",
                )}
              >
                <Plus className="size-4" /> {t("ca.alanlar.olustur")}
              </button>
            </div>
          </div>

          <p className="flex items-start gap-2 rounded-xl bg-canvas/50 px-3.5 py-3 text-[12.5px] text-slate-muted">
            <Info className="mt-0.5 size-4 shrink-0 text-brand-500" />
            {t("ca.alanlar.not")}
          </p>
        </div>
      </Panel>

      {/* Tehlike bölgesi / veri notu */}
      <Panel baslik={t("ca.veri.baslik")}>
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-canvas/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Database className="size-5" />
            </span>
            <div>
              <div className="text-[14px] font-medium text-slate-ink">{t("ca.veri.kart.baslik")}</div>
              <p className="mt-0.5 text-[12.5px] text-slate-muted">{t("ca.veri.kart.aciklama")}</p>
            </div>
          </div>
          <Link
            href="/panel/ayarlar/veri"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-full border border-line-strong bg-surface px-4 text-[13px] font-medium text-slate-ink transition hover:bg-canvas sm:self-auto"
          >
            {t("ca.veri.link")} <ArrowRight className="size-4" />
          </Link>
        </div>
      </Panel>
    </div>
  );
}
