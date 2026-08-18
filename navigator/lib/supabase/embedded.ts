/**
 * Helpers for reading embedded (joined) resources from Supabase queries.
 *
 * Without generated database types, the Supabase client cannot infer the
 * cardinality of an embedded resource and widens it to an array. Our joins on
 * `kpi_definitions` follow many-to-one foreign keys, so at runtime they come
 * back as a single row. These helpers narrow that safely instead of casting,
 * so the code is correct whichever shape the client returns.
 */

/** Narrow an embedded resource to a single row, or null when absent. */
export function embeddedOne<T>(value: unknown): T | null {
  if (value == null) return null;
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return value as T;
}

/** A KPI definition as embedded by the dashboard, chat, and hand-off queries. */
export type EmbeddedKpi = { id?: string; name: string; domain: string };
