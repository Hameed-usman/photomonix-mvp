# Photomonix MVP

Photomonix is a standalone React + Vite frontend backed by a Node.js + Express REST API. It demonstrates one complete product-photography workflow: image upload → image analysis → creative directions → user selection → image-to-image generation → result and download.

## Architecture

```text
User → React/Vite → Node.js/Express → AI Analyzer → Suggestion Engine
     → User Selection → Image-to-Image Generator → Generated Result
```

- The browser only talks to the Express `/api/*` routes; AI provider calls and credentials stay server-side.
- `server/ai.mjs` isolates `analyzeProductImage`, `generateSuggestions`, and `generateProductImage` behind the AI SDK and Vercel AI Gateway.
- `server/storage.mjs` provides ephemeral demo storage and an optional private Google Cloud Storage adapter. No database is needed for this stateless MVP.
- In demo mode, analysis and directions are explicitly labeled as sample content. The result is a browser-composed studio preview using the original photo—not an AI-generated image. A Vercel deployment uses live AI mode; if a live model call fails, the API reports an error instead of silently substituting a fake result.

## Run locally

```bash
pnpm install
pnpm dev
```

Open the Vite URL printed in the preview. Local mode defaults to the clearly labeled demo workflow. For live model calls, set `AI_MODE=live` in the server environment and provide server-side AI Gateway authentication. Never add provider credentials to `VITE_*` variables or frontend code.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `AI_MODE` | Optional. Set to `live` when AI Gateway is available; otherwise use the labeled demo. Vercel deployments default to live mode. |
| `GCS_BUCKET_NAME` | Optional. Enables private Google Cloud Storage for original and generated image objects. |
| `GOOGLE_CLOUD_PROJECT` | Optional project ID for the Google Cloud Storage client. Use server-side Application Default Credentials / workload identity. |
| `PORT` | Optional Express listen port; defaults to `3001`. |

No PostgreSQL database, login, or client-side AI key is required. Uploads are capped at 4 MB so multipart requests stay within Vercel Functions’ 4.5 MB request-body limit.

## Deploy and share

Push the project to a GitHub repository, then import that repository in Vercel (or connect GitHub under the v0 project settings and publish). Vercel uses `vercel.json`, runs `pnpm build`, serves the Vite `dist` output, and routes `/api/*` to the Express adapter in `api/index.js`. Once deployment completes, copy the production URL from Vercel to share with reviewers. The Vercel AI Gateway integration must be connected to the Vercel project for live analysis and generation. Add `GCS_BUCKET_NAME` only if private Google Cloud Storage is configured.

## Checks

- `pnpm typecheck` — TypeScript checks for the React/Vite client.
- `pnpm build` — typecheck followed by the production Vite build.
- `pnpm start` — serves the built frontend and Express API together for a local production-style smoke test.
