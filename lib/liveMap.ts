import { STATION_COORDS } from "@/components/StationCoords";

export type LatLon = [number, number];

export type LineDetailStation = {
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

export type LineDetail = {
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

export type TripResponse = {
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

export type StationArrival = {
  lineId: string;
  lineSlug: string;
  shortName: string;
  color: string;
  textColor: string;
  upMinutes?: number;
  downMinutes?: number;
};

export type TrainPoint = {
  slug: string;
  lat: number;
  lon: number;
  t: number;
  minutesAway: number | null;
};

export type TrainSchedule = {
  key: string;
  lineSlug: string;
  lineShortName: string;
  color: string;
  textColor: string;
  direction: "uptown" | "downtown";
  delayed: boolean;
  points: TrainPoint[];
};

export const MAX_MISSING_RUN = 6;
export const AT_STOP_WINDOW_SEC = 6;

const stationRecord = STATION_COORDS as Record<string, { lat: number; lon: number }>;

export function getCoords(slug: string): { lat: number; lon: number } | null {
  return stationRecord[slug] ?? null;
}

export function splitLineSegments(points: Array<{ slug: string }>): Array<Array<[number, number]>> {
  const segments: Array<Array<[number, number]>> = [];
  let current: Array<[number, number]> = [];
  let missingRun = 0;

  for (const p of points) {
    const coords = getCoords(p.slug);
    if (!coords) {
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

export function computeTrainPosition(
  schedule: TrainSchedule,
  nowSeconds: number,
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
    return {
      lat: points[0].lat,
      lon: points[0].lon,
      atStop: true,
      nextStopSlug: points[0].slug,
      etaSeconds: 0,
    };
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

export async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    signal,
    headers: { "User-Agent": "mta-data-viz/1.0" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${url}`);
  }
  return (await res.json()) as T;
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
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
