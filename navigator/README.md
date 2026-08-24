# The Navigator

A subscription tool for Nomad Consulting. Nonprofit leaders upload documents and
reports, the app scores their organisation against key performance indicators,
identifies where to improve, and works with them on a plan — escalating to a
human consultant when one is needed.

This is a **separate, self-contained app** that lives in the same repository as
the FlipOS Deal Analyzer. It has its own `package.json`, `tsconfig.json`, and
`next.config.ts`. The repo-root app excludes it from type-checking and linting,
and it does not share the root app's dependencies.

```bash
cd navigator
npm install
npm run dev
```

## Deployment

The Navigator needs **its own Vercel project**. The existing projects in this
repo build from the repo root and would build the wrong app.

Create it once, in the Vercel dashboard:

| Setting | Value |
| --- | --- |
| Repository | `Nomadwill78/flipos` |
| **Root Directory** | `navigator` |
| Framework Preset | Next.js |
| Build Command | (default) |

The Root Directory is the setting that matters — without it Vercel builds the
repo root and the deployment will not be this app.

## Environment variables

Every variable below must be set before the first deploy. The Clerk publishable
key is read at build time, so a missing or malformed value fails the build
rather than erroring at runtime.

### Auth — [Clerk](https://dashboard.clerk.com)

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_…` / `pk_live_…`. Required at build time. |
| `CLERK_SECRET_KEY` | `sk_test_…` / `sk_live_…` |

### Database and storage — [Supabase](https://supabase.com/dashboard)

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only.** Bypasses row-level security — never expose it to the browser. |

Then apply the schema and create the storage bucket:

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/001_initial.sql
```

Create a **private** storage bucket named `documents`. Uploads are written to
`orgs/{org_id}/{uuid}.{ext}`.

### AI — [Anthropic](https://console.anthropic.com)

| Variable | Notes |
| --- | --- |
| `ANTHROPIC_API_KEY` | Used for KPI extraction and the virtual consultant |

### Background jobs — [Inngest](https://app.inngest.com)

| Variable | Notes |
| --- | --- |
| `INNGEST_EVENT_KEY` | |
| `INNGEST_SIGNING_KEY` | |

Point Inngest at `https://<your-domain>/api/inngest`. Document extraction runs
here rather than in the request, so uploads are not bound by the serverless
request timeout.

### Billing — [Stripe](https://dashboard.stripe.com)

| Variable | Notes |
| --- | --- |
| `STRIPE_SECRET_KEY` | |
| `STRIPE_WEBHOOK_SECRET` | From the webhook endpoint you create below |
| `STRIPE_STARTER_PRICE_ID` | |
| `STRIPE_PROFESSIONAL_PRICE_ID` | |
| `STRIPE_ENTERPRISE_PRICE_ID` | |

Add a webhook endpoint at `https://<your-domain>/api/webhooks/stripe`
subscribed to `customer.subscription.created`, `customer.subscription.updated`,
and `customer.subscription.deleted`. The price IDs map a subscription to a
tier, so a price ID that is set here but not in Stripe silently falls back to
`starter`.

### Application

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | e.g. `https://navigator.nomadconsulting.com`. Used for Stripe return URLs. |
| `NOMAD_HANDOFF_EMAIL` | Where consultant hand-off briefings are sent |

## Post-deploy checklist

- [ ] Sign up, create an organisation, confirm the dashboard loads
- [ ] Upload a PDF and an XLSX; confirm both reach `processing_status = complete`
- [ ] Confirm KPI scores appear on the dashboard after extraction
- [ ] Ask the virtual consultant a question and confirm it cites your documents
- [ ] Trigger a hand-off and confirm the briefing reaches `NOMAD_HANDOFF_EMAIL`
- [ ] Complete a Stripe test checkout and confirm the tier updates

## Known gaps

- **Hand-off email is not wired to a provider.** `app/api/handoff/route.ts`
  persists the briefing and logs it; connect Resend/SendGrid to actually send.
- **KPI scoring is a placeholder.** `lib/inngest/extract-kpis.ts` maps the
  latest value onto a 1–5 scale instead of using each KPI's `scoring_logic`.
- **No generated database types.** Several queries restate their row shapes by
  hand because the Supabase client cannot infer them. Once the project exists,
  `supabase gen types typescript` would let most of those be deleted.
- **CI does not build this app.** The workflow in `.github/workflows/ci.yml`
  only builds the repo root, so a change that breaks the Navigator passes CI.
  Adding a job with `working-directory: navigator` would close that.
