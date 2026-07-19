"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Durum = "bos" | "gonderiliyor" | "basari" | "hata";

export function IletisimForm() {
  const [ad, setAd] = useState("");
  const [eposta, setEposta] = useState("");
  const [konu, setKonu] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [durum, setDurum] = useState<Durum>("bos");
  const [bildirim, setBildirim] = useState("");
  const [referans, setReferans] = useState("");
  const [alanHatalari, setAlanHatalari] = useState<Record<string, string>>({});

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setDurum("gonderiliyor");
    setBildirim("");
    setAlanHatalari({});
    try {
      const res = await fetch("/api/iletisim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad, eposta, konu, mesaj }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setDurum("hata");
        setAlanHatalari(data.hatalar ?? {});
        setBildirim(data.error ?? "Mesaj gönderilemedi. Lütfen tekrar deneyin.");
        return;
      }
      setDurum("basari");
      setReferans(data.referans ?? "");
      setBildirim(data.mesaj ?? "Mesajınız alındı.");
      setAd("");
      setEposta("");
      setKonu("");
      setMesaj("");
    } catch {
      setDurum("hata");
      setBildirim("Sunucuya ulaşılamadı. Lütfen bağlantınızı kontrol edin.");
    }
  }

  if (durum === "basari") {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="size-7" />
        </span>
        <h3 className="mt-4 text-xl font-extrabold text-veylify-950">Teşekkürler!</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{bildirim}</p>
        {referans && (
          <p className="mt-3 inline-block rounded-lg bg-white px-3 py-1.5 text-[13px] font-mono text-veylify-700 ring-1 ring-emerald-100">
            Referans: {referans}
          </p>
        )}
        <button
          type="button"
          onClick={() => setDurum("bos")}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-veylify-200 bg-white px-6 py-2.5 text-[14px] font-semibold text-veylify-700 transition hover:border-veylify-300 hover:bg-veylify-50"
        >
          Yeni mesaj gönder
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={gonder} className="space-y-5">
      {durum === "hata" && bildirim && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/60 p-3.5 text-[14px] text-red-800">
          <AlertCircle className="mt-0.5 size-[18px] shrink-0 text-red-500" />
          <span>{bildirim}</span>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Alan
          etiket="Ad Soyad"
          hata={alanHatalari.ad}
        >
          <input
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            placeholder="Adınız Soyadınız"
            className="w-full rounded-xl border border-veylify-200 bg-white px-4 py-3 text-[15px] text-veylify-950 outline-none transition placeholder:text-slate-400 focus:border-veylify-400 focus:ring-2 focus:ring-veylify-100"
          />
        </Alan>
        <Alan etiket="E-posta" hata={alanHatalari.eposta}>
          <input
            type="email"
            value={eposta}
            onChange={(e) => setEposta(e.target.value)}
            placeholder="siz@sirket.com"
            className="w-full rounded-xl border border-veylify-200 bg-white px-4 py-3 text-[15px] text-veylify-950 outline-none transition placeholder:text-slate-400 focus:border-veylify-400 focus:ring-2 focus:ring-veylify-100"
          />
        </Alan>
      </div>

      <Alan etiket="Konu" hata={alanHatalari.konu}>
        <input
          value={konu}
          onChange={(e) => setKonu(e.target.value)}
          placeholder="Size nasıl yardımcı olabiliriz?"
          className="w-full rounded-xl border border-veylify-200 bg-white px-4 py-3 text-[15px] text-veylify-950 outline-none transition placeholder:text-slate-400 focus:border-veylify-400 focus:ring-2 focus:ring-veylify-100"
        />
      </Alan>

      <Alan etiket="Mesaj" hata={alanHatalari.mesaj}>
        <textarea
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
          rows={5}
          placeholder="Mesajınızı buraya yazın…"
          className="w-full resize-y rounded-xl border border-veylify-200 bg-white px-4 py-3 text-[15px] text-veylify-950 outline-none transition placeholder:text-slate-400 focus:border-veylify-400 focus:ring-2 focus:ring-veylify-100"
        />
      </Alan>

      <button
        type="submit"
        disabled={durum === "gonderiliyor"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-veylify-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_32px_-10px_rgba(79,70,229,0.65)] transition hover:-translate-y-0.5 hover:bg-veylify-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {durum === "gonderiliyor" ? (
          <>
            <Loader2 className="size-[18px] animate-spin" /> Gönderiliyor…
          </>
        ) : (
          <>
            Mesajı gönder <Send className="size-[18px]" />
          </>
        )}
      </button>
    </form>
  );
}

function Alan({
  etiket,
  hata,
  children,
}: {
  etiket: string;
  hata?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13.5px] font-semibold text-veylify-950">{etiket}</span>
      {children}
      {hata && <span className="mt-1 block text-[12.5px] text-red-600">{hata}</span>}
    </label>
  );
}
