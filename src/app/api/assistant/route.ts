import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Assistant, Events, IpRep, Campaigns, Rules, Sites } from "@/lib/db/db";
import { korumaOzeti } from "@/lib/ozet";

/**
 * Specter Zeka — kural-tabanlı akıllı asistan. Kullanıcının GERÇEK
 * verisinden bağlam kurup soruya göre analiz üretir. (Gemini anahtarı
 * varsa oraya da bağlanabilir; şimdilik güçlü yerel motor.)
 */
function yanitUret(soru: string, ownerId: string): { cevap: string; kaynaklar: { ad: string; href: string }[] } {
  const q = soru.toLocaleLowerCase("tr");
  const ozet = korumaOzeti(ownerId);
  const events = Events.forOwner(ownerId, 2000);
  const son24 = events.filter((e) => e.ts > Date.now() - 86400000);
  const kaynaklar: { ad: string; href: string }[] = [];

  // Coğrafya sorusu
  if (q.includes("ülke") || q.includes("nere") || q.includes("coğraf") || q.includes("konum")) {
    const m = new Map<string, number>();
    son24.filter((e) => e.verdict === "blocked").forEach((e) => m.set(e.country, (m.get(e.country) || 0) + 1));
    const top = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    kaynaklar.push({ ad: "Tehdit İstihbaratı", href: "/panel/tehdit" });
    return {
      cevap: `Son 24 saatte **en çok bot trafiği** şu ülkelerden geldi:\n\n${top.map(([k, v], i) => `${i + 1}. **${k}** — ${v} engellenen istek`).join("\n")}\n\nBu ülkelerden gelen datacenter/VPN IP'lerini **Kurallar** bölümünden challenge'a tabi tutmanı öneririm.`,
      kaynaklar,
    };
  }

  // Kimlik doldurma / login saldırısı
  if (q.includes("kimlik") || q.includes("login") || q.includes("giriş") || q.includes("brute") || q.includes("credential")) {
    const camp = Campaigns.forOwner(ownerId).find((c) => c.botClass === "credential_stuffing");
    kaynaklar.push({ ad: "Kurallar", href: "/panel/kurallar" }, { ad: "Kampanyalar", href: "/panel/tehdit/kampanyalar" });
    return {
      cevap: `**Kimlik doldurma (credential stuffing)** saldırısını durdurmak için:\n\n- **/login yolunda hız limiti** kuralı ekle (IP başına dakikada 5 deneme)\n- Datacenter ve VPN ASN'lerini **challenge** aksiyonuna al\n- Görünmez modu açık tut — meşru kullanıcılar sürtünme yaşamaz\n${camp ? `\nŞu an **${camp.name}** kampanyası ${camp.status === "active" ? "aktif" : "durdurulmuş"} durumda; ${camp.blockedRequests.toLocaleString("tr-TR")} istek engellendi.` : ""}`,
      kaynaklar,
    };
  }

  // AI ajan
  if (q.includes("ai") || q.includes("gpt") || q.includes("claude") || q.includes("ajan") || q.includes("yapay zeka")) {
    const ai = son24.filter((e) => e.botClass === "ai_agent").length;
    kaynaklar.push({ ad: "Kurallar", href: "/panel/kurallar" });
    return {
      cevap: `Son 24 saatte **${ai} AI ajan denemesi** tespit ettim (GPTBot, ClaudeBot vb.).\n\nGhost-font çekirdeğimiz bu ajanları üç katmanda durdurur:\n- **Glyph-substitution** — DOM'da metin yok\n- **OCR-karşıtı gürültü** — vision modeli şaşırır\n- **Davranış skoru** — otomasyon insan gibi davranamaz\n\n'AI ajan tespiti' kuralın aktifse bu istekler otomatik challenge'a tabi tutuluyor.`,
      kaynaklar,
    };
  }

  // Skor / durum
  if (q.includes("skor") || q.includes("durum") || q.includes("özet") || q.includes("nasıl") || q.includes("performans")) {
    kaynaklar.push({ ad: "Genel Bakış", href: "/panel" }, { ad: "Analitik", href: "/panel/analitik" });
    return {
      cevap: `**Koruma skorun: ${ozet.skor}/100**\n\n- Tehdit tespiti: %${ozet.tespit}\n- Kapsama: %${ozet.kapsam}\n- Bot oranı (30g): %${(ozet.blockRate * 100).toFixed(1)}\n- Aktif kampanya: ${ozet.aktifKampanya}\n\n${ozet.skor >= 80 ? "Korumaların güçlü durumda. 👍" : "Skoru yükseltmek için pasif sitelerini 'challenge' moduna al ve kritik uyarıları incele."}`,
      kaynaklar,
    };
  }

  // IP / itibar
  if (q.includes("ip") || q.includes("itibar") || q.includes("engel")) {
    const kotu = IpRep.forOwner().filter((r) => r.threatScore > 60).length;
    kaynaklar.push({ ad: "Tehdit İstihbaratı", href: "/panel/tehdit" });
    return {
      cevap: `Şu an **${kotu} kötü ün IP** izliyorum (tehdit skoru 60+).\n\nEn riskli kaynaklar genellikle **datacenter ve VPN ASN'leri**. Bu IP'leri kural motorunda kalıcı engelleyebilir veya challenge'a tabi tutabilirsin. Tehdit İstihbaratı sayfasından tam listeyi filtreleyebilirsin.`,
      kaynaklar,
    };
  }

  // varsayılan
  kaynaklar.push({ ad: "Genel Bakış", href: "/panel" });
  return {
    cevap: `Trafiğini analiz edebilirim. Şu an **koruma skorun ${ozet.skor}/100** ve son 24 saatte **${son24.filter((e) => e.verdict === "blocked").length} bot** engelledim.\n\nŞunları sorabilirsin:\n- "Son 24 saatte en çok hangi ülkeden bot geldi?"\n- "Kimlik doldurma saldırısını nasıl durdururum?"\n- "AI ajan trafiği ne durumda?"\n- "Koruma skorumu nasıl yükseltirim?"`,
    kaynaklar,
  };
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { soru } = await req.json().catch(() => ({}));
  if (!soru?.trim()) return NextResponse.json({ error: "soru gerekli" }, { status: 400 });

  Assistant.add(user.id, "user", soru);
  const { cevap, kaynaklar } = yanitUret(soru, user.id);
  Assistant.add(user.id, "assistant", cevap);
  return NextResponse.json({ cevap, kaynaklar });
}
