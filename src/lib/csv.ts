/** Basit CSV export — tarayıcıda dosya indirir. */
export function exportCsv(dosyaAdi: string, satirlar: Record<string, unknown>[]): void {
  if (!satirlar.length) return;
  const basliklar = Object.keys(satirlar[0]);
  const kacir = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    basliklar.join(","),
    ...satirlar.map((r) => basliklar.map((b) => kacir(r[b])).join(",")),
  ].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dosyaAdi;
  a.click();
  URL.revokeObjectURL(url);
}
