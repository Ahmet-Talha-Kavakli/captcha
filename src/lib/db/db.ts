/**
 * Specter — Kalıcı JSON DB (v3)
 * ==============================
 * Sıfır-bağımlılık, dosya-tabanlı kalıcı veritabanı. Production'da çok
 * worker tutarlılığı için disk mtime ile cache invalidate edilir ve
 * kritik yazımlar senkron flush'lanır. Postgres'e geçiş için tüm erişim
 * buradaki repository'lerden geçer.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { SCHEMA_VERSION, type Database } from "./schema";
import type {
  User,
  BildirimTercihleri,
  Site,
  BotEvent,
  IpReputation,
  Rule,
  RuleVersion,
  Campaign,
  Alert,
  AlertStatus,
  AlertSeverity,
  AlertCategory,
  AlertPriority,
  TeamMember,
  ApiToken,
  Webhook,
  WebhookDelivery,
  UsageCounter,
  AssistantMessage,
  AuditCategory,
  ScheduledReport,
  ReportHistory,
  ReportType,
  ReportFormat,
  ReportFrequency,
  Experiment,
  Integration,
  ExperimentStatus,
  ExperimentMetric,
  ExperimentVariantConfig,
  PromoKod,
  PromoKullanim,
  IletisimMesaji,
  KrediHareket,
  PromoTur,
  Plan,
} from "./schema";
import { buildSeed } from "./seed";

const DB_PATH = path.join(process.cwd(), "data", "specter.json");

let cache: Database | null = null;
let cacheMtime = 0;

function load(): Database {
  try {
    if (fs.existsSync(DB_PATH)) {
      const stat = fs.statSync(DB_PATH);
      const mtime = stat.mtimeMs;
      if (cache && mtime === cacheMtime) return cache;
      const raw = fs.readFileSync(DB_PATH, "utf8");
      const parsed = JSON.parse(raw) as Database;
      if (parsed._version === SCHEMA_VERSION) {
        cache = parsed;
        cacheMtime = mtime;
        return cache;
      }
    }
  } catch {
    if (cache) return cache;
  }
  cache = buildSeed(Date.now());
  flushNow();
  return cache;
}

function flushNow(): void {
  if (!cache) return;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(cache), "utf8");
  try {
    cacheMtime = fs.statSync(DB_PATH).mtimeMs;
  } catch {
    /* yok say */
  }
}

// Yazma sayacı: her persist artırır. Türetilmiş önbellek invalidation'ı
// yalnızca dosya mtime'ına güvenmez — aynı milisaniyedeki ardışık yazımlarda
// mtime aynı kalabilir ama cache nesnesi yerinde değiştirilmiştir. Bu sayaç
// her yazımı yakalar → yazma sonrası asla eski türetilmiş veri dönmez.
let writeSeq = 0;

function persist(): void {
  flushNow();
  writeSeq++;
}

// --------------------------------------------------------------- Türetilmiş sorgu önbelleği
//
// PERFORMANS NOTU
// ================
// Panel yüklemelerinde aynı istek içinde `Sites.forOwner` düzinelerce kez
// çağrılır (korumaOzeti, panelSayilari, Events/Usage/Rules/Campaigns/Alerts…
// hepsi sahibin site-id kümesini yeniden `filter` ile kurar). Binlerce olayla
// bu, her çağrıda TÜM dizileri baştan tarayan N+1 bir desendir.
//
// Bu hafif in-memory memoization, türetilmiş yapıları (owner→site listesi,
// owner→site-id Set'i, siteId→olaylar indeksi) HESAP BAŞINA BİR KEZ kurar ve
// tekrar çağrılarda O(1) döndürür. Sonuçlar DEĞİŞMEZ (davranış birebir aynı);
// yalnızca tekrar tarama elenir.
//
// INVALIDATION: Önbellek mevcut `cacheMtime`'a bağlıdır. Her yazma `persist()`
// → `flushNow()` çağırıp `cacheMtime`'ı günceller; ayrıca cache nesnesi
// kimliği (referans) de anahtarın parçasıdır. mtime değişince VEYA cache
// yeniden yüklenince türetilmiş önbellek otomatik sıfırlanır → yazma sonrası
// asla eski veri dönmez. `_resetCache()` de derive önbelleğini temizler.

/** Türetilmiş önbelleğin bağlı olduğu anahtar (mtime + writeSeq + cache kimliği). */
let deriveKeyMtime = -1;
let deriveKeyWrite = -1;
let deriveKeyCache: Database | null = null;
// Owner-bazlı memo haritaları (anahtar geçersizleşince topluca atılır).
let ownerSitesMemo = new Map<string, Site[]>();
let ownerSiteIdMemo = new Map<string, Set<string>>();
// siteId → o siteye ait olaylar (ekleme sırasında, yani ts artan). Tüm
// owner'lar için tek geçişte kurulur; owner sorgusu bunları birleştirir.
let eventsBySiteMemo: Map<string, BotEvent[]> | null = null;

/** Geçerli DB durumu için türetilmiş önbelleğin taze olduğundan emin ol. */
function deriveEnsure(db: Database): void {
  if (deriveKeyCache === db && deriveKeyMtime === cacheMtime && deriveKeyWrite === writeSeq) return;
  // Anahtar değişti (yazma/yeniden-yükleme) → tüm türetilmiş önbelleği at.
  deriveKeyCache = db;
  deriveKeyMtime = cacheMtime;
  deriveKeyWrite = writeSeq;
  ownerSitesMemo = new Map();
  ownerSiteIdMemo = new Map();
  eventsBySiteMemo = null;
}

/** Sahibin siteleri — mtime-önbellekli (tekrar filter yerine O(1)). */
function ownerSites(db: Database, ownerId: string): Site[] {
  deriveEnsure(db);
  let v = ownerSitesMemo.get(ownerId);
  if (!v) {
    v = db.sites.filter((s) => s.ownerId === ownerId);
    ownerSitesMemo.set(ownerId, v);
  }
  return v;
}

/** Sahibin site-id kümesi — mtime-önbellekli (hot N+1 desenini eler). */
function ownerSiteIds(db: Database, ownerId: string): Set<string> {
  deriveEnsure(db);
  let v = ownerSiteIdMemo.get(ownerId);
  if (!v) {
    v = new Set(ownerSites(db, ownerId).map((s) => s.id));
    ownerSiteIdMemo.set(ownerId, v);
  }
  return v;
}

/** siteId → olaylar indeksi (tek geçiş). N site için N kez tam-tarama yerine. */
function eventsBySite(db: Database): Map<string, BotEvent[]> {
  deriveEnsure(db);
  if (!eventsBySiteMemo) {
    const m = new Map<string, BotEvent[]>();
    for (const e of db.events) {
      let arr = m.get(e.siteId);
      if (!arr) {
        arr = [];
        m.set(e.siteId, arr);
      }
      arr.push(e);
    }
    eventsBySiteMemo = m;
  }
  return eventsBySiteMemo;
}

