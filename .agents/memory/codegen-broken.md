---
name: Orval codegen broken on Node 24
description: The codegen command fails on Node.js 24 due to an ESM/js-yaml incompatibility in Orval. Workaround and what to do when adding new API endpoints.
---

## The rule

`pnpm --filter @workspace/api-spec run codegen` fails on Node.js 24 with:

```
SyntaxError: The requested module 'js-yaml' does not provide an export named 'default'
```

This is a pre-existing Orval bug — nothing we can do about it without upgrading Orval or downgrading Node.

## Workaround when adding new API endpoints

Instead of relying on codegen to generate Zod schemas and React Query hooks, do the following manually:

### Server-side Zod validation
Add a new file `lib/api-zod/src/<feature>.ts` with the Zod schemas (using `zod` which is already a dep of `@workspace/api-zod`). Export from `lib/api-zod/src/index.ts`. The api-server imports them via `@workspace/api-zod`.

**Why:** The api-server has `@workspace/api-zod` as a dep but NOT `zod` directly. Do NOT `import { z } from "zod/v4"` or `import { z } from "zod"` in api-server routes — use `@workspace/api-zod` re-exports instead.

### Frontend API hooks
For new endpoints without generated hooks, write inline `useQuery`/`useMutation` from `@tanstack/react-query` with direct `fetch()` calls. No need for the generated hook files.

**Do NOT** edit `lib/api-client-react/src/generated/api.ts` or `lib/api-zod/src/generated/api.ts` — these are fragile generated files.

### OpenAPI spec
Still update `lib/api-spec/openapi.yaml` as documentation/contract, but know that the codegen won't regenerate the client. The spec is still valuable for documentation purposes.

## How to apply

Every time a new feature needs server-side validation or a new API endpoint:
1. Add Zod schemas to `lib/api-zod/src/<feature>.ts` + export from index
2. Import them in the api-server route from `@workspace/api-zod`
3. Write frontend hooks inline (useQuery/useMutation + fetch)
4. Run `pnpm run typecheck:libs` after updating api-zod to rebuild declarations
