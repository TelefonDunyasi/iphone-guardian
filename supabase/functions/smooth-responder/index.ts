import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://telefondunyasi.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return reply({ error: "Giriş gerekli." }, 401);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    let publicKey =
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

    if (!publicKey) {
      const keyBundle = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
      if (keyBundle) {
        try {
          const parsedKeys = JSON.parse(keyBundle);
          publicKey = parsedKeys.default || parsedKeys.publishable || null;
        } catch {
          publicKey = keyBundle;
        }
      }
    }

    if (!supabaseUrl || !publicKey) return reply({ error: "Sunucu yapılandırması eksik." }, 500);

    const supabase = createClient(supabaseUrl, publicKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return reply({ error: "Geçerli oturum bulunamadı." }, 401);

    const body = await req.json();
    const input = body?.url;
    if (typeof input !== "string" || !input.trim() || input.length > 2048) {
      return reply({ error: "Geçerli bir bağlantı gir." }, 400);
    }

    let parsed: URL;
    try { parsed = new URL(input.trim()); }
    catch { return reply({ error: "Bağlantı biçimi geçersiz." }, 400); }

    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname || parsed.hostname.length > 253) {
      return reply({ error: "Yalnızca geçerli HTTP veya HTTPS bağlantıları kontrol edilebilir." }, 400);
    }

    const apiKey = Deno.env.get("WEBRISK_API_KEY");
    if (!apiKey) return reply({ error: "Google Web Risk API anahtarı sunucuda bulunamadı." }, 503);

    const params = new URLSearchParams({ uri: parsed.href });
    for (const type of ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"]) {
      params.append("threatTypes", type);
    }

    const providerResponse = await fetch(
      "https://webrisk.googleapis.com/v1/uris:search?" + params.toString() + "&key=" + encodeURIComponent(apiKey),
      { method: "GET", signal: AbortSignal.timeout(10000) }
    );

    if (!providerResponse.ok) {
      const detail = await providerResponse.text();
      console.error("Google Web Risk provider error:", providerResponse.status, detail.slice(0, 500));
      return reply({
        error: providerResponse.status === 403
          ? "Google Web Risk isteği reddetti. Google Cloud API ve faturalandırma ayarlarını kontrol et."
          : "Google Web Risk servisine şu anda ulaşılamıyor."
      }, 502);
    }

    const result = await providerResponse.json();
    const threatTypes: string[] = result?.threat?.threatTypes ?? [];

    const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
    const risks: string[] = [];
    let score = 0;
    const addRisk = (points: number, message: string) => { score += points; risks.push(message); };

    if (parsed.username || parsed.password) addRisk(50, "Adresin içine kullanıcı adı veya parola yerleştirilmiş.");
    const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);
    const localHost = host.startsWith("[") || host === "localhost" || host.endsWith(".localhost");
    if (ipv4 || localHost) addRisk(35, "Bağlantı normal bir alan adı yerine IP veya yerel adres kullanıyor.");
    if (host.includes("xn--")) addRisk(30, "Alan adı uluslararası kodlanmış karakterler içeriyor; benzer görünen harflere dikkat et.");
    const shorteners = ["bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy", "shorturl.at", "ow.ly"];
    if (shorteners.some((domain) => host === domain || host.endsWith("." + domain))) addRisk(20, "Kısaltılmış bağlantı hedef adresi gizleyebilir.");
    if (host.split(".").length >= 5) addRisk(15, "Alan adında olağandan fazla alt alan adı bulunuyor.");
    if (parsed.port && !["80", "443"].includes(parsed.port)) addRisk(15, "Bağlantı standart dışı bir port kullanıyor.");

    if (threatTypes.length) addRisk(100, "Google Web Risk bilinen tehdit listesinde eşleşme buldu.");
    score = Math.min(score, 100);
    if (!risks.length) risks.push("Belirlenen yerel yapısal risk işaretlerine rastlanmadı.");

    const status = threatTypes.length || score >= 50 ? "danger" : score > 0 ? "review" : "no_match";
    return reply({
      status,
      riskScore: score,
      risks,
      threatTypes,
      checkedAt: new Date().toISOString(),
      provider: "Google Web Risk + Guard Yerel Risk Analizi",
      disclaimer: "Google Web Risk kontrol edilen tehdit listelerinde eşleşme bulmadıysa bile bu bağlantının kesinlikle güvenli olduğu anlamına gelmez. Yerel adres analizi de tek başına güvenlik garantisi değildir."
    });
  } catch (error) {
    console.error("Guard URL analysis error:", error);
    return reply({ error: "Kontrol tamamlanamadı." }, 500);
  }
});
