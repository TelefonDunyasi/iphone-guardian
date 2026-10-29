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
    const { email } = await req.json();
    if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return new Response(JSON.stringify({ error: "Geçerli bir e-posta adresi gir." }), { status: 400, headers: cors });
    }
    const apiKey = Deno.env.get("HIBP_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "E-posta ihlal kontrol servisi henüz yapılandırılmadı." }), { status: 503, headers: cors });

    const response = await fetch("https://haveibeenpwned.com/api/v3/breachedAccount/" + encodeURIComponent(email.trim()), {
      headers: { "hibp-api-key": apiKey, "user-agent": "iPhone Guardian" }
    });
    if (response.status === 404) return new Response(JSON.stringify({
      status: "no_known_breach",
      breaches: [],
      checkedAt: new Date().toISOString(),
      provider: "Have I Been Pwned",
      disclaimer: "Bu sonuç yalnızca sağlayıcının kayıtlarında bulunan ihlalleri kapsar; hiçbir ihlal bulunmadığını kesin olarak kanıtlamaz."
    }), { status: 200, headers: cors });
    if (!response.ok) {
      const detail = await response.text();
      console.error("HIBP provider error", response.status, detail.slice(0, 300));
      return new Response(JSON.stringify({ error: "E-posta kontrol sağlayıcısına şu anda ulaşılamıyor." }), { status: 502, headers: cors });
    }
    const breaches = await response.json();
    return new Response(JSON.stringify({
      status: "breached",
      breaches: breaches.map((b: any) => ({ name: b.Name, title: b.Title, domain: b.Domain, breachDate: b.BreachDate, dataClasses: b.DataClasses })),
      checkedAt: new Date().toISOString(),
      provider: "Have I Been Pwned",
      attribution: "https://haveibeenpwned.com/",
      disclaimer: "Bu sonuçlar sağlayıcının bildiği ihlalleri gösterir; her ihlal veya sızıntı tespit edilemeyebilir."
    }), { status: 200, headers: cors });
  } catch (error) {
    console.error("email-breach-check error", error);
    return new Response(JSON.stringify({ error: "Kontrol tamamlanamadı." }), { status: 500, headers: cors });
  }
});
