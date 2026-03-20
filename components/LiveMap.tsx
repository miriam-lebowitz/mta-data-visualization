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
  type MapRef,
} from "react-map-gl/mapbox";
import { STATION_COORDS } from "./StationCoords";
import type { GeoLocation, LiveTrainLocation } from "@/lib/types";

// ─── Local types ─────────────────────────────────────────────────────────────

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
  points: TrainPoint[];
};

type LatLon = [number, number];

// ─── Constants ───────────────────────────────────────────────────────────────

const CITY_CENTER: LatLon = [40.75, -73.99];
const DEFAULT_ZOOM = 11.2;
const MAX_MISSING_RUN = 6;
const AT_STOP_WINDOW_SEC = 6;
const MAX_TRAINS = 28;
const REFRESH_INTERVAL_MS = 30_000;
const FETCH_CONCURRENCY = 4;

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function getCoords(slug: string) {
  const coords = (STATION_COORDS as unknown as Record<string, { lat: number; lon: number }>)[slug];
  return coords ?? null;
}

function splitLineSegments(points: Array<{ slug: string }>) {
  const segments: Array<Array<[number, number]>> = [];
  let current: Array<[number, number]> = [];
  let missingRun = 0;

  for (const p of points) {
    const coords = getCoords(p.slug);
    if (!coords) {
      // Bridge short gaps; split on very long runs of missing coordinates.
      missingRun += 1;
      continue;
    }
    if (missingRun >= MAX_MISSING_RUN && current.length >= 2) {
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
  etaSeconds: number | null;
} | null {
  const { points } = schedule;
  if (points.length === 0) return null;
  if (points.length === 1) {
    return { lat: points[0].lat, lon: points[0].lon, atStop: true, nextStopSlug: points[0].slug, etaSeconds: 0 };
  }

  let i = 0;
  while (i + 1 < points.length && points[i + 1].t <= nowSeconds) i++;

  const p1 = points[i];
  const p2 = points[Math.min(i + 1, points.length - 1)];
  if (!p1 || !p2 || p1 === p2) {
    return { lat: p1.lat, lon: p1.lon, atStop: true, nextStopSlug: p1.slug, etaSeconds: 0 };
  }

  const dt = p2.t - p1.t;
  const clamped = dt > 0 ? Math.max(0, Math.min(1, (nowSeconds - p1.t) / dt)) : 0;

  return {
    lat: p1.lat + (p2.lat - p1.lat) * clamped,
    lon: p1.lon + (p2.lon - p1.lon) * clamped,
    atStop:
      Math.abs(nowSeconds - p1.t) < AT_STOP_WINDOW_SEC ||
      Math.abs(nowSeconds - p2.t) < AT_STOP_WINDOW_SEC,
    nextStopSlug: nowSeconds <= p2.t ? p2.slug : p1.slug,
    etaSeconds: Math.max(0, p2.t - nowSeconds),
  };
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
      const current = nextIndex++;
      if (current >= items.length) return;
      results[current] = await fn(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LiveMap({
  visibleLineSlugs = null,
  onVisibleTrainsChange,
  focusLocation = null,
}: {
  visibleLineSlugs?: string[] | null;
  onVisibleTrainsChange?: (trains: LiveTrainLocation[]) => void;
  focusLocation?: GeoLocation | null;
}) {
  const [stationArrivals, setStationArrivals] = useState<Record<string, StationArrival[]>>({});
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
  const mapRef = useRef<MapRef | null>(null);

  // Tick every second to smoothly animate train positions between refreshes.
  useEffect(() => {
    const id = setInterval(() => setNowSeconds(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    if (!hasLoadedOnce) setLoading(true);

    try {
      const linesJson = await fetchJson<{ ok: boolean; data: { lines: LineSummary[] } }>("/api/lines");
      if (!linesJson.ok) return;

      const details = await mapWithConcurrency(linesJson.data.lines, FETCH_CONCURRENCY, async (line) => ({
        line,
        detail: await fetchJson<{ ok: boolean; data: LineDetail }>(`/api/lines/${line.slug}`),
      }));

      const newStationArrivals: Record<string, StationArrival[]> = {};
      const newSegments: typeof lineSegments = [];
      const tripRequests: Array<{
        tripId: string;
        routeSlug: string;
        line: LineSummary;
        direction: "uptown" | "downtown";
        lineShortName: string;
      }> = [];

      for (const { line, detail } of details) {
        if (!detail?.ok || !detail.data) continue;
        const stationList = detail.data.stations ?? [];

        for (const st of stationList) {
          if (!st.slug) continue;
          const entry: StationArrival = {
            lineId: line.id,
            lineSlug: line.slug,
            shortName: line.short_name,
            color: line.color,
            textColor: line.text_color,
            upMinutes: st.next_uptown?.minutes_away,
            downMinutes: st.next_downtown?.minutes_away,
          };
          if (entry.upMinutes === undefined && entry.downMinutes === undefined) continue;
          if (!newStationArrivals[st.slug]) newStationArrivals[st.slug] = [];
          if (!newStationArrivals[st.slug].some((a) => a.lineId === entry.lineId)) {
            newStationArrivals[st.slug].push(entry);
          }
        }

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

        let bestUp: { tripId: string; min: number } | null = null;
        let bestDown: { tripId: string; min: number } | null = null;

        for (const st of stationList) {
          if (st.next_uptown?.trip_id != null) {
            const min = st.next_uptown.minutes_away;
            if (!bestUp || min < bestUp.min) bestUp = { tripId: st.next_uptown.trip_id, min };
          }
          if (st.next_downtown?.trip_id != null) {
            const min = st.next_downtown.minutes_away;
            if (!bestDown || min < bestDown.min) bestDown = { tripId: st.next_downtown.trip_id, min };
          }
        }

        if (bestUp) tripRequests.push({ tripId: bestUp.tripId, routeSlug: line.slug, line, direction: "uptown", lineShortName: line.short_name });
        if (bestDown) tripRequests.push({ tripId: bestDown.tripId, routeSlug: line.slug, line, direction: "downtown", lineShortName: line.short_name });
      }

      const tripDetails = await mapWithConcurrency(tripRequests, FETCH_CONCURRENCY, async (tr) => ({
        tr,
        tripJson: await fetchJson<{ ok: boolean; data: TripResponse }>(
          `/api/trips/${encodeURIComponent(tr.tripId)}?route=${encodeURIComponent(tr.routeSlug)}`
        ),
      }));

      const newTrains: TrainSchedule[] = [];
      for (const { tr, tripJson } of tripDetails) {
        if (!tripJson?.ok || !tripJson.data?.stops) continue;
        const delayed = tripJson.data.stops.some((s) =>
          (s.status ?? "").toLowerCase().includes("delay")
        );
        const points: TrainPoint[] = tripJson.data.stops.flatMap((stop) => {
          const coords = getCoords(stop.station.slug);
          const tSec = stop.arrival_time ?? stop.departure_time;
          if (!coords || typeof tSec !== "number") return [];
          return [{ slug: stop.station.slug, lat: coords.lat, lon: coords.lon, t: tSec, minutesAway: stop.minutes_away ?? null }];
        });
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

      newTrains.sort((a, b) => (a.points[0]?.t ?? Infinity) - (b.points[0]?.t ?? Infinity));

      setStationArrivals(newStationArrivals);
      setLineSegments(newSegments);
      setTrains(newTrains.slice(0, MAX_TRAINS));
      setLastUpdated(new Date());
      setLoading(false);
      if (!hasLoadedOnce) setHasLoadedOnce(true);
    } catch {
      setLoading(false);
      if (!hasLoadedOnce) setHasLoadedOnce(true);
    }
  }, [hasLoadedOnce]);

  useEffect(() => {
    const bootstrapId = window.setTimeout(() => void refresh(), 0);
    const intervalId = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => {
      window.clearTimeout(bootstrapId);
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  // ─── Derived data ───────────────────────────────────────────────────────────

  const visibleLineSlugSet = useMemo(() => new Set(visibleLineSlugs ?? []), [visibleLineSlugs]);

  const filteredLineSegments = useMemo(
    () => lineSegments.filter((l) => visibleLineSlugs === null || visibleLineSlugSet.has(l.lineSlug)),
    [lineSegments, visibleLineSlugSet, visibleLineSlugs]
  );

  const lineFeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: filteredLineSegments.flatMap((line) =>
        line.segments.map((seg, i) => ({
          type: "Feature" as const,
          properties: { key: `${line.key}-seg-${i}`, color: line.color },
          geometry: {
            type: "LineString" as const,
            coordinates: seg.map(([lat, lon]) => [lon, lat]),
          },
        }))
      ),
    }),
    [filteredLineSegments]
  );

  const stationMarkerData = useMemo(() => {
    return Object.keys(stationArrivals)
      .flatMap((slug) => {
        const coords = getCoords(slug);
        if (!coords) return [];
        return [{ slug, position: [coords.lat, coords.lon] as LatLon, arrivals: stationArrivals[slug] ?? [] }];
      });
  }, [stationArrivals]);

  const filteredStationMarkerData = useMemo(
    () =>
      stationMarkerData
        .map((st) => ({
          ...st,
          arrivals: visibleLineSlugs !== null
            ? st.arrivals.filter((a) => visibleLineSlugSet.has(a.lineSlug))
            : st.arrivals,
        }))
        .filter((st) => st.arrivals.length > 0),
    [stationMarkerData, visibleLineSlugSet, visibleLineSlugs]
  );

  const visibleTrainLocations = useMemo((): LiveTrainLocation[] => {
    return trains.flatMap((train) => {
      if (visibleLineSlugs !== null && !visibleLineSlugSet.has(train.lineSlug)) return [];
      const pos = computeTrainPosition(train, nowSeconds);
      if (!pos) return [];
      const nextStopCoords = pos.nextStopSlug ? getCoords(pos.nextStopSlug) : null;
      return [{
        key: train.key,
        lineShortName: train.lineShortName,
        direction: train.direction,
        delayed: train.delayed,
        color: train.color,
        textColor: train.textColor,
        lat: pos.lat,
        lon: pos.lon,
        atStop: pos.atStop,
        nextStopSlug: pos.nextStopSlug,
        etaMinutes: typeof pos.etaSeconds === "number" ? Math.max(0, Math.ceil(pos.etaSeconds / 60)) : null,
        nextStopLat: nextStopCoords?.lat ?? null,
        nextStopLon: nextStopCoords?.lon ?? null,
      }];
    });
  }, [trains, nowSeconds, visibleLineSlugs, visibleLineSlugSet]);

  const activeTrainStopSlugs = useMemo(() => {
    const s = new Set<string>();
    for (const t of visibleTrainLocations) {
      if (t.nextStopSlug) s.add(t.nextStopSlug);
    }
    return s;
  }, [visibleTrainLocations]);

  const selectedStation = useMemo(
    () => filteredStationMarkerData.find((s) => s.slug === selectedStationSlug) ?? null,
    [selectedStationSlug, filteredStationMarkerData]
  );

  useEffect(() => {
    onVisibleTrainsChange?.(visibleTrainLocations);
  }, [onVisibleTrainsChange, visibleTrainLocations]);

  useEffect(() => {
    if (!focusLocation) return;
    mapRef.current?.flyTo({
      center: [focusLocation.lon, focusLocation.lat],
      zoom: Math.max(DEFAULT_ZOOM, 13.5),
      duration: 1200,
      essential: true,
    });
  }, [focusLocation]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-full aged-paper overflow-hidden">
      {/* Film-grain noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Last-updated timestamp */}
      <div className="absolute top-3 right-4 z-[800] retro-panel px-3 py-1 text-[10px] font-bold tracking-widest uppercase text-ink/60">
        {lastUpdated
          ? `UPDATED ${lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
          : "LOADING…"}
      </div>

      {/* Initial-load overlay */}
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

      <div className="relative w-full h-full [filter:sepia(0.15)_contrast(1.1)]">
        <Map
          ref={mapRef}
          initialViewState={{ latitude: CITY_CENTER[0], longitude: CITY_CENTER[1], zoom: DEFAULT_ZOOM }}
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
          <NavigationControl position="top-left" showCompass={false} visualizePitch={false} />

          <Source id="lines" type="geojson" data={lineFeatureCollection}>
            <Layer
              id="line-border"
              type="line"
              paint={{ "line-color": "rgba(23,23,23,0.45)", "line-width": 8 }}
              layout={{ "line-join": "round", "line-cap": "round" }}
            />
            <Layer
              id="line-color"
              type="line"
              paint={{ "line-color": ["get", "color"], "line-width": 5, "line-opacity": 0.92 }}
              layout={{ "line-join": "round", "line-cap": "round" }}
            />
          </Source>

          {filteredStationMarkerData.map((st) => {
            const isStop = activeTrainStopSlugs.has(st.slug);
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
                  className="size-2.5 rounded-full cursor-pointer bg-parchment/95 border-2"
                  style={{
                    borderColor: isStop ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.25)",
                    boxShadow: isStop ? "0 0 0 4px rgba(0,0,0,0.08)" : "none",
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
                <div className="text-[10px] font-black tracking-[0.05em] text-ink capitalize">
                  {selectedStation.slug.replaceAll("-", " ")}
                </div>
                <div className="mt-1 space-y-1">
                  {selectedStation.arrivals.slice(0, 6).map((a) => (
                    <div key={a.lineId} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="inline-block size-2.5 rounded-full border border-ink/20"
                          style={{ background: a.color }}
                          aria-hidden="true"
                        />
                        <span className="text-[10px] font-black text-ink/70">{a.shortName}</span>
                      </div>
                      <div className="text-[10px] font-bold text-ink/70 whitespace-nowrap">
                        UP:{a.upMinutes ?? "—"} · DOWN:{a.downMinutes ?? "—"}
                      </div>
                    </div>
                  ))}
                  {selectedStation.arrivals.length === 0 && (
                    <div className="text-[10px] text-ink/50 font-mono">No arrivals</div>
                  )}
                </div>
              </div>
            </Popup>
          )}

          {visibleTrainLocations.map((train) => (
            <Marker key={train.key} latitude={train.lat} longitude={train.lon} anchor="center">
              <div
                className={`relative flex items-center justify-center size-3.5 rounded-full border-2 border-ink text-[8px] font-extrabold leading-none${train.atStop ? " train-pulse" : ""}`}
                style={{
                  background: train.color,
                  color: train.textColor,
                  boxShadow: train.atStop ? "0 0 0 5px rgba(0,0,0,0.25)" : "none",
                  fontFamily: "var(--font-barlow-condensed), sans-serif",
                }}
              >
                {train.lineShortName.substring(0, 2)}
                {train.delayed && (
                  <span
                    aria-label="Delayed train"
                    title="Delayed"
                    className="absolute -right-[7px] -top-[7px] flex items-center justify-center size-2.5 rounded-full bg-signal-red border border-ink text-[7px] font-black leading-none text-white"
                  >
                    !
                  </span>
                )}
              </div>
            </Marker>
          ))}
        </Map>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-4 z-[800] retro-panel px-3 py-2 max-w-[260px]">
        <p className="text-[9px] font-black tracking-[0.15em] uppercase text-ink/60 mb-1">Legend</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full border border-ink/30 bg-parchment" />
            <span className="text-[10px] font-bold text-ink/60">Station</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-full border border-ink/50 bg-signal-red" />
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