// --------------------------------------------------------------- kimlik/hash

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pw, salt, 32).toString("hex");
  const a = Buffer.from(test, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Sabit-zamanlı string eşitliği (timing-attack direnci). Gizli değerlerin
 * (secretKey) karşılaştırılmasında düz === yerine kullanılır — düz === erken
 * çıkışlıdır ve yanıt-süresi ölçülerek karakter-karakter tahmin sızdırabilir.
 * Uzunluk farkı erken döner (secret uzunluğu sabit formatta, sızıntı yok).
 */
export function sabitZamanEsit(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
export function id(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(9).toString("hex")}`;
}

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

// --------------------------------------------------------------- Users

export const Users = {
  all: (): User[] => load().users,
  byEmail: (email: string) => load().users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  byId: (uid: string) => load().users.find((u) => u.id === uid),
  byClerkId: (cid: string) => load().users.find((u) => u.clerkId === cid),

  /**
   * Clerk kullanıcısını yerel DB User'ına eşler (just-in-time provisioning).
   * Önce clerkId ile, sonra e-posta ile eşleşme aranır; yoksa yeni User
   * oluşturulur. Mevcut demo/cookie-auth kullanıcıları etkilenmez.
   */
  clerkSenkron(input: { clerkId: string; email: string; name: string; avatarColor?: string }): User {
    const db = load();
    let u = db.users.find((x) => x.clerkId === input.clerkId)
      || db.users.find((x) => x.email.toLowerCase() === input.email.toLowerCase());
    if (u) {
      // Var olan kullanıcıya clerkId'yi bağla + isim/e-posta güncelle.
      let degisti = false;
      if (u.clerkId !== input.clerkId) { u.clerkId = input.clerkId; degisti = true; }
      if (input.name && u.name !== input.name) { u.name = input.name; degisti = true; }
      if (input.email && u.email.toLowerCase() !== input.email.toLowerCase()) { u.email = input.email; degisti = true; }
      u.lastSeenAt = Date.now();
      if (degisti) persist(); else persist();
      return u;
    }
    // Yeni kullanıcı — Clerk parola tuttuğu için yerel passwordHash boş.
    const yeni: User = {
      id: id("usr"),
      email: input.email,
      name: input.name || input.email.split("@")[0],
      passwordHash: "",
      plan: "free",
      role: "owner",
      avatarColor: input.avatarColor || "#4f46e5",
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      clerkId: input.clerkId,
    };
    db.users.push(yeni);
    db.team.push({
      id: id("tm"),
      ownerId: yeni.id,
      name: yeni.name,
      email: yeni.email,
      role: "owner",
      avatarColor: yeni.avatarColor,
      status: "active",
      lastActive: Date.now(),
    });
    persist();
    return yeni;
  },
  create(input: { email: string; name: string; password: string }): User {
    const db = load();
    const user: User = {
      id: id("usr"),
      email: input.email,
      name: input.name,
      passwordHash: hashPassword(input.password),
      plan: "free",
      role: "owner",
      avatarColor: "#06b6d4",
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
    };
    db.users.push(user);
    // Yeni kullanıcıya kendi ekip kaydı.
    db.team.push({
      id: id("tm"),
      ownerId: user.id,
      name: user.name,
      email: user.email,
      role: "owner",
      avatarColor: user.avatarColor,
      status: "active",
      lastActive: Date.now(),
    });
    persist();
    return user;
  },
  touch(uid: string): void {
    const u = Users.byId(uid);
    if (u) {
      u.lastSeenAt = Date.now();
      persist();
    }
  },
  /** AI ajan politikasını belirle (ajanId → "izin"|"dogrula"|"engelle"). */
  setAiPolicy(uid: string, agentId: string, policy: string): User | null {
    const u = Users.byId(uid);
    if (!u) return null;
    if (!u.aiPolicies) u.aiPolicies = {};
    u.aiPolicies[agentId] = policy;
    persist();
    return u;
  },
  /** Toplu AI politikası: birden çok ajanı tek yazımla ayarlar (şablon uygula). */
  setAiPolicies(uid: string, politikalar: Record<string, string>): User | null {
    const u = Users.byId(uid);
    if (!u) return null;
    u.aiPolicies = { ...(u.aiPolicies ?? {}), ...politikalar };
    persist();
    return u;
  },
  /** Plan değiştir (gerçek abonelik yükseltme/düşürme). */
  setPlan(uid: string, plan: Plan): User | null {
    const u = Users.byId(uid);
    if (!u) return null;
    u.plan = plan;
    persist();
    return u;
  },

  /* ---------------------------------------------------------------- Kredi */
  krediBakiye(uid: string): number {
    return Users.byId(uid)?.krediBakiye ?? 0;
  },
  /** Kredi hareketi işler (ekleme + / tüketim -). Yetersiz bakiyede tüketimi
   *  reddeder (null). Hareketi geçmişe yazar, atomik persist. */
  krediHareket(
    uid: string,
    tur: KrediHareket["tur"],
    miktar: number,
    aciklama: string,
  ): { user: User; hareket: KrediHareket } | null {
    const u = Users.byId(uid);
    if (!u) return null;
    const mevcut = u.krediBakiye ?? 0;
    const yeni = mevcut + miktar;
    if (yeni < 0) return null; // yetersiz bakiye
    u.krediBakiye = yeni;
    if (!u.krediHareketler) u.krediHareketler = [];
    const hareket: KrediHareket = {
      id: id("krd"),
      tur,
      miktar,
      aciklama,
      bakiyeSonrasi: yeni,
      createdAt: Date.now(),
    };
    u.krediHareketler.unshift(hareket);
    if (u.krediHareketler.length > 200) u.krediHareketler.length = 200;
    persist();
    return { user: u, hareket };
  },
  krediGecmis(uid: string, limit = 50): KrediHareket[] {
    return (Users.byId(uid)?.krediHareketler ?? []).slice(0, limit);
  },

  /**
   * Profil güncelle (yalnızca izin verilen alanlar). E-posta değişirse
   * çakışma kontrolü çağıran (route) tarafında yapılır. avatarColor'ı ekip
   * kaydına da yansıtır (owner satırı) böylece Avatar'lar tutarlı kalır.
   */
  updateProfile(
    uid: string,
    patch: Partial<
      Pick<User, "name" | "email" | "avatarColor" | "workspaceName" | "locale" | "timezone">
    >,
  ): User | null {
    const db = load();
    const u = db.users.find((x) => x.id === uid);
    if (!u) return null;
    if (patch.name !== undefined) u.name = patch.name;
    if (patch.email !== undefined) u.email = patch.email;
    if (patch.avatarColor !== undefined) u.avatarColor = patch.avatarColor;
    if (patch.workspaceName !== undefined) u.workspaceName = patch.workspaceName;
    if (patch.locale !== undefined) u.locale = patch.locale;
    if (patch.timezone !== undefined) u.timezone = patch.timezone;
    // Kullanıcının kendi ekip (owner) kaydını da senkronla.
    const own = db.team.find((t) => t.ownerId === uid && t.email && t.role === "owner");
    if (own) {
      if (patch.name !== undefined) own.name = patch.name;
      if (patch.email !== undefined) own.email = patch.email;
      if (patch.avatarColor !== undefined) own.avatarColor = patch.avatarColor;
    }
    persist();
    return u;
  },

  /** Şifreyi değiştirir; eski şifre doğrulanır. Sonuç kodu döner. */
  changePassword(uid: string, oldPw: string, newPw: string): "ok" | "yanlis" | "yok" {
    const db = load();
    const u = db.users.find((x) => x.id === uid);
    if (!u) return "yok";
    if (!verifyPassword(oldPw, u.passwordHash)) return "yanlis";
    u.passwordHash = hashPassword(newPw);
    u.passwordChangedAt = Date.now();
    persist();
    return "ok";
  },

  /** İki-adımlı doğrulamayı aç/kapat. Owner ekip kaydına da yansır. */
  setTwoFactor(uid: string, enabled: boolean): User | null {
    const db = load();
    const u = db.users.find((x) => x.id === uid);
    if (!u) return null;
    u.twoFactorEnabled = enabled;
    // Kapatılınca TOTP secret'ı temizle (yeniden açılırken yeni secret üretilir).
    if (!enabled) u.totpSecret = undefined;
    const own = db.team.find((t) => t.ownerId === uid && t.role === "owner");
    if (own) own.mfaEnabled = enabled;
    persist();
    return u;
  },

  /** 2FA kurulumu başlat: yeni TOTP secret üretip sakla (henüz enable etme).
   * Kullanıcı authenticator'ına ekleyip bir kod ile doğrulayınca aktifleşir. */
  setTotpSecret(uid: string, secret: string): User | null {
    const db = load();
    const u = db.users.find((x) => x.id === uid);
    if (!u) return null;
    u.totpSecret = secret;
    persist();
    return u;
  },

  /** Bildirim tercihlerini kaydeder (tam nesneyi değiştirir). */
  setNotificationPrefs(uid: string, prefs: BildirimTercihleri): User | null {
    const u = Users.byId(uid);
    if (!u) return null;
    u.notificationPrefs = prefs;
    persist();
    return u;
  },

  /** Hesabı ve tüm bağlı verisini kalıcı olarak siler. */
  remove(uid: string): void {
    const db = load();
    const siteIds = new Set(db.sites.filter((s) => s.ownerId === uid).map((s) => s.id));
    db.users = db.users.filter((u) => u.id !== uid);
    db.sites = db.sites.filter((s) => s.ownerId !== uid);
    db.events = db.events.filter((e) => !siteIds.has(e.siteId));
    db.rules = db.rules.filter((r) => !siteIds.has(r.siteId));
    db.campaigns = db.campaigns.filter((c) => !siteIds.has(c.siteId));
    db.alerts = db.alerts.filter((a) => !siteIds.has(a.siteId));
    db.webhooks = db.webhooks.filter((w) => !siteIds.has(w.siteId));
    db.usage = db.usage.filter((x) => !siteIds.has(x.siteId));
    db.team = db.team.filter((t) => t.ownerId !== uid);
    db.apiTokens = db.apiTokens.filter((t) => t.ownerId !== uid);
    db.auditLogs = db.auditLogs.filter((a) => a.actorId !== uid);
    db.assistant = db.assistant.filter((m) => m.ownerId !== uid);
    // Bu kullanıcıya ait oturumları da temizle.
    for (const [tok, s] of Object.entries(db.sessions)) {
      if (s.userId === uid) delete db.sessions[tok];
    }
    persist();
  },
};

// --------------------------------------------------------------- Sessions

export const Sessions = {
  create(userId: string, ttlMs = 7 * 24 * 60 * 60 * 1000): string {
    const db = load();
    const token = crypto.randomBytes(24).toString("hex");
    db.sessions[token] = { userId, exp: Date.now() + ttlMs };
    persist();
    return token;
  },
  resolve(token: string | undefined): User | null {
    if (!token) return null;
    const db = load();
    const s = db.sessions[token];
    if (!s || s.exp < Date.now()) return null;
    return Users.byId(s.userId) ?? null;
  },
  destroy(token: string | undefined): void {
    if (!token) return;
    const db = load();
    delete db.sessions[token];
    persist();
  },
};

// --------------------------------------------------------------- Sites

export const Sites = {
  // PERFORMANS: mtime-önbellekli (aynı istekte düzinelerce çağrılıyor).
  forOwner: (ownerId: string) => ownerSites(load(), ownerId),
  byId: (sid: string) => load().sites.find((s) => s.id === sid),
  bySiteKey: (k: string) => load().sites.find((s) => s.siteKey === k),
  // GİZLİ secretKey karşılaştırması sabit-zamanlı (timing-attack direnci) —
  // siteverify'da müşteri secret gönderir; düz === yanıt-süresi sızdırabilirdi.
  forOwnerBySecret: (k: string) => load().sites.find((s) => sabitZamanEsit(s.secretKey, k)),
  /** Ad slug'ından site bul (public güven mührü sayfası için). */
  byNameSlug: (slug: string) =>
    load().sites.find((s) => s.name.replace(/[^a-z0-9.-]/gi, "").toLowerCase() === slug.toLowerCase()),
  create(
    input: Omit<
      Site,
      "id" | "createdAt" | "active" | "verified" | "verifyToken" | "verifyMethod" | "verifiedAt" | "verifyAttempts"
    >,
  ): Site {
    const db = load();
    // Yeni siteler doğrulanmamış (beklemede) başlar. Kullanıcı bu token'ı
    // sitesine (DNS TXT / meta / dosya) yerleştirip "Doğrula" der.
    const site: Site = {
      ...input,
      id: id("site"),
      createdAt: Date.now(),
      active: true,
      verified: false,
      verifyToken: "veylify-verify=" + crypto.randomBytes(12).toString("hex"),
      verifyMethod: null,
      verifiedAt: null,
      verifyAttempts: 0,
    };
    db.sites.push(site);
    persist();
    return site;
  },
  /** Doğrulama denemesini kaydeder ve deneme sayısını döndürür. */
  bumpVerifyAttempt(sid: string): number {
    const s = Sites.byId(sid);
    if (!s) return 0;
    s.verifyAttempts = (s.verifyAttempts ?? 0) + 1;
    persist();
    return s.verifyAttempts;
  },
  /** Siteyi doğrulanmış işaretler (koruma aktifleşir). */
  setVerified(sid: string, method: "dns" | "meta" | "file"): Site | undefined {
    const s = Sites.byId(sid);
    if (!s) return undefined;
    s.verified = true;
    s.verifyMethod = method;
    s.verifiedAt = Date.now();
    persist();
    return s;
  },
  update(sid: string, patch: Partial<Site>): Site | undefined {
    const s = Sites.byId(sid);
    if (!s) return undefined;
    Object.assign(s, patch);
    persist();
    return s;
  },
  remove(sid: string): void {
    const db = load();
    db.sites = db.sites.filter((s) => s.id !== sid);
    // CASCADE: siteye bağlı TÜM veriyi temizle — orphan (sahipsiz) kayıt
    // bırakma. Daha önce yalnızca events+rules siliniyordu; webhooks/campaigns/
    // alerts/usage orphan kalıyordu (silinen siteye ait webhook tetiklenmeye
    // çalışabilir, panelde sahipsiz kayıt görünürdü). deleteUser cascade'iyle
    // aynı kapsam.
    db.events = db.events.filter((e) => e.siteId !== sid);
    db.rules = db.rules.filter((r) => r.siteId !== sid);
    db.campaigns = db.campaigns.filter((c) => c.siteId !== sid);
    db.alerts = db.alerts.filter((a) => a.siteId !== sid);
    db.webhooks = db.webhooks.filter((w) => w.siteId !== sid);
    db.usage = db.usage.filter((x) => x.siteId !== sid);
    persist();
  },
};

// --------------------------------------------------------------- Events

export const Events = {
  // PERFORMANS: siteId→olaylar indeksinden çek (tam-tarama yerine). İndeks
  // ekleme sırasını korur; sonuç eskiden olduğu gibi son `limit` olay, ters.
  forSite: (siteId: string, limit = 200) => {
    const arr = eventsBySite(load()).get(siteId);
    return arr ? arr.slice(-limit).reverse() : [];
  },
  forOwner(ownerId: string, limit = 500): BotEvent[] {
    const db = load();
    const ids = ownerSiteIds(db, ownerId);
    // PERFORMANS + KORUNAN DAVRANIŞ: Tek site sahibi (en yaygın durum) →
    // doğrudan indeks dilimi; ekleme sırası aynen korunur, tam-tarama yok.
    if (ids.size === 1) {
      const only = eventsBySite(db).get([...ids][0]);
      return only ? only.slice(-limit).reverse() : [];
    }
    // Çoklu site: db.events'i (orijinal ekleme sırası) mtime-önbellekli
    // Set ile filtrele. Böylece eşit-ts olayların bağ sırası orijinaldeki
    // gibi KORUNUR (yeniden sıralama YOK). Kazanç: Set'i her çağrıda yeniden
    // kurmamak (N+1 eleme). Sonuç orijinalle birebir aynıdır.
    return db.events.filter((e) => ids.has(e.siteId)).slice(-limit).reverse();
  },
  /**
   * Sahibin SON `gun` gününe ait TÜM olayları döndürür (ts penceresi ile).
   * `forOwner`'ın sabit `limit`'i, olay hacmi limiti aşınca EN ESKİ günleri
   * keser → çok-günlük trend grafikleri ilk günlerde yanlışlıkla "düz/sıfır"
   * görünür. Bu fonksiyon zaman-penceresi kullanır: kaç olay olursa olsun
   * pencere içindeki her gün eksiksiz temsil edilir. Trend/zaman-serisi çizen
   * sayfalar bunu kullanmalı (limit tabanlı forOwner yerine).
   * @param simdi "şimdi" referansı (ms); verilmezse çağıran Date.now geçmeli.
   */
  sonGunler(ownerId: string, gun: number, simdi: number): BotEvent[] {
    const db = load();
    const ids = ownerSiteIds(db, ownerId);
    const esik = simdi - gun * 86400000;
    const src =
      ids.size === 1
        ? eventsBySite(db).get([...ids][0]) ?? []
        : db.events.filter((e) => ids.has(e.siteId));
    // Kaynak ekleme (ts) sıralı; eşikten yeni olanları al, en yeni önce.
    return src.filter((e) => e.ts >= esik).reverse();
  },
  add(ev: Omit<BotEvent, "id">): BotEvent {
    const db = load();
    const full: BotEvent = { ...ev, id: id("ev") };
    db.events.push(full);
    // sayaç güncelle
    const key = `${ev.siteId}|${dayKey(ev.ts)}`;
    let u = db.usage.find((x) => `${x.siteId}|${x.day}` === key);
    if (!u) {
      u = { siteId: ev.siteId, day: dayKey(ev.ts), issued: 0, verified: 0, blocked: 0, challenged: 0 };
      db.usage.push(u);
    }
    u.issued++;
    if (ev.verdict === "allowed") u.verified++;
    else if (ev.verdict === "blocked") u.blocked++;
    else if (ev.verdict === "challenged") u.challenged++;
    if (db.events.length > 8000) db.events.splice(0, db.events.length - 8000);
    persist();
    return full;
  },
};

// --------------------------------------------------------------- IP reputation

export const IpRep = {
  forOwner(): IpReputation[] {
    // İtibar global tutuluyor.
    return load().ipReputation;
  },
  byIp: (ip: string) => load().ipReputation.find((r) => r.ip === ip),
  /** Bir IP'nin sahibin sitelerindeki tüm olayları (adli inceleme). */
  eventsForIp(ownerId: string, ip: string, limit = 100): BotEvent[] {
    const db = load();
    const siteIds = ownerSiteIds(db, ownerId); // PERFORMANS: mtime-önbellekli Set
    return db
      .events.filter((e) => e.ip === ip && siteIds.has(e.siteId))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, limit);
  },
};

// --------------------------------------------------------------- Rules

export const Rules = {
  forSite: (siteId: string) => load().rules.filter((r) => r.siteId === siteId).sort((a, b) => a.priority - b.priority),
  forOwner(ownerId: string): Rule[] {
    const db = load();
    const ids = ownerSiteIds(db, ownerId); // PERFORMANS: mtime-önbellekli Set
    return db.rules.filter((r) => ids.has(r.siteId));
  },
  byId: (rid: string) => load().rules.find((r) => r.id === rid),
  create(input: Omit<Rule, "id" | "createdAt" | "hits" | "system">): Rule {
    const db = load();
    const rule: Rule = { ...input, id: id("rule"), createdAt: Date.now(), hits: 0, system: false };
    db.rules.push(rule);
    persist();
    return rule;
  },
  /** Bir kuralın o anki yapılandırmasından sürüm anlık görüntüsü üretir. */
  _snapshot(r: Rule): RuleVersion["snapshot"] {
    return {
      name: r.name, description: r.description, enabled: r.enabled, priority: r.priority,
      field: r.field, op: r.op, value: r.value, action: r.action, kosulGrup: r.kosulGrup,
    };
  },
  update(rid: string, patch: Partial<Rule>, actor?: string, ozet?: string): Rule | undefined {
    const r = Rules.byId(rid);
    if (!r) return undefined;
    // Değişiklikten ÖNCEKİ durumu geçmişe yaz (geri-alma için).
    if (!Array.isArray(r.history)) r.history = [];
    const oncekiSurum = r.history.length + 1;
    r.history.push({
      surum: oncekiSurum,
      ts: Date.now(),
      actor: actor ?? "sistem",
      ozet: ozet ?? "Güncellendi",
      snapshot: Rules._snapshot(r),
    });
    // Geçmiş sınırı (son 30 sürüm yeter).
    if (r.history.length > 30) r.history = r.history.slice(-30);
    Object.assign(r, patch);
    persist();
    return r;
  },
  /** Kuralı geçmişteki bir sürüme geri döndürür (mevcut durumu da geçmişe yazar). */
  revert(rid: string, surum: number, actor: string): Rule | undefined {
    const r = Rules.byId(rid);
    if (!r || !Array.isArray(r.history)) return undefined;
    const hedef = r.history.find((h) => h.surum === surum);
    if (!hedef) return undefined;
    // Mevcut durumu da geçmişe ekle (geri-alınabilir olsun).
    r.history.push({
      surum: r.history.length + 1,
      ts: Date.now(),
      actor,
      ozet: `Sürüm ${surum}'e geri döndürüldü`,
      snapshot: Rules._snapshot(r),
    });
    Object.assign(r, hedef.snapshot);
    persist();
    return r;
  },
  remove(rid: string): void {
    const db = load();
    db.rules = db.rules.filter((r) => r.id !== rid);
    persist();
  },
  /** Eşleşen kuralların hit sayacını artırır (canlı değerlendirme). */
  bumpHits(ruleIds: string[]): void {
    if (!ruleIds.length) return;
    const db = load();
    const set = new Set(ruleIds);
    for (const r of db.rules) if (set.has(r.id)) r.hits++;
    persist();
  },
};

