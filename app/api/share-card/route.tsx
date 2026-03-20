import { ImageResponse } from "next/og";

export const runtime = "edge";

// Card dimensions — 1:1 square, works for Instagram feed, Twitter, and Stories (letterboxed)
const W = 1080;
const H = 1080;

// ─── Taglines ────────────────────────────────────────────────────────────────

function tagline(lineName: string, rank: number, total: number): string {
  if (rank === 1) return `#1? That's basically a Swiss train. Cherish it.`;
  if (rank <= 5) return `Top 5. The ${lineName} is out here setting standards.`;
  if (rank <= 10) return `Solid. The ${lineName} is doing the work and asking nothing in return.`;
  if (rank <= Math.ceil(total / 2)) return `Middle of the pack. Could be worse. Often is.`;
  if (rank <= total - 4) return `The ${lineName}: arrival times are more of a vibe than a schedule.`;
  return `The ${lineName} said not today. Or yesterday. Or tomorrow.`;
}

// ─── Score helpers ────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return "#2d6a4f";
  if (score >= 40) return "#d4a017";
  return "#9b2226";
}

function scoreLabel(score: number): string {
  if (score >= 70) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const line = searchParams.get("line") ?? "?";
  const rank = parseInt(searchParams.get("rank") ?? "1", 10);
  const total = parseInt(searchParams.get("total") ?? "24", 10);
  const delay = parseInt(searchParams.get("delay") ?? "75", 10);
  const incident = parseInt(searchParams.get("incident") ?? "75", 10);
  const access = parseInt(searchParams.get("access") ?? "75", 10);
  const composite = parseInt(searchParams.get("composite") ?? "75", 10);
  const color = decodeURIComponent(searchParams.get("color") ?? "#1a1a1a");
  const textColor = decodeURIComponent(searchParams.get("textColor") ?? "#ffffff");
  const customTagline = searchParams.get("tagline");
  const snapshotTime = searchParams.get("snapshotTime") ?? "This week";

  const compositeColor = scoreColor(composite);
  const compositeLabel = composite >= 70 ? "GOOD" : composite >= 40 ? "FAIR" : "POOR";
  const tl = customTagline ?? tagline(line, rank, total);

  // Load Barlow Condensed 800 for headings + body
  const [barlowBoldData, barlowRegData] = await Promise.all([
    fetch(
      "https://fonts.gstatic.com/s/barlowcondensed/v13/HTx3L3I-JCGChYJ8VI-L6OO_au7B2xY.ttf"
    ).then((r) => r.arrayBuffer()),
    fetch(
      "https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B47b1_3E.ttf"
    ).then((r) => r.arrayBuffer()),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          background: "#f5f0e8",
          fontFamily: "Barlow Condensed, sans-serif",
        }}
      >
        {/* ── Header bar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "24px 56px", borderBottom: "5px solid #1a1a1a", background: "#ebe6dc", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 999, border: "3px solid #1a1a1a", background: "#D82233", color: "#fff", fontSize: 18, fontWeight: 900, letterSpacing: "0.04em" }}>
            NY
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 18, fontWeight: 400, letterSpacing: "0.2em", color: "rgba(26,26,26,0.55)", textTransform: "uppercase" }}>NYC Transit</span>
            <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: "0.08em", color: "#1a1a1a", textTransform: "uppercase" }}>Line Performance</span>
          </div>
        </div>

        {/* ── Main body ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, padding: "56px 80px 48px", justifyContent: "space-between" }}>

          {/* Top: badge + rank + tagline */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Big badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 280, height: 280, borderRadius: 999, background: color, border: "8px solid #1a1a1a", color: textColor, fontSize: 140, fontWeight: 900, lineHeight: 1, boxShadow: "6px 6px 0 rgba(0,0,0,0.2)", marginBottom: 36 }}>
              {line}
            </div>
            {/* Rank */}
            <p style={{ fontSize: 52, fontWeight: 900, color: "#1a1a1a", textAlign: "center", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1.1, margin: 0, marginBottom: 6 }}>
              Ranked #{rank} of {total}
            </p>
            <p style={{ fontSize: 26, fontWeight: 400, color: "rgba(26,26,26,0.45)", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0, marginBottom: 28 }}>
              {snapshotTime}
            </p>
            {/* Tagline */}
            <p style={{ fontSize: 34, fontWeight: 400, color: "rgba(26,26,26,0.75)", textAlign: "center", lineHeight: 1.45, fontStyle: "italic", margin: 0, maxWidth: 780 }}>
              &ldquo;{tl}&rdquo;
            </p>
          </div>

          {/* Bottom: 4-up score grid — no box, no label */}
          <div style={{ display: "flex", flexDirection: "row", width: "100%", borderTop: "3px solid rgba(26,26,26,0.12)", paddingTop: 36 }}>
            {([["Delay", delay], ["Incident", incident], ["Accessibility", access], ["Composite", composite]] as [string, number][]).map(([label, val], i, arr) => {
              const col = scoreColor(val);
              return (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    borderRight: i < arr.length - 1 ? "3px solid rgba(26,26,26,0.12)" : "none",
                    padding: "0 16px",
                  }}
                >
                  <span style={{ fontSize: 80, fontWeight: 900, color: col, lineHeight: 1, fontVariantNumeric: "tabular-nums", marginBottom: 10 }}>{val}</span>
                  <span style={{ fontSize: 30, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: col, marginBottom: 12 }}>{scoreLabel(val)}</span>
                  <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(26,26,26,0.45)" }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 56px", borderTop: "5px solid #1a1a1a", background: "#ebe6dc", flexShrink: 0 }}>
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(26,26,26,0.45)" }}>nyctransit.app</span>
          <span style={{ fontSize: 18, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(26,26,26,0.35)" }}>NYC Transit — System Status</span>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "Barlow Condensed", data: barlowBoldData, weight: 800, style: "normal" },
        { name: "Barlow Condensed", data: barlowRegData, weight: 400, style: "normal" },
      ],
    }
  );
}
