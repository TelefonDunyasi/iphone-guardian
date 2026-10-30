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

    // PhishTank checks the submitted URL against its community phishing database.
    // Keep the application key in Supabase secrets; never expose it in the browser.
    let phishTankStatus: "listed" | "not_listed" | "unavailable" = "unavailable";
    let phishTankVerified = false;
    let phishTankDetail: string | null = null;
    let phishTankMessage = "PhishTank sorgusu şu anda tamamlanamadı.";

    try {
      const form = new URLSearchParams({
        url: parsed.href,
        format: "json",
      });
      const appKey = Deno.env.get("PHISHTANK_APP_KEY");
      if (appKey) form.set("app_key", appKey);

      const response = await fetch("https://checkurl.phishtank.com/checkurl/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Guard-iPhoneGuardian/1.0",
        },
        body: form.toString(),
        signal: AbortSignal.timeout(9000),
      });

      if (response.ok) {
        const result = await response.json();
        const record = result?.results?.url;
        if (record?.in_database === true || record?.in_database === "true") {
          const verified = record?.verified === true || record?.verified === "y" || record?.verified === "true";
          const valid = record?.valid === true || record?.valid === "y" || record?.valid === "true";
          if (verified && valid) {
            phishTankStatus = "listed";
            phishTankVerified = true;
            phishTankMessage = "PhishTank topluluk veritabanında doğrulanmış ve geçerli oltalama kaydı bulundu.";
            if (record?.phish_detail_page && typeof record.phish_detail_page === "string" &&
                record.phish_detail_page.startsWith("https://")) {
              phishTankDetail = record.phish_detail_page;
            }
            addRisk(100, "PhishTank veritabanında doğrulanmış oltalama bağlantısı olarak listeleniyor.");
          } else {
            phishTankStatus = "listed";
            phishTankMessage = "PhishTank veritabanında kayıt bulundu ancak doğrulama/geçerlilik durumu kesin değil.";
            addRisk(35, "PhishTank'ta kayıt var; doğrulama durumu kesin olmadığından dikkatli ol.");
          }
        } else {
          phishTankStatus = "not_listed";
          phishTankMessage = "PhishTank veritabanında bu URL için eşleşme bulunmadı.";
        }
      } else {
        console.error("PhishTank lookup status:", response.status);
        phishTankMessage = response.status === 509
          ? "PhishTank istek sınırına ulaşıldı; daha sonra tekrar dene."
          : "PhishTank servisi şu anda yanıt vermiyor.";
      }
    } catch (lookupError) {
      console.error("PhishTank lookup failed:", lookupError);
      phishTankMessage = "PhishTank sorgusu zaman aşımına uğradı veya geçici olarak kullanılamıyor.";
    }

    score = Math.min(score, 100);
    const status = score >= 50 ? "danger" : score > 0 ? "review" : "no_match";

    if (risks.length === 0) {
      risks.push("Belirlenen yerel yapısal risk işaretlerine rastlanmadı.");
    }

    return reply({
      status,
      riskScore: score,
      risks,
      phishTankStatus,
      phishTankVerified,
      phishTankMessage,
      phishTankDetail,
      checkedAt: new Date().toISOString(),
      provider: phishTankStatus === "unavailable"
        ? "Guard Yerel Risk Analizi · PhishTank erişilemedi"
        : "Guard Yerel Risk Analizi + PhishTank",
      disclaimer:
        "PhishTank eşleşmesi yalnızca topluluk veritabanındaki kayıtları gösterir. Eşleşme bulunmaması bağlantının güvenli olduğunu kanıtlamaz. PhishTank erişilemezse sonuç yerel URL analizine dayanır. URL, kontrol amacıyla PhishTank servisine gönderilir."
    });
  } catch (error) {
    console.error("Guard URL analysis error:", error);
    return reply({ error: "Kontrol tamamlanamadı." }, 500);
  }
});