// --------------------------------------------------------------- Campaigns

export const Campaigns = {
  forOwner(ownerId: string): Campaign[] {
    const db = load();
    const ids = ownerSiteIds(db, ownerId); // PERFORMANS: mtime-önbellekli Set
    return db.campaigns.filter((c) => ids.has(c.siteId)).sort((a, b) => b.startedAt - a.startedAt);
  },
  byId: (cid: string) => load().campaigns.find((c) => c.id === cid),
};

// --------------------------------------------------------------- Alerts

const ALERT_STATUS_ETIKET: Record<AlertStatus, string> = {
  acik: "Açık",
  inceleniyor: "İnceleniyor",
  cozuldu: "Çözüldü",
  yoksayildi: "Yok sayıldı",
};

export const Alerts = {
  forOwner(ownerId: string): Alert[] {
    const db = load();
    const ids = ownerSiteIds(db, ownerId); // PERFORMANS: mtime-önbellekli Set
    return db.alerts.filter((a) => ids.has(a.siteId)).sort((a, b) => b.ts - a.ts);
  },
  /** Sahibin tek olayını id ile getirir (yetki güvenli). */
  byId(ownerId: string, alertId: string): Alert | undefined {
    const db = load();
    const ids = ownerSiteIds(db, ownerId); // PERFORMANS: mtime-önbellekli Set
    const a = db.alerts.find((x) => x.id === alertId);
    return a && ids.has(a.siteId) ? a : undefined;
  },
  /** Timeline'a kayıt düşer (iç yardımcı). */
  _log(a: Alert, actor: string, action: string, note?: string): void {
    if (!Array.isArray(a.timeline)) a.timeline = [];
    a.timeline.push({ ts: Date.now(), actor, action, note });
  },
  /**
   * Yeni bir olay (incident) oluşturur — örn. korelasyon motorundan otomatik.
   * siteId sahibe ait olmalı; değilse undefined döner. İlk timeline kaydı düşülür.
   */
  create(
    ownerId: string,
    input: {
      siteId: string; severity: AlertSeverity; title: string; message: string;
      category: AlertCategory; priority: AlertPriority; sourceIp?: string; actor: string;
    },
  ): Alert | undefined {
    const db = load();
    const ids = ownerSiteIds(db, ownerId);
    if (!ids.has(input.siteId)) return undefined;
    const now = Date.now();
    const alert: Alert = {
      id: id("alert"),
      siteId: input.siteId,
      severity: input.severity,
      title: input.title,
      message: input.message,
      ts: now,
      read: false,
      category: input.category,
      status: "acik",
      assignee: null,
      priority: input.priority,
      sourceIp: input.sourceIp,
      timeline: [{ ts: now, actor: input.actor, action: "oluşturuldu", note: "Olay oluşturuldu." }],
    };
    db.alerts.push(alert);
    persist();
    return alert;
  },
  markRead(alertId: string): void {
    const db = load();
    const a = db.alerts.find((x) => x.id === alertId);
    if (a) {
      a.read = true;
      persist();
    }
  },
  markAllRead(ownerId: string): void {
    const db = load();
    const ids = ownerSiteIds(db, ownerId); // PERFORMANS: mtime-önbellekli Set
    db.alerts.forEach((a) => {
      if (ids.has(a.siteId)) a.read = true;
    });
    persist();
  },
  /**
   * Olay durumunu değiştirir; onay/çözüm zaman damgalarını yönetir ve
   * timeline'a kayıt düşer. `actor` işlemi yapanın adı.
   */
  updateStatus(ownerId: string, alertId: string, status: AlertStatus, actor: string): Alert | undefined {
    const a = Alerts.byId(ownerId, alertId);
    if (!a) return undefined;
    if (a.status === status) return a;
    a.status = status;
    a.read = true;
    if (status === "inceleniyor" && !a.acknowledgedAt) a.acknowledgedAt = Date.now();
    if (status === "cozuldu") a.resolvedAt = Date.now();
    // Yeniden açılırsa çözüm damgası temizlenir (MTTR bozulmasın).
    if (status === "acik" || status === "inceleniyor") a.resolvedAt = undefined;
    Alerts._log(a, actor, `durum:${status}`, `Durum "${ALERT_STATUS_ETIKET[status]}" olarak güncellendi.`);
    persist();
    return a;
  },
  /** Olayı bir ekip üyesine atar (memberId null → atamayı kaldırır). */
  assign(ownerId: string, alertId: string, memberId: string | null, actor: string): Alert | undefined {
    const a = Alerts.byId(ownerId, alertId);
    if (!a) return undefined;
    a.assignee = memberId;
    a.read = true;
    if (memberId) {
      const m = load().team.find((t) => t.id === memberId && t.ownerId === ownerId);
      Alerts._log(a, actor, "atandı", m ? `${m.name} üzerine alındı.` : "Atandı.");
    } else {
      Alerts._log(a, actor, "atama-kaldırıldı", "Atama kaldırıldı.");
    }
    persist();
    return a;
  },
  /** Olaya serbest not ekler (timeline'a düşer). */
  addNote(ownerId: string, alertId: string, actor: string, note: string): Alert | undefined {
    const a = Alerts.byId(ownerId, alertId);
    if (!a || !note.trim()) return undefined;
    a.read = true;
    Alerts._log(a, actor, "not", note.trim());
    persist();
    return a;
  },
};

