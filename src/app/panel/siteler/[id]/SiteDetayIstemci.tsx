"use client";

/**
 * Site Detay — Yönetim & Yapılandırma Konsolu
 * ============================================
 * Cloudflare zone-settings seviyesinde derin bir site konsolu. 4 sekme
 * (Genel / Anahtarlar / Entegrasyon / Ayarlar) + üstte canlı bir site
 * sağlık paneli. Tüm yapılandırma değişiklikleri gerçekten Sites.update
 * ile kaydedilir (PATCH /api/sites/:id), toast + denetim günlüğü düşer.
 */
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Key, Code2, Settings2, Activity, RefreshCw, Trash2, Bot, ShieldCheck, Eye, EyeOff,
  GitBranch, Shield, Clock, Gauge, Zap, CheckCircle2, AlertTriangle, XCircle, ArrowRight,
  CircleSlash, Sparkles, Route, Copy, Globe, ExternalLink, ShieldAlert, Timer,
} from "lucide-react";
import { Panel, Badge, Modal, Girdi, Secim, SettingRow2, DurumRozeti, Tooltip, KodBlok, useToast } from "@/components/panel/kit";
import { Toggle } from "@/components/panel/Toggle";
import { TrendGrafik } from "@/components/panel/grafikler";
import { WidgetOnizleme } from "@/components/panel/WidgetOnizleme";
import { Button } from "@/components/ui/Button";
import { DogrulamaAdimi } from "../DogrulamaAdimi";
import { cn } from "@/lib/cn";

interface KuralOzet {
  id: string;
  name: string;
  field: string;
  op: string;
  value: string;
  action: string;
  enabled: boolean;
}
interface Site {
  id: string;
  name: string;
  domains: string[];
  siteKey: string;
  secretKey: string;
  difficulty: string;
  behaviorThreshold: number;
  invisibleMode: boolean;
  mode: string;
  active: boolean;
  rateLimit: number;
  verified: boolean;
  verifyToken: string;
  verifiedAt: number | null;
  createdAt: number;
}
interface Ev {
  id: string;
  ts: number;
  ip: string;
  botClass: string;
  verdict: string;
  path: string;
  score: number;
}
interface Toplam {
  issued: number;
  verified: number;
  blocked: number;
  challenged: number;
}

const TABS = [
  { key: "genel", ad: "Genel", icon: Activity },
  { key: "koruma", ad: "Koruma", icon: Shield },
  { key: "keys", ad: "Anahtarlar", icon: Key },
  { key: "install", ad: "Entegrasyon", icon: Code2 },
  { key: "settings", ad: "Ayarlar", icon: Settings2 },
] as const;

const MODE_ETIKET: Record<string, string> = { monitor: "İzleme", challenge: "Doğrulama", block: "Engelleme" };
const ZORLUK_ETIKET: Record<string, string> = { low: "Düşük", medium: "Orta", high: "Yüksek" };

