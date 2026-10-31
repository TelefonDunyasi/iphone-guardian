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
      host.endsWith(".internal") || host === "::1" || host === "0.0.0.0") return true;
  const parts = host.split(".");
  if (parts.length !== 4 || !parts.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255)) return false;
  const [a, b] = parts.map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") return json(405, { error: "Yalnızca POST isteği kabul edilir." });

  const origin = req.headers.get("origin");
  if (origin && origin !== "https://telefondunyasi.github.io") {
    return json(403, { error: "Bu kaynaktan gelen isteğe izin verilmiyor." });
  }

  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Geçerli JSON gövdesi gerekli." });
  }

  if (typeof body.url !== "string" || body.url.length > 2048) {
    return json(400, { error: "Kontrol edilecek adres eksik veya çok uzun." });
  }

  let parsed: URL;
  try {
    parsed = new URL(body.url);
  } catch {
    return json(400, { error: "Geçerli bir web adresi gir." });
  }
  if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname ||
      parsed.username || parsed.password || isPrivateOrLocalHost(parsed.hostname)) {
    return json(400, { error: "Yalnızca herkese açık HTTP/HTTPS adresleri kontrol edilebilir." });
  }

  const apiKey = Deno.env.get("GOOGLE_WEBRISK_API_KEY");
  if (!apiKey) return json(503, { error: "Google Web Risk bağlantısı henüz yapılandırılmadı." });

  const endpoint = new URL("https://webrisk.googleapis.com/v1/uris:search");
  endpoint.searchParams.append("threatTypes", "MALWARE");
  endpoint.searchParams.append("threatTypes", "SOCIAL_ENGINEERING");
  endpoint.searchParams.append("threatTypes", "UNWANTED_SOFTWARE");
  endpoint.searchParams.set("uri", parsed.href);
  endpoint.searchParams.set("key", apiKey);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 429) return json(429, { error: "Tehdit servisi geçici istek sınırına ulaştı. Biraz sonra tekrar dene." });
    if (!response.ok) {
      return json(response.status === 403 ? 503 : 502, {
        error: response.status === 403
          ? "Google Web Risk API anahtarı, API etkinleştirmesi veya faturalandırma ayarı kontrol edilmeli."
          : "Google Web Risk servisine şu anda ulaşılamıyor.",
      });
    }
    const result = await response.json();
    const threatTypes: string[] = Array.isArray(result?.threat?.threatTypes)
      ? result.threat.threatTypes.filter((value: unknown) => typeof value === "string")
      : [];
    return json(200, {
      matched: threatTypes.length > 0,
      threatTypes,
      expireTime: typeof result?.threat?.expireTime === "string" ? result.threat.expireTime : null,
      source: "Google Web Risk",
    });
  } catch {
    return json(502, { error: "Google Web Risk bağlantısı zaman aşımına uğradı veya geçici olarak kullanılamıyor." });
  }
});
