import { describe, expect, it } from "vitest";
import {
  computeComposite,
  computeDelayScore,
  computeIncidentScore,
  type RankingWeights,
} from "./rankingScores";
import type { LinePerformanceScore, LineSummary } from "./types";

const mockLine = (overrides: Partial<LineSummary> = {}): LineSummary => ({
  id: "L",
  short_name: "L",
  long_name: "L Train",
  slug: "l",
  color: "#ccc",
  text_color: "#000",
  station_count: 24,
  ...overrides,
});

describe("rankingScores", () => {
  it("computeDelayScore is stable per line id + station count", () => {
    expect(computeDelayScore("1", 40)).toBe(computeDelayScore("1", 40));
    expect(computeDelayScore("1", 40)).not.toBe(computeDelayScore("2", 40));
  });

  it("computeIncidentScore reacts to alert set", () => {
    const empty = new Set<string>();
    const withAlert = new Set(["1"]);
    const s1 = computeIncidentScore("1", empty);
    const s2 = computeIncidentScore("1", withAlert);
    expect(s2).toBeLessThanOrEqual(s1);
  });

  it("computeComposite averages active factors", () => {
    const line = mockLine();
    const ls: LinePerformanceScore = {
      line,
      delayScore: 60,
      incidentScore: 80,
      accessScore: 40,
      composite: 0,
    };
    const all: RankingWeights = { delays: true, incidents: true, accessibility: true };
    expect(computeComposite(ls, all)).toBe(60);

    const delaysOnly: RankingWeights = { delays: true, incidents: false, accessibility: false };
    expect(computeComposite(ls, delaysOnly)).toBe(60);
  });
});
