/**
 * PNG share card via next/og (Satori). Styling must stay inline-compatible:
 * Tailwind and external CSS are not applied here — see lib/share-card-image/og-styles.ts.
 */
import { ImageResponse } from "next/og";
import { CARD_HEIGHT, CARD_WIDTH, ogStyles } from "@/lib/share-card-image/og-styles";

export const runtime = "edge";

function tagline(lineName: string, rank: number, total: number): string {
  if (rank === 1) return `#1? That's basically a Swiss train. Cherish it.`;
  if (rank <= 5) return `Top 5. The ${lineName} is out here setting standards.`;
  if (rank <= 10) return `Solid. The ${lineName} is doing the work and asking nothing in return.`;
  if (rank <= Math.ceil(total / 2)) return `Middle of the pack. Could be worse. Often is.`;
  if (rank <= total - 4) return `The ${lineName}: arrival times are more of a vibe than a schedule.`;
  return `The ${lineName} said not today. Or yesterday. Or tomorrow.`;
}

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

  const compositeLabel = composite >= 70 ? "GOOD" : composite >= 40 ? "FAIR" : "POOR";
  const tl = customTagline ?? tagline(line, rank, total);

  const [barlowBoldData, barlowRegData] = await Promise.all([
    fetch(
      "https://fonts.gstatic.com/s/barlowcondensed/v13/HTx3L3I-JCGChYJ8VI-L6OO_au7B2xY.ttf"
    ).then((r) => r.arrayBuffer()),
    fetch(
      "https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B47b1_3E.ttf"
    ).then((r) => r.arrayBuffer()),
  ]);

  const scoreRows: [string, number][] = [
    ["Delay", delay],
    ["Incident", incident],
    ["Accessibility", access],
    ["Composite", composite],
  ];

  return new ImageResponse(
    (
      <div style={ogStyles.root}>
        <div style={ogStyles.headerBar}>
          <div style={ogStyles.headerNyCircle}>NY</div>
          <div style={ogStyles.headerTitlesCol}>
            <span style={ogStyles.headerSubtitle}>NYC Transit</span>
            <span style={ogStyles.headerTitle}>Line Performance</span>
          </div>
        </div>

        <div style={ogStyles.mainBody}>
          <div style={ogStyles.topBlock}>
            <div style={ogStyles.badge(color, textColor)}>{line}</div>
            <p style={ogStyles.rankLine}>
              Ranked #{rank} of {total}
            </p>
            <p style={ogStyles.snapshotLine}>{snapshotTime}</p>
            <p style={ogStyles.tagline}>&ldquo;{tl}&rdquo;</p>
          </div>

          <div style={ogStyles.scoreGrid}>
            {scoreRows.map(([label, val], i) => {
              const col = scoreColor(val);
              return (
                <div key={label} style={ogStyles.scoreColumn(i, scoreRows.length)}>
                  <span style={ogStyles.scoreValue(col)}>{val}</span>
                  <span style={ogStyles.scoreTierText(col)}>{scoreLabel(val)}</span>
                  <span style={ogStyles.scoreCategory}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={ogStyles.footerBar}>
          <span style={ogStyles.footerUrl}>nyctransit.app</span>
          <span style={ogStyles.footerCaption}>NYC Transit — System Status</span>
        </div>
      </div>
    ),
    {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fonts: [
        { name: "Barlow Condensed", data: barlowBoldData, weight: 800, style: "normal" },
        { name: "Barlow Condensed", data: barlowRegData, weight: 400, style: "normal" },
      ],
    }
  );
}
