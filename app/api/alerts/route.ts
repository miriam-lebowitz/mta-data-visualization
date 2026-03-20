// Service alerts change at most every minute — cache for 60 seconds.
export const revalidate = 60;

// MTA public XML service status feed (no API key required).
const MTA_XML_URL = "https://servicestatus.mta.info/subwayservicestatus.aspx";

export interface Alert {
  id: string;
  line: string;
  header: string;
  description: string;
  severity: "normal" | "minor" | "major";
  updatedAt: string;
}

function severityFromText(text: string): Alert["severity"] {
  const lower = text.toLowerCase();
  if (lower.includes("suspend") || lower.includes("no train") || lower.includes("service change")) return "major";
  if (lower.includes("delay") || lower.includes("slow") || lower.includes("extra travel")) return "minor";
  return "normal";
}

async function fetchAlerts(): Promise<Alert[]> {
  // Try the MTA XML service status feed (publicly accessible, no key)
  const res = await fetch(MTA_XML_URL, {
    headers: {
      "User-Agent": "mta-data-viz/1.0",
      Accept: "application/xml, text/xml",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`MTA alerts HTTP ${res.status}`);

  const xml = await res.text();

  // Parse XML alerts with simple regex extraction (avoid xml2js dependency)
  const alerts: Alert[] = [];
  const lineBlocks = xml.match(/<line>([\s\S]*?)<\/line>/g) ?? [];

  for (const block of lineBlocks) {
    const nameMatch = block.match(/<name>([^<]+)<\/name>/);
    const statusMatch = block.match(/<status>([^<]+)<\/status>/);
    const textMatch = block.match(/<text>([^<]*)<\/text>/);
    const dateMatch = block.match(/<Date>([^<]+)<\/Date>/);
    const timeMatch = block.match(/<Time>([^<]+)<\/Time>/);

    if (!nameMatch || !statusMatch) continue;

    const status = statusMatch[1].trim();
    if (status === "Good Service") continue; // skip healthy lines

    const line = nameMatch[1].trim();
    const description = textMatch?.[1].trim() ?? "";
    const updatedAt = `${dateMatch?.[1].trim() ?? ""} ${timeMatch?.[1].trim() ?? ""}`.trim();

    alerts.push({
      id: `${line}-${status}`,
      line,
      header: status,
      description,
      severity: severityFromText(status),
      updatedAt,
    });
  }

  return alerts;
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
