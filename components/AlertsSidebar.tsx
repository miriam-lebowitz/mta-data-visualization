"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { STATION_COORDS } from "./StationCoords";
import { geocodeAddress, GeocodeError } from "@/lib/geocode";
import type { GeoLocation, LineOption, LiveTrainLocation } from "@/lib/types";

interface Alert {
  id: string;
  line: string;
  header: string;
  description: string;
  severity: "normal" | "minor" | "major";
  updatedAt: string;
}

function haversineMiles(a: GeoLocation, b: GeoLocation): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const SEVERITY_STRIPE: Record<Alert["severity"], string> = {
  major: "bg-signal-red",
  minor: "bg-signal-yellow",
  normal: "bg-signal-green",
};

const SEVERITY_TEXT: Record<Alert["severity"], string> = {
  major: "text-signal-red",
  minor: "text-signal-yellow",
  normal: "text-signal-green",
};

const SEVERITY_LABEL: Record<Alert["severity"], string> = {
  major: "SERVICE CHANGE",
  minor: "DELAYS",
  normal: "ADVISORY",
};

function AlertCard({ alert }: { alert: Alert }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      className="w-full text-left retro-panel mb-2 p-0 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
      onClick={() => setExpanded((e) => !e)}
      aria-expanded={expanded}
    >
      <div className="flex items-stretch">
        <span
          className={`w-2 shrink-0 ${SEVERITY_STRIPE[alert.severity]}`}
          aria-hidden="true"
        />
        <div className="flex-1 px-2 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[9px] font-black tracking-[0.12em] uppercase ${SEVERITY_TEXT[alert.severity]}`}
            >
              {SEVERITY_LABEL[alert.severity]}
            </span>
            <span className="text-[9px] font-bold text-ink/40 shrink-0">
              {alert.line}
            </span>
          </div>
          <p className="text-[11px] font-bold text-ink leading-tight mt-0.5 line-clamp-2">
            {alert.header}
          </p>
        </div>
      </div>

      {expanded && alert.description && (
        <div className="px-3 pb-2 pt-1 border-t-2 border-ink/20">
          <p className="text-[10px] text-ink/70 leading-relaxed">{alert.description}</p>
          {alert.updatedAt && (
            <p className="text-[9px] text-ink/40 mt-1 font-mono">{alert.updatedAt}</p>
          )}
        </div>
      )}
    </button>
  );
}

