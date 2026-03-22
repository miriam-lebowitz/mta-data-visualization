"use client";

// DOM preview of the share card — mirrors `/api/share-card` layout.
// Authored at CARD_W × CARD_W px, then scaled with CSS zoom for the modal.

import * as ui from "./styles/ShareCardPreview.styles";

interface RawLine {
  id: string;
  short_name: string;
  long_name: string;
  color: string;
  text_color: string;
}

export interface LineScore {
  line: RawLine;
  delayScore: number;
  incidentScore: number;
  accessScore: number;
  composite: number;
}

const CARD_W = 360;
const PREVIEW_W = 300;
const SCALE = PREVIEW_W / CARD_W;

export default function ShareCardPreview({
  ls,
  rank,
  total,
  customTagline,
  snapshotTime,
}: {
  ls: LineScore;
  rank: number;
  total: number;
  customTagline: string;
  snapshotTime: string;
}) {
  const rows: [string, number][] = [
    ["Delay", ls.delayScore],
    ["Incident", ls.incidentScore],
    ["Accessibility", ls.accessScore],
    ["Composite", ls.composite],
  ];

  return (
    <div className={ui.root}>
      <div
        className={ui.card}
        style={{
          width: CARD_W,
          height: CARD_W,
          zoom: SCALE,
        }}
      >
        <div className={ui.header}>
          <div className={ui.headerNyBadge}>NY</div>
          <div className={ui.headerTextCol}>
            <span className={ui.headerEyebrow}>NYC Transit</span>
            <span className={ui.headerTitle}>Line Performance</span>
          </div>
        </div>

        <div className={ui.body}>
          <div className={ui.bodyTop}>
            <div
              className={ui.lineBadge}
              style={{
                background: ls.line.color,
                color: ls.line.text_color,
              }}
            >
              {ls.line.short_name}
            </div>
            <p className={ui.rankText}>
              Ranked #{rank} of {total}
            </p>
            <p className={ui.snapshotText}>{snapshotTime}</p>
            <p className={ui.tagline}>&ldquo;{customTagline}&rdquo;</p>
          </div>

          <div className={ui.scoresRow}>
            {rows.map(([label, val], i, arr) => (
              <div
                key={label}
                className={`${ui.scoreCol} ${i < arr.length - 1 ? ui.scoreColDivider : ""}`}
              >
                <span className={`${ui.scoreValue} ${ui.scoreTextToneClass(val)}`}>
                  {val}
                </span>
                <span className={`${ui.scoreLabel} ${ui.scoreTextToneClass(val)}`}>
                  {ui.scoreBandLabel(val)}
                </span>
                <span className={ui.scoreName}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={ui.footer}>
          <span className={ui.footerLeft}>nyctransit.app</span>
          <span className={ui.footerRight}>NYC Transit</span>
        </div>
      </div>
    </div>
  );
}
