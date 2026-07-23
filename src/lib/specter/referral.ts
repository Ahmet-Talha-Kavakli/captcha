import "server-only";
import { Users } from "@/lib/db/db";
import { MARKA } from "@/lib/marka";
import type { User } from "@/lib/db/schema";

/**
 * Referral (Davet Et Kazan)
 * =========================
 * Her kullanıcının kalıcı bir davet kodu vardır (id'den deterministik türetilir —
 * ayrı alan gerektirmez). Davet linkiyle (`/kayit?ref=KOD`) kaydolan yeni kullanıcı:
 *   • DAVET EDEN'e ODUL_DAVET_EDEN kredi,
 *   • DAVET EDİLEN'e ODUL_DAVET_EDILEN kredi verilir (çift taraflı teşvik).
 * Kötüye kullanım: kendini davet edemez; bir kullanıcı yalnız bir kez ödüllenir
 * (davetEdenKod bir kez set edilir).
 */

export const ODUL_DAVET_EDEN = 100; // davet eden kişiye
export const ODUL_DAVET_EDILEN = 50; // davetle gelen kişiye

/** Kullanıcı id'sinden kararlı, okunur bir davet kodu türet (ör. "VEY-7A3F2B"). */
export function davetKodu(user: Pick<User, "id">): string {
  // id "usr_<hex>" → hex'in ilk 6 karakteri, büyük harf.
  const hex = user.id.replace(/^usr_/, "").slice(0, 6).toUpperCase();
  return `VEY-${hex}`;
}

/** Davet kodundan kullanıcıyı bul (kod → user). Geçersizse null. */
export function koddanKullanici(kod: string): User | null {
  const temiz = kod.trim().toUpperCase();
  return Users.all().find((u) => davetKodu(u) === temiz) ?? null;
}

/** Tam davet linki. */
export function davetLinki(user: Pick<User, "id">): string {
  return `${MARKA.url}/kayit?ref=${davetKodu(user)}`;
}

/**
 * Yeni kaydolan kullanıcıya referral ödülünü uygula (kayıt sonrası çağrılır).
 * @returns ödül verildi mi + davet eden (varsa).
 */
export function referralUygula(yeniUser: User, refKod?: string | null): { odullendi: boolean; davetEden?: User } {
  if (!refKod) return { odullendi: false };
  const davetEden = koddanKullanici(refKod);
  // Geçersiz kod veya kendini davet → ödül yok.
  if (!davetEden || davetEden.id === yeniUser.id) return { odullendi: false };
  // Bu kullanıcı zaten bir davetle geldiyse tekrar ödüllenmez.
  if (yeniUser.davetEdenKod) return { odullendi: false };

  // Davet edilen: kaydı işaretle + hoşgeldin kredisi.
  Users.davetEdeniAyarla(yeniUser.id, davetKodu(davetEden));
  Users.krediHareket(yeniUser.id, "bonus", ODUL_DAVET_EDILEN, `Davet bonusu (${davetEden.name})`);

  // Davet eden: ödül kredisi + sayaç.
  Users.krediHareket(davetEden.id, "bonus", ODUL_DAVET_EDEN, `Davet ödülü (${yeniUser.name})`);
  Users.davetKazancEkle(davetEden.id, ODUL_DAVET_EDEN);

  return { odullendi: true, davetEden };
}

/** Bir kullanıcının referral istatistikleri (panel için). */
export function referralIstatistik(user: User): {
  kod: string;
  link: string;
  davetSayisi: number;
  kazanc: number;
  odulEden: number;
  odulEdilen: number;
} {
  return {
    kod: davetKodu(user),
    link: davetLinki(user),
    davetSayisi: user.davetSayisi ?? 0,
    kazanc: user.davetKazanci ?? 0,
    odulEden: ODUL_DAVET_EDEN,
    odulEdilen: ODUL_DAVET_EDILEN,
  };
}
