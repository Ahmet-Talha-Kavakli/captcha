"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, UserPlus, Shield, Mail, Crown, Eye, Check, X, ShieldCheck,
  Clock, RefreshCw,
} from "lucide-react";
import {
  PanelBaslik, Panel, StatKart, Badge, Avatar, Modal, Alan, Girdi, Secim,
  SatirMenu, Tooltip, useToast, Tablo, type Kolon,
} from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { Gauge as GaugeGost } from "@/components/panel/grafikler-ek";
import { DonutDagilim } from "@/components/panel/grafikler";
import { cn } from "@/lib/cn";
import type { Role, TeamCapability } from "@/lib/db/schema";
import { ROLLER, YETENEKLER, rolYetenekli, efektifIzinler } from "./roller";
import { ekipCeviri } from "./ekip.i18n";
import type { Dil } from "@/lib/i18n/panel";

/** t yardımcısının tipi (saf alt bileşenlere prop olarak geçilir). */
type Ceviri = (anahtar: string) => string;

/** Rol enum değeri → çevrilebilir etiket anahtarı. Enum değeri asla çevrilmez. */
const ROL_ANAHTAR: Record<Role, string> = {
  owner: "ek.rol.owner",
  admin: "ek.rol.admin",
  analyst: "ek.rol.analyst",
  viewer: "ek.rol.viewer",
};
/** Rolün çevrilmiş görüntü etiketi. */
function rolEtiket(t: Ceviri, rol: Role): string {
  return t(ROL_ANAHTAR[rol]);
}
/** Rolün çevrilmiş açıklaması (enum → anahtar). */
const ROL_ACIK_ANAHTAR: Record<Role, string> = {
  owner: "ek.rolAcik.owner",
  admin: "ek.rolAcik.admin",
  analyst: "ek.rolAcik.analyst",
  viewer: "ek.rolAcik.viewer",
};
/** Yetenek anahtarı → çevrilebilir ad/açıklama anahtarı. */
const YET_AD_ANAHTAR: Record<string, string> = {
  "sites.manage": "ek.yet.sites.manage",
  "rules.edit": "ek.yet.rules.edit",
  "incidents.resolve": "ek.yet.incidents.resolve",
  "team.manage": "ek.yet.team.manage",
  "apikeys.manage": "ek.yet.apikeys.manage",
  "billing.manage": "ek.yet.billing.manage",
};

/* ------------------------------------------------------------------ tipler */
export interface UyeDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  status: "active" | "invited" | "suspended";
  lastActive: number;
  title?: string;
  mfaEnabled: boolean;
  permissions: TeamCapability[];
  invitedAt?: number;
  invitedBy?: string;
  inviteExpiresAt?: number;
}
export interface DenetimDTO {
  id: string;
  actorName: string;
  action: string;
  target: string;
  ts: number;
  meta?: Record<string, string>;
}

/* ------------------------------------------------------------------ etiketler */
const DURUM_TON: Record<UyeDTO["status"], "yesil" | "sari" | "gri"> = { active: "yesil", invited: "sari", suspended: "gri" };
/** Durum enum değeri → çevrilebilir etiket anahtarı. Enum değeri asla çevrilmez. */
const DURUM_ANAHTAR: Record<UyeDTO["status"], string> = { active: "ek.durum.active", invited: "ek.durum.invited", suspended: "ek.durum.suspended" };
const ROL_TON: Record<Role, "brand" | "mavi" | "gri"> = { owner: "brand", admin: "brand", analyst: "mavi", viewer: "gri" };
/** Rol donutu için renk kimliği (rozet tonlarıyla uyumlu). */
const ROL_RENK: Record<Role, string> = { owner: "#1d4ed8", admin: "#2f6fed", analyst: "#0891b2", viewer: "#94a3b8" };
const ROL_IKON: Record<Role, React.ReactNode> = {
  owner: <Crown className="size-3" />,
  admin: <Shield className="size-3" />,
  analyst: <ShieldCheck className="size-3" />,
  viewer: <Eye className="size-3" />,
};

