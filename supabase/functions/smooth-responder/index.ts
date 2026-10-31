const allowedOrigin = "https://telefondunyasi.github.io";

function response(body: unknown, status = 200, origin = allowedOrigin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  if (origin && origin !== allowedOrigin) {
    return response({ error: "Origin not allowed" }, 403, allowedOrigin);
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Vary": "Origin",
      },
    });
  }

  if (req.method !== "POST") {
    return response({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
    if (!rawUrl || rawUrl.length > 2048) {
      return response({ error: "A valid URL is required (maximum 2048 characters)." }, 400);
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return response({ error: "Invalid URL." }, 400);
    }

    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
      return response({ error: "Only public HTTP/HTTPS URLs without embedded credentials can be checked." }, 400);
    }

    const form = new URLSearchParams({
      url: parsed.href,
      format: "json",
    });
    const appKey = Deno.env.get("PHISHTANK_API_KEY");
    if (appKey) form.set("app_key", appKey);

    const upstream = await fetch("https://checkurl.phishtank.com/checkurl/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "User-Agent": "iPhoneGuardian/1.0 (https://telefondunyasi.github.io/iphone-guardian/)",
      },
      body: form.toString(),
      signal: AbortSignal.timeout(12000),
    });

    if (!upstream.ok) {
      return response({
        error: "PhishTank is temporarily unavailable.",
        upstreamStatus: upstream.status,
      }, 502);
    }

    const payload = await upstream.json();
    const result = Array.isArray(payload?.results) ? payload.results[0] : payload?.results;
    if (!result || typeof result.in_database !== "boolean") {
      return response({ error: "PhishTank returned an unexpected response." }, 502);
    }

    const verified = String(result.verified ?? "").toLowerCase() === "yes";
    const valid = String(result.valid ?? "").toLowerCase() === "yes";
    return response({
      source: "PhishTank",
      inDatabase: result.in_database,
      matched: result.in_database && verified && valid,
      verified: result.verified ?? null,
      valid: result.valid ?? null,
      phishId: result.phish_id ?? null,
      detailUrl: result.phish_detail_url ?? null,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const timedOut = message.toLowerCase().includes("timeout");
    return response({
      error: timedOut ? "PhishTank request timed out." : "Threat lookup could not be completed.",
    }, timedOut ? 504 : 502);
  }
});
