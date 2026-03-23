import { ACCESS_SCORES } from "@/lib/rankingScores";
import { getSubwayLineColors } from "@/lib/subwayLineColors";

// Service alerts change at most every minute — cache for 60 seconds.
export const revalidate = 60;

// `servicestatus.mta.info` no longer resolves in DNS; use the same upstream as
// `/api/lines` — JSON alerts derived from MTA GTFS-RT service alerts.
const UPSTREAM_ALERTS_URL = "https://nyc-subway-status.com/api/alerts";

export interface Alert {
  id: string;
  line: string;
  header: string;
  description: string;
  severity: "normal" | "minor" | "major";
  updatedAt: string;
  /** Present for subway line–scoped alerts; drives stripe + line badge color in the UI. */
  lineColor?: string;
  lineTextColor?: string;
}

interface UpstreamAlert {
  id: string;
  header: string;
  description: string;
  severity: string;
  route_ids: string[];
  active_periods?: Array<{ start: string; end: string }>;
}

function severityFromText(text: string): Alert["severity"] {
  const lower = text.toLowerCase();
  if (lower.includes("suspend") || lower.includes("no train") || lower.includes("service change")) return "major";
  if (lower.includes("delay") || lower.includes("slow") || lower.includes("extra travel")) return "minor";
  return "normal";
}

function severityFromUpstream(a: UpstreamAlert): Alert["severity"] {
  const s = a.severity.toLowerCase();
  if (s === "minor" || s === "major") return s;
  if (s === "severe" || s === "critical" || s === "high") return "major";
  if (s === "moderate" || s === "low") return "minor";
  return severityFromText(`${a.header} ${a.description}`);
}

function normalizeSubwayRouteId(routeId: string): string | null {
  if (Object.prototype.hasOwnProperty.call(ACCESS_SCORES, routeId)) return routeId;
  const found = Object.keys(ACCESS_SCORES).find((k) => k.toLowerCase() === routeId.toLowerCase());
  return found ?? null;
}

function updatedAtFromUpstream(periods: UpstreamAlert["active_periods"]): string {
  const start = periods?.[0]?.start;
  if (start) return start;
  return new Date().toISOString();
}

/** Upstream occasionally repeats the same alert id or duplicates route_ids. */
function mergeUpstreamAlerts(items: UpstreamAlert[]): UpstreamAlert[] {
  const byId = new Map<string, UpstreamAlert>();
  for (const raw of items) {
    const routeIds = [...new Set(raw.route_ids)];
    const existing = byId.get(raw.id);
    if (!existing) {
      byId.set(raw.id, { ...raw, route_ids: routeIds });
    } else {
      existing.route_ids = [...new Set([...existing.route_ids, ...routeIds])];
    }
  }
  return [...byId.values()];
}

function dedupeMappedAlerts(alerts: Alert[]): Alert[] {
  const seen = new Map<string, Alert>();
  for (const a of alerts) {
    const key = `${a.line}\0${a.header}\0${a.description}`;
    if (seen.has(key)) continue;
    seen.set(key, a);
  }
  return [...seen.values()];
}

function mapUpstreamToAlerts(items: UpstreamAlert[]): Alert[] {
  const merged = mergeUpstreamAlerts(items);
  const alerts: Alert[] = [];

  for (const raw of merged) {
    const sev = severityFromUpstream(raw);
    const updatedAt = updatedAtFromUpstream(raw.active_periods);

    for (const rid of raw.route_ids) {
      const line = normalizeSubwayRouteId(rid);
      if (!line) continue;

      const palette = getSubwayLineColors(line);
      alerts.push({
        id: `${raw.id}:${line}`,
        line,
        header: raw.header,
        description: raw.description,
        severity: sev,
        updatedAt,
        ...(palette && { lineColor: palette.color, lineTextColor: palette.text_color }),
      });
    }
  }

  const unique = dedupeMappedAlerts(alerts);
  unique.sort((a, b) => a.line.localeCompare(b.line, undefined, { numeric: true }) || a.header.localeCompare(b.header));
  return unique;
}

async function fetchAlerts(): Promise<Alert[]> {
  const res = await fetch(UPSTREAM_ALERTS_URL, {
    headers: {
      "User-Agent": "mta-data-viz/1.0",
      Accept: "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`Alerts upstream HTTP ${res.status}`);

  const json = (await res.json()) as {
    ok?: boolean;
    data?: { alerts?: UpstreamAlert[] };
  };

  const items = json.data?.alerts;
  if (!json.ok || !Array.isArray(items)) {
    throw new Error("Alerts upstream returned unexpected JSON");
  }

  return mapUpstreamToAlerts(items);
}

export async function GET() {
  try {
    const alerts = await fetchAlerts();
    return Response.json({ ok: true, data: { alerts, count: alerts.length } }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=15" },
    });
  } catch (err) {
    console.error("Alerts fetch error:", err);
    // Return empty list rather than erroring; UI handles gracefully
    return Response.json({
      ok: true,
      data: { alerts: [], count: 0 },
      _warning: "Could not fetch live alerts",
    });
  }
}
