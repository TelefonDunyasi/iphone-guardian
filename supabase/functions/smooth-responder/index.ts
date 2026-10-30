import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://telefondunyasi.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors });

  const auth = req.headers.get("Authorization");
  if (!auth) return new Response(JSON.stringify({ error: "Giriş gerekli." }), { status: 401, headers: cors });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ? JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")!).default : Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return new Response(JSON.stringify({ error: "Geçerli oturum bulunamadı." }), { status: 401, headers: cors });

  try {
    const { url } = await req.json();
    if (typeof url !== "string" || url.length > 2048) return new Response(JSON.stringify({ error: "Geçerli bir bağlantı gir." }), { status: 400, headers: cors });
    let parsed: URL;
    try { parsed = new URL(url.trim()); } catch { return new Response(JSON.stringify({ error: "Bağlantı biçimi geçersiz." }), { status: 400, headers: cors }); }
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname.includes(".")) return new Response(JSON.stringify({ error: "Yalnızca geçerli HTTP veya HTTPS bağlantıları kontrol edilebilir." }), { status: 400, headers: cors });

    const apiKey = Deno.env.get("WEBRISK_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "Bağlantı kontrol servisi henüz yapılandırılmadı." }), { status: 503, headers: cors });
    const params = new URLSearchParams({ uri: parsed.href });
    for (const type of ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"]) params.append("threatTypes", type);
    const response = await fetch("https://webrisk.googleapis.com/v1/uris:search?" + params.toString() + "&key=" + encodeURIComponent(apiKey));
    if (!response.ok) {
      const detail = await response.text();
      console.error("Web Risk provider error", response.status, detail.slice(0, 300));
      return new Response(JSON.stringify({ error: "Güvenlik sağlayıcısına şu anda ulaşılamıyor." }), { status: 502, headers: cors });
    }
    const result = await response.json();
    const threatTypes = result?.threat?.threatTypes ?? [];
    return new Response(JSON.stringify({
      status: threatTypes.length ? "danger" : "no_match",
      threatTypes,
      checkedAt: new Date().toISOString(),
      provider: "Google Web Risk",
      disclaimer: "Eşleşme bulunmaması bağlantının kesinlikle güvenli olduğunu garanti etmez."
    }), { status: 200, headers: cors });
  } catch (error) {
    console.error("url-check error", error);
    return new Response(JSON.stringify({ error: "Kontrol tamamlanamadı." }), { status: 500, headers: cors });
  }
});
