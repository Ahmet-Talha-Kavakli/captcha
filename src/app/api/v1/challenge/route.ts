/**
 * POST /api/v1/challenge
 * -----------------------
 * Widget'ın çağırdığı public uç. Bir site key alır, o site için yeni
 * bir ghost-font challenge üretir ve tarayıcıya GÜVENLİ alt kümeyi
 * (seed + imzalı token) döndürür. Cevap ASLA gönderilmez.
 */

import { NextResponse } from "next/server";
import { Sites, Users, Usage } from "@/lib/db/db";
import { rateLimit } from "@/lib/db/rate";
import {
  createChallenge,
  adaptiveDifficulty,
  CHALLENGE_TYPES,
  type ChallengeType,
} from "@/lib/specter/challenge";
import { signToken, secureSeed, randomNonce, type TokenPayload } from "@/lib/specter/crypto";
import { powZorluk, TABAN_ZORLUK_BIT } from "@/lib/specter/proof-of-work";
import { kotaDurumu } from "@/lib/specter/plans";
import { extractMeta } from "@/lib/specter/request-meta";
import { IpRep } from "@/lib/db/db";

const CHALLENGE_TTL_MS = 2 * 60 * 1000;

function cors(origin: string | null, allowed: string[]): Record<string, string> {
  // Widget cross-origin çağırır; izinli origin ise yansıt.
  const ok =
    origin &&
    (allowed.includes("*") ||
      allowed.some((d) => origin === `https://${d}` || origin === `http://${d}` || origin.includes(d)));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: cors(req.headers.get("origin"), ["*"]),
  });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const body = await req.json().catch(() => ({}));
  const siteKey: string | undefined = body.siteKey;

  if (!siteKey) {
    return NextResponse.json({ error: "siteKey gerekli" }, { status: 400 });
  }

  const site = Sites.bySiteKey(siteKey);
  if (!site || !site.active) {
    return NextResponse.json(
      { error: "Geçersiz veya pasif site anahtarı" },
      { status: 403 },
    );
  }

  const headers = cors(origin, site.domains);

  // Rate limit: site başına dakikada 120 challenge.
  const rl = rateLimit(`chal:${site.id}`, 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Çok fazla istek, biraz bekleyin" },
      { status: 429, headers },
    );
  }

  // Aylık kota zorlaması: plan limitini kontrol et. Ücretsiz planda aşımda
  // reddedilir (429 quota_exceeded) — AMA kullanıcı kredi yüklediyse aşımı
  // krediyle karşılar (kota dolsa bile koruma sürer). Ücretli planda overage.
  const sahip = Users.byId(site.ownerId);
  const durum = kotaDurumu(Usage.aylikIssued(site.ownerId), sahip?.plan ?? "free");
  let krediKullanildi = false;
  if (durum.asildi && durum.asimDavranisi === "block") {
    // Kredi ile karşılamayı dene (1 kredi = 1 doğrulama).
    const krediSonuc = Users.krediHareket(site.ownerId, "tuketim", -1, "Kota aşımı — ek doğrulama");
    if (krediSonuc) {
      krediKullanildi = true;
    } else {
      return NextResponse.json(
        {
          error: "Aylık doğrulama kotası doldu",
          code: "quota_exceeded",
          used: durum.kullanilan,
          limit: durum.kota,
          hint: "Planı yükseltin veya kredi yükleyin.",
        },
        { status: 429, headers: { ...headers, "X-Veylify-Quota": "exceeded" } },
      );
    }
  }

  // Kullanımı say (gerçek ölçüm — panel/fatura bu sayaçtan beslenir).
  Usage.increment(site.id, "issued", 1);

  const now = Date.now();
  const seed = secureSeed();
  const nonce = randomNonce();
  const cid = "cid_" + randomNonce(9);

  // Adaptif zorluk: bu IP'nin itibarına göre challenge zorluğunu otomatik
  // ayarla. Kötü ün IP → daha zor challenge (bot için); temiz IP → site
  // varsayılanı. deriveAnswer/render mantığına dokunmaz, sadece profil seçer.
  const meta = extractMeta(req);
  const ipItibar = IpRep.byIp(meta.ip);
  const zorluk = adaptiveDifficulty(site.difficulty, {
    ipReputation: ipItibar ? Math.max(0, 1 - ipItibar.threatScore / 100) : undefined,
  });

  // İşlem-Kanıtı (Proof-of-Work) adaptif zorluk: kötü ün IP → daha çok CPU
  // maliyeti (yüksek-hacim bot saldırısını ekonomik olarak caydırır), temiz
  // IP → taban (insana ~görünmez). botOlasilik = IP tehdit skoru.
  const botOlasilik = ipItibar ? Math.min(1, ipItibar.threatScore / 100) : 0;
  const pow = powZorluk(botOlasilik);
  const powBit = pow.hedefBit;

  // Challenge türü seçimi. Site "challengeType" belirlememişse "kod"
  // (mevcut davranış). "rotasyon" seçiliyse seed'den deterministik olarak
  // türler arasında döner. Adaptif zorluk/kota mantığına DOKUNULMAZ.
  const siteType = site.challengeType ?? "kod";
  let type: ChallengeType;
  if (siteType === "rotasyon") {
    type = CHALLENGE_TYPES[seed % CHALLENGE_TYPES.length];
  } else {
    type = siteType;
  }

  const challenge = createChallenge({
    id: cid,
    seed,
    difficulty: zorluk,
    type,
    now,
  });

  const payload: TokenPayload = {
    cid,
    seed,
    len: challenge.params.length,
    // Tür yalnızca "kod" değilse token'a eklenir → mevcut kod-token'ları
    // ve testleri BİREBİR aynı kalır (geriye uyum).
    ...(type !== "kod" && { type }),
    site: site.siteKey,
    iat: now,
    exp: now + CHALLENGE_TTL_MS,
    nonce,
    // PoW yalnızca taban üstünde bir zorluk varsa token'a eklenir → mevcut
    // "kod" token'ları ve testler (temiz IP, taban bit) BİREBİR aynı kalır.
    ...(powBit > TABAN_ZORLUK_BIT && { powBit }),
  };
  const token = signToken(payload, site.secretKey);

  return NextResponse.json(
    {
      id: cid,
      params: challenge.params, // seed + length + difficulty (render için)
      token,
      // Widget'ın PoW çözebilmesi için hedef bit + challenge seed'i (nonce arama).
      ...(powBit > TABAN_ZORLUK_BIT && { pow: { hedefBit: powBit, seed } }),
      ttl: Math.floor(CHALLENGE_TTL_MS / 1000),
      invisibleMode: site.invisibleMode,
      ...(durum.uyari && { quotaWarning: { used: durum.kullanilan, limit: durum.kota, overage: durum.asildi } }),
    },
    { headers: durum.uyari ? { ...headers, "X-Veylify-Quota": durum.asildi ? "overage" : "warning" } : headers },
  );
}
