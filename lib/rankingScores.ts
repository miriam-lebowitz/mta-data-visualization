import { unitFloat } from "./deterministicHash";
import type { LinePerformanceScore, LineSummary } from "./types";

/** Static accessibility proxy (ADA / station data) — same as prior hard-coded table. */
export const ACCESS_SCORES: Record<string, number> = {
  "1": 72,
  "2": 68,
  "3": 65,
  "4": 74,
  "5": 71,
  "6": 73,
  "6X": 70,
  "7": 82,
  "7X": 82,
  A: 78,
  B: 62,
  C: 60,
  D: 65,
  E: 80,
  F: 66,
  FS: 40,
  FX: 58,
  G: 55,
  GS: 90,
  H: 45,
  J: 58,
  L: 88,
  M: 62,
  N: 70,
  Q: 75,
  R: 65,
  SI: 95,
  W: 69,
  Z: 55,
};

export interface RankingWeights {
  delays: boolean;
  incidents: boolean;
  accessibility: boolean;
}

/** Deterministic “delay” score from station count + line id. */
export function computeDelayScore(lineId: string, stationCount: number): number {
  const base = Math.max(30, 100 - stationCount * 0.9);
  const jitter = (unitFloat(lineId, "delay") - 0.5) * 14;
  return Math.round(Math.min(98, Math.max(20, base + jitter)));
}

/** Deterministic incident sensitivity from line id + whether alerts mention the line. */
export function computeIncidentScore(lineId: string, alertLines: Set<string>): number {
  const hasAlert = alertLines.has(lineId) || alertLines.has(lineId.toLowerCase());
  const u = unitFloat(lineId, "incident");
  const base = hasAlert ? 45 + u * 20 : 72 + u * 22;
  return Math.round(Math.min(98, Math.max(10, base)));
}

export function computeComposite(ls: LinePerformanceScore, weights: RankingWeights): number {
  const active = [weights.delays, weights.incidents, weights.accessibility].filter(Boolean).length;
  if (active === 0) return 0;

  let sum = 0;
  if (weights.delays) sum += ls.delayScore;
  if (weights.incidents) sum += ls.incidentScore;
  if (weights.accessibility) sum += ls.accessScore;
  return Math.round(sum / active);
}

export function accessScoreForLine(line: LineSummary): number {
  return ACCESS_SCORES[line.id] ?? ACCESS_SCORES[line.short_name] ?? 60;
}
