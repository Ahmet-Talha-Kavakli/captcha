/**
 * Specter — Doğrulama Orkestratörü
 * ---------------------------------
 * Bir çözüm denemesini (kullanıcı girdisi + davranış sinyalleri + token)
 * alır, çok katmanlı karar üretir:
 *
 *   1. Token bütünlüğü (HMAC) + süre.
 *   2. Girdi doğruluğu (ghost-font glyph substitution katmanı).
 *   3. Davranışsal insanlık skoru (vision-bot'a karşı ikinci katman).
 *
 * Sonuç, müşteri sunucusunun /siteverify ile teyit edeceği imzalı bir
 * "verification token" ya da ret sebebidir.
 */

import { deriveAnswer, normalizeInput } from "./challenge";
import {
  verifyToken,
  signVerification,
  type TokenPayload,
  type VerificationClaim,
} from "./crypto";
import { scoreBehavior, type BehaviorSignals } from "./behavior";
import { powDogrula } from "./proof-of-work";

export interface SolveAttempt {
  token: string;
  input: string;
  signals: BehaviorSignals;
}

export type VerifyOutcome =
  | {
      success: true;
      verification: string;
      score: number;
      payload: TokenPayload;
    }
  | {
      success: false;
      reason:
        | "malformed"
        | "bad_signature"
        | "expired"
        | "wrong_answer"
        | "low_behavior_score"
        | "honeypot"
        | "pow_failed";
      score?: number;
    };

export interface VerifyConfig {
  /** Davranış skoru bu eşiğin altındaysa reddet. */
  behaviorThreshold: number;
  /** verification token ömrü (ms). */
  verificationTtl: number;
}

export const DEFAULT_VERIFY_CONFIG: VerifyConfig = {
  behaviorThreshold: 0.35,
  verificationTtl: 2 * 60 * 1000,
};

/**
 * Ana doğrulama fonksiyonu. secret = müşterinin secret key'i
 * (challenge token'ı bununla imzalanmıştı).
 */
export function verifyAttempt(
  attempt: SolveAttempt,
  secret: string,
  now: number,
  config: VerifyConfig = DEFAULT_VERIFY_CONFIG,
): VerifyOutcome {
  // 1) Token
  const tok = verifyToken(attempt.token, secret, now);
  if (!tok.ok) {
    return { success: false, reason: tok.reason };
  }
  const payload = tok.payload;

  // 1b) Honeypot tuzağı: widget görünmez tuzak alan(lar)ı basar. İnsan asla
  // göremez/dolduramaz (aria-hidden + tabindex=-1); yalnızca DOM'u parse eden
  // botlar doldurur. Tetiklendiyse ghost-font cevabı doğru olsa bile ANINDA
  // reddet — sıfır-yanlış-pozitif, en güçlü bot kanıtı.
  if (attempt.signals.honeypotTetik === true) {
    return { success: false, reason: "honeypot", score: 0 };
  }

  // 1c) İşlem-Kanıtı (Proof-of-Work): token powBit istiyorsa (şüpheli IP için
  // challenge route eklemişti), istemci geçerli bir nonce+hash sunmalı. Çözüm
  // eksik/geçersizse reddet — bu, yüksek-hacim botun her istekte CPU ödemesini
  // zorunlu kılar. powBit yoksa (temiz IP / eski token) bu adım atlanır.
  if (payload.powBit && payload.powBit > 0) {
    const nonce = attempt.signals.powNonce;
    const hash = attempt.signals.powHashHex;
    // seed token'da İMZALI taşınır (istemci değiştiremez); istemci
    // SHA-256(`${seed}:${nonce}`) hesaplar, powDogrula aynısını yeniden üretip
    // eşleştirir — uydurma-hash bypass'ı kapalı.
    if (
      nonce === undefined ||
      !hash ||
      !powDogrula(payload.powBit, String(payload.seed), String(nonce), hash).gecerli
    ) {
      return { success: false, reason: "pow_failed", score: 0 };
    }
  }

  // 2) Ghost-font cevap kontrolü. Tür token'da taşınır; yoksa "kod" (geriye
  // uyum). "kod" için deriveAnswer BİREBİR eski davranıştadır.
  const expected = deriveAnswer(payload.seed, payload.len, payload.type ?? "kod");
  const given = normalizeInput(attempt.input);
  if (given !== expected) {
    return { success: false, reason: "wrong_answer" };
  }

  // 3) Davranışsal skor
  const behavior = scoreBehavior(attempt.signals);
  if (behavior.score < config.behaviorThreshold) {
    return {
      success: false,
      reason: "low_behavior_score",
      score: behavior.score,
    };
  }

  // Başarılı → imzalı verification token
  const claim: VerificationClaim = {
    cid: payload.cid,
    site: payload.site,
    success: true,
    iat: now,
    exp: now + config.verificationTtl,
    score: behavior.score,
  };
  const verification = signVerification(claim, secret);

  return { success: true, verification, score: behavior.score, payload };
}