export function SiteDetayIstemci({
  site: ilk,
  events,
  ruleCount,
  aktifKural,
  kuralOzet,
  trendIssued,
  trendBlocked,
  toplam,
  bugunTrafik,
}: {
  site: Site;
  events: Ev[];
  ruleCount: number;
  aktifKural: number;
  kuralOzet: KuralOzet[];
  trendIssued: number[];
  trendBlocked: number[];
  toplam: Toplam;
  bugunTrafik: number;
}) {
  const router = useRouter();
  const { goster } = useToast();
  const [site, setSite] = useState(ilk);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("genel");
  const [delOpen, setDelOpen] = useState(false);

  // Doğrulama gerçekten başarılı olunca (DogrulamaAdimi sunucu-taraflı
  // /api/sites/verify'ı geçince) çağrılır. Taze siteyi SUNUCUDAN çekeriz —
  // GET başarısız olursa client'ta doğrulanmış VARSAYMAYIZ (yanıltıcı olur);
  // yalnız gerçek sunucu durumunu yansıtırız.
  async function verilendiktenSonra() {
    try {
      const res = await fetch(`/api/sites/${site.id}`);
      if (res.ok) {
        const { site: u } = await res.json();
        setSite((s) => ({ ...s, ...u }));
        if (u?.verified) {
          goster({ tip: "basari", baslik: "Alan adı doğrulandı", aciklama: "Koruma aktif." });
        }
      }
    } catch {
      /* ağ hatası — sunucu durumu değişmedi, sessizce geç */
    }
    router.refresh();
  }

  async function patch(body: Partial<Site>, sessizToast = false) {
    const res = await fetch(`/api/sites/${site.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const { site: u } = await res.json();
      setSite((s) => ({ ...s, ...u }));
      if (!sessizToast) goster({ tip: "basari", baslik: "Yapılandırma kaydedildi" });
    } else {
      goster({ tip: "hata", baslik: "Kaydedilemedi" });
    }
  }
  async function rotate() {
    const res = await fetch(`/api/sites/${site.id}/rotate`, { method: "POST" });
    if (res.ok) {
      const { site: u } = await res.json();
      setSite((s) => ({ ...s, ...u }));
      goster({ tip: "bilgi", baslik: "Secret anahtar döndürüldü", aciklama: "Eski anahtar artık geçersiz." });
    }
  }
  async function remove() {
    const res = await fetch(`/api/sites/${site.id}`, { method: "DELETE" });
    if (res.ok) {
      goster({ tip: "basari", baslik: "Site silindi" });
      router.push("/panel/siteler");
      router.refresh();
    }
  }

  // --- Site sağlık skoru: doğrulama + koruma + trafik + kural bileşenleri.
  const saglik = useMemo(() => hesaplaSaglik(site, aktifKural, bugunTrafik), [site, aktifKural, bugunTrafik]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-6 pt-6 pb-10 lg:px-10">
      <Link href="/panel/siteler" className="inline-flex items-center gap-1.5 text-[13px] text-slate-muted transition hover:text-slate-ink">
        <ArrowLeft className="size-3.5" /> Siteler
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {site.verified ? (
            <Badge ton={site.active ? "yesil" : "gri"}>{site.active ? "Aktif" : "Pasif"}</Badge>
          ) : (
            <Badge ton="sari"><Clock className="size-3" /> Doğrulama bekliyor</Badge>
          )}
          <span className="text-[13px] text-slate-faint">{site.domains.join(", ")}</span>
        </div>
        {/* Doğrulanmamış sitede koruma açılamaz. */}
        {site.verified && (
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-medium text-slate-muted">{site.active ? "Koruma açık" : "Koruma kapalı"}</span>
            <Toggle on={site.active} onChange={(v) => patch({ active: v })} />
          </div>
        )}
      </div>

      {!site.verified && (
        <Panel>
          <div className="mb-4 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warn-soft text-amber-600">
              <Clock className="size-5" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-slate-ink">Alan adı doğrulaması gerekiyor</h3>
              <p className="mt-0.5 text-[13px] text-slate-muted">
                Koruma etkinleşmeden önce <strong>{site.domains[0]}</strong> üzerindeki sahipliğinizi kanıtlamalısınız.
              </p>
            </div>
          </div>
          <DogrulamaAdimi
            site={{ id: site.id, name: site.name, domains: site.domains, verifyToken: site.verifyToken }}
            onDogrulandi={verilendiktenSonra}
          />
        </Panel>
      )}

      {/* Site sağlık paneli — her zaman görünür (doğrulama bileşeni de dahil). */}
      <SaglikPaneli saglik={saglik} site={site} aktifKural={aktifKural} bugunTrafik={bugunTrafik} />

      {/* tabs — Tavily pill grubu */}
      <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-canvas p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const aktif = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn("flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition", aktif ? "bg-surface text-brand-700 shadow-card" : "text-slate-muted hover:text-slate-ink")}>
              <Icon className="size-4" /> {t.ad}
            </button>
          );
        })}
      </div>

      {tab === "genel" && <GenelTab site={site} events={events} ruleCount={ruleCount} aktifKural={aktifKural} trendIssued={trendIssued} trendBlocked={trendBlocked} toplam={toplam} />}
      {tab === "koruma" && <KorumaTab site={site} patch={patch} kuralOzet={kuralOzet} ruleCount={ruleCount} />}
      {tab === "keys" && <KeysTab site={site} rotate={rotate} goster={goster} toplam={toplam} />}
      {tab === "install" && <InstallTab site={site} />}
      {tab === "settings" && <SettingsTab site={site} patch={patch} onDogrulandi={verilendiktenSonra} onDelete={() => setDelOpen(true)} />}

      <Modal acik={delOpen} kapat={() => setDelOpen(false)} baslik="Siteyi sil" genislik="max-w-md">
        <p className="text-sm text-slate-muted">
          <strong>{site.name}</strong> ve tüm analitiği kalıcı olarak siliniyor. Bu işlem geri alınamaz.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDelOpen(false)}>İptal</Button>
          <Button variant="danger" onClick={remove}><Trash2 className="size-4" /> Kalıcı sil</Button>
        </div>
      </Modal>
    </div>
  );
}

/* ================================================================= Sağlık paneli */

interface SaglikBilesen {
  ad: string;
  puan: number; // 0..1
  durum: "ok" | "warn" | "danger";
  mesaj: string;
}
interface Saglik {
  skor: number; // 0..100
  seviye: "saglikli" | "dikkat" | "risk";
  bilesenler: SaglikBilesen[];
}

function hesaplaSaglik(site: Site, aktifKural: number, bugunTrafik: number): Saglik {
  const bilesenler: SaglikBilesen[] = [];

  // 1) Doğrulama
  if (site.verified) {
    bilesenler.push({ ad: "Doğrulama", puan: 1, durum: "ok", mesaj: "Alan adı sahipliği doğrulandı" });
  } else {
    bilesenler.push({ ad: "Doğrulama", puan: 0, durum: "danger", mesaj: "Alan adı doğrulanmadı — koruma pasif" });
  }

  // 2) Koruma durumu (aktif mi + mod ne kadar sıkı)
  if (!site.active) {
    bilesenler.push({ ad: "Koruma", puan: 0, durum: "danger", mesaj: "Koruma kapalı — trafik değerlendirilmiyor" });
  } else if (site.mode === "monitor") {
    bilesenler.push({ ad: "Koruma", puan: 0.5, durum: "warn", mesaj: "İzleme modu — kaydeder ama engellemez" });
  } else if (site.mode === "challenge") {
    bilesenler.push({ ad: "Koruma", puan: 0.9, durum: "ok", mesaj: "Doğrulama modu — şüpheli trafik challenge alır" });
  } else {
    bilesenler.push({ ad: "Koruma", puan: 1, durum: "ok", mesaj: "Engelleme modu — en yüksek koruma" });
  }

  // 3) Kural kapsamı
  if (aktifKural === 0) {
    bilesenler.push({ ad: "Kurallar", puan: 0.3, durum: "warn", mesaj: "Etkin kural yok — yalnızca temel koruma" });
  } else if (aktifKural < 3) {
    bilesenler.push({ ad: "Kurallar", puan: 0.7, durum: "warn", mesaj: `${aktifKural} etkin kural — genişletilebilir` });
  } else {
    bilesenler.push({ ad: "Kurallar", puan: 1, durum: "ok", mesaj: `${aktifKural} etkin kural aktif` });
  }

  // 4) Son trafik (bugün istek gördü mü)
  if (bugunTrafik > 0) {
    bilesenler.push({ ad: "Trafik", puan: 1, durum: "ok", mesaj: `Bugün ${bugunTrafik.toLocaleString("tr-TR")} istek değerlendirildi` });
  } else if (site.verified) {
    bilesenler.push({ ad: "Trafik", puan: 0.6, durum: "warn", mesaj: "Bugün henüz trafik yok" });
  } else {
    bilesenler.push({ ad: "Trafik", puan: 0.3, durum: "warn", mesaj: "Widget kurulumu bekleniyor" });
  }

  const skor = Math.round((bilesenler.reduce((a, b) => a + b.puan, 0) / bilesenler.length) * 100);
  const seviye: Saglik["seviye"] = skor >= 80 ? "saglikli" : skor >= 50 ? "dikkat" : "risk";
  return { skor, seviye, bilesenler };
}

function SaglikPaneli({ saglik, site, aktifKural, bugunTrafik }: { saglik: Saglik; site: Site; aktifKural: number; bugunTrafik: number }) {
  void site; void aktifKural; void bugunTrafik;
  const ton = saglik.seviye === "saglikli" ? "ok" : saglik.seviye === "dikkat" ? "warn" : "danger";
  const etiket = saglik.seviye === "saglikli" ? "Sağlıklı" : saglik.seviye === "dikkat" ? "Dikkat" : "Risk";
  const halkaRenk = ton === "ok" ? "#16a34a" : ton === "warn" ? "#d97706" : "#dc2626";
  const cevre = 2 * Math.PI * 34;
  const dolu = (saglik.skor / 100) * cevre;
  return (
    <Panel padding={false}>
      <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center">
        {/* Skor halkası */}
        <div className="flex items-center gap-5">
          <div className="relative grid size-[104px] place-items-center">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              <circle cx="50" cy="50" r="34" fill="none" stroke="#eceae2" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="34" fill="none" stroke={halkaRenk} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={cevre} strokeDashoffset={cevre - dolu}
                style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold tabular-nums text-slate-ink">{saglik.skor}</span>
              <span className="text-[10px] font-medium text-slate-faint">/ 100</span>
            </div>
          </div>
          <div className="md:hidden">
            <div className="text-[15px] font-semibold text-slate-ink">Site sağlığı</div>
            <DurumRozeti ton={ton} etiket={etiket} nabiz={ton !== "ok"} />
          </div>
        </div>
        {/* Bileşenler */}
        <div>
          <div className="mb-3 hidden items-center justify-between md:flex">
            <div className="text-[15px] font-semibold text-slate-ink">Site sağlığı</div>
            <DurumRozeti ton={ton} etiket={etiket} nabiz={ton !== "ok"} />
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {saglik.bilesenler.map((b) => {
              const Icon = b.durum === "ok" ? CheckCircle2 : b.durum === "warn" ? AlertTriangle : XCircle;
              const renk = b.durum === "ok" ? "text-ok" : b.durum === "warn" ? "text-warn" : "text-danger2";
              return (
                <div key={b.ad} className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas/40 px-3.5 py-2.5">
                  <Icon className={cn("mt-0.5 size-4 shrink-0", renk)} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-slate-ink">{b.ad}</div>
                    <div className="text-[12px] leading-snug text-slate-muted">{b.mesaj}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ================================================================= Genel */

function GenelTab({ site, events, ruleCount, aktifKural, trendIssued, trendBlocked, toplam }: {
  site: Site; events: Ev[]; ruleCount: number; aktifKural: number; trendIssued: number[]; trendBlocked: number[]; toplam: Toplam;
}) {
  const engelOran = toplam.issued > 0 ? Math.round((toplam.blocked / toplam.issued) * 100) : 0;
  return (
    <div className="space-y-5">
      {/* Hızlı istatistikler — GERÇEK 14g toplamları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniKart ad="Doğrulanan (14g)" deger={toplam.verified.toLocaleString("tr-TR")} ikon={<ShieldCheck className="size-4" />} ton="ok" />
        <MiniKart ad="Engellenen (14g)" deger={toplam.blocked.toLocaleString("tr-TR")} ikon={<CircleSlash className="size-4" />} ton="danger" />
        <MiniKart ad="Challenge (14g)" deger={toplam.challenged.toLocaleString("tr-TR")} ikon={<Shield className="size-4" />} />
        <MiniKart ad="Engelleme oranı" deger={`%${engelOran}`} ikon={<Gauge className="size-4" />} />
      </div>

      {/* Yapılandırma özeti + kısayollar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniKart ad="Koruma modu" deger={MODE_ETIKET[site.mode]} ikon={<Shield className="size-4" />} />
        <MiniKart ad="Zorluk" deger={ZORLUK_ETIKET[site.difficulty]} ikon={<Zap className="size-4" />} />
        <MiniKart ad="Etkin kural" deger={`${aktifKural} / ${ruleCount}`} ikon={<GitBranch className="size-4" />} link="/panel/kurallar" />
        <MiniKart ad="Görünmez mod" deger={site.invisibleMode ? "Açık" : "Kapalı"} ikon={site.invisibleMode ? <Eye className="size-4" /> : <EyeOff className="size-4" />} />
      </div>

      {/* Canlı trafik mini-grafikleri — GERÇEK veriden */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel baslik="Doğrulama trafiği (14g)" sagUst={<span className="text-[12px] font-semibold tabular-nums text-slate-muted">{toplam.issued.toLocaleString("tr-TR")} istek</span>}>
          <TrendGrafik noktalar={trendIssued} renk="#2f6fed" gradId="siteIssued" yukseklik={180} />
        </Panel>
        <Panel baslik="Engellenen (14g)" sagUst={<span className="text-[12px] font-semibold tabular-nums text-danger2">{toplam.blocked.toLocaleString("tr-TR")} engel</span>}>
          <TrendGrafik noktalar={trendBlocked} renk="#dc2626" gradId="siteBlocked" yukseklik={180} />
        </Panel>
      </div>

      {/* Son olaylar özeti */}
      <Panel baslik="Son olaylar" padding={false} sagUst={<Link href="/panel/canli" className="text-[12px] font-medium text-brand-600 hover:text-brand-700">Canlı akış →</Link>}>
        {events.length === 0 ? (
          <div className="px-6 py-12 text-center text-[13px] text-slate-faint">Henüz olay kaydı yok. Widget kurulduğunda burada belirir.</div>
        ) : (
          <div className="divide-y divide-line">
            {events.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className={cn("grid size-8 place-items-center rounded-lg", e.verdict === "blocked" ? "bg-danger-soft text-danger2" : e.verdict === "allowed" ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn")}>
                    {e.verdict === "allowed" ? <ShieldCheck className="size-4" /> : <Bot className="size-4" />}
                  </span>
                  <div>
                    <div className="num text-[13px] font-medium text-slate-ink">{e.ip}</div>
                    <div className="text-[12px] text-slate-muted">{e.path} · {new Date(e.ts).toLocaleTimeString("tr-TR")}</div>
                  </div>
                </div>
                <span className="num text-[12px] font-semibold text-slate-muted">skor {e.score.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ================================================================= Koruma yapılandırması (derin) */

function KorumaTab({ site, patch, kuralOzet, ruleCount }: {
  site: Site; patch: (b: Partial<Site>, sessiz?: boolean) => void; kuralOzet: KuralOzet[]; ruleCount: number;
}) {
  // Slider için yerel durum (bırakınca kaydeder — her tikte istek atmaz).
  const [esik, setEsik] = useState(site.behaviorThreshold);
  const [rl, setRl] = useState(site.rateLimit);

  return (
    <div className="space-y-5">
      {/* Zorluk seviyesi seçici — açıklamalı kartlar */}
      <Panel baslik="Zorluk seviyesi" sagUst={<Tooltip metin="Ghost-font gürültü ve çarpıtma yoğunluğu"><Sparkles className="size-4 text-slate-faint" /></Tooltip>}>
        <p className="mb-4 text-[13px] text-slate-muted">
          Yüksek zorluk daha fazla temporal-dithering gürültüsü uygular; AI için okunması imkânsızlaşır, insan için hafif zorlaşır.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            { v: "low", ad: "Düşük", aciklama: "Az gürültü. Yüksek trafikli, düşük riskli sayfalar için.", ikon: Gauge },
            { v: "medium", ad: "Orta", aciklama: "Dengeli. Çoğu site için önerilen varsayılan.", ikon: Shield },
            { v: "high", ad: "Yüksek", aciklama: "Yoğun çarpıtma. Login / ödeme / hassas akışlar için.", ikon: ShieldAlert },
          ] as const).map((o) => {
            const Icon = o.ikon;
            const aktif = site.difficulty === o.v;
            return (
              <button
                key={o.v}
                onClick={() => patch({ difficulty: o.v })}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  aktif ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-line bg-surface hover:border-line-strong hover:bg-canvas",
                )}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <Icon className={cn("size-5", aktif ? "text-brand-600" : "text-slate-faint")} />
                  {aktif && <CheckCircle2 className="size-4 text-brand-600" />}
                </div>
                <div className="text-[14px] font-semibold text-slate-ink">{o.ad}</div>
                <div className="mt-0.5 text-[12px] leading-snug text-slate-muted">{o.aciklama}</div>
              </button>
            );
          })}
        </div>
      </Panel>

      {/* Koruma modu + görünmez mod */}
      <Panel baslik="Koruma modu">
        <SettingRow2 baslik="Trafik kararı" aciklama="İzleme yalnızca kaydeder; Doğrulama şüpheli trafiğe challenge gösterir; Engelleme direkt reddeder.">
          <Secim className="w-44" value={site.mode} onChange={(e) => patch({ mode: e.target.value })}>
            <option value="monitor">İzleme</option>
            <option value="challenge">Doğrulama</option>
            <option value="block">Engelleme</option>
          </Secim>
        </SettingRow2>
        <SettingRow2 baslik="Görünmez mod" aciklama="Davranış skoru eşiğin üstündeyse challenge'ı atlar — sürtünmesiz akış. Sadece şüpheli oturumlar kod görür." onerilen>
          <Toggle on={site.invisibleMode} onChange={(v) => patch({ invisibleMode: v })} />
        </SettingRow2>
      </Panel>

      {/* Davranış eşiği slider */}
      <Panel baslik="Davranış eşiği">
        <p className="mb-4 text-[13px] text-slate-muted">
          Bir oturumun &ldquo;insan&rdquo; sayılması için gereken minimum davranış skoru. Düşük eşik daha çok trafiği geçirir (az sürtünme);
          yüksek eşik daha katıdır (az bot kaçağı).
        </p>
        <div className="flex items-center gap-4">
          <span className="w-16 text-[12px] font-medium text-slate-muted">Gevşek</span>
          <input
            type="range" min={0} max={1} step={0.05} value={esik}
            onChange={(e) => setEsik(Number(e.target.value))}
            onMouseUp={() => patch({ behaviorThreshold: esik })}
            onTouchEnd={() => patch({ behaviorThreshold: esik })}
            onKeyUp={() => patch({ behaviorThreshold: esik })}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-canvas accent-brand-600"
            aria-label="Davranış eşiği"
          />
          <span className="w-16 text-right text-[12px] font-medium text-slate-muted">Katı</span>
          <span className="w-14 rounded-lg bg-brand-50 py-1 text-center text-[13px] font-bold tabular-nums text-brand-700">{esik.toFixed(2)}</span>
        </div>
      </Panel>

      {/* Rate limit */}
      <Panel baslik="Hız sınırı (rate limit)">
        <SettingRow2 baslik="IP başına dakikada azami istek" aciklama="Aynı IP dakikada bu sayıyı aşarsa ek doğrulamaya alınır / engellenir. 0 = sınırsız (kapalı).">
          <div className="flex items-center gap-2">
            <Girdi
              type="number" min={0} max={100000} value={rl}
              onChange={(e) => setRl(Math.max(0, Math.min(100000, Number(e.target.value) || 0)))}
              className="w-28 text-right"
            />
            <Button variant="outline" size="sm" onClick={() => patch({ rateLimit: rl })} disabled={rl === site.rateLimit}>
              <Timer className="size-3.5" /> Kaydet
            </Button>
          </div>
        </SettingRow2>
        <div className="mt-1 flex flex-wrap gap-2">
          {[0, 60, 120, 300, 600].map((n) => (
            <button
              key={n}
              onClick={() => { setRl(n); patch({ rateLimit: n }); }}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] font-medium transition",
                site.rateLimit === n ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line text-slate-muted hover:border-line-strong hover:text-slate-ink",
              )}
            >
              {n === 0 ? "Kapalı" : `${n}/dk`}
            </button>
          ))}
        </div>
      </Panel>

      {/* Yol-bazlı kurallar önizlemesi (görsel + gerçek kural özeti) */}
      <Panel
        baslik="Yol-bazlı koruma"
        sagUst={<Link href="/panel/kurallar" className="text-[12px] font-medium text-brand-600 hover:text-brand-700">Kuralları yönet →</Link>}
      >
        <p className="mb-4 text-[13px] text-slate-muted">
          Farklı yollar farklı sıkılık ister. Aşağıda önerilen yol-bazlı politika ve bu siteye tanımlı ilk kurallar görünür.
        </p>
        {/* önerilen yol politikası — görsel */}
        <div className="mb-5 space-y-2">
          {[
            { yol: "/login", pol: "Katı — her istek challenge", ton: "danger" as const },
            { yol: "/api", pol: "Orta — davranış + rate limit", ton: "warn" as const },
            { yol: "/", pol: "Gevşek — yalnızca şüpheli oturumlar", ton: "ok" as const },
          ].map((p) => (
            <div key={p.yol} className="flex items-center gap-3 rounded-xl border border-line bg-canvas/40 px-3.5 py-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><Route className="size-4" /></span>
              <code className="rounded-md bg-ink-900 px-2 py-0.5 font-mono text-[12px] text-[#c7d5e2]">{p.yol}</code>
              <ArrowRight className="size-3.5 text-slate-faint" />
              <span className="text-[13px] text-slate-muted">{p.pol}</span>
            </div>
          ))}
        </div>
        {/* siteye tanımlı gerçek kurallar */}
        <div className="rounded-2xl border border-line">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-slate-faint">
            <span>Tanımlı kurallar</span>
            <span className="tabular-nums">{ruleCount} kural</span>
          </div>
          {kuralOzet.length === 0 ? (
            <div className="px-4 py-6 text-center text-[13px] text-slate-faint">Bu siteye özel kural tanımlı değil.</div>
          ) : (
            <div className="divide-y divide-line">
              {kuralOzet.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={cn("size-1.5 shrink-0 rounded-full", r.enabled ? "bg-ok" : "bg-slate-300")} />
                    <span className="truncate text-[13px] font-medium text-slate-ink">{r.name}</span>
                    <code className="hidden shrink-0 rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-slate-muted sm:inline">
                      {r.field} {opSembol(r.op)} {r.value}
                    </code>
                  </div>
                  <Badge ton={aksiyonTon(r.action)}>{aksiyonEtiket(r.action)}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function opSembol(op: string): string {
  return { eq: "=", neq: "≠", contains: "⊃", gt: ">", lt: "<", in: "∈" }[op] ?? op;
}
function aksiyonEtiket(a: string): string {
  return { allow: "İzin", challenge: "Doğrula", block: "Engelle", flag: "İşaretle" }[a] ?? a;
}
function aksiyonTon(a: string): "yesil" | "sari" | "kirmizi" | "mavi" | "gri" {
  const m: Record<string, "yesil" | "sari" | "kirmizi" | "mavi"> = {
    allow: "yesil", challenge: "sari", block: "kirmizi", flag: "mavi",
  };
  return m[a] ?? "gri";
}

/* ================================================================= Anahtarlar */

function KeysTab({ site, rotate, goster, toplam }: {
  site: Site; rotate: () => void; goster: (t: { tip: "basari" | "hata" | "bilgi"; baslik: string }) => void; toplam: Toplam;
}) {
  const [secretGoster, setSecretGoster] = useState(false);
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel baslik="Site anahtarı (public)" sagUst={<Badge ton="mavi">pk</Badge>}>
          <p className="mb-3 text-[13px] text-slate-muted">Widget'ın istemcide kullandığı public anahtar. Herkese açık olabilir.</p>
          <KopyaKutu value={site.siteKey} goster={goster} />
        </Panel>
        <Panel baslik="Secret anahtar" sagUst={<Badge ton="kirmizi">sk</Badge>}>
          <p className="mb-3 text-[13px] text-slate-muted">Sunucu doğrulaması için gizli anahtar. Asla istemciye / repoya koyma.</p>
          <KopyaKutu value={site.secretKey} goster={goster} maskele={!secretGoster} sagAksiyon={
            <button onClick={() => setSecretGoster((v) => !v)} className="shrink-0 text-slate-faint transition hover:text-slate-ink" aria-label={secretGoster ? "Gizle" : "Göster"}>
              {secretGoster ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          } />
          <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-warn-soft px-3.5 py-3">
            <span className="text-[13px] text-amber-700">Sızıntı durumunda anahtarı döndür</span>
            <Button variant="outline" size="sm" onClick={rotate}><RefreshCw className="size-3.5" /> Döndür</Button>
          </div>
        </Panel>
      </div>

      {/* Anahtar kullanım istatistiği — GERÇEK 14g toplamları */}
      <Panel baslik="Anahtar kullanımı (14g)">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <UsageMini ad="Toplam çağrı" deger={toplam.issued} />
          <UsageMini ad="Doğrulanan" deger={toplam.verified} ton="ok" />
          <UsageMini ad="Challenge" deger={toplam.challenged} ton="warn" />
          <UsageMini ad="Engellenen" deger={toplam.blocked} ton="danger" />
        </div>
      </Panel>
    </div>
  );
}

function UsageMini({ ad, deger, ton }: { ad: string; deger: number; ton?: "ok" | "warn" | "danger" }) {
  const renk = ton === "ok" ? "text-ok" : ton === "warn" ? "text-warn" : ton === "danger" ? "text-danger2" : "text-slate-ink";
  return (
    <div className="rounded-xl border border-line bg-canvas/40 p-4">
      <div className={cn("text-2xl font-bold tabular-nums", renk)}>{deger.toLocaleString("tr-TR")}</div>
      <div className="mt-0.5 text-[12px] text-slate-muted">{ad}</div>
    </div>
  );
}

/* ================================================================= Entegrasyon (derin) */

function InstallTab({ site }: { site: Site }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://veylify.com";
  const [dil, setDil] = useState<"html" | "react" | "vue">("html");

  const kodlar: Record<typeof dil, { baslik: string; dilAd: string; kod: string }> = {
    html: {
      baslik: "index.html", dilAd: "HTML",
      kod: `<!-- Specter widget'ı formunuzun içine yerleştirin -->
<form method="POST" action="/giris">
  <input name="email" type="email" required />
  <input name="password" type="password" required />

  <div class="veylify" data-sitekey="${site.siteKey}"></div>

  <button type="submit">Giriş yap</button>
</form>

<script src="${origin}/veylify.js" async defer></script>`,
    },
    react: {
      baslik: "GirisFormu.tsx", dilAd: "React",
      kod: `import { useEffect } from "react";

export function GirisFormu() {
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "${origin}/veylify.js";
    s.async = true;
    document.body.appendChild(s);
    return () => { s.remove(); };
  }, []);

  return (
    <form method="POST" action="/giris">
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <div className="specter" data-sitekey="${site.siteKey}" />
      <button type="submit">Giriş yap</button>
    </form>
  );
}`,
    },
    vue: {
      baslik: "GirisFormu.vue", dilAd: "Vue",
      kod: `<script setup>
import { onMounted } from "vue";
onMounted(() => {
  const s = document.createElement("script");
  s.src = "${origin}/veylify.js";
  s.async = true;
  document.body.appendChild(s);
});
</script>

<template>
  <form method="POST" action="/giris">
    <input name="email" type="email" required />
    <input name="password" type="password" required />
    <div class="veylify" :data-sitekey="'${site.siteKey}'"></div>
    <button type="submit">Giriş yap</button>
  </form>
</template>`,
    },
  };

  const verify = `// Sunucu tarafı: gönderilen token'ı Specter ile doğrula
const res = await fetch("${origin}/api/v1/siteverify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    secret: "${site.secretKey}",           // gizli anahtar — yalnızca sunucuda
    response: req.body["veylify-token"],   // formdan gelen token
    remoteip: req.ip,                       // opsiyonel
  }),
});
const data = await res.json();
if (!data.success) {
  return res.status(403).send("Doğrulama başarısız — bot şüphesi");
}
// data.score → insanlık skoru (0..1), data.action → allow/challenge/block`;

  return (
    <div className="space-y-5">
      {/* Kurulum durumu — görsel adım göstergesi */}
      <Panel baslik="Kurulum durumu">
        <div className="grid gap-3 sm:grid-cols-3">
          <KurulumAdim n={1} ad="Anahtar hazır" tamam ikon={Key} not="Site anahtarınız üretildi" />
          <KurulumAdim n={2} ad="Widget eklendi" tamam={site.verified} ikon={Code2} not={site.verified ? "Alan adı doğrulandı" : "Doğrulama bekliyor"} />
          <KurulumAdim n={3} ad="Sunucu doğrulaması" ikon={ShieldCheck} not="Backend'e siteverify çağrısı ekleyin" />
        </div>
      </Panel>

      {/* Frontend — dil sekmeli KodBlok */}
      <Panel
        baslik="Frontend entegrasyonu"
        sagUst={
          <div className="inline-flex gap-1 rounded-xl bg-canvas p-1">
            {(["html", "react", "vue"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDil(d)}
                className={cn("rounded-lg px-2.5 py-1 text-[12px] font-medium transition", dil === d ? "bg-surface text-brand-700 shadow-card" : "text-slate-muted hover:text-slate-ink")}
              >
                {kodlar[d].dilAd}
              </button>
            ))}
          </div>
        }
      >
        <KodBlok kod={kodlar[dil].kod} baslik={kodlar[dil].baslik} dil={kodlar[dil].dilAd} />
      </Panel>

      {/* Backend doğrulaması */}
      <Panel baslik="Sunucu-taraflı doğrulama">
        <p className="mb-4 text-[13px] text-slate-muted">
          Token yalnızca istemciye güvenmek yeterli değildir. Formu işlerken sunucuda <strong>siteverify</strong> ile onaylayın —
          secret anahtar asla istemciye gitmez.
        </p>
        <KodBlok kod={verify} baslik="dogrula.ts" dil="TypeScript" />
      </Panel>

      {/* Canlı widget önizlemesi */}
      <Panel baslik="Canlı widget önizlemesi">
        <p className="mb-4 text-[13px] text-slate-muted">
          Bu, sitene ekleneceğinde ziyaretçilerin göreceği gerçek widget (kendi anahtarınla). Ghost-font, hareketli gürültü
          içinde çalışır: insan okur, AI statik karede kör kalır.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <WidgetOnizleme siteKey={site.siteKey} />
          <div className="flex-1 space-y-2 text-[13px] text-slate-muted">
            <div className="flex items-center gap-2"><Eye className="size-4 text-brand-600" /> Kod hareketli gürültüde belirir</div>
            <div className="flex items-center gap-2"><Eye className="size-4 text-brand-600" /> İnsan okur, AI statik karede kör kalır</div>
            <div className="flex items-center gap-2"><Eye className="size-4 text-brand-600" /> Davranış + kurallar arka planda değerlendirilir</div>
            <a href="/ornek.html" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 hover:text-brand-700">
              Gerçek bir formda dene <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function KurulumAdim({ n, ad, not, tamam, ikon: Icon }: { n: number; ad: string; not: string; tamam?: boolean; ikon: typeof Key }) {
  return (
    <div className={cn("rounded-2xl border p-4", tamam ? "border-ok/30 bg-ok-soft/50" : "border-line bg-canvas/40")}>
      <div className="mb-2 flex items-center justify-between">
        <span className={cn("grid size-9 place-items-center rounded-xl", tamam ? "bg-ok text-white" : "bg-surface text-slate-faint ring-1 ring-line")}>
          {tamam ? <CheckCircle2 className="size-5" /> : <Icon className="size-4.5" />}
        </span>
        <span className="text-[11px] font-semibold text-slate-faint">Adım {n}</span>
      </div>
      <div className="text-[14px] font-semibold text-slate-ink">{ad}</div>
      <div className="mt-0.5 text-[12px] leading-snug text-slate-muted">{not}</div>
    </div>
  );
}

