// Auth is OPTIONAL infrastructure: the app works fully without Clerk keys
// (local-only deals and device-local Pro). When the env vars below exist,
// sign-in appears and Pro becomes account-bound.
//
//   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  — safe to expose, inlined client-side
//   CLERK_SECRET_KEY                   — server only
//
// This flag is evaluated at build time for client components.
export const authEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
