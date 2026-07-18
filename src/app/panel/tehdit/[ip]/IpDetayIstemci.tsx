"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Ban, ShieldCheck, MapPin, Server, Clock, Bot, GitBranch, ShieldAlert, Download, Activity } from "lucide-react";
import { Panel, Badge, StatKart, Ilerleme, Ulke, Tablo, BosDurum, useToast, type Kolon } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { TrendGrafik, DonutDagilim } from "@/components/panel/grafikler";
import { exportCsv } from "@/lib/csv";
import { fingerprintUret } from "@/lib/specter/fingerprint";
import { tehditBeslemeEslestir } from "@/lib/specter/threat-feed";
import { Fingerprint, Radio } from "lucide-react";
import { cn } from "@/lib/cn";

interface Ev {
  id: string;
  ts: number;
  path: string;
  botClass: string;
  verdict: string;
  score: number;
  ua: string;
  latency: number;
  triggeredRules: string[];
  siteId: string;
}
interface Ozet {
  toplamIstek: number;
  engellenen: number;
  dogrulama: number;
  izin: number;
  ortLatency: number;
  asnSayi: number;
  ulkeSayi: number;
  botClass: string;
  firstSeen: number;
  lastSeen: number;
}

const BOT_ETIKET: Record<string, string> = {
  human: "İnsan", good_bot: "İyi bot", automation: "Otomasyon", scraper: "Kazıyıcı",
  credential_stuffing: "Kimlik doldurma", ai_agent: "AI ajan", ddos: "DDoS", spam: "Spam",
};
const BOT_RENK: Record<string, string> = {
  automation: "#4a41e8", scraper: "#dc2626", credential_stuffing: "#d97706",
  ai_agent: "#7c74ff", ddos: "#0b0b18", spam: "#5c6072", good_bot: "#16a34a", human: "#a3b0ff",
};
const KAT_ETIKET: Record<string, string> = {
  clean: "Temiz ün", suspicious: "Şüpheli", malicious: "Kötü ün", tor: "Tor çıkış düğümü", vpn: "VPN / Proxy", datacenter: "Veri merkezi",
};
const VERDICT_ETIKET: Record<string, string> = { blocked: "Engellendi", allowed: "İzin verildi", challenged: "Doğrulandı", flagged: "İşaretlendi" };
const VERDICT_RENK: Record<string, string> = { blocked: "#dc2626", challenged: "#d97706", flagged: "#7c74ff", allowed: "#16a34a" };

