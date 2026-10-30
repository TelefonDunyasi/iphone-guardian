const cors = {
  "Access-Control-Allow-Origin": "https://telefondunyasi.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  return new Response(JSON.stringify({
    error: "Bu sunucu bağlantı kontrolü kapatıldı. Ücretsiz bağlantı analizi uygulama içinde, cihaz üzerinde yapılır."
  }), { status: 410, headers: cors });
});
