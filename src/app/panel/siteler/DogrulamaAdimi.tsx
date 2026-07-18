"use client";

/**
 * DogrulamaAdimi — Alan adı sahiplik doğrulama arayüzü
 * =====================================================
 * 3 yöntem sunar (DNS TXT / HTML meta / .well-known dosyası). Her yöntem
 * kopyalanabilir koyu-zemin snippet gösterir. "Doğrula" butonu
 * /api/sites/verify'a gider ve gerçekten site durumunu değiştirir.
 *
 * Hem site ekleme sihirbazının 2. adımında hem de site detayındaki
 * "beklemede" durumunda yeniden kullanılır.
 */
import { useState } from "react";
import { Globe, Code2, FileText, Check, Copy, ShieldCheck } from "lucide-react";
import { NotKutusu, useToast } from "@/components/panel/kit";
import { Button } from "@/components/ui/Button";
import { sitelerCeviri } from "./siteler.i18n";
import type { Dil } from "@/lib/i18n/panel";
import { cn } from "@/lib/cn";

type Yontem = "dns" | "meta" | "file";

/** Yöntemler — enum key + ikon + i18n anahtarları. Değerler t() ile çözülür. */
const YONTEMLER: { key: Yontem; adKey: string; ikon: typeof Globe; ipucuKey: string }[] = [
  { key: "dns", adKey: "st.yontemDns", ikon: Globe, ipucuKey: "st.yontemDnsIpucu" },
  { key: "meta", adKey: "st.yontemMeta", ikon: Code2, ipucuKey: "st.yontemMetaIpucu" },
  { key: "file", adKey: "st.yontemFile", ikon: FileText, ipucuKey: "st.yontemFileIpucu" },
];

export function DogrulamaAdimi({
  site,
  onDogrulandi,
  onSonra,
  dil,
}: {
  site: { id: string; name: string; domains: string[]; verifyToken: string };
  onDogrulandi: () => void;
  onSonra?: () => void;
  /** Panel dili. Verilmezse TR'ye düşer (ör. henüz dil geçirilmeyen çağrı yerleri). */
  dil?: Dil;
}) {
  const t = (k: string) => sitelerCeviri(k, dil ?? "tr");
  const { goster } = useToast();
  const [yontem, setYontem] = useState<Yontem>("dns");
  const [busy, setBusy] = useState(false);
  const [durum, setDurum] = useState<string | null>(null);

  const domain = site.domains[0] || "example.com";
  const token = site.verifyToken; // "veylify-verify=xxxx"
  const deger = token.split("=")[1] ?? token;

  // Snippet'ler sunucunun ARADIĞIYLA birebir tutarlı olmalı; aksi halde
  // kullanıcı doğru talimatı uygulasa da doğrulama geçmez. Sunucu tarafı
  // (api/sites/verify): TXT → tam token; meta → token; dosya → veylify-verify.txt.
  const snippetler: Record<Yontem, string> = {
    dns: `${t("st.snippetTip")}:   TXT\n${t("st.snippetHost")}:  @  (${t("st.snippetHostAlt")} ${domain})\n${t("st.snippetDeger")}: ${token}`,
    meta: `<meta name="veylify-verify" content="${token}" />`,
    file: `# ${domain}/.well-known/veylify-verify.txt\n${token}`,
  };

  async function dogrula() {
    if (busy) return;
    setBusy(true);
    setDurum(null);
    try {
      const res = await fetch("/api/sites/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: site.id, method: yontem }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.verified) {
        onDogrulandi();
      } else {
        setDurum(data.message || t("st.durumVarsayilan"));
        goster({ tip: "hata", baslik: t("st.toastHenuzBaslik"), aciklama: t("st.toastHenuzAciklama") });
      }
    } catch {
      setDurum(t("st.durumVarsayilan"));
      goster({ tip: "hata", baslik: t("st.toastHenuzBaslik"), aciklama: t("st.toastHenuzAciklama") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <NotKutusu ton="bilgi" baslik={t("st.notSahiplikBaslik").replace("{domain}", domain)}>
        {t("st.notSahiplikMetin1")}{" "}
        <strong>{t("st.notSahiplikDogrula")}</strong>{t("st.notSahiplikMetin2")}
      </NotKutusu>

      {/* Yöntem seçici — Tavily pill grubu */}
      <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-canvas p-1.5">
        {YONTEMLER.map((y) => {
          const Icon = y.ikon;
          const aktif = yontem === y.key;
          return (
            <button
              key={y.key}
              onClick={() => { setYontem(y.key); setDurum(null); }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition",
                aktif ? "bg-surface text-brand-700 shadow-card" : "text-slate-muted hover:text-slate-ink",
              )}
            >
              <Icon className="size-4" /> {t(y.adKey)}
            </button>
          );
        })}
      </div>

      <p className="text-[13px] text-slate-muted">{t(YONTEMLER.find((y) => y.key === yontem)!.ipucuKey)}</p>

      <KodBlok baslik={t(etiketAnahtarFor(yontem))} code={snippetler[yontem]} goster={goster} t={t} />

      {durum && <NotKutusu ton="sari" baslik={t("st.durumBeklemedeBaslik")}>{durum}</NotKutusu>}

      <div className="flex items-center justify-between gap-2 pt-1">
        {onSonra ? (
          <Button variant="ghost" onClick={onSonra}>{t("st.sonraYaparim")}</Button>
        ) : (
          <span />
        )}
        <Button onClick={dogrula} disabled={busy}>
          {busy ? t("st.kontrolEdiliyor") : (<><ShieldCheck className="size-4" /> {t("st.dogrula")}</>)}
        </Button>
      </div>
    </div>
  );
}

function etiketAnahtarFor(y: Yontem): string {
  return y === "dns" ? "st.etiketTxt" : y === "meta" ? "st.etiketMeta" : "st.etiketFile";
}

/** Koyu zeminli, kopyalanabilir kod bloğu. */
function KodBlok({
  baslik,
  code,
  goster,
  t,
}: {
  baslik: string;
  code: string;
  goster: (t: { tip: "basari" | "hata" | "bilgi"; baslik: string }) => void;
  t: (k: string) => string;
}) {
  const [kopyalandi, setKopyalandi] = useState(false);
  function kopyala() {
    navigator.clipboard.writeText(code);
    setKopyalandi(true);
    goster({ tip: "basari", baslik: t("st.kopyalandi") });
    setTimeout(() => setKopyalandi(false), 1600);
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-line-strong bg-ink-950">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="text-[12px] font-medium text-slate-300">{baslik}</span>
        <button
          onClick={kopyala}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          {kopyalandi ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
          {kopyalandi ? t("st.kopyalandi") : t("st.kopyala")}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 text-[12.5px] leading-relaxed text-[#c7d5e2]">
        <code className="font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}
