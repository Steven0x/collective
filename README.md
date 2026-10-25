# COLLECTIVE — site scaffold

Artist-owned fashion ecosystem: influence map, artist directory, collaborate board, preorder shop, public royalty ledger.

## Run
```bash
npm install
cp .env.example .env.local   # already filled in for the collective Supabase project
npm run dev                  # http://localhost:3000
```
`.env.local` points at the live Supabase project (`evwcqfpidsrdepreygnw`, us-east-1) which already holds the seed data.
Set `DATA_SOURCE=json` to run from `src/data/*.json` with no database.

For preorders to write orders, add `SUPABASE_SERVICE_ROLE_KEY` (Supabase dashboard → Project Settings → API). Never ship it to the client.

## What's here
- `src/app/` — Home, `/map`, `/artists`, `/artists/[slug]`, `/collaborate`, `/shop`, `/shop/[slug]`, `/about`, `/me`
- `src/components/InfluenceMap.tsx` — MapLibre map: craft-coloured pins → artist sidebar → click a garment → influence arcs light up + process timeline scrubber → walk the graph via contributors; trace-forward to derivatives.
- `src/app/api/map/pins` and `src/app/api/works/[id]/lineage` — the two JSON endpoints the map consumes.
- `src/lib/data.ts` — async data layer. Reads Supabase (tables + `map_pins`, `work_funding`, `artist_earnings` views + `lineage_json()` RPC); falls back to `src/data/*.json` when `DATA_SOURCE=json`.
- `src/app/api/preorder` + `src/components/PreorderButton.tsx` — mock checkout that calls the `place_preorder()` RPC: creates the collector, the order, and accrues ledger rows for every *confirmed* contributor. Stripe later replaces only the front half (Checkout Session → webhook → same RPC).
- `src/data/` — fictional seed data (20 artists, 24 works, 47 contributions, 12 influences, 79 timeline events, 52 orders, 233 ledger rows). Regenerate with `python3 seed/generate.py`.
- `supabase/schema.sql` — Postgres schema matching the JSON 1:1, PostGIS pins, recursive lineage function, public append-only ledger.

## Visual direction (v0.4)
Riso / neon / cosmic — Afrofuturism × Asian futurism × Y2K. Palette in `globals.css` (`--magenta --yellow --indigo --cyan --gold --red` on deep indigo `#0b0a1a`, warm paper ink). Paper grain and halftone overlays, riso color-offset headlines (`.riso`, `.riso-yellow`), neon signage (`.neon`, `NeonSign`), and procedural cultural motifs in `src/components/motifs.tsx` (`KenteStrip`, `AdinkraGrid`, `GlyphColumn`, `RisoSun`, `Tunnel`, `Stars`). These are abstractions in the palette, not reproductions — swap in artists' real work as it arrives. Custom classes live in `@layer components` so Tailwind utilities (e.g. `absolute`) always win.

## Fonts
Chakra Petch (nav) and Space Grotesk (body) load from Google Fonts. Neue Machina Inktrap (display) and Departure Mono (readouts) are licensed — drop the `.woff2` files into `public/fonts/` and uncomment the `@font-face` block in `src/app/globals.css`.

## Map tiles
Scaffold uses CARTO dark raster tiles (free, attribution required). For the retro-topographic look, make a style in MapTiler and replace `STYLE` in `InfluenceMap.tsx` with the style URL.

## Accounts & roles
Magic-link sign-in (`/login`, Supabase Auth, no password). One account, three roles stored in `profiles.role`:
- **collector** (default) — `/me`: orders, become-an-artist form.
- **artist** — `/me/studio`: earnings, credit inbox (accept/decline credits others declare on you), publish works with media upload + contributor splits that must total 100. Publishing unlocks once a curator approves the profile.
- **curator** — `/admin`: approve artist applications, override pending credits, create/advance drops, mark accrued royalties paid, export accrued CSV.

Make yourself curator once (Supabase → SQL editor):
```sql
update profiles set role = 'curator' where email = 'you@example.com';
```
(An allowlist trigger for this was blocked by a permission check during the build; one line does the job.)

## Artist profiles (v0.5)
Onboarding at `/me/onboard` — five steps saved as you go (`upsert_my_artist` RPC): **Identity** (name, name in own script → neon signs, pronouns, languages, roles, city pin via OpenStreetMap geocoder, bio, portrait → map pin, cover, links) · **Lineage** (relationship to tradition, heritage statement, mentors, 1–5 influence places → personal arcs on the map via `artist_influences`) · **Craft & terms** (specialties, materials, techniques, maker capacity, open-to, rate basis/range, currency, availability, default license) · **Work** (press/links for curators) · **Agreement** (versioned text in `agreements`, acceptance timestamped). Submits as `pending`; curator approves in `/admin` with the lineage statement visible.
Public profile `/artists/[slug]`: cover, portrait, native-name neon, lineage block, terms, works, credits, public ledger. Map: `?artist=<id>` deep-links and draws their influence arcs.

## Notifications
`src/lib/email.ts` (Resend). Events: profile submitted, profile approved, you were credited, credit accepted, order confirmed. Logs to console until `RESEND_API_KEY` + `EMAIL_FROM` are set. Client components call `/api/notify` after an RPC succeeds; the server re-derives recipients from the DB.

## Payouts
`/api/connect` creates a Stripe Connect Express account per artist and returns an onboarding link (button in the studio). Until Stripe keys exist, payouts stay manual from the curator CSV.

## Payments
`PreorderButton` tries `/api/checkout` (Stripe Checkout) first and falls back to `/api/preorder` (mock, writes a real order) when `STRIPE_SECRET_KEY` is unset. Webhook: `/api/stripe/webhook` → `place_preorder(..., stripe_session_id)`, idempotent on session id. Local test: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Database
Live in Supabase. `supabase/schema.sql` is the reference; the applied migrations are:
`collective_schema_v0`, `map_views_and_lineage_json`, `place_preorder_rpc`, `auth_profiles_roles_and_studio_rpcs`, `artist_profiles_v2`. RLS: public read on everything except `collectors`; writes go through RPCs with the service role.

## Next
1. Add Stripe test keys → real checkout. Add `SUPABASE_SERVICE_ROLE_KEY` → mock preorders + webhook can write.
2. Email: Resend for credit-request and approval notifications (hooks are the `respond_to_credit` / `curator_set_*` RPCs).
3. Licensing flow on `/collaborate` (the `licenses` table + RLS are ready; needs the request/accept UI).
4. Replace `<Art>` gradients on public pages with `work.media[]` once artists upload.
5. Link `collectors.user_id` at checkout so orders key on the account, not the email hash.
