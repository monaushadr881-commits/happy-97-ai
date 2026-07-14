# Phase 11 — HAPPY AI Creator Operating System (Creator OS)

The unified AI-native Creative OS for HAPPY X. One identity (HAPPY), many
studios (image, voice, presentation, copy, marketing, brand). Every
generation flows through the Lovable AI Gateway; no provider is ever
called directly, and no AI key is ever exposed to the client.

## Architecture

- **Layout:** `src/routes/_authenticated/studio.tsx` wraps every studio
  in `<CreatorNav />` + `<Outlet />` under the `_authenticated` gate.
- **Service Layer:** `src/lib/creator-v1.functions.ts` holds every
  server function. Auth via `requireSupabaseAuth`. Zod validation on
  every input. RLS on every table scopes rows to `auth.uid()`.
- **AI Gateway:** Only path to models. Uses `LOVABLE_API_KEY` from
  `process.env` inside handlers. 402 / 429 surfaced with user-safe
  messages. Never streamed to the browser (v1); previews are polled.

## Navigation tree

```
/studio                     Dashboard (KPIs + studio cards + recent activity)
/studio/projects            Projects (create / archive / delete)
/studio/image               Image Studio (generate + edit)
/studio/voice               Voice Studio (text-to-speech)
/studio/presentation        Presentation Studio (AI-authored decks)
/studio/copy                Copy Studio (long/short-form copy)
/studio/marketing           Marketing Studio (multi-channel campaigns)
/studio/brand               Brand Studio (brand kits, tone, typography)
/studio/assets              Media Library (all generated media)
/studio/exports             Exports (generation history)
```

## Module inventory

| Studio | Capability | AI Model |
| --- | --- | --- |
| Image | Text-to-image | Gemini 3 Pro Image / Nano Banana 2 / GPT-Image 2 |
| Image | Image-to-image edit | Gemini 3.1 Flash Image |
| Voice | Text-to-speech | `openai/gpt-4o-mini-tts` |
| Presentation | Deck generation | `google/gemini-2.5-flash` |
| Copy | Ads, emails, blogs, landing, script | `google/gemini-2.5-flash` |
| Marketing | Multi-channel campaign copy | `google/gemini-2.5-flash` |
| Brand | Brand kit management (no AI) | — |

## API inventory (`src/lib/creator-v1.functions.ts`)

Projects: `creatorListProjects`, `creatorCreateProject`,
`creatorArchiveProject`, `creatorDeleteProject`.

Assets: `creatorListAssets`, `creatorDeleteAsset`.

Studios: `creatorGenerateImage`, `creatorEditImage`, `creatorTts`,
`creatorGenerateCopy`, `creatorGenerateSlides`.

Brand: `creatorListBrandKits`, `creatorSaveBrandKit`,
`creatorDeleteBrandKit`.

Analytics: `creatorDashboard`, `creatorRecentGenerations`.

Every generation writes a `creator_generations` audit row (studio,
operation, model, status, prompt, output_asset_id, duration_ms).

## Database

Four RLS-scoped tables added in `20260714072000_creator_os.sql`:

- `creator_projects` — creative work grouping (project_id references).
- `creator_assets` — every media asset (image / audio / document /
  slide_deck). Payload in `data_url` (b64) or `external_url` for CDN.
- `creator_generations` — AI job audit trail.
- `creator_brand_kits` — reusable brand color / typography / voice.

Every table policy: `USING (user_id = auth.uid())` and matching
`WITH CHECK`. `authenticated` and `service_role` grants issued in the
same migration per platform rules.

## Media pipeline

1. User submits a prompt in a studio → mutation calls a server function.
2. Server function calls the Lovable AI Gateway with `LOVABLE_API_KEY`.
3. Response payload is base64-decoded (image / audio) or JSON-parsed
   (slides) and inserted into `creator_assets`.
4. A `creator_generations` audit row is written with `output_asset_id`.
5. TanStack Query cache is invalidated; the media library and dashboard
   refetch automatically.

For production scale, swap the `data_url` payload for a signed CDN URL
(e.g. a storage bucket) by populating `external_url` instead — every
consumer already reads `data_url ?? external_url`.

## Security

- **AuthN:** Every server function is protected by `requireSupabaseAuth`.
- **AuthZ:** RLS on all four tables scopes rows to the caller.
- **Input:** Zod-validated on every mutation.
- **Secrets:** `LOVABLE_API_KEY` read only inside handlers; never
  reaches the client. No provider is called directly.
- **Content:** OpenAI content-policy errors surface via the standard
  gateway error path; upstream 402 / 429 map to friendly messages.

## Performance

- Head-only `count: "exact"` counts on the dashboard (no row payload).
- Bounded list limits (`limit(100)` projects, `limit(60)` assets by
  default; `limit(100)` for exports).
- Indexes on `(user_id, updated_at DESC)` and `(user_id, kind)` for
  fast scoped queries.
- Client-side caching via TanStack Query with per-kind cache keys.

## Rules (permanent)

1. Never duplicate AI logic in components — everything flows through
   `creator-v1.functions.ts`.
2. Never bypass the AI Gateway — no direct provider calls.
3. Never persist a `LOVABLE_API_KEY` in `.env` visible to the client
   or ship it via `VITE_*`.
4. Every AI generation writes a `creator_generations` audit row.
5. All new studios must extend this service layer, not fork it.
