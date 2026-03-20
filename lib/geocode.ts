import type { GeoLocation } from "./types";

export class GeocodeError extends Error {}

/**
 * Resolves a free-text address string to lat/lon coordinates using
 * the Mapbox geocoding API. Throws `GeocodeError` for user-facing failures.
 */
export async function geocodeAddress(address: string): Promise<GeoLocation> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new GeocodeError("Missing MapBox token. Check NEXT_PUBLIC_MAPBOX_TOKEN.");
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    address
  )}.json?access_token=${encodeURIComponent(token)}&limit=1&country=US`;

  let json: unknown;
  try {
    const res = await fetch(url);
    json = await res.json();
  } catch {
    throw new GeocodeError("Could not resolve address right now.");
  }

  const center = (json as { features?: Array<{ center?: unknown }> })?.features?.[0]?.center;
  if (!Array.isArray(center) || center.length < 2) {
    throw new GeocodeError("Address not found. Try a more specific location.");
  }

  const [lon, lat] = center as [number, number];
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new GeocodeError("Address lookup failed. Please try again.");
  }

  return { lat, lon };
}
