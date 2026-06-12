"use client";

import { useEffect, useState } from "react";

// Freemium plan state.
//
// NOTE: until Clerk auth + Stripe webhooks are wired in, the plan is stored
// per-device in localStorage and unlocked by the checkout success redirect.
// Once accounts exist, this becomes a server-verified subscription lookup.

export type Plan = "free" | "pro";

export const PRICING = {
  monthly: 29,
  annual: 290, // two months free vs 12 × $29 = $348
} as const;

export const FREE_DEAL_LIMIT = 1;

const PLAN_KEY = "flipos.plan.v1";

export function getPlan(): Plan {
  if (typeof window === "undefined") return "free";
  try {
    return window.localStorage.getItem(PLAN_KEY) === "pro" ? "pro" : "free";
  } catch {
    return "free";
  }
}

export function setPlan(plan: Plan): void {
  try {
    window.localStorage.setItem(PLAN_KEY, plan);
    window.dispatchEvent(new Event("flipos-plan-change"));
  } catch {
    // ignore — plan stays free in memory
  }
}

export function usePlan(): Plan {
  const [plan, setPlanState] = useState<Plan>("free");
  useEffect(() => {
    setPlanState(getPlan());
    const update = () => setPlanState(getPlan());
    window.addEventListener("flipos-plan-change", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("flipos-plan-change", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return plan;
}
