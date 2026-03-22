"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  accessScoreForLine,
  computeComposite,
  computeDelayScore,
  computeIncidentScore,
  type RankingWeights,
} from "@/lib/rankingScores";
import type { LinePerformanceScore, LineSummary } from "@/lib/types";
import LineBadge from "./LineBadge";
import RetroToggle from "./RetroToggle";
import SolariFlip from "./SolariFlip";
import ScoreBar from "./ScoreBar";
import ShareModal from "./ShareModal";
import * as ui from "./styles/LineRankings.styles";

// ─── Row component ───────────────────────────────────────────────────────────

function RankRow({
  rank,
  ls,
  weights,
}: {
  rank: number;
  ls: LinePerformanceScore;
  weights: RankingWeights;
}) {
  const composite = computeComposite(ls, weights);

  return (
    <div className={ui.rankRow}>
      {/* Rank number */}
      <span className={ui.rankNumber}>
        {rank}
      </span>

      {/* Badge */}
      <LineBadge
        label={ls.line.short_name}
        color={ls.line.color}
        textColor={ls.line.text_color}
        size="md"
      />

      {/* Line name */}
      <div className={ui.lineNameBlock}>
        <p className={ui.lineLongName}>
          {ls.line.long_name}
        </p>
        <ScoreBar score={composite} width="100%" />
      </div>

      {/* Sub-scores */}
      <div className={ui.subScoresRow}>
        {weights.delays && (
          <SubScore label="DELAY" value={ls.delayScore} />
        )}
        {weights.incidents && (
          <SubScore label="INCIDENT" value={ls.incidentScore} />
        )}
        {weights.accessibility && (
          <SubScore label="ACCESS" value={ls.accessScore} />
        )}
      </div>

      {/* Composite */}
      <div className={ui.compositeBlock}>
        <SolariFlip
          value={composite}
          decimals={0}
          className={`${ui.solariComposite} ${ui.scoreClass(composite)}`}
        />
        <p className={`${ui.compositeLabel} ${ui.scoreTextClass(composite)}`}>
          {composite >= 70 ? "GOOD" : composite >= 40 ? "FAIR" : "POOR"}
        </p>
      </div>
    </div>
  );
}

