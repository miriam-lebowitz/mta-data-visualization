"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  type MapLayerMouseEvent,
} from "react-map-gl/mapbox";
import { STATION_COORDS } from "./StationCoords";

type LineSummary = {
  id: string;
  short_name: string;
  long_name: string;
  slug: string;
  color: string;
  text_color: string;
};

type LineDetailStation = {
  id: string;
  name: string;
  slug: string;
  next_uptown?: {
    minutes_away: number;
    trip_id: string;
    arrival_time_iso?: string;
    arrival_time?: number;
  } | null;
  next_downtown?: {
    minutes_away: number;
    trip_id: string;
    arrival_time_iso?: string;
    arrival_time?: number;
  } | null;
};

type LineDetail = {
  route: {
    id: string;
    short_name: string;
    color: string;
    text_color: string;
    slug: string;
  };
  station_count: number;
  stations: LineDetailStation[];
};

type TripResponse = {
  trip_id: string;
  route: {
    slug: string;
    short_name: string;
    color: string;
    text_color?: string;
  };
  direction: "uptown" | "downtown";
  stops: Array<{
    station: { name: string; slug: string };
    arrival_time: number | null;
    departure_time: number | null;
    minutes_away: number | null;
    status: string;
  }>;
};

type StationArrival = {
  lineId: string;
  lineSlug: string;
  shortName: string;
  color: string;
  textColor: string;
  upMinutes?: number;
  downMinutes?: number;
};

type TrainPoint = {
  slug: string;
  lat: number;
  lon: number;
  t: number; // unix seconds
  minutesAway: number | null;
};

type TrainSchedule = {
  key: string;
  lineSlug: string;
  lineShortName: string;
  color: string;
  textColor: string;
  direction: "uptown" | "downtown";
  delayed: boolean;
  points: TrainPoint[]; // in order along the trip
};

type LatLon = [number, number];

const CITY_CENTER: LatLon = [40.75, -73.99];
const DEFAULT_ZOOM = 11.2;

function getCoords(slug: string) {
  // `STATION_COORDS` is generated as a `const` map, so we cast to allow string lookups.
  const coords = (STATION_COORDS as unknown as Record<
    string,
    { lat: number; lon: number }
  >)[slug];
  return coords ?? null;
}

function splitLineSegments(points: Array<{ slug: string }>) {
  const segments: Array<Array<[number, number]>> = [];
  let current: Array<[number, number]> = [];
  let missingRun = 0;

  for (const p of points) {
    const coords = getCoords(p.slug);
    if (!coords) {
      // Bridge short gaps by skipping unknown stations instead of splitting the segment.
      // This keeps lines visually continuous when coordinate data is incomplete.
      missingRun += 1;
      continue;
    }

    // Prevent unrealistic jumps when a very long run of stations is missing.
    if (missingRun >= 6 && current.length >= 2) {
      segments.push(current);
      current = [];
    }
    missingRun = 0;

    current.push([coords.lat, coords.lon]);
  }

  if (current.length >= 2) segments.push(current);
  return segments;
}

