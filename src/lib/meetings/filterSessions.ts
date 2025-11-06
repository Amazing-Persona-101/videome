import type { Session } from "./types";

function parseWhen(s?: string | null): number | undefined {
  if (!s) return undefined;
  // Not sure if this is the correct way to handle timezones, but it's a start
  const normalized = s.replace(/\s+(?=\d{2}(?:Z|$))/g, '').replace(/T(\d{2}):\s*(\d{2}):\s*(\d{2})/, 'T$1:$2:$3');
  const t = Date.parse(normalized);
  return Number.isNaN(t) ? undefined : t;
}

function effectiveTimestamp(x: Session): number {
  return (
    parseWhen(x.updated_at) ??
    parseWhen(x.ended_at) ??
    parseWhen(x.started_at) ??
    parseWhen(x.created_at) ??
    Number.NEGATIVE_INFINITY
  );
}

export function latestByAssociatedId<T extends Session>(rows: T[]): T[] {
  const best = new Map<string, T & { __ts?: number }>();

  for (const row of rows) {
    const key = row.associated_id;
    if (!key) continue;
    const ts = effectiveTimestamp(row);
    const prev = best.get(key);
    if (!prev || ts > (prev.__ts ?? effectiveTimestamp(prev))) {
      best.set(key, { ...row, __ts: ts });
    }
  }

  // return without the helper field, sorted newest→oldest (optional)
  return Array.from(best.values())
    .sort((a, b) => (b.__ts ?? 0) - (a.__ts ?? 0))
    .map(({ __ts, ...rest }) => rest as T);
}
