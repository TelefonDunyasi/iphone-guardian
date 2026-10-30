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

    if (!supabaseUrl || !publicKey) {
      return reply({ error: "Sunucu yapılandırması eksik." }, 500);
    }

    const supabase = createClient(supabaseUrl, publicKey, {
      global: { headers: { Authorization: authorization } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return reply({ error: "Geçerli oturum bulunamadı." }, 401);
    }

    const body = await req.json();
    const input = body?.url;

    if (typeof input !== "string" || !input.trim() || input.length > 2048) {
      return reply({ error: "Geçerli bir bağlantı gir." }, 400);
    }

    let parsed: URL;
    try {
      parsed = new URL(input.trim());
    } catch {
      return reply({ error: "Bağlantı biçimi geçersiz." }, 400);
    }

    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      !parsed.hostname ||
      parsed.hostname.length > 253
    ) {
      return reply({ error: "Yalnızca geçerli HTTP veya HTTPS bağlantıları kontrol edilebilir." }, 400);
    }

    const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
    const risks: string[] = [];
    let score = 0;

    const addRisk = (points: number, message: string) => {
      score += points;
      risks.push(message);
    };

    if (parsed.username || parsed.password) {
      addRisk(50, "Adresin içine kullanıcı adı veya parola yerleştirilmiş.");
    }

    const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);
    const ipv6OrLiteral = host.startsWith("[") || host === "localhost" || host.endsWith(".localhost");
    if (ipv4 || ipv6OrLiteral) {
      addRisk(35, "Bağlantı normal bir alan adı yerine IP veya yerel adres kullanıyor.");
    }

    if (host.includes("xn--")) {
      addRisk(30, "Alan adı uluslararası kodlanmış karakterler içeriyor; benzer görünen harflere dikkat et.");
    }

    const shorteners = [
      "bit.ly", "tinyurl.com", "t.co", "is.gd",
      "cutt.ly", "rb.gy", "shorturl.at", "ow.ly"
    ];
    if (shorteners.some((domain) => host === domain || host.endsWith("." + domain))) {
      addRisk(20, "Kısaltılmış bağlantı hedef adresi gizleyebilir.");
    }

    const labels = host.split(".");
    if (labels.length >= 5) {
      addRisk(15, "Alan adında olağandan fazla alt alan adı bulunuyor.");
    }

    if (parsed.port && !["80", "443"].includes(parsed.port)) {
      addRisk(15, "Bağlantı standart dışı bir port kullanıyor.");
    }

    score = Math.min(score, 100);
    const status = score >= 50 ? "danger" : score > 0 ? "review" : "no_match";

    return reply({
      status,
      riskScore: score,
      risks,
      checkedAt: new Date().toISOString(),
      provider: "Guard Yerel Risk Analizi",
      disclaimer:
        "Bu analiz yalnızca URL biçimindeki bazı risk işaretlerini değerlendirir. Canlı tehdit istihbaratı veya zararlı site veritabanı sorgusu değildir. Risk işareti bulunmaması bağlantının güvenli olduğunu kanıtlamaz."
    });
  } catch (error) {
    console.error("Guard URL analysis error:", error);
    return reply({ error: "Kontrol tamamlanamadı." }, 500);
  }
});
