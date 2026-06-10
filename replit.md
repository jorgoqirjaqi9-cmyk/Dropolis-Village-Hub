# Dropolis — Δρόπολη

Portal ειδήσεων, φωτογραφιών, βίντεο και κοινότητας για τα χωριά της Δρόπολης (Β. Ήπειρος).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/dropolis run dev` — run the frontend (port 20727)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind + shadcn/ui + wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/db/src/schema/` — Drizzle schema (articles, villages, photos, videos, chat)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/dropolis/src/` — React frontend (Greek language)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit)

## Architecture decisions

- Contract-first: OpenAPI spec → Orval codegen → typed hooks + Zod schemas
- All UI text in Modern Greek
- AdSense placeholder zones as reusable `<AdSenseSlot>` component
- Chat polling every 5 seconds via `refetchInterval`
- SEO via document.title + meta tags on each page

## Product

- Homepage with news ticker, stats bar, featured articles, AdSense zones
- News listing filterable by category and village
- Village directory with individual village pages
- Photo gallery (masonry-style, filterable by village)
- YouTube video gallery
- Live community chat room

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, re-run `pnpm --filter @workspace/api-spec run codegen`
- After schema changes in `lib/db/src/schema/`, run `pnpm run typecheck:libs` before checking API server

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
