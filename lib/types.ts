export type LineOption = {
  id: string;
  short_name: string;
  slug: string;
  color: string;
  text_color: string;
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
