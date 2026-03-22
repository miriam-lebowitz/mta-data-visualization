import { describe, expect, it } from "vitest";
import { computeTrainPosition, splitLineSegments, type TrainSchedule } from "./liveMap";

describe("liveMap", () => {
  it("splitLineSegments returns empty when slugs have no coords", () => {
    expect(splitLineSegments([{ slug: "nonexistent-station-slug-xyz" }])).toEqual([]);
  });

  it("splitLineSegments joins known station slugs", () => {
    const segs = splitLineSegments([{ slug: "14-st" }, { slug: "18-st" }]);
    expect(segs.length).toBeGreaterThanOrEqual(1);
    expect(segs[0]!.length).toBeGreaterThanOrEqual(2);
  });

  it("computeTrainPosition interpolates between two points", () => {
    const schedule: TrainSchedule = {
      key: "t",
      lineSlug: "l",
      lineShortName: "L",
      color: "#000",
      textColor: "#fff",
      direction: "uptown",
      delayed: false,
      points: [
        { slug: "a", lat: 40, lon: -74, t: 1000, minutesAway: null },
        { slug: "b", lat: 41, lon: -73, t: 2000, minutesAway: null },
      ],
    };
    const mid = computeTrainPosition(schedule, 1500);
    expect(mid).not.toBeNull();
    expect(mid!.lat).toBeCloseTo(40.5, 5);
    expect(mid!.lon).toBeCloseTo(-73.5, 5);
  });
});
