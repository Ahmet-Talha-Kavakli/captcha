"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { SpecterMark } from "@/components/ui/Logo";
import { MARKA } from "@/lib/marka";

/**
 * Mixfont tarzı auth ekranı — beyaz, ferah, tek kolon (kart değil).
 * Büyük başlık, siyah "Google ile devam et" butonu, "veya" ayıracı,
 * geniş e-posta/şifre inputları, tam-genişlik ana buton.
 *
 * AKIŞ KORUNUR: /api/auth/login ve /api/auth/register çağrılır,
 * başarıda ?next veya /panel'e yönlendirilir. Google butonu DEKORATİF:
 * gerçek OAuth yok, dürüstçe "yakında" uyarısı gösterir + e-postaya odaklanır.
 */
export function AuthMixfont({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleHint, setGoogleHint] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const isSignUp = mode === "sign-up";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");

    // İstemci-tarafı doğrulama — sunucuya gitmeden net Türkçe geri bildirim.
    if (isSignUp && name.trim().length < 2) {
      setError("Lütfen adınızı ve soyadınızı girin.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }
    if (isSignUp && password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (!password) {
      setError("Lütfen şifrenizi girin.");
      return;
    }

    setBusy(true);
    const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
    const body = isSignUp ? { name, email, password } : { email, password };
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(params.get("next") || "/panel");
        router.refresh();
      } else {
        setError(data.error || "Bir hata oluştu. Lütfen tekrar deneyin.");
        setBusy(false);
      }
    } catch {
      setError("Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.");
      setBusy(false);
    }
  }

  // Google butonu dekoratif: OAuth yok, dürüstçe bilgilendir + e-postaya odakla
  function handleGoogle() {
    setGoogleHint(true);
    emailRef.current?.focus();
  }

  return (
    <div className="w-full max-w-[440px]">
      {/* üst satır — logo yalnız MOBİLDE (lg'de sol panelde zaten büyük marka var,
          çift logo olmasın). Sağda giriş/kayıt geçişi. */}
      <div className="mb-14 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 lg:invisible">
          <SpecterMark size={26} />
          <span className="font-display text-[17px] font-extrabold tracking-tight text-ink-900">
            {MARKA.ad}
          </span>
        </Link>
        <Link
          href={isSignUp ? "/login" : "/signup"}
          className="text-[13.5px] font-medium text-ink-500 transition hover:text-ink-900"
        >
          {isSignUp ? "Giriş Yap" : "Kayıt Ol"}
        </Link>
      </div>

      {/* büyük başlık */}
      <div className="mb-8 text-center">
        <h1 className="text-[34px] font-bold leading-tight tracking-tight text-ink-900 sm:text-[38px]">
          {isSignUp ? "Kayıt Ol" : "Giriş Yap"}
        </h1>
        <p className="mt-2.5 text-[15px] text-ink-500">
          {isSignUp
            ? `${MARKA.ad} çalışma alanınızı oluşturun.`
            : `${MARKA.ad} çalışma alanınıza devam edin.`}
        </p>
      </div>

      {/* siyah Google butonu (dekoratif) */}
      <button
        type="button"
        onClick={handleGoogle}
        className="flex h-[52px] w-full items-center justify-center gap-3 rounded-full bg-ink-900 text-[15px] font-medium text-white transition hover:bg-ink-800 active:scale-[0.99]"
      >
        <GoogleIcon />
        Google ile {isSignUp ? "Kayıt Ol" : "Giriş Yap"}
      </button>

      {googleHint && (
        <p className="mt-2.5 text-center text-[12.5px] text-ink-500">
          Google girişi çok yakında. Şimdilik e-posta ile devam edin.
        </p>
      )}

      {/* veya ayıracı */}
      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-ink-200" />
        <span className="text-[12.5px] font-medium text-ink-400">veya</span>
        <span className="h-px flex-1 bg-ink-200" />
      </div>

      {/* e-posta formu */}
      <form onSubmit={submit} className="space-y-3.5">
        {isSignUp && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ad Soyad"
            autoComplete="name"
            className="h-[52px] w-full rounded-2xl border border-ink-200 bg-white px-4 text-[15px] text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5"
          />
        )}
        <input
          ref={emailRef}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="E-posta adresinizi girin"
          autoComplete="email"
          className="h-[52px] w-full rounded-2xl border border-ink-200 bg-white px-4 text-[15px] text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Şifrenizi girin"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className="h-[52px] w-full rounded-2xl border border-ink-200 bg-white px-4 text-[15px] text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5"
        />

        {error && (
          <div className="rounded-2xl border border-danger-500/25 bg-danger-50 px-4 py-3 text-[13.5px] text-danger-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink-900 text-[15px] font-semibold text-white transition hover:bg-ink-800 active:scale-[0.99] disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSignUp ? "E-posta ile devam et" : "Giriş yap"}
        </button>
      </form>

      {/* alt geçiş linki */}
      <p className="mt-8 text-center text-[14px] text-ink-500">
        {isSignUp ? "Zaten hesabın var mı? " : "Henüz hesabın yok mu? "}
        <Link
          href={isSignUp ? "/login" : "/signup"}
          className="font-medium text-ink-900 underline-offset-4 hover:underline"
        >
          {isSignUp ? "Giriş yap" : "Kayıt ol"}
        </Link>
      </p>

      {/* ince gri alt açıklama — mixfont sadeliği */}
      <p className="mx-auto mt-10 max-w-[360px] text-center text-[11.5px] leading-relaxed text-ink-400">
        Devam ederek {MARKA.ad} Hizmet Koşulları ve Gizlilik Politikası&apos;nı kabul
        etmiş olursunuz. Sitenizi AI botlarından ghost-font teknolojisiyle koruyun.
      </p>
    </div>
  );
}

/** Google G logosu — lucide'de yok, inline SVG (resmi renkler). */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
