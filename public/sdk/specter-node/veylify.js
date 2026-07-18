/**
 * @veylify/node — Official Veylify SDK for Node.js
 * ================================================
 * Server-side client for Veylify (AI-bot / ghost-font CAPTCHA protection).
 *
 * What it does:
 *   - siteverify(secret, token): confirm a widget verification token from your
 *     backend (the reCAPTCHA `/siteverify` equivalent).
 *   - verifyWebhook(body, header, secret): verify the HMAC-SHA256 signature of
 *     an inbound Veylify webhook (`X-Veylify-Signature: t=<ts>,v1=<hmac>`).
 *   - express() / nextHandler(): drop-in middleware helpers.
 *
 * Zero runtime dependencies — uses Node's built-in `crypto` and global `fetch`
 * (Node 18+). Works in CommonJS and ESM (see package.json "exports").
 *
 * Back-compat: `SpecterClient` / `SpecterError` are exported as aliases of
 * `VeylifyClient` / `VeylifyError` so existing integrations keep working.
 */

"use strict";

const crypto = require("node:crypto");

const DEFAULT_BASE_URL = "https://api.veylify.com";

/**
 * @typedef {Object} SiteverifyResult
 * @property {boolean} success                  Whether the token is valid.
 * @property {string}  [challenge_ts]           ISO-8601 timestamp of the challenge.
 * @property {string}  [hostname]               Site name the token was issued for.
 * @property {number}  [score]                  Behavioral score (0..1).
 * @property {string}  [cid]                    Challenge id.
 * @property {string[]} [error_codes]           Error codes when success === false.
 *                                              Mirrors the raw `error-codes` field.
 */

class VeylifyError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "VeylifyError";
    this.code = code || "veylify_error";
  }
}

class VeylifyClient {
  /**
   * @param {Object} [options]
   * @param {string} [options.secret]   Default secret key (sk_live_… / sk_test_…).
   * @param {string} [options.baseUrl]  Override the API origin. Default https://api.veylify.com
   * @param {number} [options.timeout]  Request timeout in ms. Default 8000.
   * @param {typeof fetch} [options.fetch]  Custom fetch implementation (tests).
   */
  constructor(options = {}) {
    this.secret =
      options.secret ||
      process.env.VEYLIFY_SECRET_KEY ||
      process.env.SPECTER_SECRET_KEY ||
      "";
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeout = options.timeout || 8000;
    this._fetch = options.fetch || globalThis.fetch;
    if (typeof this._fetch !== "function") {
      throw new VeylifyError(
        "No fetch implementation found. Use Node 18+ or pass options.fetch.",
        "no_fetch",
      );
    }
  }