/** Denetim aksiyon enum anahtarı → çevrilebilir metin anahtarı. Enum çevrilmez. */
const AKSIYON_ANAHTAR: Record<string, string> = {
  "üye.davet": "ek.aksiyon.davet",
  "üye.rol-değiştir": "ek.aksiyon.rolDegistir",
  "üye.çıkar": "ek.aksiyon.cikar",
  "üye.davet-iptal": "ek.aksiyon.davetIptal",
  "üye.davet-yenile": "ek.aksiyon.davetYenile",
};

/* göreli zaman */
function goreli(t: Ceviri, ts: number): string {
  const fark = Date.now() - ts;
  const dk = Math.round(fark / 60000);
  if (dk < 1) return t("ek.zaman.azOnce");
  if (dk < 60) return t("ek.zaman.dk").replace("{n}", String(dk));
  const sa = Math.round(dk / 60);
  if (sa < 24) return t("ek.zaman.sa").replace("{n}", String(sa));
  const gun = Math.round(sa / 24);
  if (gun < 30) return t("ek.zaman.gun").replace("{n}", String(gun));
  const ay = Math.round(gun / 30);
  return t("ek.zaman.ay").replace("{n}", String(ay));
}
function kalanGun(t: Ceviri, ts?: number): string {
  if (!ts) return "";
  const gun = Math.ceil((ts - Date.now()) / 86400000);
  if (gun <= 0) return t("ek.davet.suresiDoldu");
  return t("ek.davet.kalanGun").replace("{gun}", String(gun));
}

type Sekme = "uyeler" | "davetler" | "roller" | "aktivite";

