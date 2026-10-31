const allowedOrigin = "https://telefondunyasi.github.io";

// OpenPhish Community Feed is free for non-commercial use and refreshed every 12 hours.
let cachedFeed: { urls: Set<string>; fetchedAt: number } | null = null;
const FEED_URL = "https://openphish.com/feed.txt";
const CACHE_TTL_MS = 15 * 60 * 1000;

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function normalizeUrl(value: string): string {
  const parsed = new URL(value);
  parsed.hash = "";
  return parsed.href;
}

async function getFeed(): Promise<{ urls: Set<string>; fetchedAt: number }> {
  if (cachedFeed && Date.now() - cachedFeed.fetchedAt < CACHE_TTL_MS) return cachedFeed;
  const upstream = await fetch(FEED_URL, {
    headers: { "Accept": "text/plain" },
    signal: AbortSignal.timeout(12000),
  });
  if (!upstream.ok) throw new Error("OpenPhish feed returned HTTP " + upstream.status);
  const text = await upstream.text();
  if (text.length < 100) throw new Error("OpenPhish feed response was unexpectedly small");
  const urls = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const candidate = line.trim();
    if (!candidate || candidate.startsWith("#")) continue;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") urls.add(normalizeUrl(parsed.href));
    } catch { /* Ignore malformed feed lines. */ }
  }
  if (urls.size < 10) throw new Error("OpenPhish feed did not contain enough valid URL entries");
  cachedFeed = { urls, fetchedAt: Date.now() };
  return cachedFeed;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  if (origin && origin !== allowedOrigin) return response({ error: "Origin not allowed" }, 403);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
    }});
  }
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json();
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
    if (!rawUrl || rawUrl.length > 2048) return response({ error: "A valid URL is required (maximum 2048 characters)." }, 400);
    let parsed: URL;
    try { parsed = new URL(rawUrl); } catch { return response({ error: "Invalid URL." }, 400); }
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
      return response({ error: "Only public HTTP/HTTPS URLs without embedded credentials can be checked." }, 400);
    }
    const feed = await getFeed();
    const matched = feed.urls.has(normalizeUrl(parsed.href));
    return response({
      source: "OpenPhish Community Feed",
      matched,
      verdict: matched ? "known_phishing_url" : "no_exact_match",
      checkedAt: new Date().toISOString(),
      feedFetchedAt: new Date(feed.fetchedAt).toISOString(),
      feedEntries: feed.urls.size,
      notice: matched ? "This exact URL appears in the OpenPhish phishing feed. Do not open it." : "No exact URL match was found in the OpenPhish Community Feed. This does not mean the URL is safe.",
      limitation: "The community feed is refreshed every 12 hours and is not a complete list of threats. URL matching is exact after removing the URL fragment.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("OpenPhish lookup failed", message);
    const timedOut = message.toLowerCase().includes("timeout");
    return response({ error: timedOut ? "The threat feed request timed out. The URL was not verified." : "The threat feed is temporarily unavailable. The URL was not verified." }, timedOut ? 504 : 502);
  }
});