function zaman(ts: number) {
  return new Date(ts).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function sureMetni(ms: number) {
  const g = Math.floor(ms / 86400000);
  if (g > 0) return `${g} gün önce`;
  const s = Math.floor(ms / 3600000);
  if (s > 0) return `${s} saat önce`;
  const d = Math.floor(ms / 60000);
  return `${Math.max(1, d)} dk önce`;
}

export function IpDetayIstemci({
  ip,
  rep,
  ozet,
  events,
  yollar,
  saatler,
  kararlar,
  botlar,
  gunlukTrend,
  gunEtiketleri,
}: {
  ip: string;
  rep: { country: string; asn: string; threatScore: number; category: string; requests: number; blocked: number; firstSeen: number; lastSeen: number } | null;
  ozet: Ozet;
  events: Ev[];
  yollar: [string, number][];
  saatler: number[];
  kararlar: [string, number][];
  botlar: [string, number][];
  gunlukTrend: number[];
  gunEtiketleri: string[];
}) {
  const { goster } = useToast();
  const router = useRouter();
  const [engellendi, setEngellendi] = useState(false);

  const threat = rep?.threatScore ?? 0;
  const kategori = rep?.category ?? "suspicious";
  const country = rep?.country ?? "—";
  const asn = rep?.asn ?? "Bilinmeyen ASN";
  const vpnMi = asn.includes("VPN") || kategori === "vpn" || kategori === "tor";

  const maxSaat = Math.max(...saatler, 1);
  const maxYol = Math.max(...yollar.map((y) => y[1]), 1);
  const toplamOlay = events.length;

  const donutKararlar = useMemo(
    () => kararlar.map(([k, v]) => ({ etiket: VERDICT_ETIKET[k] || k, deger: v, renk: VERDICT_RENK[k] || "#8b8fa3" })),
    [kararlar],
  );
  const maxBot = Math.max(...botlar.map((b) => b[1]), 1);
  const toplamBot = botlar.reduce((a, b) => a + b[1], 0) || 1;

  function engelle() {
    setEngellendi(true);
    goster({ tip: "basari", baslik: "IP engellendi", aciklama: `${ip} tüm sitelerde engelleme listesine alındı.` });
  }
  function kuralOlustur() {
    goster({ tip: "bilgi", baslik: "Kural taslağı hazırlanıyor", aciklama: `${ip} için engelleme kuralı açılıyor…` });
    router.push(`/panel/kurallar?ip=${encodeURIComponent(ip)}`);
  }
  function disaAktar() {
    exportCsv(
      `specter-ip-${ip}.csv`,
      events.map((e) => ({
        zaman: new Date(e.ts).toISOString(),
        yol: e.path,
        karar: e.verdict,
        bot_sinifi: e.botClass,
        skor: e.score.toFixed(2),
        yanit_ms: e.latency,
        kurallar: e.triggeredRules.join(" | "),
      })),
    );
  }

  const kolonlar: Kolon<Ev>[] = [
    { baslik: "Zaman", render: (e) => <span className="num whitespace-nowrap text-[12.5px] text-slate-muted">{zaman(e.ts)}</span> },
    { baslik: "Yol", render: (e) => <span className="font-mono text-[12.5px] text-slate-ink">{e.path}</span> },
    { baslik: "Bot sınıfı", render: (e) => (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-ink">
        <span className="size-2 rounded-full" style={{ background: BOT_RENK[e.botClass] || "#8b8fa3" }} />
        {BOT_ETIKET[e.botClass] || e.botClass}
      </span>
    ) },
    { baslik: "Karar", render: (e) => <Badge ton={e.verdict === "blocked" ? "kirmizi" : e.verdict === "allowed" ? "yesil" : e.verdict === "flagged" ? "mavi" : "sari"}>{VERDICT_ETIKET[e.verdict] || e.verdict}</Badge> },
    { baslik: "Skor", render: (e) => <span className={cn("num text-[13px] font-semibold", e.score < 0.3 ? "text-danger2" : e.score < 0.6 ? "text-warn" : "text-ok")}>{e.score.toFixed(2)}</span> },
    { baslik: "Yanıt", render: (e) => <span className="num text-[12.5px] text-slate-muted">{e.latency} ms</span>, className: "text-right" },
  ];

  const threatRenk = threat > 70 ? "#dc2626" : threat > 40 ? "#d97706" : "#16a34a";
  const threatEtiket = threat > 70 ? "Yüksek risk" : threat > 40 ? "Orta risk" : "Düşük risk";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-6 pt-6 pb-10 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/panel/tehdit" className="inline-flex items-center gap-1.5 text-[13px] text-slate-muted transition hover:text-slate-ink">
          <ArrowLeft className="size-3.5" /> Tehdit İstihbaratı
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={disaAktar}><Download className="size-4" /> Dışa aktar</Button>
          <Button variant="outline" size="sm" onClick={kuralOlustur}><GitBranch className="size-4" /> Kural oluştur</Button>
          <Button variant="danger" size="sm" onClick={engelle} disabled={engellendi}>
            <Ban className="size-4" /> {engellendi ? "Engellendi" : "IP'yi engelle"}
          </Button>
        </div>
      </div>

      {/* Kimlik başlığı */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn("grid size-11 place-items-center rounded-2xl", threat > 70 ? "bg-danger-soft text-danger2" : threat > 40 ? "bg-warn-soft text-warn" : "bg-brand-50 text-brand-600")}>
          <Server className="size-5" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="num text-lg font-bold tracking-tight text-slate-ink">{ip}</span>
            <Badge ton={kategori === "malicious" || kategori === "tor" ? "kirmizi" : kategori === "vpn" || kategori === "suspicious" ? "sari" : kategori === "datacenter" ? "mavi" : "gri"}>
              {KAT_ETIKET[kategori] || kategori}
            </Badge>
            {vpnMi && <Badge ton="sari"><ShieldAlert className="size-3" /> Anonimleştirme</Badge>}
            {engellendi && <Badge ton="kirmizi"><Ban className="size-3" /> Engelli</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-slate-muted">
            <Ulke kod={country} />
            <span className="flex items-center gap-1 text-slate-faint"><Server className="size-3.5" /> {asn}</span>
          </div>
        </div>
      </div>

      {/* Özet şeridi: tehdit ölçer + KPI'lar */}
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <Panel>
          <div className="flex flex-col items-center">
            <ThreatOlcer skor={threat} renk={threatRenk} etiket={threatEtiket} />
            <p className="mt-3 text-center text-[13px] text-slate-muted">
              Bu kaynağın davranışı ve itibarı temel alınarak hesaplanan tehdit skoru.
            </p>
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatKart sayi={ozet.toplamIstek.toLocaleString("tr-TR")} etiket="Toplam istek" ikon={<Activity className="size-5" />} />
          <StatKart sayi={ozet.engellenen.toLocaleString("tr-TR")} etiket="Engellenen" tone="danger" ikon={<Ban className="size-5" />} />
          <StatKart sayi={ozet.dogrulama.toLocaleString("tr-TR")} etiket="Doğrulama / işaret" tone="warn" ikon={<ShieldAlert className="size-5" />} />
          <StatKart sayi={ozet.izin.toLocaleString("tr-TR")} etiket="İzin verilen" tone="ok" ikon={<ShieldCheck className="size-5" />} />
          <MiniKart baslik="İlk görülme" deger={zaman(ozet.firstSeen)} altmetin={sureMetni(Date.now() - ozet.firstSeen)} ikon={<Clock className="size-4" />} />
          <MiniKart baslik="Son görülme" deger={zaman(ozet.lastSeen)} altmetin={sureMetni(Date.now() - ozet.lastSeen)} ikon={<Clock className="size-4" />} />
        </div>
      </div>

      {/* İstek trendi + karar dağılımı */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel baslik="İstek trendi (14 gün)" className="lg:col-span-2">
          <TrendGrafik noktalar={gunlukTrend} etiketler={gunEtiketleri} renk="#dc2626" gradId="ipTrend" yukseklik={200} />
        </Panel>
        <Panel baslik="Karar dağılımı">
          {toplamOlay > 0 ? (
            <DonutDagilim segmentler={donutKararlar} />
          ) : (
            <div className="grid h-40 place-items-center text-[13px] text-slate-faint">Henüz veri yok</div>
          )}
        </Panel>
      </div>

      {/* Aktivite saatleri + hedeflenen yollar */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel baslik="Aktivite saatleri (0-23)">
          <div className="flex h-40 items-end gap-1">
            {saatler.map((s, i) => (
              <div key={i} className="group relative flex flex-1 flex-col justify-end">
                <motion.div
                  className="w-full rounded-t-[3px] bg-brand-500/70 transition group-hover:bg-brand-600"
                  initial={{ height: 0 }}
                  animate={{ height: `${(s / maxSaat) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.012, ease: [0.16, 1, 0.3, 1] }}
                  style={{ minHeight: s > 0 ? 3 : 0 }}
                />
                {s > 0 && (
                  <div className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink-900 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                    {String(i).padStart(2, "0")}:00 · {s}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-faint"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
        </Panel>

        <Panel baslik="Hedeflenen yollar">
          {yollar.length > 0 ? (
            <div className="space-y-3">
              {yollar.map(([yol, sayi]) => (
                <div key={yol}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-mono text-slate-ink">{yol}</span>
                    <span className="num font-semibold text-slate-muted">{sayi.toLocaleString("tr-TR")}</span>
                  </div>
                  <Ilerleme deger={(sayi / maxYol) * 100} ton="brand" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid h-40 place-items-center text-[13px] text-slate-faint">Henüz veri yok</div>
          )}
        </Panel>
      </div>

      {/* Bot sınıfı dağılımı */}
      <Panel baslik="Bot sınıfı dağılımı">
        {botlar.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {botlar.map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-[13px] font-medium text-slate-ink">{BOT_ETIKET[k] || k}</span>
                <div className="h-6 flex-1 overflow-hidden rounded-md bg-canvas">
                  <motion.div
                    className="h-full rounded-md"
                    style={{ background: BOT_RENK[k] || "#8b8fa3" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(v / maxBot) * 100}%` }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="num w-24 shrink-0 text-right text-[13px] text-slate-muted">
                  {v.toLocaleString("tr-TR")} <span className="text-slate-faint">· %{Math.round((v / toplamBot) * 100)}</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid h-24 place-items-center text-[13px] text-slate-faint">Henüz veri yok</div>
        )}
      </Panel>

      {/* Cihaz parmak izi özeti */}
      <TehditBeslemeOzet ip={ip} asn={rep?.asn ?? ""} />

      <FingerprintOzet ip={ip} events={events} />

      {/* Olay geçmişi tablosu */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-slate-ink">Olay geçmişi</h2>
          <span className="text-[13px] text-slate-muted">{toplamOlay.toLocaleString("tr-TR")} olay kaydı</span>
        </div>
        {toplamOlay > 0 ? (
          <Tablo
            kolonlar={kolonlar}
            veri={events}
            sayfaBoyu={15}
            ara={(e) => `${e.path} ${e.botClass} ${e.verdict} ${e.ua}`}
            araPlaceholder="Yol, bot sınıfı, karar veya UA ara…"
            bosMesaj="Eşleşen olay yok."
          />
        ) : (
          <BosDurum
            ikon={<Bot className="size-7" />}
            baslik="Bu IP için olay kaydı yok"
            aciklama="Bu IP itibar veritabanında listelenmiş ancak sitelerinizde henüz bir istek üretmemiş."
          />
        )}
      </div>
    </div>
  );
}

/* Tehdit ölçer — donut, threat semantiği (yüksek = kötü, kırmızı). */
function ThreatOlcer({ skor, renk, etiket }: { skor: number; renk: string; etiket: string }) {
  const r = 42;
  const cevre = 2 * Math.PI * r;
  const dolu = (Math.max(0, Math.min(100, skor)) / 100) * cevre;
  return (
    <div className="relative grid size-44 place-items-center">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e7e9ef" strokeWidth="7" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none" stroke={renk} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={cevre}
          initial={{ strokeDashoffset: cevre }}
          animate={{ strokeDashoffset: cevre - dolu }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-slate-ink num">{skor}</span>
        <span className="text-[11px] text-slate-faint">/ 100 tehdit</span>
        <span className="mt-1 text-xs font-semibold" style={{ color: renk }}>{etiket}</span>
      </div>
    </div>
  );
}

function MiniKart({ baslik, deger, altmetin, ikon }: { baslik: string; deger: string; altmetin?: string; ikon?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-center gap-1.5 text-[12px] text-slate-muted">{ikon}{baslik}</div>
      <div className="mt-1.5 text-[15px] font-semibold text-slate-ink">{deger}</div>
      {altmetin && <div className="mt-0.5 text-[12px] text-slate-faint">{altmetin}</div>}
    </div>
  );
}

/** Bu IP'nin baskın cihaz parmak izi profili — olaylarındaki UA'lardan türetilir. */
/** Bu IP'nin bilinen tehdit beslemelerinde (Tor/bulletproof/botnet) olup olmadığı. */
function TehditBeslemeOzet({ ip, asn }: { ip: string; asn: string }) {
  const eslesme = useMemo(() => tehditBeslemeEslestir(ip, asn), [ip, asn]);
  if (!eslesme.eslesti) {
    return (
      <Panel>
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-ok-soft text-ok"><Radio className="size-5" /></span>
          <div>
            <div className="text-[14px] font-semibold text-slate-ink">Tehdit beslemesinde temiz</div>
            <div className="text-[13px] text-slate-muted">Bu IP bilinen kötü altyapı listelerinde (Tor / bulletproof / botnet) görünmüyor.</div>
          </div>
        </div>
      </Panel>
    );
  }
  return (
    <Panel>
      <div className="mb-3 flex items-center gap-2">
        <Radio className="size-5 text-danger2" />
        <h2 className="text-[15px] font-semibold text-slate-ink">Tehdit beslemesi eşleşmesi</h2>
        <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold text-danger2">%{Math.round(eslesme.maxGuven * 100)} güven</span>
      </div>
      <p className="mb-3 text-[13px] text-slate-muted">Bu IP, gerçek-zaman tehdit istihbarat beslemelerinde şu kategorilerde tanımlı:</p>
      <div className="flex flex-wrap gap-2">
        {eslesme.kaynaklar.map((k) => (
          <span key={k.kaynak} className="inline-flex items-center gap-1.5 rounded-xl border border-danger-soft bg-danger-soft/40 px-3 py-2 text-[13px] font-medium text-danger2">
            <Radio className="size-3.5" /> {k.ad}
            <span className="text-[11px] opacity-70">%{Math.round(k.guven * 100)}</span>
          </span>
        ))}
      </div>
    </Panel>
  );
}

function FingerprintOzet({ ip, events }: { ip: string; events: Ev[] }) {
  const analiz = useMemo(() => {
    if (!events.length) return null;
    // En sık görülen UA'yı bul, ondan profil türet.
    const uaSay: Record<string, number> = {};
    for (const e of events) uaSay[e.ua] = (uaSay[e.ua] || 0) + 1;
    const baskinUa = Object.entries(uaSay).sort((a, b) => b[1] - a[1])[0][0];
    const fp = fingerprintUret(baskinUa, events[0].botClass, ip);
    // Bu IP'de headless/tool sinyali taşıyan olay oranı
    const otomasyonOran = Math.round(
      (events.filter((e) => fingerprintUret(e.ua, e.botClass, ip).headless || fingerprintUret(e.ua, e.botClass, ip).tlsUaUyumsuz).length / events.length) * 100,
    );
    const benzersizUa = Object.keys(uaSay).length;
    return { fp, baskinUa, otomasyonOran, benzersizUa };
  }, [events, ip]);

  if (!analiz) return null;
  const { fp, otomasyonOran, benzersizUa } = analiz;
  const anomaliYuzde = Math.round(fp.headerAnomali * 100);

  return (
    <Panel>
      <div className="mb-4 flex items-center gap-2">
        <Fingerprint className="size-5 text-brand-600" />
        <h2 className="text-[15px] font-semibold text-slate-ink">Cihaz parmak izi istihbaratı</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FpMini etiket="Baskın motor" deger={fp.engine} />
        <FpMini etiket="HTTP sürümü" deger={fp.httpVersion} />
        <FpMini etiket="Otomasyon oranı" deger={`%${otomasyonOran}`} ton={otomasyonOran >= 50 ? "danger" : otomasyonOran >= 20 ? "warn" : "ok"} />
        <FpMini etiket="Benzersiz UA" deger={String(benzersizUa)} ton={benzersizUa > 3 ? "warn" : undefined} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-canvas/50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-faint">JA3 / JA4</div>
          <div className="mt-1 truncate font-mono text-[12px] text-slate-ink">{fp.ja3}</div>
          <div className="truncate font-mono text-[11px] text-slate-muted">{fp.ja4}</div>
        </div>
        <div className="rounded-2xl border border-line bg-canvas/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-slate-faint">Header anomali skoru</span>
            <span className={cn("num text-[13px] font-bold", anomaliYuzde >= 50 ? "text-danger2" : anomaliYuzde >= 25 ? "text-warn" : "text-ok")}>%{anomaliYuzde}</span>
          </div>
          <div className="mt-2"><Ilerleme deger={anomaliYuzde} ton={anomaliYuzde >= 50 ? "danger" : anomaliYuzde >= 25 ? "warn" : "ok"} /></div>
        </div>
      </div>
      {/* baskın sinyaller */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {fp.headless && <span className="rounded-md bg-danger-soft px-2 py-1 text-[11px] font-semibold text-danger2">Headless imza</span>}
        {fp.tlsUaUyumsuz && <span className="rounded-md bg-danger-soft px-2 py-1 text-[11px] font-semibold text-danger2">TLS/UA uyumsuz</span>}
        {fp.automationFlags.map((f) => <span key={f} className="rounded-md bg-warn-soft px-2 py-1 font-mono text-[11px] font-medium text-amber-700">{f}</span>)}
        {fp.sinyaller.slice(0, 2).map((s, i) => <span key={i} className="rounded-md bg-canvas px-2 py-1 text-[11px] text-slate-muted">{s}</span>)}
      </div>
    </Panel>
  );
}

function FpMini({ etiket, deger, ton }: { etiket: string; deger: string; ton?: "danger" | "warn" | "ok" }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas/50 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-slate-faint">{etiket}</div>
      <div className={cn("mt-0.5 text-[14px] font-bold", ton === "danger" ? "text-danger2" : ton === "warn" ? "text-warn" : ton === "ok" ? "text-ok" : "text-slate-ink")}>{deger}</div>
    </div>
  );
}