function computeTrainPosition(
  schedule: TrainSchedule,
  nowSeconds: number
): {
  lat: number;
  lon: number;
  atStop: boolean;
  nextStopSlug: string | null;
} | null {
  const points = schedule.points;
  if (points.length === 0) return null;
  if (points.length === 1) {
    return {
      lat: points[0].lat,
      lon: points[0].lon,
      atStop: true,
      nextStopSlug: points[0].slug,
    };
  }

  // Find segment i -> i+1 containing nowSeconds
  let i = 0;
  while (i + 1 < points.length && points[i + 1].t <= nowSeconds) i++;

  const p1 = points[i];
  const p2 = points[Math.min(i + 1, points.length - 1)];

  if (!p1 || !p2) return null;

  // If now is beyond last point, hold at last.
  if (p1 === p2) {
    return {
      lat: p1.lat,
      lon: p1.lon,
      atStop: true,
      nextStopSlug: p1.slug,
    };
  }

  const dt = p2.t - p1.t;
  const frac = dt > 0 ? (nowSeconds - p1.t) / dt : 0;
  const clamped = Math.max(0, Math.min(1, frac));

  const lat = p1.lat + (p2.lat - p1.lat) * clamped;
  const lon = p1.lon + (p2.lon - p1.lon) * clamped;

  const stopWindowSec = 6;
  const atStop =
    Math.abs(nowSeconds - p1.t) < stopWindowSec ||
    Math.abs(nowSeconds - p2.t) < stopWindowSec;

  const nextStopSlug = nowSeconds <= p2.t ? p2.slug : p1.slug;

  return { lat, lon, atStop, nextStopSlug: nextStopSlug ?? null };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": "mta-data-viz/1.0" } });
  return (await res.json()) as T;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;
      if (current >= items.length) return;
      results[current] = await fn(items[current], current);
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

export default function LiveMap({
  visibleLineSlugs = null,
}: {
  visibleLineSlugs?: string[] | null;
}) {
  const [stationArrivals, setStationArrivals] = useState<
    Record<string, StationArrival[]>
  >({});
  const [lineSegments, setLineSegments] = useState<
    Array<{ key: string; lineSlug: string; color: string; textColor: string; segments: LatLon[][] }>
  >([]);
  const [trains, setTrains] = useState<TrainSchedule[]>([]);
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [selectedStationSlug, setSelectedStationSlug] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Smooth-ish motion without re-fetching: recompute positions from schedule.
  useEffect(() => {
    const id = setInterval(() => {
      setNowSeconds(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    if (!hasLoadedOnce) setLoading(true);

    try {
      const linesJson = await fetchJson<{ ok: boolean; data: { lines: LineSummary[] } }>(
        "/api/lines"
      );
      if (!linesJson.ok) return;

      const fetchedLines = linesJson.data.lines;
      // Fetch line details with limited concurrency.
      const details = await mapWithConcurrency(
        fetchedLines,
        4,
        async (line) => {
          const detail = await fetchJson<{
            ok: boolean;
            data: LineDetail;
          }>(`/api/lines/${line.slug}`);
          return { line, detail };
        }
      );

      const newStationArrivals: Record<string, StationArrival[]> = {};
      const newSegments: Array<{
        key: string;
        lineSlug: string;
        color: string;
        textColor: string;
        segments: LatLon[][];
      }> = [];

      // Collect “best next trip” per line and direction.
      const tripRequests: Array<{
        tripId: string;
        routeSlug: string;
        line: LineSummary;
        direction: "uptown" | "downtown";
        // used for label
        lineShortName: string;
      }> = [];

      for (const item of details) {
        const line = item.line;
        const data = item.detail;
        if (!data?.ok || !data.data) continue;

        const stationList = data.data.stations ?? [];
        // Build station arrivals map for click popups.
        for (const st of stationList) {
          const slug = st.slug;
          if (!slug) continue;

          const entry: StationArrival = {
            lineId: line.id,
            lineSlug: line.slug,
            shortName: line.short_name,
            color: line.color,
            textColor: line.text_color,
            upMinutes: st.next_uptown?.minutes_away ?? undefined,
            downMinutes: st.next_downtown?.minutes_away ?? undefined,
          };

          // Only include stations that actually have something useful.
          if (
            entry.upMinutes === undefined &&
            entry.downMinutes === undefined
          )
            continue;

          if (!newStationArrivals[slug]) newStationArrivals[slug] = [];
          // Avoid duplicates for multi-appearance.
          if (
            !newStationArrivals[slug].some(
              (a) => a.lineId === entry.lineId
            )
          ) {
            newStationArrivals[slug].push(entry);
          }
        }

        // Build map polylines from station order.
        const segments = splitLineSegments(stationList);
        if (segments.length > 0) {
          newSegments.push({
            key: `line-${line.id}`,
            lineSlug: line.slug,
            color: line.color,
            textColor: line.text_color,
            segments: segments as LatLon[][],
          });
        }

        // Best trip per direction (smallest minutes_away across stations).
        let bestUp: { tripId: string; min: number } | null = null;
        let bestDown: { tripId: string; min: number } | null = null;

        for (const st of stationList) {
          if (st.next_uptown?.trip_id != null) {
            const min = st.next_uptown.minutes_away;
            if (bestUp == null || min < bestUp.min) {
              bestUp = { tripId: st.next_uptown.trip_id, min };
            }
          }
          if (st.next_downtown?.trip_id != null) {
            const min = st.next_downtown.minutes_away;
            if (bestDown == null || min < bestDown.min) {
              bestDown = { tripId: st.next_downtown.trip_id, min };
            }
          }
        }

        if (bestUp) {
          tripRequests.push({
            tripId: bestUp.tripId,
            routeSlug: line.slug,
            line,
            direction: "uptown",
            lineShortName: line.short_name,
          });
        }
        if (bestDown) {
          tripRequests.push({
            tripId: bestDown.tripId,
            routeSlug: line.slug,
            line,
            direction: "downtown",
            lineShortName: line.short_name,
          });
        }
      }

      // Fetch trips for those schedules.
      const tripDetails = await mapWithConcurrency(
        tripRequests,
        4,
        async (tr) => {
          const tripJson = await fetchJson<{
            ok: boolean;
            data: TripResponse;
          }>(`/api/trips/${encodeURIComponent(tr.tripId)}?route=${encodeURIComponent(tr.routeSlug)}`);
          return { tr, tripJson };
        }
      );

      // Build train schedules with coordinates.
      const newTrains: TrainSchedule[] = [];
      for (const t of tripDetails) {
        const tr = t.tr;
        const tj = t.tripJson;
        if (!tj?.ok || !tj.data?.stops) continue;

        const points: TrainPoint[] = [];
        const delayed = tj.data.stops.some((stop) =>
          (stop.status ?? "").toLowerCase().includes("delay")
        );
        for (const stop of tj.data.stops) {
          const coords = getCoords(stop.station.slug);
          if (!coords) continue;

          const tSec = stop.arrival_time ?? stop.departure_time;
          if (typeof tSec !== "number") continue;

          points.push({
            slug: stop.station.slug,
            lat: coords.lat,
            lon: coords.lon,
            t: tSec,
            minutesAway: stop.minutes_away ?? null,
          });
        }

        // Keep only schedules with at least 2 points so we can interpolate.
        if (points.length >= 2) {
          newTrains.push({
            key: `train-${tr.routeSlug}-${tr.direction}-${tr.tripId}`,
            lineSlug: tr.routeSlug,
            lineShortName: tr.lineShortName,
            color: tr.line.color,
            textColor: tr.line.text_color,
            direction: tr.direction,
            delayed,
            points,
          });
        }
      }

      // Limit clutter: keep earliest trains if too many.
      newTrains.sort((a, b) => {
        const aSoon = a.points[0]?.t ?? Number.MAX_SAFE_INTEGER;
        const bSoon = b.points[0]?.t ?? Number.MAX_SAFE_INTEGER;
        return aSoon - bSoon;
      });

      setStationArrivals(newStationArrivals);
      setLineSegments(newSegments);
      setTrains(newTrains.slice(0, 28));
      setLastUpdated(new Date());
      setLoading(false);
      if (!hasLoadedOnce) setHasLoadedOnce(true);
    } catch {
      // Don’t crash the whole map; just show loading state.
      setLoading(false);
      if (!hasLoadedOnce) setHasLoadedOnce(true);
    }
  }, [hasLoadedOnce]);

  useEffect(() => {
    const runRefresh = () => {
      void refresh();
    };
    const bootstrapId = window.setTimeout(runRefresh, 0);
    const intervalId = window.setInterval(runRefresh, 30_000);
    return () => {
      window.clearTimeout(bootstrapId);
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  const stationMarkerData = useMemo(() => {
    const slugs = Object.keys(stationArrivals);
    const markers = slugs
      .map((slug) => {
        const coords = getCoords(slug);
        if (!coords) return null;
        return {
          slug,
          position: [coords.lat, coords.lon] as LatLon,
          arrivals: stationArrivals[slug] ?? [],
        };
      })
      .filter(Boolean) as Array<{
      slug: string;
      position: LatLon;
      arrivals: StationArrival[];
    }>;
    return markers;
  }, [stationArrivals]);

  const visibleLineSlugSet = useMemo(
    () => new Set(visibleLineSlugs ?? []),
    [visibleLineSlugs]
  );

  const filteredLineSegments = useMemo(
    () =>
      lineSegments.filter(
        (line) => visibleLineSlugs === null || visibleLineSlugSet.has(line.lineSlug)
      ),
    [lineSegments, visibleLineSlugSet, visibleLineSlugs]
  );

  const lineFeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: filteredLineSegments.flatMap((line) =>
        line.segments.map((seg, segIdx) => ({
          type: "Feature" as const,
          properties: {
            key: `${line.key}-seg-${segIdx}`,
            color: line.color,
          },
          geometry: {
            type: "LineString" as const,
            coordinates: seg.map(([lat, lon]) => [lon, lat]),
          },
        }))
      ),
    }),
    [filteredLineSegments]
  );

  const activeTrainStopSlugs = useMemo(() => {
    const s = new Set<string>();
    for (const train of trains) {
      if (visibleLineSlugs !== null && !visibleLineSlugSet.has(train.lineSlug)) continue;
      const pos = computeTrainPosition(train, nowSeconds);
      if (pos?.nextStopSlug) s.add(pos.nextStopSlug);
    }
    return s;
  }, [trains, nowSeconds, visibleLineSlugSet, visibleLineSlugs]);

  const filteredStationMarkerData = useMemo(
    () =>
      stationMarkerData
        .map((st) => ({
          ...st,
          arrivals:
            visibleLineSlugs !== null
              ? st.arrivals.filter((a) => visibleLineSlugSet.has(a.lineSlug))
              : st.arrivals,
        }))
        .filter((st) => st.arrivals.length > 0),
    [stationMarkerData, visibleLineSlugSet, visibleLineSlugs]
  );

  const selectedStation = useMemo(
    () => filteredStationMarkerData.find((s) => s.slug === selectedStationSlug) ?? null,
    [selectedStationSlug, filteredStationMarkerData]
  );

  return (
    <div className="relative w-full h-full aged-paper overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          mixBlendMode: "multiply",
        }}
      />

      {/* Last updated */}
      <div className="absolute top-3 right-4 z-[800] retro-panel px-3 py-1 text-[10px] font-bold tracking-widest uppercase text-ink/60">
        {lastUpdated
          ? `UPDATED ${lastUpdated.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}`
          : "LOADING…"}
      </div>

      {loading && (
        <div className="absolute inset-0 z-[900] flex items-center justify-center">
          <div className="retro-panel px-8 py-6 text-center">
            <p className="text-[11px] font-black tracking-[0.08em] uppercase text-ink/70 mb-3">
              Loading ...
            </p>
            <div className="skeleton h-3 w-32 mx-auto" />
          </div>
        </div>
      )}

      <div
        className="relative w-full h-full"
        style={{ filter: "sepia(0.15) contrast(1.1)" }}
      >
        <Map
          initialViewState={{
            latitude: CITY_CENTER[0],
            longitude: CITY_CENTER[1],
            zoom: DEFAULT_ZOOM,
          }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          scrollZoom
          touchZoomRotate
          style={{ height: "100%", width: "100%" }}
          onClick={(e: MapLayerMouseEvent) => {
            if (e.originalEvent.defaultPrevented) return;
            setSelectedStationSlug(null);
          }}
        >
          <NavigationControl
            position="top-left"
            showCompass={false}
            visualizePitch={false}
          />

          <Source id="lines" type="geojson" data={lineFeatureCollection}>
            <Layer
              id="line-border"
              type="line"
              paint={{
                "line-color": "rgba(23, 23, 23, 0.45)",
                "line-width": 8,
              }}
              layout={{ "line-join": "round", "line-cap": "round" }}
            />
            <Layer
              id="line-color"
              type="line"
              paint={{
                "line-color": ["get", "color"],
                "line-width": 5,
                "line-opacity": 0.92,
              }}
              layout={{ "line-join": "round", "line-cap": "round" }}
            />
          </Source>

          {filteredStationMarkerData.map((st) => {
            const isStop = activeTrainStopSlugs.has(st.slug);
            const borderColor = isStop ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.25)";

            return (
              <Marker
                key={st.slug}
                latitude={st.position[0]}
                longitude={st.position[1]}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.preventDefault();
                  setSelectedStationSlug(st.slug);
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: "rgba(245,240,232,0.95)",
                    border: `2px solid ${borderColor}`,
                    boxShadow: isStop ? "0 0 0 4px rgba(0,0,0,0.08)" : "none",
                    cursor: "pointer",
                  }}
                />
              </Marker>
            );
          })}

          {selectedStation && (
            <Popup
              latitude={selectedStation.position[0]}
              longitude={selectedStation.position[1]}
              closeButton
              closeOnClick={false}
              onClose={() => setSelectedStationSlug(null)}
              offset={10}
            >
              <div className="retro-panel p-2">
                <div className="text-[10px] font-black tracking-[0.05em] text-ink">
                  {selectedStation.slug.replaceAll("-", " ")}
                </div>
                <div className="mt-1 space-y-1">
                  {selectedStation.arrivals.slice(0, 6).map((a) => (
                    <div
                      key={a.lineId}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full border border-ink/20"
                          style={{ background: a.color }}
                          aria-hidden="true"
                        />
                        <span className="text-[10px] font-black text-ink/70">
                          {a.shortName}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-ink/70 whitespace-nowrap">
                        UP:{a.upMinutes ?? "—"} · DOWN:{a.downMinutes ?? "—"}
                      </div>
                    </div>
                  ))}
                  {selectedStation.arrivals.length === 0 && (
                    <div className="text-[10px] text-ink/50 font-mono">
                      No arrivals
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          )}

          {trains.map((train) => {
            if (visibleLineSlugs !== null && !visibleLineSlugSet.has(train.lineSlug)) {
              return null;
            }
            const pos = computeTrainPosition(train, nowSeconds);
            if (!pos) return null;

            const ring = pos.atStop ? "0 0 0 5px rgba(0,0,0,0.25)" : "none";

            return (
              <Marker
                key={train.key}
                latitude={pos.lat}
                longitude={pos.lon}
                anchor="center"
              >
                <div
                  className={pos.atStop ? "train-pulse" : undefined}
                  style={{
                    position: "relative",
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: train.color,
                    border: "2px solid var(--ink)",
                    boxShadow: ring,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-barlow-condensed), sans-serif",
                    fontWeight: 800,
                    fontSize: 8,
                    color: train.textColor,
                    lineHeight: 1,
                  }}
                >
                  {train.lineShortName.substring(0, 2)}
                  {train.delayed && (
                    <span
                      aria-label="Delayed train"
                      title="Delayed"
                      style={{
                        position: "absolute",
                        right: -7,
                        top: -7,
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: "var(--signal-red)",
                        color: "#fff",
                        border: "1px solid var(--ink)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 7,
                        fontWeight: 900,
                        lineHeight: 1,
                      }}
                    >
                      !
                    </span>
                  )}
                </div>
              </Marker>
            );
          })}
        </Map>
      </div>

      <div className="absolute bottom-3 left-4 z-[800] retro-panel px-3 py-2 max-w-[260px]">
        <p className="text-[9px] font-black tracking-[0.15em] uppercase text-ink/60 mb-1">
          Legend
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full border border-ink/30 bg-parchment" />
            <span className="text-[10px] font-bold text-ink/60">Station</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full border border-ink/50 bg-signal-red" />
            <span className="text-[10px] font-bold text-ink/60">Train</span>
          </div>
        </div>
        <p className="text-[9px] text-ink/50 font-mono mt-2">
          Trains move based on `/api/trips` schedules · refresh 30s
        </p>
      </div>
    </div>
  );
}

