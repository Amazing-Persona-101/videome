type PackedMetaV1 = { g?: string; s?: string }; // g=groupId, s=summary

function b64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlDecode(b64url: string): string {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/")
    .padEnd(b64url.length + ((4 - (b64url.length % 4)) % 4), "=");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** Pack title + optional groupId/summary (summary clamped to 140 chars). */
export function packMeetingTitle(
  title: string,
  opts?: { groupId?: string; summary?: string; summaryMax?: number; ellipsis?: boolean }
): string {
  const t = title.trim();
  if (!opts || (!opts.groupId && !opts.summary)) return t;

  const max = opts.summaryMax ?? 140;
  const meta: PackedMetaV1 = {};
  if (opts.groupId) meta.g = opts.groupId;
  if (opts.summary) meta.s = truncateSummary(opts.summary, max, { ellipsis: opts.ellipsis ?? false });

  const capsule = b64urlEncode(JSON.stringify(meta));
  return `${capsule}`;
}

export function truncateSummary(
  s: string,
  max = 140,
  { ellipsis = false }: { ellipsis?: boolean } = {}
): string {
  if (s.length <= max) return s;
  const seg = (typeof Intl !== "undefined" && (Intl as any).Segmenter)
    ? new (Intl as any).Segmenter(undefined, { granularity: "grapheme" })
    : null;

  if (!seg) return s.slice(0, max - (ellipsis ? 1 : 0)) + (ellipsis ? "…" : "");

  const it = seg.segment(s)[Symbol.iterator]();
  let out = "";
  let graphemeCount = 0;
  const maxGraphemes = max - (ellipsis ? 1 : 0);

  let next = it.next();
  while (!next.done) {
    const chunk = next.value.segment as string;
    if (graphemeCount >= maxGraphemes) break;
    out += chunk;
    graphemeCount++;
    next = it.next();
  }
  return ellipsis ? out + "…" : out;
}

/** Unpack back into fields. */
export function unpackMeetingTitle(
  stored: string
) {
  try {
    return JSON.parse(b64urlDecode(stored))
  } catch {
    return stored;
  }
}
