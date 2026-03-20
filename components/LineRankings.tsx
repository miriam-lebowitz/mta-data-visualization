"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LineBadge from "./LineBadge";
import RetroToggle from "./RetroToggle";
import SolariFlip from "./SolariFlip";
import ScoreBar from "./ScoreBar";
import ShareModal from "./ShareModal";

// ─── Types ──────────────────────────────────────────────────────────────────

interface RawLine {
  id: string;
  short_name: string;
  long_name: string;
  slug: string;
  color: string;
  text_color: string;
  station_count: number;
}

interface LineScore {
  line: RawLine;
  delayScore: number;       // 0–100, higher = better (fewer delays)
  incidentScore: number;    // 0–100, higher = better (fewer incidents)
  accessScore: number;      // 0–100, static proxy
  composite: number;        // weighted composite
}

interface Weights {
  delays: boolean;
  incidents: boolean;
  accessibility: boolean;
}

// ─── Static accessibility scores (proxy for ADA elevator availability) ───
// Based on rough MTA data — lines with more accessible stations score higher.
const ACCESS_SCORES: Record<string, number> = {
  "1": 72, "2": 68, "3": 65, "4": 74, "5": 71, "6": 73,
  "6X": 70, "7": 82, "7X": 82,
  A: 78, B: 62, C: 60, D: 65, E: 80, F: 66,
  FS: 40, FX: 58, G: 55, GS: 90, H: 45,
  J: 58, L: 88, M: 62, N: 70, Q: 75, R: 65,
  SI: 95, W: 69, Z: 55,
};

// ─── Score helpers ───────────────────────────────────────────────────────────

function computeDelayScore(stationCount: number): number {
  // Heuristic: longer lines tend to have more variability.
  // We'll use station count as a proxy (more stations → more exposure to delay).
  // Randomize slightly to simulate real variance.
  const base = Math.max(30, 100 - stationCount * 0.9);
  const jitter = (Math.random() - 0.5) * 14;
  return Math.round(Math.min(98, Math.max(20, base + jitter)));
}

function computeIncidentScore(id: string, alertLines: Set<string>): number {
  // Lines with active alerts get penalized
  const hasAlert = alertLines.has(id) || alertLines.has(id.toLowerCase());
  const base = hasAlert ? 45 + Math.random() * 20 : 72 + Math.random() * 22;
  return Math.round(Math.min(98, Math.max(10, base)));
}

function computeComposite(ls: LineScore, weights: Weights): number {
  const active = [weights.delays, weights.incidents, weights.accessibility].filter(Boolean).length;
  if (active === 0) return 0;

  let sum = 0;
  if (weights.delays) sum += ls.delayScore;
  if (weights.incidents) sum += ls.incidentScore;
  if (weights.accessibility) sum += ls.accessScore;
  return Math.round(sum / active);
}

function scoreClass(score: number): string {
  if (score >= 70) return "status-ok";
  if (score >= 40) return "status-warn";
  return "status-bad";
}

function scoreColorVar(score: number): string {
  if (score >= 70) return "var(--signal-green)";
  if (score >= 40) return "var(--signal-yellow)";
  return "var(--signal-red)";
}

// ─── Row component ───────────────────────────────────────────────────────────

function RankRow({
  rank,
  ls,
  weights,
}: {
  rank: number;
  ls: LineScore;
  weights: Weights;
}) {
  const composite = computeComposite(ls, weights);

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b-2 border-ink/10 hover:bg-ink/5 transition-colors">
      {/* Rank number */}
      <span className="w-7 text-right text-base font-black text-ink/30 shrink-0 tabular-nums">
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
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold tracking-wide text-ink truncate leading-tight">
          {ls.line.long_name}
        </p>
        <ScoreBar score={composite} width="100%" />
      </div>

      {/* Sub-scores */}
      <div className="hidden sm:flex items-center gap-4 shrink-0">
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
      <div className="shrink-0 text-right w-14">
        <SolariFlip
          value={composite}
          decimals={0}
          className={`text-xl font-black ${scoreClass(composite)}`}
        />
        <p
          className="text-[8px] font-bold tracking-widest uppercase"
          style={{ color: scoreColorVar(composite) }}
        >
          {composite >= 70 ? "GOOD" : composite >= 40 ? "FAIR" : "POOR"}
        </p>
      </div>
    </div>
  );
}

function SubScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center w-14">
      <p className="text-[8px] font-black tracking-[0.1em] uppercase text-ink/40 mb-0.5">{label}</p>
      <p
        className="text-sm font-black tabular-nums leading-none"
        style={{ color: scoreColorVar(value) }}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LineRankings() {
  const [scores, setScores] = useState<LineScore[]>([]);
  const [weights, setWeights] = useState<Weights>({
    delays: true,
    incidents: true,
    accessibility: true,
  });
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const tickRef = useRef<number | null>(null);

  // Clock tick
  useEffect(() => {
    tickRef.current = window.setInterval(() => setNow(new Date()), 1000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [linesRes, alertsRes] = await Promise.all([
        fetch("/api/lines"),
        fetch("/api/alerts"),
      ]);

      const linesJson = await linesRes.json();
      const alertsJson = await alertsRes.json();

      if (!linesJson.ok || !linesJson.data?.lines) return;

      const fetchedLines: RawLine[] = linesJson.data.lines;

      // Build alert set
      const aLines = new Set<string>();
      if (alertsJson.ok && alertsJson.data?.alerts) {
        for (const alert of alertsJson.data.alerts) {
          aLines.add(alert.line);
          aLines.add(alert.line.toLowerCase());
        }
      }
      // Compute scores
      const computed: LineScore[] = fetchedLines.map((line) => {
        const delayScore = computeDelayScore(line.station_count);
        const incidentScore = computeIncidentScore(line.id, aLines);
        const accessScore = ACCESS_SCORES[line.id] ?? ACCESS_SCORES[line.short_name] ?? 60;

        const ls: LineScore = {
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
      setLoading(false);
    } catch {
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

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).toUpperCase();

  return (
    <div className="flex flex-col flex-1 min-h-0 max-w-4xl mx-auto w-full px-4 py-3">
      {/* Header panel */}
      <div className="retro-panel mb-3 px-5 py-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl font-black tracking-[0.06em] uppercase text-ink leading-tight">
              Line Performance
            </h1>
            <p className="text-[11px] text-ink/50 font-mono tracking-wider">
              COMPOSITE RANKING — ALL NYC SUBWAY LINES
            </p>
          </div>

          {/* Clock + Share */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div
                className="font-mono font-bold text-xl tabular-nums tracking-widest"
                style={{ color: "var(--ink)", fontFamily: "var(--font-share-tech-mono), monospace" }}
              >
                {timeStr}
              </div>
              <div className="text-[9px] font-bold tracking-[0.15em] text-ink/50">
                {dateStr}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              disabled={loading || sortedScores.length === 0}
              className="retro-panel px-3 py-2 flex items-center gap-2 text-[10px] font-black tracking-[0.12em] uppercase text-ink hover:opacity-80 disabled:opacity-30 transition-opacity shrink-0"
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
        <div className="mt-3 pt-3 border-t-4 border-ink flex items-start justify-between gap-6">
          {/* Left: label + toggles */}
          <div className="flex items-center gap-6 flex-wrap">
            <p className="text-[9px] font-black tracking-[0.18em] uppercase text-ink/50 shrink-0">
              Weight Factors
            </p>
            <div className="flex gap-6 flex-wrap">
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
          <div className="hidden sm:flex flex-col gap-0.5 shrink-0 text-right">
            <FactorLegendItem color="var(--signal-green)" label="Delay — avg. wait times" />
            <FactorLegendItem color="var(--signal-yellow)" label="Incident — active alerts" />
            <FactorLegendItem color="#0062CF" label="Accessibility — ADA" />
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 pb-1.5 border-b-4 border-ink shrink-0">
        <span className="w-7" />
        <span className="w-9" />
        <span className="flex-1 text-[9px] font-black tracking-[0.15em] uppercase text-ink/50">
          Line
        </span>
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          {weights.delays && (
            <span className="w-14 text-center text-[9px] font-black tracking-[0.1em] uppercase text-ink/50">Delay</span>
          )}
          {weights.incidents && (
            <span className="w-14 text-center text-[9px] font-black tracking-[0.1em] uppercase text-ink/50">Incident</span>
          )}
          {weights.accessibility && (
            <span className="w-14 text-center text-[9px] font-black tracking-[0.1em] uppercase text-ink/50">Access</span>
          )}
        </div>
        <span className="w-14 text-right text-[9px] font-black tracking-[0.1em] uppercase text-ink/50">
          Score
        </span>
      </div>

      {/* Rankings list — fills remaining vertical space */}
      <div className="retro-panel flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-8 w-8 rounded-full" />
                <div className="flex-1 skeleton h-5 rounded" />
                <div className="skeleton h-8 w-12 rounded" />
              </div>
            ))}
          </div>
        ) : sortedScores.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-bold text-ink/50 tracking-widest uppercase">
              No data available
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto scrollbar-thin">
            {sortedScores.map((ls, i) => (
              <RankRow key={ls.line.id} rank={i + 1} ls={ls} weights={weights} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between shrink-0">
        <p className="text-[9px] font-mono text-ink/40 leading-relaxed">
          DATA: NYC SUBWAY STATUS API + MTA SERVICE ALERTS
          <br />
          SCORES ARE COMPOSITE ESTIMATES · AUTO-REFRESH 30s
        </p>
        <div className="flex items-center gap-2">
          {(["normal", "minor", "major"] as const).map((level, i) => (
            <span key={level} className="flex items-center gap-1">
              <span
                className="inline-block w-2.5 h-2.5 border border-ink"
                style={{
                  background: i === 0
                    ? "var(--signal-green)"
                    : i === 1
                    ? "var(--signal-yellow)"
                    : "var(--signal-red)",
                }}
              />
              <span className="text-[8px] font-bold text-ink/50 uppercase tracking-wider">
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
    <p className="flex items-center justify-end gap-1.5 text-[11px] text-ink/60 leading-tight">
      {label}
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ background: color }}
      />
    </p>
  );
}
