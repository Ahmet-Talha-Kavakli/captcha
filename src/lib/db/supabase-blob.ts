/**
 * Supabase kalıcı depo — TÜM uygulama state'ini TEK satır/blob olarak saklar.
 * ================================================================
 * db.ts senkron bir in-memory `cache` (Database) üzerinde çalışır ve bunu
 * dosyaya yazardı. Vercel'de dosya sistemi read-only → veri kalıcı olmaz.
 * Bu katman `cache`'i Supabase'de tek bir jsonb satırında tutar:
 *   tablo: veylify_state (id text pk, data jsonb, updated_at timestamptz)
 *   satır: id = 'main'
 *
 * db.ts bunu şöyle kullanır:
 *   - BOOT: bir kez `blobYukle()` ile Supabase'den state çekilir (async).
 *   - YAZMA: her persist bellekteki cache'i günceller + `blobKaydet(cache)`
 *     write-behind (fire-and-forget) ile Supabase'e yazar. Senkron API bozulmaz.
 *
 * Supabase yoksa (env yok) katman devre dışı — db.ts dosya moduna düşer (yerel
 * geliştirme). Böylece hem yerelde hem Vercel'de çalışır.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./schema";

const URL = process.env.SUPABASE_URL?.trim();
const KEY = process.env.SUPABASE_SERVICE_KEY?.trim();
const TABLO = "veylify_state";
const SATIR_ID = "main";

export const supabaseAktif = Boolean(URL && KEY);

/**
 * Supabase isteklerinin ÜST SINIRI (ms).
 *
 * NEDEN: Supabase erişilemez olduğunda (proje duraklatılmış, kota, geçici arıza)
 * istek varsayılan olarak ~20 sn timeout'a kadar bekliyor ve HER sunucu-render
 * sayfası bunu bekliyordu → tüm site 20 sn'de açılıyordu (ölçüldü: HTTP 522).
 * Kısa bir sınırla sayfa, veritabanı olmadan da (bellekteki cache/seed ile)
 * HIZLI açılır — kullanıcı bekletilmez.
 */
const ISTEK_TIMEOUT_MS = 4000;

/** fetch'i AbortController ile süre sınırına bağlar. */
function zamanSinirliFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const kontrol = new AbortController();
  const zamanlayici = setTimeout(() => kontrol.abort(), ISTEK_TIMEOUT_MS);
  return fetch(input, { ...init, signal: kontrol.signal }).finally(() => clearTimeout(zamanlayici));
}

let _client: SupabaseClient | null = null;
function client(): SupabaseClient {
  if (!_client) {
    _client = createClient(URL!, KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: zamanSinirliFetch },
    });
  }
  return _client;
}

/** State blob'unu Supabase'den çeker. Satır yoksa/erişilemezse null. */
export async function blobYukle(): Promise<Database | null> {
  if (!supabaseAktif) return null;
  try {
    const { data, error } = await client()
      .from(TABLO)
      .select("data")
      .eq("id", SATIR_ID)
      .maybeSingle();
    if (error) {
      console.error("[supabase-blob] yükleme hatası:", error.message);
      return null;
    }
    return (data?.data as Database) ?? null;
  } catch (e) {
    // Timeout/abort veya ağ hatası — sayfa bellekteki state ile devam etsin.
    console.error("[supabase-blob] yükleme erişilemedi:", String(e).slice(0, 120));
    return null;
  }
}

/** State blob'unu Supabase'e yazar (upsert). Hatayı yutar (write-behind). */
export async function blobKaydet(db: Database): Promise<void> {
  if (!supabaseAktif) return;
  try {
    const { error } = await client()
      .from(TABLO)
      .upsert(
        { id: SATIR_ID, data: db, updated_at: new Date().toISOString() },
        { onConflict: "id" },
      );
    if (error) console.error("[supabase-blob] kaydetme hatası:", error.message);
  } catch (e) {
    // Timeout/abort — yazma kaybı write-behind semantiğiyle tolere edilir;
    // isteğin kendisi asılı kalmamalı (kullanıcı bekletilmez).
    console.error("[supabase-blob] kaydetme erişilemedi:", String(e).slice(0, 120));
  }
}
