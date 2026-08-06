# HH Goa Builder Card Generator

A branded Builder ID Card generator for Hacker House Goa 2026. Users upload a photo, crop it, fill in their details, and get a shareable 1080×1350 PNG card they can download and post on X with #FrameInGoa. No login required.

## Run & Operate

- `npm run dev --workspace=@workspace/builder-card` — run the frontend (port 23460)
- `npm run dev --workspace=@workspace/api-server` — run the API server (port 8080)
- `npm run typecheck` — full typecheck across all packages
- `npm run build` — typecheck + build all packages
- `npm run codegen --workspace=@workspace/api-spec` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `npm run push --workspace=@workspace/db` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- npm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite, Tailwind CSS, Framer Motion, Wouter
- Photo: react-easy-crop (cropping), html-to-image (PNG export), browser-image-compression, heic2any
- Animations: canvas-confetti (post-generate burst)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `artifacts/builder-card/` — React + Vite frontend
- `artifacts/api-server/src/routes/cards.ts` — POST /api/cards, GET /api/cards/:id, GET /api/cards/:id/image
- `lib/db/src/schema/cards.ts` — cards table (uuid, name, role, stack, country, github_username, builder_title, image_path, created_at)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- Card images stored on disk at `uploads/cards/` (relative to api-server cwd)

## Architecture decisions

- Card generation is fully client-side (html-to-image captures the DOM card element at 3× pixel ratio → ~1080×1350px PNG)
- To share: frontend POSTs the base64 PNG + metadata to `/api/cards`, which saves the PNG to disk and stores metadata in DB. Returns a unique ID and share URL.
- Share URL `/cards/:id` loads the card page with OG meta tags pointing to `/api/cards/:id/image` (the PNG served by Express).
- JSON body limit on api-server is 15 MB to handle large base64-encoded card images.
- No auth — every card is public by design (hackathon submission tool).

## Product

- Step 1: Upload photo (JPG, PNG, WEBP, HEIC)
- Step 2: Circular crop with zoom/rotate
- Step 3: Fill details (name, role, stack, country, GitHub, builder title)
- Live card preview updates as user types
- Download card as PNG (`hh-goa-builder-card.png`)
- Share on X with pre-filled tweet + `#FrameInGoa`
- Share link shows OG preview of the generated card

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always re-run `npm run codegen --workspace=@workspace/api-spec` before editing route or frontend code.
- api-server JSON body limit is 15 MB (set in app.ts) — needed for base64-encoded card images.
- Card images are stored on the api-server filesystem at `uploads/cards/`. These are ephemeral in dev; in production, consider object storage for durability.