// --------------------------------------------------------------- Audit

/** Bir işlem adından kategori türet (runtime kayıtları da sınıflansın). */
function auditKategoriTuret(action: string): AuditCategory {
  const a = action.toLowerCase();
  if (a.startsWith("ai.") || a.includes("ai-politika") || a.includes("politika")) return "ai-policy";
  if (a.startsWith("oturum") || a.startsWith("2fa") || a.startsWith("parola")) return "auth";
  if (a.startsWith("site")) return "site";
  if (a.startsWith("kural")) return "rule";
  if (a.startsWith("üye") || a.startsWith("uye") || a.startsWith("ekip")) return "team";
  if (a.startsWith("anahtar") || a.startsWith("token")) return "token";
  if (a.startsWith("webhook")) return "webhook";
  if (a.startsWith("plan") || a.startsWith("fatura") || a.startsWith("kota") || a.startsWith("ödeme")) return "billing";
  return "site";
}
/** Kritik/hassas işlem mi (silme, rol değişimi, anahtar döndürme, engelleme…). */
function auditKritikMi(action: string): boolean {
  const a = action.toLowerCase();
  return /(\.sil|döndür|iptal|rol-değiştir|askıya|devre-dışı|yükselt|başarısız|2fa|ödeme-yöntemi)/.test(a);
}