function SubScore({ label, value }: { label: string; value: number }) {
  return (
    <div className={ui.subScoreCell}>
      <p className={ui.subScoreLabel}>{label}</p>
      <p className={`${ui.subScoreValue} ${ui.scoreTextClass(value)}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LineRankings() {
  const [scores, setScores] = useState<LinePerformanceScore[]>([]);
  const [weights, setWeights] = useState<RankingWeights>({
    delays: true,
    incidents: true,
    accessibility: true,
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  /** `null` until after mount — avoids SSR/client clock mismatch (hydration errors). */
  const [now, setNow] = useState<Date | null>(null);
  const tickRef = useRef<number | null>(null);

  // Clock tick (client-only)
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    tickRef.current = window.setInterval(tick, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [linesRes, alertsRes] = await Promise.all([
        fetch("/api/lines"),
        fetch("/api/alerts"),
      ]);

      const linesJson = await linesRes.json();
      const alertsJson = await alertsRes.json();

      if (!linesJson.ok || !linesJson.data?.lines) {
        throw new Error("Lines data unavailable");
      }

      const fetchedLines = linesJson.data.lines as LineSummary[];

      const aLines = new Set<string>();
      if (alertsJson.ok && alertsJson.data?.alerts) {
        for (const alert of alertsJson.data.alerts) {
          aLines.add(alert.line);
          aLines.add(alert.line.toLowerCase());
        }
      }

      const computed: LinePerformanceScore[] = fetchedLines.map((line) => {
        const delayScore = computeDelayScore(line.id, line.station_count);
        const incidentScore = computeIncidentScore(line.id, aLines);
        const accessScore = accessScoreForLine(line);

        const ls: LinePerformanceScore = {
          line,
          delayScore,
          incidentScore,
          accessScore,
          composite: 0,
        };
        ls.composite = computeComposite(ls, weights);
        return ls;
      });

      setScores(computed);
      setFetchError(null);
      setLoading(false);
    } catch {
      setFetchError("Could not load rankings. Check your connection and try again.");
      setLoading(false);
    }
  }, [weights]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await fetchData();
    };

    void run();

    const id = window.setInterval(() => {
      if (!mounted) return;
      void fetchData();
    }, 30_000);

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [fetchData]);

  // Re-sort when weights change
  const sortedScores = [...scores]
    .map((ls) => ({ ...ls, composite: computeComposite(ls, weights) }))
    .sort((a, b) => b.composite - a.composite);

  const timeStr = now
    ? now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";
  const dateStr = now
    ? now
        .toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase()
    : "—";

  return (
    <div className={ui.page}>
      {fetchError && (
        <div className={ui.fetchErrorBar} role="alert">
          <span className={ui.fetchErrorText}>{fetchError}</span>
          <button type="button" className={ui.fetchErrorRetry} onClick={() => void fetchData()}>
            Retry
          </button>
        </div>
      )}

      {/* Header panel */}
      <div className={ui.headerPanel}>
        <div className={ui.headerTopRow}>
          <div>
            <h1 className={ui.title}>
              Line Performance
            </h1>
            <p className={ui.subtitle}>
              COMPOSITE RANKING — ALL NYC SUBWAY LINES
            </p>
          </div>

          {/* Clock + Share */}
          <div className={ui.clockShareRow}>
            <div className={ui.clockBlock}>
              <div className={ui.clockTime}>
                {timeStr}
              </div>
              <div className={ui.clockDate}>
                {dateStr}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              disabled={loading || sortedScores.length === 0}
              className={ui.shareButton}
              aria-label="Share your favorite line"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>
          </div>
        </div>

        {/* Toggle controls */}
        <div className={ui.togglesSection}>
          {/* Left: label + toggles */}
          <div className={ui.togglesLeft}>
            <p className={ui.togglesLabel}>
              Weight Factors
            </p>
            <div className={ui.togglesRow}>
              <RetroToggle
                id="toggle-delays"
                label="Delays"
                checked={weights.delays}
                onChange={(v) => setWeights((w) => ({ ...w, delays: v }))}
                accentColor="var(--signal-green)"
              />
              <RetroToggle
                id="toggle-incidents"
                label="Incidents"
                checked={weights.incidents}
                onChange={(v) => setWeights((w) => ({ ...w, incidents: v }))}
                accentColor="var(--signal-yellow)"
              />
              <RetroToggle
                id="toggle-access"
                label="Accessibility"
                checked={weights.accessibility}
                onChange={(v) => setWeights((w) => ({ ...w, accessibility: v }))}
                accentColor="#0062CF"
              />
            </div>
          </div>

          {/* Right: factor key */}
          <div className={ui.factorKeyColumn}>
            <FactorLegendItem color="var(--signal-green)" label="Delay — avg. wait times" />
            <FactorLegendItem color="var(--signal-yellow)" label="Incident — active alerts" />
            <FactorLegendItem color="#0062CF" label="Accessibility — ADA" />
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div className={ui.columnHeaders}>
        <span className={ui.colRankSpacer} />
        <span className={ui.colBadgeSpacer} />
        <span className={ui.colLineLabel}>
          Line
        </span>
        <div className={ui.colSubScoresRow}>
          {weights.delays && (
            <span className={ui.colSubScoreHeader}>Delay</span>
          )}
          {weights.incidents && (
            <span className={ui.colSubScoreHeader}>Incident</span>
          )}
          {weights.accessibility && (
            <span className={ui.colSubScoreHeader}>Access</span>
          )}
        </div>
        <span className={ui.colScoreHeader}>
          Score
        </span>
      </div>

      {/* Rankings list — fills remaining vertical space */}
      <div className={ui.listPanel}>
        {loading ? (
          <div className={ui.skeletonList}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className={ui.skeletonRow}>
                <div className={ui.skeletonRank} />
                <div className={ui.skeletonLine} />
                <div className={ui.skeletonScore} />
              </div>
            ))}
          </div>
        ) : sortedScores.length === 0 ? (
          <div className={ui.emptyState}>
            <p className={ui.emptyMessage}>
              No data available
            </p>
          </div>
        ) : (
          <div className={ui.scrollList}>
            {sortedScores.map((ls, i) => (
              <RankRow key={ls.line.id} rank={i + 1} ls={ls} weights={weights} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={ui.footer}>
        <p className={ui.footerNote}>
          DATA: NYC SUBWAY STATUS API + MTA SERVICE ALERTS
          <br />
          SCORES ARE COMPOSITE ESTIMATES · AUTO-REFRESH 30s
        </p>
        <div className={ui.footerLegendRow}>
          {(["normal", "minor", "major"] as const).map((level, i) => (
            <span key={level} className={ui.footerLegendItem}>
              <span className={ui.footerLegendSwatches[i]} />
              <span className={ui.footerLegendLabel}>
                {i === 0 ? "Good" : i === 1 ? "Fair" : "Poor"}
              </span>
            </span>
          ))}
        </div>
      </div>

      {shareModalOpen && (
        <ShareModal
          scores={sortedScores}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </div>
  );
}

function FactorLegendItem({ color, label }: { color: string; label: string }) {
  return (
    <p className={ui.factorLegendRow}>
      {label}
      <span
        className={ui.factorLegendSwatch}
        style={{ background: color }}
      />
    </p>
  );
}
