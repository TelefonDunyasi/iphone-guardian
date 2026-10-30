# iPhone Guardian

Privacy-first iPhone security companion (installable web app / PWA).

## Current features

- iPhone security checklist with search and status filters.
- Local progress storage, plus optional Supabase account and cloud sync.
- Practical guides for Apple Account, WhatsApp, privacy, lost-device preparation, iCloud backup, Security Checkup and configuration profiles.
- Shareable checklist report.
- Google Web Risk URL check through the authenticated Supabase Edge Function named `smooth-responder`.

## Publish

GitHub Pages should publish the `main` branch from the repository root. The app entry point is `index.html`. Open the published Pages URL in Safari and use Share → Add to Home Screen.

## Supabase setup

See [AUTH_SETUP.md](AUTH_SETUP.md) for Auth, project URL, public publishable/anon key, email confirmation and the `guardian_progress` table with row-level security.

For the URL checker:

1. In Supabase Edge Function Secrets, set `WEBRISK_API_KEY` to the Google Web Risk API key. Keep it only in Supabase; never put it in browser code or GitHub.
2. Deploy the source at `supabase/functions/smooth-responder/index.ts` as the Edge Function named `smooth-responder`.
3. Keep JWT verification enabled. The app calls the function with the signed-in user's Supabase session. Do not disable authentication to hide 401 responses.
4. The function permits the GitHub Pages origin `https://telefondunyasi.github.io` and accepts POST requests only.
5. Test from the app after signing in. Opening the function URL directly in Safari sends an unauthenticated GET and is not a valid test.

## Honest capability and privacy statement

This is a web app, not a native iOS security scanner. It cannot scan the iPhone in the background, inspect other apps, read WhatsApp messages, or detect spyware. The URL checker queries Google Web Risk for selected threat-list matches; no match is not a safety guarantee and it does not prove a site is safe. The checklist score reflects only items the user marked complete.

The public Supabase browser key is intended for client use and is protected by database RLS. Never commit a Supabase secret/service-role key or Google Web Risk API key. Premium is a preview only; there is no payment or subscription system enabled.

A native App Store release requires a separate SwiftUI app, Apple-supported build workflow (normally Xcode on a Mac), testing, and applicable Apple Developer distribution membership.
