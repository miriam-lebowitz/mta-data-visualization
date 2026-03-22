/** Full line row from `/api/lines` (includes fields used by map + rankings). */
export type LineSummary = {
  id: string;
  short_name: string;
  long_name: string;
  slug: string;
  color: string;
  text_color: string;
  station_count: number;
};

/** Subset for line toggles / chrome (sidebar, badges). */
export type LineOption = Pick<LineSummary, "id" | "short_name" | "slug" | "color" | "text_color">;

/** Line + sub-scores for rankings page and share flow. */
export type LinePerformanceScore = {
  line: LineSummary;
  delayScore: number;
  incidentScore: number;
  accessScore: number;
  composite: number;
};

export type LiveTrainLocation = {
  key: string;
  lineShortName: string;
  direction: "uptown" | "downtown";
  delayed: boolean;
  color: string;
  textColor: string;
  lat: number;
  lon: number;
  atStop: boolean;
  nextStopSlug: string | null;
  etaMinutes: number | null;
  nextStopLat: number | null;
  nextStopLon: number | null;
};

export type GeoLocation = { lat: number; lon: number };
