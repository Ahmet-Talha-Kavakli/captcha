"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === "sign-up";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
    const body = isSignUp ? { name, email, password } : { email, password };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      router.push(params.get("next") || "/panel");
      router.refresh();
    } else {
      setError(data.error || "Bir hata oluştu.");
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8 flex justify-center">
        <Logo size={32} />
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white p-7 shadow-[0_8px_40px_-12px_rgba(11,17,32,0.12)]">
        <div className="mb-6 text-center">
          <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">
            {isSignUp ? "Veylify'a katılın" : "Tekrar hoş geldiniz"}
          </h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {isSignUp ? "Sitenizi AI botlarından korumaya başlayın" : "Panele erişmek için giriş yapın"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-700">Ad Soyad</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ada Lovelace"
                className="h-[42px] w-full rounded-lg border border-ink-200 bg-white px-3.5 text-sm outline-none transition focus:border-specter-500 focus:ring-2 focus:ring-specter-500/20"
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-700">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="siz@sirket.com"
              className="h-[42px] w-full rounded-lg border border-ink-200 bg-white px-3.5 text-sm outline-none transition focus:border-specter-500 focus:ring-2 focus:ring-specter-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-700">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="h-[42px] w-full rounded-lg border border-ink-200 bg-white px-3.5 text-sm outline-none transition focus:border-specter-500 focus:ring-2 focus:ring-specter-500/20"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-3 py-2 text-[13px] text-danger-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-specter-500 text-[15px] font-semibold text-[#04222b] transition hover:bg-specter-600 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignUp ? "Hesap oluştur" : "Giriş yap"}
          </button>
        </form>

        {!isSignUp && (
          <div className="mt-4 rounded-lg border border-specter-500/20 bg-specter-50/50 px-3 py-2.5 text-center text-[12px] text-ink-600">
            Demo: <span className="font-mono font-medium">demo@veylify.com</span> ·{" "}
            <span className="font-mono font-medium">specter123</span>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-[13px] text-ink-500">
        {isSignUp ? "Zaten hesabın var mı? " : "Hesabın yok mu? "}
        <Link
          href={isSignUp ? "/giris" : "/kayit"}
          className="font-medium text-specter-600 hover:text-specter-700"
        >
          {isSignUp ? "Giriş yap" : "Kayıt ol"}
        </Link>
      </p>
    </div>
  );
}
