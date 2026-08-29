<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Base44 dev environment

## Running
- `docker compose -f docker-compose.base44.yml up -d` starts the Next.js 16 dev server (Turbopack) on port 3000.
- The container runs `npm install` then `npx next dev -H 0.0.0.0 -p 3000`. Source is bind-mounted at `/app`, so edits hot-reload.
- `next.config.ts` sets `allowedDevOrigins` from `BASE44_PUBLIC_HOST_SUFFIX` so the preview origin can load dev assets/HMR.

## Secrets
- All env vars (Clerk, Stripe) are **optional**. The app runs fully without them: auth is disabled and the payment API returns a 503.
- `.env.base44-defaults` holds empty placeholders; `/run/base44/app.env` (platform-managed) overrides them when the user adds real keys.
- No secrets are required at boot.

## Verify
- `curl -sf http://localhost:3000/` returns the FlipOS HTML ("Loading your deals…" initial state).
- External hostname check: `curl -sf -H "Host: 3000-${BASE44_PUBLIC_HOST_SUFFIX}" http://localhost:3000/` must also succeed.