/* ------------------------------------------------------------------ ana */
export function EkipIstemci({
  uyeler: ilk,
  denetim,
  benimAdim,
  dil,
}: {
  uyeler: UyeDTO[];
  denetim: DenetimDTO[];
  benimAdim: string;
  dil: Dil;
}) {
  const t = (k: string) => ekipCeviri(k, dil);
  const router = useRouter();
  const { goster } = useToast();
  const [uyeler, setUyeler] = useState(ilk);
  const [sekme, setSekme] = useState<Sekme>("uyeler");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; role: Role; title: string }>({
    name: "", email: "", role: "analyst", title: "",
  });
  const [rolFiltre, setRolFiltre] = useState<Role | "all">("all");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const aktifler = useMemo(() => uyeler.filter((u) => u.status === "active"), [uyeler]);
  const davetliler = useMemo(() => uyeler.filter((u) => u.status === "invited"), [uyeler]);
  const mfaAdet = useMemo(() => aktifler.filter((u) => u.mfaEnabled).length, [aktifler]);
  const mfaOran = aktifler.length ? Math.round((mfaAdet / aktifler.length) * 100) : 0;

  // Rol dağılımı donutu — owner→viewer sırasıyla (görüntü türevi).
  const rolDagilim = useMemo(() => {
    const sira: Role[] = ["owner", "admin", "analyst", "viewer"];
    const say = new Map<Role, number>();
    for (const u of uyeler) say.set(u.role, (say.get(u.role) ?? 0) + 1);
    return sira
      .filter((r) => (say.get(r) ?? 0) > 0)
      .map((r) => ({ etiket: rolEtiket(t, r), deger: say.get(r) ?? 0, renk: ROL_RENK[r] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uyeler, dil]);

  // Üyeler sekmesindeki liste (davetliler ayrı sekmede).
  const uyelerListe = useMemo(() => {
    let liste = uyeler.filter((u) => u.status !== "invited");
    if (rolFiltre !== "all") liste = liste.filter((u) => u.role === rolFiltre);
    // Rol yetkisine göre sırala (owner → admin → analyst → viewer), sonra ad.
    const sira: Role[] = ["owner", "admin", "analyst", "viewer"];
    return liste.sort((a, b) => sira.indexOf(a.role) - sira.indexOf(b.role) || a.name.localeCompare(b.name, "tr"));
  }, [uyeler, rolFiltre]);

  /* --------------------------------------------------- mutasyonlar */
  async function davet() {
    if (!form.email.trim() || !form.email.includes("@")) {
      goster({ tip: "hata", baslik: t("ek.toast.epostaGir") });
      return;
    }
    setGonderiliyor(true);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setGonderiliyor(false);
    if (res.ok) {
      const { member } = await res.json();
      setUyeler((p) => [...p, normalize(member)]);
      setModal(false);
      setForm({ name: "", email: "", role: "analyst", title: "" });
      setSekme("davetler");
      goster({ tip: "basari", baslik: t("ek.toast.davetGonderildi"), aciklama: `${form.email} • ${rolEtiket(t, form.role)}` });
      router.refresh();
    } else {
      const { error } = await res.json().catch(() => ({ error: t("ek.toast.davetGonderilemedi") }));
      goster({ tip: "hata", baslik: t("ek.toast.davetGonderilemedi"), aciklama: error });
    }
  }

  async function rolDegistir(u: UyeDTO, yeniRol: Role) {
    if (u.role === yeniRol) return;
    const eski = uyeler;
    setUyeler((p) => p.map((x) => (x.id === u.id ? { ...x, role: yeniRol } : x)));
    const res = await fetch("/api/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, role: yeniRol }),
    });
    if (res.ok) {
      goster({ tip: "basari", baslik: t("ek.toast.rolGuncellendi"), aciklama: `${u.name} → ${rolEtiket(t, yeniRol)}` });
      router.refresh();
    } else {
      setUyeler(eski);
      goster({ tip: "hata", baslik: t("ek.toast.rolDegistirilemedi") });
    }
  }

  async function cikar(u: UyeDTO) {
    if (u.role === "owner") {
      goster({ tip: "hata", baslik: t("ek.toast.sahipCikarilamaz") });
      return;
    }
    const davetMi = u.status === "invited";
    setUyeler((p) => p.filter((x) => x.id !== u.id));
    const res = await fetch("/api/team", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id }),
    });
    if (res.ok) {
      goster({ tip: "basari", baslik: davetMi ? t("ek.toast.davetIptal") : t("ek.toast.uyeCikarildi"), aciklama: u.email });
      router.refresh();
    } else {
      setUyeler((p) => [...p, u]);
      goster({ tip: "hata", baslik: t("ek.toast.islemBasarisiz") });
    }
  }

  async function davetiYenile(u: UyeDTO) {
    const res = await fetch("/api/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, action: "resend" }),
    });
    if (res.ok) {
      const { member } = await res.json();
      setUyeler((p) => p.map((x) => (x.id === u.id ? normalize(member) : x)));
      goster({ tip: "basari", baslik: t("ek.toast.davetYeniden"), aciklama: u.email });
      router.refresh();
    } else {
      goster({ tip: "hata", baslik: t("ek.toast.davetYenilenemedi") });
    }
  }

  /* --------------------------------------------------- render */
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      <PanelBaslik
        aciklama={t("ek.aciklama")}
        aksiyon={<Button size="sm" onClick={() => setModal(true)}><UserPlus className="size-4" /> {t("ek.uyeDavetEt")}</Button>}
      />

      {/* Üst özet */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKart sayi={aktifler.length + davetliler.length} etiket={t("ek.stat.toplam")} ikon={<Users className="size-5" />} />
        <StatKart sayi={aktifler.length} etiket={t("ek.stat.aktif")} ikon={<Check className="size-5" />} tone="ok" />
        <StatKart sayi={davetliler.length} etiket={t("ek.stat.bekleyen")} ikon={<Mail className="size-5" />} tone={davetliler.length ? "warn" : undefined} />
        <StatKart
          sayi={`%${mfaOran}`}
          etiket={t("ek.stat.2fa").replace("{adet}", String(mfaAdet)).replace("{toplam}", String(aktifler.length))}
          ikon={<ShieldCheck className="size-5" />}
          tone={mfaOran >= 80 ? "ok" : mfaOran >= 50 ? "warn" : "danger"}
        />
      </div>

      {/* Genel bakış — MFA kapsamı gauge + rol dağılımı donut */}
      {(aktifler.length + davetliler.length) > 0 && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <Panel baslik={t("ek.bakis.mfaBaslik")}>
            <div className="flex flex-col items-center pt-1 text-center">
              <GaugeGost
                deger={mfaOran}
                boyut={168}
                etiket={t("ek.bakis.mfaEtiket")}
                renk={mfaOran >= 80 ? "#16a34a" : mfaOran >= 50 ? "#d97706" : "#dc2626"}
              />
              <span className={cn(
                "mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ring-1 ring-inset",
                mfaOran >= 80 ? "bg-ok-soft text-green-700 ring-green-200"
                  : mfaOran >= 50 ? "bg-warn-soft text-amber-700 ring-amber-200"
                  : "bg-danger-soft text-red-700 ring-red-200",
              )}>
                <ShieldCheck className="size-3.5" /> {mfaAdet}/{aktifler.length} {t("ek.bakis.mfaAcik")}
              </span>
              <p className="mt-3 max-w-[240px] text-[12.5px] leading-relaxed text-slate-muted">
                {t("ek.bakis.mfaAlt").replace("{adet}", String(mfaAdet)).replace("{toplam}", String(aktifler.length))}
              </p>
            </div>
          </Panel>
          <Panel baslik={t("ek.bakis.rolBaslik")}>
            {rolDagilim.length ? (
              <DonutDagilim segmentler={rolDagilim} merkezEtiket={t("ek.bakis.uye")} />
            ) : (
              <p className="py-8 text-center text-sm text-slate-faint">—</p>
            )}
          </Panel>
        </div>
      )}

      {/* Sekmeler */}
      <SekmeCubugu
        sekme={sekme}
        setSekme={setSekme}
        davetSayi={davetliler.length}
        t={t}
      />

      {sekme === "uyeler" && (
        <UyelerSekmesi
          liste={uyelerListe}
          rolFiltre={rolFiltre}
          setRolFiltre={setRolFiltre}
          onRol={rolDegistir}
          onCikar={cikar}
          davetliVar={davetliler.length > 0}
          onDavet={() => setModal(true)}
          t={t}
        />
      )}

      {sekme === "davetler" && (
        <DavetlerSekmesi liste={davetliler} onYenile={davetiYenile} onIptal={cikar} onDavet={() => setModal(true)} t={t} />
      )}

      {sekme === "roller" && <RollerSekmesi uyeler={uyeler} t={t} />}

      {sekme === "aktivite" && <AktiviteSekmesi denetim={denetim} t={t} />}

      {/* Davet modalı */}
      <Modal acik={modal} kapat={() => setModal(false)} baslik={t("ek.modal.baslik")} aciklama={t("ek.modal.aciklama")}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Alan etiket={t("ek.modal.adSoyad")} opsiyonel>
              <Girdi value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("ek.modal.adSoyadPh")} />
            </Alan>
            <Alan etiket={t("ek.modal.gorev")} opsiyonel>
              <Girdi value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("ek.modal.gorevPh")} />
            </Alan>
          </div>
          <Alan etiket={t("ek.modal.eposta")}>
            <Girdi type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("ek.modal.epostaPh")} autoFocus />
          </Alan>
          <Alan etiket={t("ek.modal.rol")}>
            <Secim value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="admin">{t("ek.modal.rolAdmin")}</option>
              <option value="analyst">{t("ek.modal.rolAnalyst")}</option>
              <option value="viewer">{t("ek.modal.rolViewer")}</option>
            </Secim>
          </Alan>
          {/* Seçilen rolün özet izinleri */}
          <RolOnizleme rol={form.role} t={t} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setModal(false)}>{t("ek.modal.iptal")}</Button>
            <Button onClick={davet} disabled={!form.email.trim() || gonderiliyor}>
              {gonderiliyor ? t("ek.modal.gonderiliyor") : t("ek.modal.davetGonder")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ normalize */
function normalize(m: Record<string, unknown>): UyeDTO {
  return {
    id: String(m.id),
    name: String(m.name),
    email: String(m.email),
    role: m.role as Role,
    avatarColor: String(m.avatarColor),
    status: m.status as UyeDTO["status"],
    lastActive: Number(m.lastActive),
    title: m.title ? String(m.title) : undefined,
    mfaEnabled: Boolean(m.mfaEnabled),
    permissions: (m.permissions as TeamCapability[]) ?? [],
    invitedAt: m.invitedAt ? Number(m.invitedAt) : undefined,
    invitedBy: m.invitedBy ? String(m.invitedBy) : undefined,
    inviteExpiresAt: m.inviteExpiresAt ? Number(m.inviteExpiresAt) : undefined,
  };
}

/* ------------------------------------------------------------------ SekmeCubugu */
function SekmeCubugu({
  sekme, setSekme, davetSayi, t,
}: {
  sekme: Sekme;
  setSekme: (s: Sekme) => void;
  davetSayi: number;
  t: Ceviri;
}) {
  const sekmeler: { anahtar: Sekme; ad: string; rozet?: number }[] = [
    { anahtar: "uyeler", ad: t("ek.sekme.uyeler") },
    { anahtar: "davetler", ad: t("ek.sekme.davetler"), rozet: davetSayi },
    { anahtar: "roller", ad: t("ek.sekme.roller") },
    { anahtar: "aktivite", ad: t("ek.sekme.aktivite") },
  ];
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-line">
      {sekmeler.map((s) => (
        <button
          key={s.anahtar}
          onClick={() => setSekme(s.anahtar)}
          className={cn(
            "relative flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium transition",
            sekme === s.anahtar ? "text-slate-ink" : "text-slate-muted hover:text-slate-ink",
          )}
        >
          {s.ad}
          {s.rozet ? (
            <span className="grid min-w-5 place-items-center rounded-full bg-warn-soft px-1.5 text-[11px] font-semibold text-amber-700">
              {s.rozet}
            </span>
          ) : null}
          {sekme === s.anahtar && (
            <motion.span layoutId="ekip-sekme" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Üyeler sekmesi */
function UyelerSekmesi({
  liste, rolFiltre, setRolFiltre, onRol, onCikar, davetliVar, onDavet, t,
}: {
  liste: UyeDTO[];
  rolFiltre: Role | "all";
  setRolFiltre: (r: Role | "all") => void;
  onRol: (u: UyeDTO, r: Role) => void;
  onCikar: (u: UyeDTO) => void;
  davetliVar: boolean;
  onDavet: () => void;
  t: Ceviri;
}) {
  // Sadece sahip var (davet edilmiş kimse yok) → yalnız-sen daveti.
  const yalnizSen = liste.length <= 1 && rolFiltre === "all" && !davetliVar;
  const kolonlar: Kolon<UyeDTO>[] = [
    {
      baslik: t("ek.tablo.uye"),
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar ad={u.name} renk={u.avatarColor} boyut={38} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-slate-ink">{u.name}</span>
              {u.mfaEnabled ? (
                <Tooltip metin={t("ek.tablo.2faAcik")}>
                  <ShieldCheck className="size-3.5 text-ok" />
                </Tooltip>
              ) : (
                <Tooltip metin={t("ek.tablo.2faKapali")}>
                  <ShieldCheck className="size-3.5 text-slate-300" />
                </Tooltip>
              )}
            </div>
            {u.title && <div className="text-[12px] text-slate-muted">{u.title}</div>}
          </div>
        </div>
      ),
    },
    { baslik: t("ek.tablo.eposta"), render: (u) => <span className="text-[13px] text-slate-muted">{u.email}</span> },
    {
      baslik: t("ek.tablo.rol"),
      render: (u) => <RolRozeti rol={u.role} ekstra={u.permissions} t={t} />,
    },
    { baslik: t("ek.tablo.durum"), render: (u) => <Badge ton={DURUM_TON[u.status]}>{t(DURUM_ANAHTAR[u.status])}</Badge> },
    { baslik: t("ek.tablo.sonAktivite"), render: (u) => <span className="text-[13px] text-slate-muted">{goreli(t, u.lastActive)}</span> },
    {
      baslik: "",
      className: "text-right",
      render: (u) =>
        u.role === "owner" ? (
          <Tooltip metin={t("ek.satir.sahipDegismez")} yon="sol"><span className="text-slate-300"><Crown className="size-4" /></span></Tooltip>
        ) : (
          <SatirMenu
            aksiyonlar={[
              ...ROLLER.filter((r) => r.anahtar !== "owner" && r.anahtar !== u.role).map((r) => ({
                ad: t("ek.satir.rolDegistir").replace("{rol}", rolEtiket(t, r.anahtar)),
                onClick: () => onRol(u, r.anahtar),
              })),
              { ad: t("ek.satir.cikar"), onClick: () => onCikar(u), tehlike: true },
            ]}
          />
        ),
    },
  ];

  const rolSecenek: { deger: Role | "all"; ad: string }[] = [
    { deger: "all", ad: t("ek.filtre.tumu") },
    { deger: "owner", ad: rolEtiket(t, "owner") },
    { deger: "admin", ad: rolEtiket(t, "admin") },
    { deger: "analyst", ad: rolEtiket(t, "analyst") },
    { deger: "viewer", ad: rolEtiket(t, "viewer") },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {rolSecenek.map((r) => (
          <button
            key={r.deger}
            onClick={() => setRolFiltre(r.deger)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[13px] font-medium transition",
              rolFiltre === r.deger
                ? "border-ink-900 bg-ink-900 text-white"
                : "border-line-strong bg-surface text-slate-muted hover:bg-canvas hover:text-slate-ink",
            )}
          >
            {r.ad}
          </button>
        ))}
      </div>
      {yalnizSen && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line-strong bg-brand-50/40 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Users className="size-5" /></span>
            <div>
              <h3 className="text-[15px] font-semibold text-slate-ink">{t("ek.yalniz.baslik")}</h3>
              <p className="mt-0.5 max-w-md text-[13px] text-slate-muted">{t("ek.yalniz.aciklama")}</p>
            </div>
          </div>
          <Button size="sm" onClick={onDavet}><UserPlus className="size-4" /> {t("ek.yalniz.davet")}</Button>
        </div>
      )}
      <Tablo
        kolonlar={kolonlar}
        veri={liste}
        sayfaBoyu={15}
        ara={(u) => `${u.name} ${u.email} ${u.title ?? ""} ${rolEtiket(t, u.role)}`}
        araPlaceholder={t("ek.tablo.ara")}
        bosMesaj={t("ek.tablo.bos")}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ Davetler sekmesi */
function DavetlerSekmesi({
  liste, onYenile, onIptal, onDavet, t,
}: {
  liste: UyeDTO[];
  onYenile: (u: UyeDTO) => void;
  onIptal: (u: UyeDTO) => void;
  onDavet: () => void;
  t: Ceviri;
}) {
  if (liste.length === 0) {
    return (
      <Panel>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Mail className="size-6" />
          </span>
          <h3 className="text-[15px] font-semibold text-slate-ink">{t("ek.davet.bosBaslik")}</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-muted">{t("ek.davet.bosAciklama")}</p>
          <Button size="sm" className="mt-5" onClick={onDavet}><UserPlus className="size-4" /> {t("ek.davet.bosDavet")}</Button>
        </div>
      </Panel>
    );
  }
  return (
    <Panel baslik={t("ek.davet.baslik").replace("{adet}", String(liste.length))}>
      <div className="divide-y divide-line">
        {liste.map((u) => {
          const suresiDoldu = u.inviteExpiresAt != null && u.inviteExpiresAt <= Date.now();
          return (
            <div key={u.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0 last:pb-0">
              <Avatar ad={u.name} renk={u.avatarColor} boyut={38} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-ink">{u.email}</span>
                  <RolRozeti rol={u.role} ekstra={u.permissions} t={t} />
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-slate-muted">
                  {u.invitedBy && <span>{t("ek.davet.davetEtti").replace("{ad}", u.invitedBy)}</span>}
                  {u.invitedAt && <span>· {goreli(t, u.invitedAt)}</span>}
                  <span className={cn("inline-flex items-center gap-1", suresiDoldu ? "text-red-600" : "")}>
                    · <Clock className="size-3" /> {kalanGun(t, u.inviteExpiresAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => onYenile(u)}>
                  <RefreshCw className="size-3.5" /> {t("ek.davet.yenidenGonder")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onIptal(u)} className="text-danger2 hover:bg-danger-soft">
                  <X className="size-4" /> {t("ek.davet.iptal")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ Roller & izinler sekmesi */
function RollerSekmesi({ uyeler, t }: { uyeler: UyeDTO[]; t: Ceviri }) {
  // Her rolde kaç aktif/davetli üye var.
  const rolSayim = useMemo(() => {
    const m = new Map<Role, number>();
    for (const u of uyeler) m.set(u.role, (m.get(u.role) ?? 0) + 1);
    return m;
  }, [uyeler]);
  const uyeSay = (n: number) => t("ek.roller.uyeSay").replace("{adet}", String(n));

  return (
    <div className="space-y-6">
      {/* İzin matrisi */}
      <Panel baslik={t("ek.roller.matris")} sagUst={<span className="text-[12px] text-slate-faint">{t("ek.roller.matrisNot")}</span>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-faint">{t("ek.roller.yetenek")}</th>
                {ROLLER.map((r) => (
                  <th key={r.anahtar} className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <RolRozeti rol={r.anahtar} t={t} />
                      <span className="text-[11px] font-normal text-slate-faint">{uyeSay(rolSayim.get(r.anahtar) ?? 0)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {YETENEKLER.map((y) => (
                <tr key={y.anahtar} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-slate-ink">{t(YET_AD_ANAHTAR[y.anahtar])}</div>
                    <div className="text-[12px] text-slate-muted">{t(`${YET_AD_ANAHTAR[y.anahtar]}.a`)}</div>
                  </td>
                  {ROLLER.map((r) => (
                    <td key={r.anahtar} className="px-3 py-3 text-center">
                      {rolYetenekli(r.anahtar, y.anahtar) ? (
                        <span className="inline-grid size-6 place-items-center rounded-full bg-ok-soft text-ok">
                          <Check className="size-3.5" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="inline-grid size-6 place-items-center rounded-full bg-slate-100 text-slate-300">
                          <X className="size-3.5" strokeWidth={2.5} />
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Rol açıklamaları */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {ROLLER.slice().reverse().map((r) => {
          const izin = efektifIzinler(r.anahtar);
          return (
            <div key={r.anahtar} className="rounded-3xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-canvas text-slate-ink">{ROL_IKON[r.anahtar]}</span>
                  <div>
                    <div className="text-[15px] font-semibold text-slate-ink">{rolEtiket(t, r.anahtar)}</div>
                    <div className="text-[12px] text-slate-faint">{uyeSay(rolSayim.get(r.anahtar) ?? 0)}</div>
                  </div>
                </div>
                <span className="text-[12px] font-medium text-slate-muted num">{t("ek.roller.yetenekSay").replace("{var}", String(izin.size)).replace("{toplam}", String(YETENEKLER.length))}</span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-muted">{t(ROL_ACIK_ANAHTAR[r.anahtar])}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Aktivite sekmesi */
function AktiviteSekmesi({ denetim, t }: { denetim: DenetimDTO[]; t: Ceviri }) {
  if (denetim.length === 0) {
    return (
      <Panel>
        <div className="py-12 text-center text-sm text-slate-muted">{t("ek.aktivite.bos")}</div>
      </Panel>
    );
  }
  return (
    <Panel baslik={t("ek.aktivite.baslik")} sagUst={<span className="text-[12px] text-slate-faint">{t("ek.aktivite.son").replace("{adet}", String(denetim.length))}</span>}>
      <ol className="relative space-y-4 pl-1">
        {denetim.map((d, i) => (
          <li key={d.id} className="relative flex gap-3">
            {/* dikey çizgi */}
            {i < denetim.length - 1 && <span className="absolute left-[11px] top-6 h-[calc(100%+0.25rem)] w-px bg-line" />}
            <span className={cn(
              "relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ring-4 ring-surface",
              d.action.includes("çıkar") || d.action.includes("iptal") ? "bg-danger-soft text-danger2"
                : d.action.includes("rol") ? "bg-brand-50 text-brand-600"
                : "bg-ok-soft text-ok",
            )}>
              <Mail className="size-3" />
            </span>
            <div className="min-w-0 pb-0.5">
              <p className="text-[13.5px] text-slate-ink">
                <span className="font-medium">{d.actorName}</span>{" "}
                <span className="text-slate-muted">{AKSIYON_ANAHTAR[d.action] ? t(AKSIYON_ANAHTAR[d.action]) : d.action}</span>{" "}
                <span className="font-medium">{d.target}</span>
                {d.meta?.yeniRol && <span className="text-slate-muted"> → {ROL_ANAHTAR[d.meta.yeniRol as Role] ? rolEtiket(t, d.meta.yeniRol as Role) : d.meta.yeniRol}</span>}
                {d.meta?.rol && <span className="text-slate-muted"> ({ROL_ANAHTAR[d.meta.rol as Role] ? rolEtiket(t, d.meta.rol as Role) : d.meta.rol})</span>}
              </p>
              <span className="text-[12px] text-slate-faint">{goreli(t, d.ts)}</span>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/* ------------------------------------------------------------------ RolRozeti */
function RolRozeti({ rol, ekstra, t }: { rol: Role; ekstra?: TeamCapability[]; t: Ceviri }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge ton={ROL_TON[rol]}>
        {ROL_IKON[rol]} {rolEtiket(t, rol)}
      </Badge>
      {ekstra && ekstra.length > 0 && (
        <Tooltip metin={t("ek.modal.ekIzin").replace("{adet}", String(ekstra.length))}>
          <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600">+{ekstra.length}</span>
        </Tooltip>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ RolOnizleme (davet modalı) */
function RolOnizleme({ rol, t }: { rol: Role; t: Ceviri }) {
  const tanim = ROLLER.find((r) => r.anahtar === rol);
  if (!tanim) return null;
  const izin = efektifIzinler(rol);
  return (
    <div className="rounded-xl border border-line bg-canvas/50 px-4 py-3">
      <div className="text-[13px] text-slate-muted">{t(ROL_ACIK_ANAHTAR[rol])}</div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {YETENEKLER.map((y) => {
          const var_ = izin.has(y.anahtar);
          return (
            <span
              key={y.anahtar}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                var_ ? "bg-ok-soft text-green-700" : "bg-slate-100 text-slate-400 line-through",
              )}
            >
              {var_ ? <Check className="size-3" /> : <X className="size-3" />} {t(YET_AD_ANAHTAR[y.anahtar])}
            </span>
          );
        })}
      </div>
    </div>
  );
}