export const Audit = {
  forOwner: (ownerId: string, limit = 100) =>
    load().auditLogs.filter((a) => a.actorId === ownerId).slice(0, limit),
  log(
    actorId: string,
    actorName: string,
    action: string,
    target: string,
    meta?: Record<string, string>,
    opts?: { category?: AuditCategory; critical?: boolean; onceki?: string; sonraki?: string },
  ): void {
    const db = load();
    // Değişmezlik zincirini sürdür: en son kaydın seq/hash'ini baz al.
    const enYeni = db.auditLogs.reduce<{ seq: number; hash: string } | null>(
      (m, a) => (a.seq != null && (!m || a.seq > m.seq) ? { seq: a.seq, hash: a.hash ?? "genesis" } : m),
      null,
    );
    const seq = (enYeni?.seq ?? 0) + 1;
    const prevHash = enYeni?.hash ?? "genesis";
    const ts = Date.now();
    const govde = JSON.stringify({ seq, actor: actorId, action, target, ts, prevHash });
    const hash = crypto.createHash("sha256").update(govde).digest("hex").slice(0, 16);
    db.auditLogs.unshift({
      id: id("audit"),
      actorId,
      actorName,
      action,
      target,
      ts,
      ip: "127.0.0.1",
      meta,
      category: opts?.category ?? auditKategoriTuret(action),
      seq,
      hash,
      prevHash,
      critical: opts?.critical ?? auditKritikMi(action),
      onceki: opts?.onceki,
      sonraki: opts?.sonraki,
    });
    if (db.auditLogs.length > 500) db.auditLogs.length = 500;
    persist();
  },
};

// --------------------------------------------------------------- Team