export default function AlertsSidebar({
  lineOptions = [],
  visibleLineSlugs = null,
  onToggleLine,
  onShowAllLines,
  onHideAllLines,
  liveTrains = [],
  onResolvedLocation,
}: {
  lineOptions?: LineOption[];
  visibleLineSlugs?: string[] | null;
  onToggleLine?: (slug: string) => void;
  onShowAllLines?: () => void;
  onHideAllLines?: () => void;
  liveTrains?: LiveTrainLocation[];
  onResolvedLocation?: (location: GeoLocation) => void;
}) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [addressInput, setAddressInput] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<GeoLocation | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      const json = await res.json();
      if (json.ok) {
        setAlerts(json.data.alerts);
        setError(false);
      }
      setLastFetched(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 60_000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  const handleFindLocation = useCallback(async () => {
    const q = addressInput.trim();
    if (!q) {
      setLocationError("Enter an address to search.");
      return;
    }
    setIsResolvingLocation(true);
    try {
      const location = await geocodeAddress(q);
      setUserLocation(location);
      onResolvedLocation?.(location);
      setLocationError(null);
    } catch (err) {
      setLocationError(
        err instanceof GeocodeError ? err.message : "Could not resolve address right now."
      );
    } finally {
      setIsResolvingLocation(false);
    }
  }, [addressInput, onResolvedLocation]);

  const nearestTrains = useMemo(() => {
    if (!userLocation) return [];
    return liveTrains
      .map((train) => ({
        ...train,
        distanceMiles: haversineMiles(userLocation, { lat: train.lat, lon: train.lon }),
      }))
      .sort((a, b) => a.distanceMiles - b.distanceMiles)
      .slice(0, 6);
  }, [liveTrains, userLocation]);

  const nearestStationWalk = useMemo(() => {
    if (!userLocation) return null;
    const WALK_MIN_PER_MILE = 20;
    let best: { slug: string; miles: number } | null = null;

    for (const [slug, coords] of Object.entries(STATION_COORDS)) {
      const miles = haversineMiles(userLocation, { lat: coords.lat, lon: coords.lon });
      if (!best || miles < best.miles) best = { slug, miles };
    }

    if (!best) return null;
    return {
      slug: best.slug,
      walkMinutes: Math.max(1, Math.round(best.miles * WALK_MIN_PER_MILE)),
    };
  }, [userLocation]);

  return (
    <aside className="flex flex-col h-full retro-panel border-y-0 border-r-0 w-72 shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b-4 border-ink">
        <h2 className="text-xs font-black tracking-[0.18em] uppercase text-ink">
          System Alerts
        </h2>
        {lastFetched && (
          <p className="text-[9px] text-ink/50 font-mono mt-0.5">
            {lastFetched.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {/* Line visibility toggles */}
        {lineOptions.length > 0 && onToggleLine && (
          <div className="retro-panel p-2 mb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[9px] font-black tracking-[0.14em] uppercase text-ink/60">
                Visible Lines
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-[9px] font-bold text-ink/60 hover:text-ink"
                  onClick={onShowAllLines}
                >
                  All
                </button>
                <button
                  type="button"
                  className="text-[9px] font-bold text-ink/60 hover:text-ink"
                  onClick={onHideAllLines}
                >
                  None
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {lineOptions.map((line) => {
                const isOn =
                  visibleLineSlugs === null || visibleLineSlugs.includes(line.slug);
                return (
                  <button
                    key={line.slug}
                    type="button"
                    onClick={() => onToggleLine(line.slug)}
                    className="h-6 rounded border text-[10px] font-black transition-opacity"
                    style={{
                      background: isOn ? line.color : "rgba(0,0,0,0.04)",
                      color: isOn ? (line.text_color || "#fff") : "var(--ink)",
                      borderColor: isOn ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.18)",
                      opacity: isOn ? 1 : 0.7,
                    }}
                    aria-pressed={isOn}
                    title={line.short_name}
                  >
                    {line.short_name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Nearest trains */}
        <div className="retro-panel p-2 mb-3">
          <p className="text-[9px] font-black tracking-[0.14em] uppercase text-ink/60 mb-2">
            Nearest Trains
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleFindLocation()}
              placeholder="Enter address (e.g. Times Square)"
              className="min-w-0 flex-1 h-7 px-2 border border-ink/20 rounded text-[10px] bg-parchment/70 text-ink"
            />
            <button
              type="button"
              className="h-7 px-2 rounded border border-ink/20 text-[10px] font-bold text-ink/70 hover:text-ink disabled:opacity-50"
              disabled={isResolvingLocation}
              onClick={() => void handleFindLocation()}
            >
              {isResolvingLocation ? "..." : "Find"}
            </button>
          </div>

          {locationError && (
            <p className="text-[9px] text-signal-red mt-1 font-bold">{locationError}</p>
          )}

          {!locationError && userLocation && nearestTrains.length === 0 && (
            <p className="text-[9px] text-ink/50 mt-2">No visible trains right now.</p>
          )}

          {nearestStationWalk && (
            <p className="text-[9px] text-ink/60 mt-2 font-mono">
              Nearest station:{" "}
              <span className="capitalize">{nearestStationWalk.slug.replaceAll("-", " ")}</span>
              {" · "}Walk {nearestStationWalk.walkMinutes}m
            </p>
          )}

          {nearestTrains.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {nearestTrains.map((train) => (
                <li
                  key={train.key}
                  className="flex items-center justify-between gap-2 text-[10px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-ink/30 text-[9px] font-black text-white shrink-0"
                      style={{
                        background: train.delayed ? "var(--signal-red)" : "var(--ink)",
                      }}
                    >
                      {train.lineShortName.slice(0, 2)}
                    </span>
                    <span className="text-ink/70 font-bold uppercase truncate">
                      {train.direction}
                    </span>
                    {train.delayed && (
                      <span className="text-[8px] font-black text-signal-red shrink-0">
                        DELAYED
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-ink/60 whitespace-nowrap">
                    {train.distanceMiles.toFixed(2)} mi
                    {" · "}ETA{" "}
                    {typeof train.etaMinutes === "number" ? `${train.etaMinutes}m` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Alerts loading skeleton */}
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton h-12 rounded" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-8">
            <p className="text-[11px] font-bold status-bad">FEED UNAVAILABLE</p>
            <p className="text-[10px] text-ink/50 mt-1">Could not reach MTA servers</p>
          </div>
        )}

        {!loading && !error && alerts.length === 0 && (
          <div className="text-center py-3">
            <div className="text-xl mb-1 text-signal-green" aria-hidden="true">
              ◉
            </div>
            <p className="text-[11px] font-black tracking-widest uppercase status-ok">
              Good Service
            </p>
            <p className="text-[10px] text-ink/50 mt-0.5">All lines operating normally</p>
          </div>
        )}

        {!loading && alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t-4 border-ink">
        <p className="text-[8px] text-ink/40 font-mono leading-tight">
          SOURCE: MTA SERVICE STATUS
          <br />
          AUTO-REFRESH 60s
        </p>
      </div>
    </aside>
  );
}
