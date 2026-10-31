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
    return response({ error: "Origin not allowed" }, 403);
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

    const apiKey = Deno.env.get("WEBRISK_API_KEY");
    if (!apiKey) {
      console.error("WEBRISK_API_KEY secret is missing");
      return response({ error: "Google Web Risk is not configured on the server." }, 500);
    }

    const endpoint = new URL("https://webrisk.googleapis.com/v1/uris:search");
    endpoint.searchParams.set("uri", parsed.href);
    endpoint.searchParams.set("key", apiKey);
    endpoint.searchParams.append("threatTypes", "MALWARE");
    endpoint.searchParams.append("threatTypes", "SOCIAL_ENGINEERING");
    endpoint.searchParams.append("threatTypes", "UNWANTED_SOFTWARE");

    const upstream = await fetch(endpoint.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(12000),
    });

    const upstreamText = await upstream.text();
    let payload: any = {};
    if (upstreamText) {
      try {
        payload = JSON.parse(upstreamText);
      } catch {
        console.error("Google Web Risk returned a non-JSON response", { status: upstream.status });
        return response({ error: "Google Web Risk returned an unexpected response.", upstreamStatus: upstream.status }, 502);
      }
    }

    if (!upstream.ok) {
      const apiMessage = typeof payload?.error?.message === "string" ? payload.error.message : "";
      console.error("Google Web Risk request failed", { status: upstream.status, message: apiMessage.slice(0, 300) });

      if (upstream.status === 403) {
        return response({
          error: "Google Web Risk denied the request. Check that the Web Risk API is enabled and the API key is authorized.",
          upstreamStatus: 403,
        }, 502);
      }
      if (upstream.status === 429) {
        return response({ error: "Google Web Risk quota or rate limit was reached. Try again later.", upstreamStatus: 429 }, 502);
      }
      return response({ error: "Google Web Risk is temporarily unavailable.", upstreamStatus: upstream.status }, 502);
    }

    const threat = payload?.threat ?? null;
    const threatTypes = Array.isArray(threat?.threatTypes) ? threat.threatTypes : [];
    const matched = threatTypes.length > 0;

    return response({
      source: "Google Web Risk",
      matched,
      threatTypes,
      expireTime: threat?.expireTime ?? null,
      verdict: matched ? "known_threat_detected" : "no_known_threat_found",
      checkedAt: new Date().toISOString(),
      notice: matched
        ? "A known threat match was found. Do not open this URL."
        : "No match was found in the checked threat lists. This does not guarantee that the URL is safe.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Threat lookup failed", message);
    const timedOut = message.toLowerCase().includes("timeout");
    return response({
      error: timedOut ? "Google Web Risk request timed out." : "Threat lookup could not be completed.",
    }, timedOut ? 504 : 502);
  }
});
