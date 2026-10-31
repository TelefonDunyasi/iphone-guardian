const corsHeaders = {
  "Access-Control-Allow-Origin": "https://telefondunyasi.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin",
};
function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}
function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
      host.endsWith(".internal") || host.includes(":") || host === "0.0.0.0") return true;
  const parts = host.split(".");
  if (parts.length !== 4 || !parts.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255)) return false;
  const [a, b] = parts.map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127);
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Yalnızca POST isteği kabul edilir." });
  const origin = req.headers.get("origin");
  if (origin && origin !== "https://telefondunyasi.github.io") return json(403, { error: "Bu kaynaktan gelen isteğe izin verilmiyor." });
  let body: { url?: unknown };
  try { body = await req.json(); } catch { return json(400, { error: "Geçerli JSON gövdesi gerekli." }); }
  if (typeof body.url !== "string" || body.url.length > 2048) return json(400, { error: "Kontrol edilecek adres eksik veya çok uzun." });
  let parsed: URL;
  try { parsed = new URL(body.url); } catch { return json(400, { error: "Geçerli bir web adresi gir." }); }
  if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password || isPrivateOrLocalHost(parsed.hostname)) {
    return json(400, { error: "Yalnızca herkese açık HTTP/HTTPS adresleri kontrol edilebilir." });
  }
  const params = new URLSearchParams({ url: parsed.href, format: "json" });
  const appKey = Deno.env.get("PHISHTANK_APP_KEY");
  if (appKey) params.set("app_key", appKey);
  try {
    const response = await fetch("https://checkurl.phishtank.com/checkurl/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json", "User-Agent": "iPhoneGuardian/1.0 (URL reputation lookup)" },
      body: params.toString(),
      signal: AbortSignal.timeout(12000),
    });
    if (response.status === 509 || response.status === 429) return json(429, { error: "PhishTank istek sınırına ulaşıldı. Biraz sonra tekrar dene." });
    if (!response.ok) return json(502, { error: "PhishTank servisi şu anda yanıt vermiyor." });
    const result = await response.json();
    const record = result?.results;
    if (!record || typeof record.in_database !== "boolean") return json(502, { error: "PhishTank geçerli bir yanıt döndürmedi." });
    const verified = record.verified === true || record.verified === "y" || record.verified === "yes";
    const valid = record.valid === true || record.valid === "y" || record.valid === "yes";
    return json(200, {
      inDatabase: record.in_database, verified, valid,
      matched: record.in_database && verified && valid,
      phishId: typeof record.phish_id === "number" || typeof record.phish_id === "string" ? record.phish_id : null,
      detailPage: typeof record.phish_detail_page === "string" ? record.phish_detail_page : null,
      source: "PhishTank",
    });
  } catch {
    return json(502, { error: "PhishTank bağlantısı zaman aşımına uğradı veya geçici olarak kullanılamıyor." });
  }
});