/* ================================================================= Ayarlar */

function SettingsTab({ site, patch, onDogrulandi, onDelete }: {
  site: Site; patch: (b: Partial<Site>, sessiz?: boolean) => void; onDogrulandi: () => void; onDelete: () => void;
}) {
  const [ad, setAd] = useState(site.name);
  const [domainler, setDomainler] = useState(site.domains.join(", "));
  const adDegisti = ad.trim() !== site.name && ad.trim().length > 0;
  const domainDegisti = domainler.trim() !== site.domains.join(", ") && domainler.trim().length > 0;

  return (
    <div className="space-y-5">
      {/* Site kimliği */}
      <Panel baslik="Site bilgileri">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-ink">Site adı</label>
            <div className="flex gap-2">
              <Girdi value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Site adı" className="flex-1" />
              <Button variant="outline" onClick={() => patch({ name: ad.trim() })} disabled={!adDegisti}>Kaydet</Button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-ink">Alan adları</label>
            <div className="flex gap-2">
              <Girdi value={domainler} onChange={(e) => setDomainler(e.target.value)} placeholder="ornek.com, app.ornek.com" className="flex-1" />
              <Button variant="outline" onClick={() => patch({ domains: domainler as unknown as string[] })} disabled={!domainDegisti}>Kaydet</Button>
            </div>
            <p className="mt-1.5 text-[12px] text-slate-muted">Virgül veya satırla ayırın. Widget yalnızca bu alan adlarında çalışır.</p>
          </div>
        </div>
      </Panel>

      {/* Domain doğrulama durumu */}
      <Panel baslik="Alan adı doğrulaması" sagUst={site.verified
        ? <DurumRozeti ton="ok" etiket="Doğrulandı" />
        : <DurumRozeti ton="warn" etiket="Bekliyor" nabiz />}>
        {site.verified ? (
          <div className="flex items-center gap-3 rounded-xl border border-ok/30 bg-ok-soft/50 px-4 py-3">
            <ShieldCheck className="size-5 shrink-0 text-ok" />
            <div className="text-[13px] text-slate-muted">
              <strong className="text-slate-ink">{site.domains[0]}</strong> sahipliği doğrulandı
              {site.verifiedAt ? ` · ${new Date(site.verifiedAt).toLocaleDateString("tr-TR")}` : ""}. Koruma aktif.
            </div>
          </div>
        ) : (
          <>
            <p className="mb-4 text-[13px] text-slate-muted">
              Koruma etkinleşmeden önce alan adı sahipliğinizi kanıtlayın.
            </p>
            <DogrulamaAdimi
              site={{ id: site.id, name: site.name, domains: site.domains, verifyToken: site.verifyToken }}
              onDogrulandi={onDogrulandi}
            />
          </>
        )}
      </Panel>

      {/* Meta bilgi */}
      <Panel baslik="Site meta">
        <dl className="grid gap-3 sm:grid-cols-2">
          <MetaSatir etiket="Site ID" deger={site.id} mono />
          <MetaSatir etiket="Oluşturulma" deger={new Date(site.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} />
          <MetaSatir etiket="Birincil alan adı" deger={site.domains[0]} ikon={<Globe className="size-3.5" />} />
          <MetaSatir etiket="Rate limit" deger={site.rateLimit > 0 ? `${site.rateLimit}/dk` : "Kapalı"} />
        </dl>
      </Panel>

      {/* Tehlikeli bölge */}
      <Panel baslik="Tehlikeli bölge">
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-danger-soft px-4 py-3">
          <div>
            <div className="text-sm font-medium text-slate-ink">Siteyi sil</div>
            <div className="text-[13px] text-slate-muted">Tüm anahtarlar, kurallar ve analitik kalıcı olarak silinir.</div>
          </div>
          <Button variant="danger" size="sm" onClick={onDelete}><Trash2 className="size-3.5" /> Sil</Button>
        </div>
      </Panel>
    </div>
  );
}

function MetaSatir({ etiket, deger, mono, ikon }: { etiket: string; deger: string; mono?: boolean; ikon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-2.5">
      <dt className="text-[12px] text-slate-muted">{etiket}</dt>
      <dd className={cn("mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-slate-ink", mono && "font-mono text-[12px]")}>
        {ikon}{deger}
      </dd>
    </div>
  );
}

/* ================================================================= ortak parçalar */

function MiniKart({ ad, deger, ikon, link, ton }: {
  ad: string; deger: string; ikon?: React.ReactNode; link?: string; ton?: "ok" | "danger";
}) {
  const renk = ton === "ok" ? "text-ok" : ton === "danger" ? "text-danger2" : "text-slate-ink";
  const inner = (
    <div className={cn("rounded-2xl border border-line bg-surface p-4 shadow-card transition", link && "group hover:border-line-strong hover:bg-canvas")}>
      <div className="flex items-center justify-between text-[12px] text-slate-muted">
        <span className="flex items-center gap-1.5">{ikon}{ad}</span>
        {link && <ArrowRight className="size-3.5 text-slate-faint transition group-hover:translate-x-0.5" />}
      </div>
      <div className={cn("mt-1 text-lg font-semibold tabular-nums", renk)}>{deger}</div>
    </div>
  );
  return link ? <Link href={link}>{inner}</Link> : inner;
}

function KopyaKutu({ value, goster, maskele, sagAksiyon }: {
  value: string;
  goster: (t: { tip: "basari" | "hata" | "bilgi"; baslik: string }) => void;
  maskele?: boolean;
  sagAksiyon?: React.ReactNode;
}) {
  const gosterilen = maskele ? value.slice(0, 8) + "•".repeat(Math.max(4, value.length - 12)) + value.slice(-4) : value;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5">
      <button
        onClick={() => { navigator.clipboard.writeText(value); goster({ tip: "basari", baslik: "Kopyalandı" }); }}
        className="flex min-w-0 flex-1 items-center gap-2 text-left font-mono text-[13px] transition hover:text-brand-700"
      >
        <span className="truncate text-slate-ink">{gosterilen}</span>
        <Copy className="size-3.5 shrink-0 text-slate-faint" />
      </button>
      {sagAksiyon}
    </div>
  );
}
