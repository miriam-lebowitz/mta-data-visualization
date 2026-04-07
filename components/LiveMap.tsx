"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  type MapRef,
} from "react-map-gl/mapbox";
import type { MapMouseEvent } from "mapbox-gl";
import {
  computeTrainPosition,
  fetchJson,
  fetchJsonOrNotFound,
  getCoords,
  mapWithConcurrency,
  splitLineSegments,
  type LineDetail,
  type LatLon,
  type StationArrival,
  type TrainPoint,
  type TrainSchedule,
  type TripResponse,
} from "@/lib/liveMap";
import { useThrottledLiveTrainNotify } from "@/lib/useThrottledLiveTrainNotify";
import type { GeoLocation, LineOption, LineSummary, LiveTrainLocation } from "@/lib/types";
import * as ui from "./styles/LiveMap.styles";

const CITY_CENTER: LatLon = [40.75, -73.99];
const DEFAULT_ZOOM = 11.2;
const MAX_TRAINS = 28;
const REFRESH_INTERVAL_MS = 30_000;
const FETCH_CONCURRENCY = 4;

function isAbortError(e: unknown): boolean {
  return (
    e instanceof DOMException && e.name === "AbortError"
  ) || (e instanceof Error && e.name === "AbortError");
}

export default function LiveMap({
  visibleLineSlugs = null,
  onVisibleTrainsChange,
  onLinesChange,
  focusLocation = null,
}: {
  visibleLineSlugs?: string[] | null;
  onVisibleTrainsChange?: (trains: LiveTrainLocation[]) => void;
  onLinesChange?: (lines: LineOption[]) => void;
  focusLocation?: GeoLocation | null;
}) {
  const [stationArrivals, setStationArrivals] = useState<Record<string, StationArrival[]>>({});
  const [lineSegments, setLineSegments] = useState<
    Array<{ key: string; lineSlug: string; color: string; textColor: string; segments: LatLon[][] }>
  >([]);
  const [trains, setTrains] = useState<TrainSchedule[]>([]);
  const [nowSeconds, setNowSeconds] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedStationSlug, setSelectedStationSlug] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mapRef = useRef<MapRef | null>(null);
  const refreshGenerationRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);

  useLayoutEffect(() => {
    const tick = () => setNowSeconds(Math.floor(Date.now() / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const signal = ac.signal;
    const gen = ++refreshGenerationRef.current;

    if (!hasLoadedOnceRef.current) setLoading(true);
    setLoadError(null);

    try {
      const linesJson = await fetchJson<{ ok: boolean; data: { lines: LineSummary[] } }>(
        "/api/lines",
        signal,
      );
      if (refreshGenerationRef.current !== gen) return;
      if (!linesJson.ok) throw new Error("Lines request failed");

      onLinesChange?.(linesJson.data.lines);

      const details = await mapWithConcurrency(
        linesJson.data.lines,
        FETCH_CONCURRENCY,
        async (line) => ({
          line,
          detail: await fetchJson<{ ok: boolean; data: LineDetail }>(
            `/api/lines/${line.slug}`,
            signal,
          ),
        }),
      );
      if (refreshGenerationRef.current !== gen) return;

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

      const tripDetails = await mapWithConcurrency(tripRequests, FETCH_CONCURRENCY, async (tr) => ({
        tr,
        tripJson: await fetchJsonOrNotFound<{ ok: boolean; data: TripResponse }>(
          `/api/trips/${encodeURIComponent(tr.tripId)}?route=${encodeURIComponent(tr.routeSlug)}`,
          signal,
          { tripId: tr.tripId, routeSlug: tr.routeSlug },
        ),
      }));
      if (refreshGenerationRef.current !== gen) return;

      const newTrains: TrainSchedule[] = [];
      for (const { tr, tripJson } of tripDetails) {
        if (tripJson == null) continue;
        if (!tripJson.ok || !tripJson.data?.stops) {
          if (process.env.NODE_ENV === "development") {
            console.warn(`[live map] Trip response ok=false: trip=${tr.tripId} route=${tr.routeSlug}`);
          }
          continue;
        }
        const delayed = tripJson.data.stops.some((s) =>
          (s.status ?? "").toLowerCase().includes("delay"),
        );
        const points: TrainPoint[] = tripJson.data.stops.flatMap((stop) => {
          const coords = getCoords(stop.station.slug);
          const tSec = stop.arrival_time ?? stop.departure_time;
          if (!coords || typeof tSec !== "number") return [];
          return [
            {
              slug: stop.station.slug,
              lat: coords.lat,
              lon: coords.lon,
              t: tSec,
              minutesAway: stop.minutes_away ?? null,
            },
          ];
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
      setLoadError(null);
    } catch (e) {
      if (refreshGenerationRef.current !== gen) return;
      if (signal.aborted || isAbortError(e)) return;
      setLoadError(e instanceof Error ? e.message : "Could not load map data.");
    } finally {
      if (refreshGenerationRef.current === gen && !signal.aborted) {
        setLoading(false);
        hasLoadedOnceRef.current = true;
      }
    }
  }, [onLinesChange]);

  useEffect(() => {
    const bootstrapId = window.setTimeout(() => void refresh(), 0);
    const intervalId = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => {
      window.clearTimeout(bootstrapId);
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  const visibleLineSlugSet = useMemo(() => new Set(visibleLineSlugs ?? []), [visibleLineSlugs]);

  const filteredLineSegments = useMemo(
    () => lineSegments.filter((l) => visibleLineSlugs === null || visibleLineSlugSet.has(l.lineSlug)),
    [lineSegments, visibleLineSlugSet, visibleLineSlugs],
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
        })),
      ),
    }),
    [filteredLineSegments],
  );

  const stationMarkerData = useMemo(() => {
    return Object.keys(stationArrivals).flatMap((slug) => {
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
          arrivals:
            visibleLineSlugs !== null
              ? st.arrivals.filter((a) => visibleLineSlugSet.has(a.lineSlug))
              : st.arrivals,
        }))
        .filter((st) => st.arrivals.length > 0),
    [stationMarkerData, visibleLineSlugSet, visibleLineSlugs],
  );

  const visibleTrainLocations = useMemo((): LiveTrainLocation[] => {
    return trains.flatMap((train) => {
      if (visibleLineSlugs !== null && !visibleLineSlugSet.has(train.lineSlug)) return [];
      const pos = computeTrainPosition(train, nowSeconds);
      if (!pos) return [];
      const nextStopCoords = pos.nextStopSlug ? getCoords(pos.nextStopSlug) : null;
      return [
        {
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
        },
      ];
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
    [selectedStationSlug, filteredStationMarkerData],
  );

  useThrottledLiveTrainNotify(visibleTrainLocations, onVisibleTrainsChange);

  useEffect(() => {
    if (!focusLocation) return;
    mapRef.current?.flyTo({
      center: [focusLocation.lon, focusLocation.lat],
      zoom: Math.max(DEFAULT_ZOOM, 13.5),
      duration: 1200,
      essential: true,
    });
  }, [focusLocation]);

  return (
    <div className={ui.mapRoot}>
      <div className={ui.grainOverlay} aria-hidden />

      <div className={ui.lastUpdatedBadge}>
        {lastUpdated
          ? `UPDATED ${lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
          : "LOADING…"}
      </div>

      {loadError && (
        <div className={ui.loadErrorBar} role="alert">
          <span className={ui.loadErrorText}>{loadError}</span>
          <button type="button" className={ui.loadErrorRetry} onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className={ui.loadingOverlay}>
          <div className={ui.loadingPanel}>
            <p className={ui.loadingText}>Loading ...</p>
            <div className={ui.loadingSkeleton} />
          </div>
        </div>
      )}

      <div className={ui.mapFilterWrap}>
        <Map
          ref={mapRef}
          initialViewState={{ latitude: CITY_CENTER[0], longitude: CITY_CENTER[1], zoom: DEFAULT_ZOOM }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          scrollZoom
          touchZoomRotate
          style={{ height: "100%", width: "100%" }}
          onClick={(e: MapMouseEvent) => {
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
                  className={`${ui.stationMarkerBase} ${
                    isStop ? ui.stationMarkerActive : ui.stationMarkerIdle
                  }`}
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
              <div className={ui.popupPanel}>
                <div className={ui.popupTitle}>{selectedStation.slug.replaceAll("-", " ")}</div>
                <div className={ui.popupList}>
                  {selectedStation.arrivals.slice(0, 6).map((a) => (
                    <div key={a.lineId} className={ui.popupRow}>
                      <div className={ui.popupLineGroup}>
                        <span
                          className={ui.popupLineDot}
                          style={{ background: a.color }}
                          aria-hidden="true"
                        />
                        <span className={ui.popupLineName}>{a.shortName}</span>
                      </div>
                      <div className={ui.popupTimes}>
                        UP:{a.upMinutes ?? "—"} · DOWN:{a.downMinutes ?? "—"}
                      </div>
                    </div>
                  ))}
                  {selectedStation.arrivals.length === 0 && (
                    <div className={ui.popupEmpty}>No arrivals</div>
                  )}
                </div>
              </div>
            </Popup>
          )}

          {visibleTrainLocations.map((train) => (
            <Marker key={train.key} latitude={train.lat} longitude={train.lon} anchor="center">
              <div
                className={`${ui.trainMarkerBase} ${train.atStop ? ui.trainMarkerAtStop : ""}`}
                style={{
                  background: train.color,
                  color: train.textColor,
                }}
              >
                {train.lineShortName.substring(0, 2)}
                {train.delayed && (
                  <span
                    aria-label="Delayed train"
                    title="Delayed"
                    className={ui.trainDelayBadge}
                  >
                    !
                  </span>
                )}
              </div>
            </Marker>
          ))}
        </Map>
      </div>

      <div className={ui.legendPanel}>
        <p className={ui.legendTitle}>Legend</p>
        <div className={ui.legendRow}>
          <div className={ui.legendItem}>
            <span className={ui.legendDotStation} />
            <span className={ui.legendLabel}>Station</span>
          </div>
          <div className={ui.legendItem}>
            <span className={ui.legendDotTrain} />
            <span className={ui.legendLabel}>Train</span>
          </div>
        </div>
        <p className={ui.legendFootnote}>
          Trains move based on `/api/trips` schedules · refresh 30s
        </p>
      </div>
    </div>
  );
}
