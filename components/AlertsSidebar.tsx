"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { STATION_COORDS } from "./StationCoords";
import { geocodeAddress, GeocodeError } from "@/lib/geocode";
import type { GeoLocation, LineOption, LiveTrainLocation } from "@/lib/types";
import * as ui from "./styles/AlertsSidebar.styles";

interface Alert {
  id: string;
  line: string;
  header: string;
  description: string;
  severity: ui.AlertSeverity;
  updatedAt: string;
}

/**
 * Great-circle distance between two lat/lon points on Earth (miles), using the haversine formula.
 *
 * 1. Convert degree differences to radians.
 * 2. Compute the “haversine” of half the central angle between the points on the sphere
 *    (uses sin²(Δlat/2) + cos(lat₁)cos(lat₂)sin²(Δlon/2) so it’s stable for short distances).
 * 3. Solve for the central angle, then multiply by Earth’s radius (~3958.8 mi) to get arc length.
 */
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

function AlertCard({ alert }: { alert: Alert }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      className={ui.alertCardButton}
      onClick={() => setExpanded((e) => !e)}
      aria-expanded={expanded}
    >
      <div className={ui.alertCardRow}>
        <span
          className={`${ui.alertCardStripe} ${ui.alertSeverityStripe[alert.severity]}`}
          aria-hidden="true"
        />
        <div className={ui.alertCardBody}>
          <div className={ui.alertCardMetaRow}>
            <span
              className={`${ui.alertCardSeverity} ${ui.alertSeverityText[alert.severity]}`}
            >
              {ui.alertSeverityLabel[alert.severity]}
            </span>
            <span className={ui.alertCardLine}>{alert.line}</span>
          </div>
          <p className={ui.alertCardHeader}>{alert.header}</p>
        </div>
      </div>

      {expanded && alert.description && (
        <div className={ui.alertCardExpanded}>
          <p className={ui.alertCardDescription}>{alert.description}</p>
          {alert.updatedAt && (
            <p className={ui.alertCardUpdated}>{alert.updatedAt}</p>
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
    <aside className={ui.aside}>
      <div className={ui.header}>
        <h2 className={ui.headerTitle}>System Alerts</h2>
        {lastFetched && (
          <p className={ui.headerTime}>
            {lastFetched.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      <div className={ui.scrollArea}>
        {lineOptions.length > 0 && onToggleLine && (
          <div className={ui.panel}>
            <div className={ui.panelSectionHeader}>
              <p className={ui.panelLabel}>Visible Lines</p>
              <div className={ui.panelHeaderActions}>
                <button type="button" className={ui.textButtonMuted} onClick={onShowAllLines}>
                  All
                </button>
                <button type="button" className={ui.textButtonMuted} onClick={onHideAllLines}>
                  None
                </button>
              </div>
            </div>
            <div className={ui.lineToggleGrid}>
              {lineOptions.map((line) => {
                const isOn =
                  visibleLineSlugs === null || visibleLineSlugs.includes(line.slug);
                return (
                  <button
                    key={line.slug}
                    type="button"
                    onClick={() => onToggleLine(line.slug)}
                    className={ui.lineToggleClassName(isOn)}
                    style={isOn ? ui.lineToggleOnStyle(line) : undefined}
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

        <div className={ui.panel}>
          <p className={ui.nearestTrainsPanelLabel}>Nearest Trains</p>
          <div className={ui.addressRow}>
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleFindLocation()}
              placeholder="Enter address (e.g. Times Square)"
              className={ui.addressInput}
            />
            <button
              type="button"
              className={ui.findButton}
              disabled={isResolvingLocation}
              onClick={() => void handleFindLocation()}
            >
              {isResolvingLocation ? "..." : "Find"}
            </button>
          </div>

          {locationError && <p className={ui.errorText}>{locationError}</p>}

          {!locationError && userLocation && nearestTrains.length === 0 && (
            <p className={ui.mutedHint}>No visible trains right now.</p>
          )}

          {nearestStationWalk && (
            <p className={ui.stationWalkMeta}>
              Nearest station:{" "}
              <span className={ui.stationWalkSlug}>
                {nearestStationWalk.slug.replaceAll("-", " ")}
              </span>
              {" · "}Walk {nearestStationWalk.walkMinutes}m
            </p>
          )}

          {nearestTrains.length > 0 && (
            <ul className={ui.trainList}>
              {nearestTrains.map((train) => (
                <li key={train.key} className={ui.trainRow}>
                  <div className={ui.trainRowLeft}>
                    <span className={ui.trainLineBadgeClassName(train.delayed)}>
                      {train.lineShortName.slice(0, 2)}
                    </span>
                    <span className={ui.trainDirection}>{train.direction}</span>
                    {train.delayed && (
                      <span className={ui.trainDelayedTag}>DELAYED</span>
                    )}
                  </div>
                  <span className={ui.trainMeta}>
                    {train.distanceMiles.toFixed(2)} mi
                    {" · "}ETA{" "}
                    {typeof train.etaMinutes === "number" ? `${train.etaMinutes}m` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {loading && (
          <div className={ui.skeletonStack}>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={ui.skeletonBlock} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className={ui.errorState}>
            <p className={ui.errorTitle}>FEED UNAVAILABLE</p>
            <p className={ui.errorSub}>Could not reach MTA servers</p>
          </div>
        )}

        {!loading && !error && alerts.length === 0 && (
          <div className={ui.goodServiceRow}>
            <span className={ui.goodServiceIcon} aria-hidden="true">
              ◉
            </span>
            <div>
              <p className={ui.goodServiceTitle}>Good Service</p>
              <p className={ui.goodServiceSub}>All lines operating normally</p>
            </div>
          </div>
        )}

        {!loading && alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
      </div>

      <div className={ui.footer}>
        <p className={ui.footerMeta}>
          SOURCE: MTA SERVICE STATUS
          <br />
          AUTO-REFRESH 60s
        </p>
      </div>
    </aside>
  );
}