const TEAM_COLORS = ["#06b6d4", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"];
const INVITE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 gün

export const Team = {
  forOwner: (ownerId: string) => load().team.filter((t) => t.ownerId === ownerId),
  /** Yetki-güvenli tekil getirme: yalnızca sahibin ekibindeki üyeyi döndürür. */
  byId(ownerId: string, memberId: string): TeamMember | undefined {
    return load().team.find((t) => t.id === memberId && t.ownerId === ownerId);
  },
  invite(
    ownerId: string,
    name: string,
    email: string,
    role: TeamMember["role"],
    opts?: { title?: string; invitedBy?: string },
  ): TeamMember {
    const db = load();
    const now = Date.now();
    const m: TeamMember = {
      id: id("tm"),
      ownerId,
      name,
      email,
      role,
      avatarColor: TEAM_COLORS[db.team.length % TEAM_COLORS.length],
      status: "invited",
      lastActive: now,
      title: opts?.title,
      mfaEnabled: false,
      invitedAt: now,
      invitedBy: opts?.invitedBy,
      inviteExpiresAt: now + INVITE_TTL,
    };
    db.team.push(m);
    persist();
    return m;
  },
  /** Rol değiştir (yetki-güvenli). Sahip rolü bu yolla değiştirilemez. */
  changeRole(ownerId: string, memberId: string, role: TeamMember["role"]): TeamMember | undefined {
    const m = Team.byId(ownerId, memberId);
    if (!m || m.role === "owner") return undefined;
    m.role = role;
    persist();
    return m;
  },
  /** Bekleyen davetin süresini yeniler (yeniden gönder). */
  resendInvite(ownerId: string, memberId: string): TeamMember | undefined {
    const m = Team.byId(ownerId, memberId);
    if (!m || m.status !== "invited") return undefined;
    const now = Date.now();
    m.invitedAt = now;
    m.inviteExpiresAt = now + INVITE_TTL;
    persist();
    return m;
  },
  update(memberId: string, patch: Partial<TeamMember>) {
    const db = load();
    const m = db.team.find((x) => x.id === memberId);
    if (m) {
      Object.assign(m, patch);
      persist();
    }
    return m;
  },
  /** Yetki-güvenli çıkar/iptal: sahip çıkarılamaz. */
  removeForOwner(ownerId: string, memberId: string): boolean {
    const m = Team.byId(ownerId, memberId);
    if (!m || m.role === "owner") return false;
    const db = load();
    db.team = db.team.filter((t) => t.id !== memberId);
    persist();
    return true;
  },
  remove(memberId: string): void {
    const db = load();
    db.team = db.team.filter((t) => t.id !== memberId);
    persist();
  },
};

// --------------------------------------------------------------- API tokens

export const Tokens = {
  forOwner: (ownerId: string) => load().apiTokens.filter((t) => t.ownerId === ownerId),
  byId: (ownerId: string, tokenId: string) =>
    load().apiTokens.find((t) => t.id === tokenId && t.ownerId === ownerId),
  create(
    ownerId: string,
    name: string,
    scopes: string[],
    environment: "live" | "test" = "live",
  ): { token: ApiToken; secret: string } {
    const db = load();
    // Gerçek gizli anahtar yalnızca bir kez döner; DB'de maskeli prefix (ilk 20
    // karakter, gösterim için) + tam anahtarın SHA-256 HASH'i tutulur. Düz metin
    // secret ASLA saklanmaz → sızıntı olsa bile anahtarlar geri elde edilemez.
    const secret = `sk_${environment}_` + crypto.randomBytes(24).toString("hex");
    const token: ApiToken = {
      id: id("tok"),
      ownerId,
      name,
      prefix: secret.slice(0, 20),
      secretHash: crypto.createHash("sha256").update(secret).digest("hex"),
      scopes,
      environment,
      createdAt: Date.now(),
      lastUsed: null,
      requests30d: 0,
      revoked: false,
    };
    db.apiTokens.push(token);
    persist();
    return { token, secret };
  },
  /**
   * Bir Bearer secret'ından iptal edilmemiş token'ı bulur (SHA-256 hash
   * karşılaştırması, timing-safe). Public API auth'unun tek doğrulama noktası.
   * Bulunursa lastUsed + requests30d güncellenir. Geçersiz/iptal → null.
   */
  byToken(secret: string): ApiToken | null {
    if (!secret || !secret.startsWith("sk_")) return null;
    const hash = crypto.createHash("sha256").update(secret).digest("hex");
    const hb = Buffer.from(hash, "hex");
    const t = load().apiTokens.find((x) => {
      if (x.revoked || !x.secretHash) return false;
      const xb = Buffer.from(x.secretHash, "hex");
      return xb.length === hb.length && crypto.timingSafeEqual(xb, hb);
    });
    if (!t) return null;
    t.lastUsed = Date.now();
    t.requests30d = (t.requests30d ?? 0) + 1;
    persist();
    return t;
  },
  /** Anahtarı döndürür: yeni gizli anahtar üretir, prefix'i günceller, kullanımı sıfırlar. */
  rotate(ownerId: string, tokenId: string): { token: ApiToken; secret: string } | null {
    const t = Tokens.byId(ownerId, tokenId);
    if (!t || t.revoked) return null;
    const secret = `sk_${t.environment}_` + crypto.randomBytes(24).toString("hex");
    t.prefix = secret.slice(0, 20);
    t.secretHash = crypto.createHash("sha256").update(secret).digest("hex");
    const now = Date.now();
    t.createdAt = now;
    t.lastUsed = null;
    // Rotasyon güvenlik izi: döndürme sayacı + son-döndürme + sızıntı temizlenir.
    t.lastRotatedAt = now;
    t.rotationCount = (t.rotationCount ?? 0) + 1;
    if (t.leaked) { t.leaked = false; t.leakedAt = undefined; t.leakSource = undefined; }
    persist();
    return { token: t, secret };
  },
  /** Anahtarı sızıntılı olarak işaretler (dış tarama tespiti simülasyonu). */
  markLeaked(ownerId: string, tokenId: string, source: string): ApiToken | undefined {
    const t = Tokens.byId(ownerId, tokenId);
    if (!t) return undefined;
    t.leaked = true;
    t.leakedAt = Date.now();
    t.leakSource = source;
    persist();
    return t;
  },
  revoke(ownerId: string, tokenId: string): void {
    const t = Tokens.byId(ownerId, tokenId);
    if (t) {
      t.revoked = true;
      persist();
    }
  },
};

// --------------------------------------------------------------- Webhooks

export const Webhooks = {
  forOwner(ownerId: string): Webhook[] {
    const db = load();
    const ids = ownerSiteIds(db, ownerId); // PERFORMANS: mtime-önbellekli Set
    return db.webhooks.filter((w) => ids.has(w.siteId));
  },
  /** Sahip-güvenli tekil webhook getir (webhook'un sitesi sahibe ait olmalı). */
  byId(ownerId: string, whId: string): Webhook | undefined {
    const db = load();
    const ids = ownerSiteIds(db, ownerId); // PERFORMANS: mtime-önbellekli Set
    const w = db.webhooks.find((x) => x.id === whId);
    return w && ids.has(w.siteId) ? w : undefined;
  },
  create(siteId: string, url: string, events: string[]): Webhook {
    const db = load();
    const wh: Webhook = {
      id: id("wh"),
      siteId,
      url,
      events,
      active: true,
      secret: "whsec_" + crypto.randomBytes(16).toString("hex"),
      createdAt: Date.now(),
      lastDelivery: null,
      lastStatus: null,
      deliveries: [],
    };
    db.webhooks.push(wh);
    persist();
    return wh;
  },
  /** Aktif/pasif değiştir (sahip-güvenli). */
  toggle(ownerId: string, whId: string): Webhook | undefined {
    const w = Webhooks.byId(ownerId, whId);
    if (!w) return undefined;
    w.active = !w.active;
    persist();
    return w;
  },
  /**
   * Test teslimatı: gerçek bir teslim denemesi kaydı ekler (deterministik
   * başarı simülasyonu — aktif endpoint'ler 2xx döner). Son 20 teslimat tutulur.
   */
  testDeliver(ownerId: string, whId: string, event = "webhook.test"): WebhookDelivery | undefined {
    const w = Webhooks.byId(ownerId, whId);
    if (!w) return undefined;
    if (!Array.isArray(w.deliveries)) w.deliveries = [];
    const now = Date.now();
    // Aktif endpoint çoğunlukla 200 döner; pasif endpoint bağlantı hatası (0).
    const status = w.active ? 200 : 0;
    const delivery: WebhookDelivery = {
      id: id("whd"),
      event,
      status,
      ts: now,
      attempt: 1,
      durationMs: 40 + Math.floor(Math.random() * 220),
    };
    w.deliveries.push(delivery);
    if (w.deliveries.length > 20) w.deliveries.splice(0, w.deliveries.length - 20);
    w.lastDelivery = now;
    w.lastStatus = status;
    persist();
    return delivery;
  },
  /** Gerçek bir teslimat sonucunu kaydeder (webhook-delivery motoru çağırır). */
  kaydetTeslimat(
    ownerId: string,
    whId: string,
    d: { event: string; status: number; attempt: number; durationMs: number },
  ): void {
    const w = Webhooks.byId(ownerId, whId);
    if (!w) return;
    if (!Array.isArray(w.deliveries)) w.deliveries = [];
    const now = Date.now();
    w.deliveries.push({ id: id("whd"), event: d.event, status: d.status, ts: now, attempt: d.attempt, durationMs: d.durationMs });
    if (w.deliveries.length > 20) w.deliveries.splice(0, w.deliveries.length - 20);
    w.lastDelivery = now;
    w.lastStatus = d.status;
    persist();
  },
  remove(ownerId: string, whId: string): boolean {
    const w = Webhooks.byId(ownerId, whId);
    if (!w) return false;
    const db = load();
    db.webhooks = db.webhooks.filter((x) => x.id !== whId);
    persist();
    return true;
  },
};

// --------------------------------------------------------------- Usage / Analytics

export const Usage = {
  forOwner(ownerId: string, days = 30): UsageCounter[] {
    const db = load();
    const ids = ownerSiteIds(db, ownerId); // PERFORMANS: mtime-önbellekli Set
    const cutoff = dayKey(Date.now() - days * 86400000);
    return db.usage.filter((u) => ids.has(u.siteId) && u.day >= cutoff);
  },
  forSite(siteId: string, days = 30): UsageCounter[] {
    const cutoff = dayKey(Date.now() - days * 86400000);
    return load().usage.filter((u) => u.siteId === siteId && u.day >= cutoff);
  },
  /** Bir sitenin bugünkü sayaçlarını artırır (gerçek kullanım ölçümü). */
  increment(siteId: string, alan: keyof Omit<UsageCounter, "siteId" | "day">, miktar = 1): void {
    const db = load();
    const gun = dayKey(Date.now());
    let u = db.usage.find((x) => x.siteId === siteId && x.day === gun);
    if (!u) {
      u = { siteId, day: gun, issued: 0, verified: 0, blocked: 0, challenged: 0 };
      db.usage.push(u);
    }
    u[alan] += miktar;
    persist();
  },
  /** Owner'ın son 30 gündeki toplam issued (kota kontrolü için). */
  aylikIssued(ownerId: string): number {
    return Usage.forOwner(ownerId, 30).reduce((a, u) => a + u.issued, 0);
  },
};

// --------------------------------------------------------------- Assistant

export const Assistant = {
  forOwner: (ownerId: string) => load().assistant.filter((m) => m.ownerId === ownerId).sort((a, b) => a.ts - b.ts),
  add(ownerId: string, role: "user" | "assistant", content: string): AssistantMessage {
    const db = load();
    const msg: AssistantMessage = { id: id("msg"), ownerId, role, content, ts: Date.now() };
    db.assistant.push(msg);
    persist();
    return msg;
  },
};

// --------------------------------------------------------------- Reports

/** Bir sonraki çalışma anını sıklığa göre hesapla (şimdiden ileri). */
function sonrakiCalisma(freq: ReportFrequency, base = Date.now()): number {
  const gun = 86400000;
  if (freq === "gunluk") return base + gun;
  if (freq === "haftalik") return base + 7 * gun;
  return base + 30 * gun; // aylik
}

export const Reports = {
  /** Sahibin zamanlanmış raporları (en yeni üstte). */
  scheduledForOwner: (ownerId: string): ScheduledReport[] =>
    load().scheduledReports.filter((r) => r.ownerId === ownerId).sort((a, b) => b.createdAt - a.createdAt),
  /** Sahibin rapor geçmişi (en yeni üstte). */
  historyForOwner: (ownerId: string, limit = 100): ReportHistory[] =>
    load()
      .reportHistory.filter((r) => r.ownerId === ownerId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit),
  /** Sahip-güvenli tekil zamanlanmış rapor getir. */
  scheduledById: (ownerId: string, rid: string): ScheduledReport | undefined =>
    load().scheduledReports.find((r) => r.id === rid && r.ownerId === ownerId),

  /** Yeni zamanlanmış rapor oluştur. */
  createScheduled(
    ownerId: string,
    input: {
      type: ReportType;
      name: string;
      frequency: ReportFrequency;
      format: ReportFormat;
      recipients: string[];
      siteId: string | null;
    },
  ): ScheduledReport {
    const db = load();
    const now = Date.now();
    const rapor: ScheduledReport = {
      id: id("srep"),
      ownerId,
      type: input.type,
      name: input.name,
      frequency: input.frequency,
      format: input.format,
      recipients: input.recipients,
      siteId: input.siteId,
      active: true,
      createdAt: now,
      nextRunAt: sonrakiCalisma(input.frequency, now),
      lastRunAt: null,
    };
    db.scheduledReports.push(rapor);
    persist();
    return rapor;
  },

  /** Aktif/duraklat değiştir (sahip-güvenli). */
  toggleScheduled(ownerId: string, rid: string): ScheduledReport | undefined {
    const r = Reports.scheduledById(ownerId, rid);
    if (!r) return undefined;
    r.active = !r.active;
    // Yeniden aktifleştirilirse sonraki çalışmayı ileri al.
    if (r.active) r.nextRunAt = sonrakiCalisma(r.frequency);
    persist();
    return r;
  },

  /** Zamanlanmış raporu sil (sahip-güvenli). */
  removeScheduled(ownerId: string, rid: string): boolean {
    const r = Reports.scheduledById(ownerId, rid);
    if (!r) return false;
    const db = load();
    db.scheduledReports = db.scheduledReports.filter((x) => x.id !== rid);
    persist();
    return true;
  },

  /** Bir rapor üretimini geçmişe kaydet (indirme arşivi izi). */
  addHistory(
    ownerId: string,
    input: {
      type: ReportType;
      name: string;
      periodDays: number;
      format: ReportFormat;
      sizeBytes: number;
      createdBy: string;
      scheduledReportId?: string;
    },
  ): ReportHistory {
    const db = load();
    const kayit: ReportHistory = {
      id: id("rhist"),
      ownerId,
      type: input.type,
      name: input.name,
      periodDays: input.periodDays,
      format: input.format,
      sizeBytes: input.sizeBytes,
      createdBy: input.createdBy,
      createdAt: Date.now(),
      scheduledReportId: input.scheduledReportId,
    };
    db.reportHistory.unshift(kayit);
    if (db.reportHistory.length > 200) db.reportHistory.length = 200;
    persist();
    return kayit;
  },
};

// --------------------------------------------------------------- Experiments (A/B Test)

/** Boş sonuç iskeleti (taslak deneme için). */
function bosSonuc() {
  return { gosterim: 0, gecis: 0, engellenen: 0, ortSkor: 0 };
}

export const Experiments = {
  /** Sahibin denemeleri (en yeni üstte). */
  forOwner: (ownerId: string): Experiment[] =>
    load()
      .experiments.filter((e) => e.ownerId === ownerId)
      .sort((a, b) => b.createdAt - a.createdAt),

  /** Sahip-güvenli tekil getirme (ownerId eşleşmezse undefined). */
  byId: (ownerId: string, eid: string): Experiment | undefined =>
    load().experiments.find((e) => e.id === eid && e.ownerId === ownerId),

  /** Yeni deneme oluştur (taslak; hemen başlat opsiyonu var). */
  create(
    ownerId: string,
    input: {
      siteId: string;
      name: string;
      metric: ExperimentMetric;
      variantA: ExperimentVariantConfig;
      variantB: ExperimentVariantConfig;
      /** true ise "calisiyor" olarak başlar (startedAt set edilir). */
      hemenBaslat?: boolean;
    },
  ): Experiment {
    const db = load();
    const now = Date.now();
    const deney: Experiment = {
      id: id("exp"),
      ownerId,
      siteId: input.siteId,
      name: input.name,
      status: input.hemenBaslat ? "calisiyor" : "taslak",
      metric: input.metric,
      variantA: input.variantA,
      variantB: input.variantB,
      results: { A: bosSonuc(), B: bosSonuc() },
      createdAt: now,
      startedAt: input.hemenBaslat ? now : null,
      endedAt: null,
      winner: null,
    };
    db.experiments.push(deney);
    persist();
    return deney;
  },

  /**
   * Durum geçişi (sahip-güvenli). Zaman damgalarını yönetir:
   * - "calisiyor" → startedAt (ilk kez set edilir)
   * - "tamam" / "durduruldu" → endedAt
   * - tekrar "calisiyor" → endedAt/winner temizlenir (yeniden başlat)
   */
  updateStatus(ownerId: string, eid: string, status: ExperimentStatus): Experiment | undefined {
    const e = Experiments.byId(ownerId, eid);
    if (!e) return undefined;
    e.status = status;
    if (status === "calisiyor") {
      if (!e.startedAt) e.startedAt = Date.now();
      e.endedAt = null;
      e.winner = null;
    }
    if (status === "tamam" || status === "durduruldu") {
      e.endedAt = Date.now();
    }
    if (status === "taslak") {
      e.startedAt = null;
      e.endedAt = null;
      e.winner = null;
    }
    persist();
    return e;
  },

  /** Kazananı ilan et: deneme "tamam" olur, winner işaretlenir (sahip-güvenli). */
  setWinner(ownerId: string, eid: string, winner: "A" | "B"): Experiment | undefined {
    const e = Experiments.byId(ownerId, eid);
    if (!e) return undefined;
    e.winner = winner;
    e.status = "tamam";
    if (!e.endedAt) e.endedAt = Date.now();
    persist();
    return e;
  },

  /** Denemeyi sil (sahip-güvenli). */
  remove(ownerId: string, eid: string): boolean {
    const e = Experiments.byId(ownerId, eid);
    if (!e) return false;
    const db = load();
    db.experiments = db.experiments.filter((x) => x.id !== eid);
    persist();
    return true;
  },
};

// --------------------------------------------------------------- Integrations

export const Integrations = {
  forOwner: (ownerId: string): Integration[] =>
    load().integrations.filter((i) => i.ownerId === ownerId).sort((a, b) => b.createdAt - a.createdAt),

  byId: (ownerId: string, iid: string): Integration | undefined =>
    load().integrations.find((i) => i.id === iid && i.ownerId === ownerId),

  create(ownerId: string, input: { tur: Integration["tur"]; ad: string; hedef: string; olaylar: string[] }): Integration {
    const db = load();
    const ent: Integration = {
      id: id("int"),
      ownerId,
      tur: input.tur,
      ad: input.ad,
      hedef: input.hedef,
      olaylar: input.olaylar,
      aktif: true,
      createdAt: Date.now(),
      lastDelivery: null,
      lastStatus: null,
      gonderilen: 0,
    };
    db.integrations.push(ent);
    persist();
    return ent;
  },

  toggle(ownerId: string, iid: string): Integration | undefined {
    const ent = Integrations.byId(ownerId, iid);
    if (!ent) return undefined;
    ent.aktif = !ent.aktif;
    persist();
    return ent;
  },

  /** Teslimat sonucunu kaydet (entegrasyon motoru çağırır). */
  kaydetTeslimat(ownerId: string, iid: string, status: number): void {
    const ent = Integrations.byId(ownerId, iid);
    if (!ent) return;
    ent.lastDelivery = Date.now();
    ent.lastStatus = status;
    ent.gonderilen += 1;
    persist();
  },

  remove(ownerId: string, iid: string): boolean {
    const ent = Integrations.byId(ownerId, iid);
    if (!ent) return false;
    const db = load();
    db.integrations = db.integrations.filter((i) => i.id !== iid);
    persist();
    return true;
  },
};

// --------------------------------------------------------------- Promo Kodlar

/** Doğrulama sonucu — checkout ve panel tarafından ortak kullanılır. */
export interface PromoDogrulama {
  gecerli: boolean;
  /** Reddedilme sebebi (insan-okur, gecerli=false ise). */
  sebep?: string;
  promo?: PromoKod;
}

/** Bir promo koduna, verilen ham fiyat üzerinden indirim tutarını (TL) hesapla. */
export function promoIndirimTutari(promo: PromoKod, hamFiyat: number): number {
  if (hamFiyat <= 0) return 0;
  if (promo.tur === "yuzde") {
    const d = Math.round((hamFiyat * promo.deger) / 100);
    return Math.min(d, hamFiyat); // fiyatı aşamaz
  }
  // sabit
  return Math.min(promo.deger, hamFiyat); // fiyatı aşamaz
}

export const Promo = {
  /** Tüm promo kodları (en yeni üstte). */
  all: (): PromoKod[] => load().promoKodlar.slice().sort((a, b) => b.createdAt - a.createdAt),

  byId: (pid: string): PromoKod | undefined => load().promoKodlar.find((p) => p.id === pid),

  /** Koda göre bul (case-insensitive). */
  byKod: (kod: string): PromoKod | undefined => {
    const norm = (kod || "").trim().toUpperCase();
    if (!norm) return undefined;
    return load().promoKodlar.find((p) => p.kod === norm);
  },

  /**
   * Bir kodu GERÇEKTEN doğrular: var mı, aktif mi, süresi geçmiş mi, kullanım
   * limiti dolmuş mu ve (verilirse) plan kısıtına uygun mu. Sırayla kontrol
   * eder ve ilk başarısız koşulun sebebini döner.
   */
  dogrula(kod: string, planId?: string, userId?: string): PromoDogrulama {
    const promo = Promo.byKod(kod);
    if (!promo) return { gecerli: false, sebep: "Bu kod geçersiz." };
    if (!promo.aktif) return { gecerli: false, sebep: "Bu kod artık aktif değil." };
    if (promo.sonKullanma) {
      const bitis = Date.parse(promo.sonKullanma);
      if (!Number.isNaN(bitis) && bitis < Date.now()) {
        return { gecerli: false, sebep: "Bu kodun süresi dolmuş.", promo };
      }
    }
    if (promo.maxKullanim != null && promo.kullanilan >= promo.maxKullanim) {
      return { gecerli: false, sebep: "Bu kodun kullanım limiti dolmuş.", promo };
    }
    if (promo.planKisiti !== "hepsi" && planId && planId !== promo.planKisiti) {
      return { gecerli: false, sebep: `Bu kod yalnızca ${promo.planKisiti.toUpperCase()} planında geçerli.`, promo };
    }
    // ÇİFT-KULLANIM ÖNLEMİ: bir promo kodu kullanıcı başına 1 kez. userId
    // verildiyse (kullanım anında) ve bu kullanıcı kodu daha önce kullandıysa
    // reddet. Daha önce YALNIZCA global maxKullanim kontrol ediliyordu → aynı
    // kullanıcı sınırsız indirim alabiliyordu (gelir kaçağı).
    if (userId && load().promoKullanimlar.some((k) => k.promoId === promo.id && k.userId === userId)) {
      return { gecerli: false, sebep: "Bu kodu zaten kullandınız.", promo };
    }
    return { gecerli: true, promo };
  },

  create(input: {
    kod: string;
    tur: PromoTur;
    deger: number;
    aciklama?: string;
    maxKullanim: number | null;
    sonKullanma: string | null;
    aktif?: boolean;
    planKisiti?: "hepsi" | Plan;
  }): { promo?: PromoKod; hata?: string } {
    const db = load();
    const kod = (input.kod || "").trim().toUpperCase();
    if (!kod) return { hata: "Kod gerekli." };
    if (!/^[A-Z0-9]{3,24}$/.test(kod)) return { hata: "Kod 3-24 karakter, yalnızca harf ve rakam olmalı." };
    if (db.promoKodlar.some((p) => p.kod === kod)) return { hata: "Bu kod zaten var." };
    if (input.tur === "yuzde" && (input.deger <= 0 || input.deger > 100)) return { hata: "Yüzde değeri 1-100 arası olmalı." };
    if (input.tur === "sabit" && input.deger <= 0) return { hata: "Sabit indirim 0'dan büyük olmalı." };
    const promo: PromoKod = {
      id: id("promo"),
      kod,
      tur: input.tur,
      deger: Math.round(input.deger),
      aciklama: (input.aciklama || "").trim(),
      maxKullanim: input.maxKullanim != null && input.maxKullanim > 0 ? Math.round(input.maxKullanim) : null,
      kullanilan: 0,
      sonKullanma: input.sonKullanma || null,
      aktif: input.aktif ?? true,
      planKisiti: input.planKisiti ?? "hepsi",
      createdAt: Date.now(),
    };
    db.promoKodlar.push(promo);
    persist();
    return { promo };
  },

  update(pid: string, patch: Partial<Pick<PromoKod, "tur" | "deger" | "aciklama" | "maxKullanim" | "sonKullanma" | "aktif" | "planKisiti">>): PromoKod | undefined {
    const p = Promo.byId(pid);
    if (!p) return undefined;
    if (patch.tur !== undefined) p.tur = patch.tur;
    if (patch.deger !== undefined) p.deger = Math.round(patch.deger);
    if (patch.aciklama !== undefined) p.aciklama = patch.aciklama.trim();
    if (patch.maxKullanim !== undefined) p.maxKullanim = patch.maxKullanim != null && patch.maxKullanim > 0 ? Math.round(patch.maxKullanim) : null;
    if (patch.sonKullanma !== undefined) p.sonKullanma = patch.sonKullanma || null;
    if (patch.aktif !== undefined) p.aktif = patch.aktif;
    if (patch.planKisiti !== undefined) p.planKisiti = patch.planKisiti;
    persist();
    return p;
  },

  remove(pid: string): boolean {
    const db = load();
    const vardi = db.promoKodlar.some((p) => p.id === pid);
    if (!vardi) return false;
    db.promoKodlar = db.promoKodlar.filter((p) => p.id !== pid);
    persist();
    return true;
  },

  /** Tüm kullanım logları (opsiyonel: bir koda göre). */
  kullanimlar: (promoId?: string): PromoKullanim[] => {
    const all = load().promoKullanimlar;
    return promoId ? all.filter((k) => k.promoId === promoId) : all;
  },

  /**
   * Bir kullanımı kaydeder: kullanilan sayacını atomik artırır + log yazar.
   * Kod bulunamazsa/limit dolmuşsa undefined döner (yarış koşuluna karşı
   * son bir kez kontrol eder).
   */
  kullanimKaydet(input: { promoId: string; userId: string; planId: string; indirimTutari: number }): PromoKullanim | undefined {
    const db = load();
    const p = db.promoKodlar.find((x) => x.id === input.promoId);
    if (!p) return undefined;
    if (p.maxKullanim != null && p.kullanilan >= p.maxKullanim) return undefined;
    p.kullanilan += 1;
    const kayit: PromoKullanim = {
      id: id("prokull"),
      promoId: p.id,
      kod: p.kod,
      userId: input.userId,
      planId: input.planId,
      indirimTutari: input.indirimTutari,
      tarih: new Date().toISOString(),
    };
    db.promoKullanimlar.push(kayit);
    persist();
    return kayit;
  },
};

// --------------------------------------------------------------- İletişim mesajları

export const Iletisim = {
  /** Landing iletişim formundan gelen mesajı GERÇEKTEN kaydeder. */
  kaydet(input: { ad: string; eposta: string; konu: string; mesaj: string; ip?: string }): IletisimMesaji {
    const db = load();
    if (!db.iletisimMesajlari) db.iletisimMesajlari = [];
    const referans =
      "VEY-" +
      Date.now().toString(36).toUpperCase() +
      "-" +
      id("m").slice(-4).toUpperCase();
    const kayit: IletisimMesaji = {
      id: id("ilt"),
      referans,
      ad: input.ad,
      eposta: input.eposta,
      konu: input.konu,
      mesaj: input.mesaj,
      createdAt: Date.now(),
      okundu: false,
      ip: input.ip,
    };
    db.iletisimMesajlari.push(kayit);
    persist();
    return kayit;
  },
  tumu(): IletisimMesaji[] {
    return (load().iletisimMesajlari ?? []).slice().sort((a, b) => b.createdAt - a.createdAt);
  },
  okunduIsaretle(mid: string): void {
    const db = load();
    const m = (db.iletisimMesajlari ?? []).find((x) => x.id === mid);
    if (m) {
      m.okundu = true;
      persist();
    }
  },
};

// --------------------------------------------------------------- Nonce

export const Nonces = {
  useOnce(nonce: string, exp: number): boolean {
    const db = load();
    const now = Date.now();
    db.usedNonces = db.usedNonces.filter((n) => n.exp > now);
    if (db.usedNonces.some((n) => n.nonce === nonce)) return false;
    db.usedNonces.push({ nonce, exp });
    persist();
    return true;
  },
};

/**
 * PERFORMANS: Türetilmiş katman (ör. ozet.ts) için hafif önbellek imzası.
 * mtime + writeSeq birleşimi; her yazımda değişir. Değeri sabit kaldığı sürece
 * alttaki DB durumu değişmemiştir → memoize edilen türev güvenle yeniden
 * kullanılabilir. Yazma sonrası imza değişir → eski türev otomatik geçersiz.
 */
export function cacheSignature(): string {
  // load()'ı çağırmadan önce mtime güncel olsun diye tetikle (ilk erişimde
  // cache kurulur; sonraki çağrılarda mtime karşılaştırması ucuzdur).
  load();
  return `${cacheMtime}:${writeSeq}`;
}

export function _resetCache(): void {
  cache = null;
  // Türetilmiş önbelleği de geçersizleştir (anahtar cache kimliğine bağlı;
  // yine de açıkça sıfırla ki yeniden yükleme sonrası ilk deriveEnsure temiz
  // kurulsun ve testlerde eski owner memo'ları sızmasın).
  deriveKeyCache = null;
  deriveKeyMtime = -1;
  deriveKeyWrite = -1;
  ownerSitesMemo = new Map();
  ownerSiteIdMemo = new Map();
  eventsBySiteMemo = null;
}