  /**
   * Verify a widget verification token against the Veylify API.
   * Calls POST /api/v1/siteverify.
   *
   * @param {string} secret    Secret key. If omitted, uses the client default.
   * @param {string} response  The verification token returned by the widget.
   * @returns {Promise<SiteverifyResult>}
   */
  async siteverify(secret, response) {
    // Allow siteverify(response) when a default secret is configured.
    if (response === undefined && this.secret) {
      response = secret;
      secret = this.secret;
    }
    if (!secret) throw new VeylifyError("Missing secret key", "missing-secret");
    if (!response) throw new VeylifyError("Missing response token", "missing-input");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    let res;
    try {
      res = await this._fetch(`${this.baseUrl}/api/v1/siteverify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response }),
        signal: controller.signal,
      });
    } catch (err) {
      throw new VeylifyError(`Network error: ${err.message}`, "network-error");
    } finally {
      clearTimeout(timer);
    }

    const data = await res.json().catch(() => ({}));
    // Normalize the hyphenated `error-codes` field to a JS-friendly alias.
    if (data && data["error-codes"]) data.error_codes = data["error-codes"];
    return data;
  }

  /**
   * Verify the signature of an inbound Veylify webhook.
   * Header format (Stripe-style): `t=<unix-seconds>,v1=<hmac-sha256-hex>`
   * where hmac = HMAC_SHA256(`${t}.${rawBody}`, webhookSecret).
   *
   * IMPORTANT: `body` must be the RAW request body string (not a re-serialized
   * object) so the bytes match exactly what Veylify signed.
   *
   * @param {string} body       Raw request body (string or Buffer).
   * @param {string} header     Value of the `X-Veylify-Signature` header.
   * @param {string} secret     Webhook signing secret (from your dashboard).
   * @param {Object} [opts]
   * @param {number} [opts.toleranceSeconds]  Max clock skew. Default 300.
   * @returns {boolean}  true if the signature is valid and fresh.
   */
  verifyWebhook(body, header, secret, opts = {}) {
    return VeylifyClient.verifyWebhook(body, header, secret, opts);
  }

  /** Static form — usable without instantiating a client. */
  static verifyWebhook(body, header, secret, opts = {}) {
    const toleranceSeconds = opts.toleranceSeconds ?? 300;
    if (!header || !secret) return false;

    const raw = Buffer.isBuffer(body) ? body.toString("utf8") : String(body);
    const parts = Object.fromEntries(
      header.split(",").map((p) => {
        const idx = p.indexOf("=");
        return [p.slice(0, idx).trim(), p.slice(idx + 1).trim()];
      }),
    );
    const ts = Number(parts.t);
    const v1 = parts.v1;
    if (!ts || !v1) return false;

    // Reject stale/future timestamps (replay protection).
    if (Math.abs(Date.now() / 1000 - ts) > toleranceSeconds) return false;

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${ts}.${raw}`)
      .digest("hex");

    const a = Buffer.from(v1, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  /**
   * Parse + verify a webhook and return its decoded event, or throw.
   * @returns {{type:string,id:string,created:number,data:object}}
   */
  constructEvent(body, header, secret, opts = {}) {
    const ok = this.verifyWebhook(body, header, secret, opts);
    if (!ok) throw new VeylifyError("Invalid webhook signature", "invalid-signature");
    const raw = Buffer.isBuffer(body) ? body.toString("utf8") : String(body);
    return JSON.parse(raw);
  }

  /**
   * Express middleware. Reads the token from `req.body[field]` (or query),
   * verifies it, and attaches `req.veylify` (the SiteverifyResult). On failure
   * responds 403 unless `onFail` is provided.
   *
   * For back-compat the result is also attached as `req.specter`.
   *
   * Usage:
   *   app.post("/signup", veylify.express(), handler)
   *
   * @param {Object} [opts]
   * @param {string} [opts.field]   Body field holding the token. Default "veylify-token".
   * @param {string} [opts.secret]  Secret override.
   * @param {number} [opts.minScore] Reject if score below this (0..1).
   * @param {(req,res)=>void} [opts.onFail]  Custom failure handler.
   */
  express(opts = {}) {
    const field = opts.field || "veylify-token";
    const secret = opts.secret || this.secret;
    return async (req, res, next) => {
      try {
        const token =
          (req.body && req.body[field]) ||
          (req.query && req.query[field]) ||
          "";
        const result = await this.siteverify(secret, token);
        req.veylify = result;
        req.specter = result; // back-compat alias
        const scoreOk =
          opts.minScore == null || (result.score ?? 0) >= opts.minScore;
        if (result.success && scoreOk) return next();
        if (opts.onFail) return opts.onFail(req, res);
        return res.status(403).json({
          error: "veylify_verification_failed",
          codes: result.error_codes || [],
        });
      } catch (err) {
        if (opts.onFail) return opts.onFail(req, res, err);
        return res.status(403).json({ error: "veylify_verification_failed" });
      }
    };
  }
}

// Back-compat aliases — old class names keep working.
const SpecterClient = VeylifyClient;
const SpecterError = VeylifyError;

module.exports = {
  VeylifyClient,
  VeylifyError,
  SpecterClient,
  SpecterError,
  DEFAULT_BASE_URL,
};
module.exports.default = VeylifyClient;
