// Type definitions for @veylify/node

export interface SiteverifyResult {
  /** Whether the verification token is valid. */
  success: boolean;
  /** ISO-8601 timestamp of the original challenge (present when success). */
  challenge_ts?: string;
  /** Site name / hostname the token was issued for. */
  hostname?: string;
  /** Behavioral score, 0..1 (higher = more human). */
  score?: number;
  /** Challenge id. */
  cid?: string;
  /** Raw error codes from the API (e.g. "invalid-input-secret"). */
  "error-codes"?: string[];
  /** JS-friendly alias of `error-codes`, added by the SDK. */
  error_codes?: string[];
}

export interface VeylifyWebhookEvent<T = Record<string, unknown>> {
  /** Event type, e.g. "bot.blocked", "ai_agent.detected". */
  type: string;
  /** Unique event id, e.g. "evt_ab12cd34…". */
  id: string;
  /** Unix seconds when the event was created. */
  created: number;
  /** Event payload. */
  data: T;
}

export interface VeylifyClientOptions {
  /** Default secret key (sk_live_… / sk_test_…). */
  secret?: string;
  /** API origin. Default "https://api.veylify.com". */
  baseUrl?: string;
  /** Request timeout in ms. Default 8000. */
  timeout?: number;
  /** Custom fetch implementation (e.g. for tests). */
  fetch?: typeof fetch;
}

export interface VerifyWebhookOptions {
  /** Max allowed clock skew in seconds. Default 300. */
  toleranceSeconds?: number;
}

export interface ExpressMiddlewareOptions {
  /** Body/query field holding the widget token. Default "veylify-token". */
  field?: string;
  /** Secret key override. */
  secret?: string;
  /** Reject the request if the score is below this (0..1). */
  minScore?: number;
  /** Custom failure handler. */
  onFail?: (req: any, res: any, err?: Error) => void;
}

export declare class VeylifyError extends Error {
  code: string;
  constructor(message: string, code?: string);
}

export declare class VeylifyClient {
  secret: string;
  baseUrl: string;
  timeout: number;

  constructor(options?: VeylifyClientOptions);

  /** POST /api/v1/siteverify — confirm a widget verification token. */
  siteverify(secret: string, response: string): Promise<SiteverifyResult>;
  /** Overload: siteverify(token) when a default secret is configured. */
  siteverify(response: string): Promise<SiteverifyResult>;

  /** Verify an inbound webhook's X-Veylify-Signature header. */
  verifyWebhook(
    body: string | Buffer,
    header: string,
    secret: string,
    opts?: VerifyWebhookOptions,
  ): boolean;

  /** Verify + parse an inbound webhook. Throws on invalid signature. */
  constructEvent<T = Record<string, unknown>>(
    body: string | Buffer,
    header: string,
    secret: string,
    opts?: VerifyWebhookOptions,
  ): VeylifyWebhookEvent<T>;

  /** Express middleware that verifies the token and attaches req.veylify (and req.specter for back-compat). */
  express(opts?: ExpressMiddlewareOptions): (req: any, res: any, next: any) => void;

  /** Static webhook verification (no client instance needed). */
  static verifyWebhook(
    body: string | Buffer,
    header: string,
    secret: string,
    opts?: VerifyWebhookOptions,
  ): boolean;
}

// -----------------------------------------------------------------
// Back-compat aliases — old type/class names keep working.
// -----------------------------------------------------------------
export type SpecterWebhookEvent<T = Record<string, unknown>> = VeylifyWebhookEvent<T>;
export type SpecterClientOptions = VeylifyClientOptions;
export declare const SpecterError: typeof VeylifyError;
export declare const SpecterClient: typeof VeylifyClient;

export declare const DEFAULT_BASE_URL: string;
export default VeylifyClient;
