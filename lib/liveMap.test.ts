import { afterEach, describe, expect, it, vi } from "vitest";
import {
  computeTrainPosition,
  fetchJsonOrNotFound,
  mapWithConcurrency,
  splitLineSegments,
  TRIP_FETCH_FAILED_USER_MESSAGE,
  type TrainSchedule,
} from "./liveMap";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("fetchJson", () => {
  it("throws a friendly message on network failure (e.g. blocked URL)", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      (await import("./liveMap")).fetchJson("https://example.com/api/lines"),
    ).rejects.toThrow("Could not reach the server. Check your connection and try again.");
  });

  it("throws a friendly message on 404", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));

    await expect(
      (await import("./liveMap")).fetchJson("https://example.com/api/lines"),
    ).rejects.toThrow("Map data could not be found. It may have moved or be temporarily unavailable.");
  });

  it("throws a friendly message on 410", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 410 }));

    await expect(
      (await import("./liveMap")).fetchJson("https://example.com/api/lines"),
    ).rejects.toThrow("Map data could not be found. It may have moved or be temporarily unavailable.");
  });

  it("throws a friendly message on 429", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 429 }));

    await expect(
      (await import("./liveMap")).fetchJson("https://example.com/api/lines"),
    ).rejects.toThrow("Too many requests. Please wait a moment and try again.");
  });

  it("throws a friendly message on other server errors", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));

    await expect(
      (await import("./liveMap")).fetchJson("https://example.com/api/lines"),
    ).rejects.toThrow("Map data failed to load. The map will try again on the next refresh.");
  });

  it("does not swallow abort errors", async () => {
    const abort = new DOMException("Aborted", "AbortError");
    globalThis.fetch = vi.fn().mockRejectedValue(abort);

    await expect(
      (await import("./liveMap")).fetchJson("https://example.com/api/lines"),
    ).rejects.toThrow("Aborted");
  });
});

describe("fetchJsonOrNotFound", () => {
  it("returns null on 404 so upstream missing trips do not surface as user errors", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));

    await expect(
      fetchJsonOrNotFound<{ ok: boolean }>("https://example.com/api/trips/missing", undefined),
    ).resolves.toBeNull();
  });

  it("returns null on 410", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 410 }));

    await expect(
      fetchJsonOrNotFound<{ ok: boolean }>("https://example.com/api/trips/gone", undefined),
    ).resolves.toBeNull();
  });

  it("throws a friendly message on 429", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 429 }));

    await expect(
      fetchJsonOrNotFound<{ ok: boolean }>("https://example.com/api/trips/x", undefined),
    ).rejects.toThrow(/Too many requests/);
  });

  it("throws a generic user message on other upstream errors — not a raw HTTP URL", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 502 }));

    await expect(
      fetchJsonOrNotFound<{ ok: boolean }>("https://example.com/api/trips/x", undefined),
    ).rejects.toThrow(TRIP_FETCH_FAILED_USER_MESSAGE);
  });

  it("throws a friendly message on network failure (e.g. blocked URL)", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      fetchJsonOrNotFound<{ ok: boolean }>("https://example.com/api/trips/x", undefined),
    ).rejects.toThrow(TRIP_FETCH_FAILED_USER_MESSAGE);
  });

  it("returns parsed JSON on 200", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      Response.json({ ok: true, data: { stops: [] } }),
    );

    await expect(
      fetchJsonOrNotFound<{ ok: boolean; data: { stops: unknown[] } }>(
        "https://example.com/api/trips/good",
        undefined,
      ),
    ).resolves.toEqual({ ok: true, data: { stops: [] } });
  });

  it("warns in development when 404 and logContext is provided", async () => {
    vi.stubEnv("NODE_ENV", "development");
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await fetchJsonOrNotFound("https://example.com/api/trips/x", undefined, {
      tripId: "080850_L..N",
      routeSlug: "l",
    });

    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/Trip schedule not found \(404\).*trip=080850_L\.\.N.*route=l/),
    );
  });

  it("does not warn in non-development env on 404", async () => {
    vi.stubEnv("NODE_ENV", "test");
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await fetchJsonOrNotFound("https://example.com/api/trips/x", undefined, {
      tripId: "t1",
      routeSlug: "a",
    });

    expect(warn).not.toHaveBeenCalled();
  });
});

describe("mapWithConcurrency with fetchJsonOrNotFound", () => {
  it("completes when some trips 404 and others succeed (mirrors LiveMap batch)", async () => {
    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("trip-not-found")) {
        return Promise.resolve(new Response(null, { status: 404 }));
      }
      return Promise.resolve(Response.json({ ok: true, data: { stops: [{ x: 1 }] } }));
    });

    const requests = [
      { key: "a", url: "https://x/api/trips/trip-not-found?route=l" },
      { key: "b", url: "https://x/api/trips/trip-ok?route=l" },
    ];

    const out = await mapWithConcurrency(requests, 2, async (r) => ({
      key: r.key,
      trip: await fetchJsonOrNotFound<{ ok: boolean; data: { stops: unknown[] } }>(
        r.url,
        undefined,
      ),
    }));

    expect(out).toHaveLength(2);
    expect(out[0]!.trip).toBeNull();
    expect(out[1]!.trip).toEqual({ ok: true, data: { stops: [{ x: 1 }] } });
  });
});

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
