"use client";

import { useEffect } from "react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import type { Plan } from "@/app/lib/plan";

// Both components in this file may ONLY be rendered when authEnabled is true
// (they rely on <ClerkProvider> existing in the layout).

/** Header sign-in / account button. */
export function AuthControls() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:border-amber-500 hover:text-amber-400 transition-colors shrink-0">
          Sign in
        </button>
      </SignInButton>
    );
  }

  return (
    <span className="shrink-0 flex items-center">
      <UserButton />
    </span>
  );
}

/**
 * Invisible bridge: reads the signed-in user's plan (set by the Stripe
 * webhook in Clerk publicMetadata) and reports it to the app shell.
 */
export function AccountPlanSync({
  onPlan,
}: {
  onPlan: (plan: Plan | null) => void;
}) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      onPlan(null);
      return;
    }
    onPlan(user.publicMetadata?.plan === "pro" ? "pro" : "free");
  }, [user, isLoaded, onPlan]);

  return null;
}
