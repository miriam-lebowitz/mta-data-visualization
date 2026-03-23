/**
 * MTA line badge colors (aligned with nyc-subway-status / GTFS). Used where the
 * lines API is not in scope (e.g. server-only alert mapping).
 */
export const SUBWAY_LINE_COLORS: Record<string, { color: string; text_color: string }> = {
  "1": { color: "#D82233", text_color: "#FFFFFF" },
  "2": { color: "#D82233", text_color: "#FFFFFF" },
  "3": { color: "#D82233", text_color: "#FFFFFF" },
  "4": { color: "#009952", text_color: "#FFFFFF" },
  "5": { color: "#009952", text_color: "#FFFFFF" },
  "6": { color: "#009952", text_color: "#FFFFFF" },
  "6X": { color: "#009952", text_color: "#FFFFFF" },
  "7": { color: "#9A38A1", text_color: "#FFFFFF" },
  "7X": { color: "#9A38A1", text_color: "#FFFFFF" },
  A: { color: "#0062CF", text_color: "#FFFFFF" },
  B: { color: "#EB6800", text_color: "#FFFFFF" },
  C: { color: "#0062CF", text_color: "#FFFFFF" },
  D: { color: "#EB6800", text_color: "#FFFFFF" },
  E: { color: "#0062CF", text_color: "#FFFFFF" },
  F: { color: "#EB6800", text_color: "#FFFFFF" },
  FS: { color: "#7C858C", text_color: "#FFFFFF" },
  FX: { color: "#EB6800", text_color: "#FFFFFF" },
  G: { color: "#799534", text_color: "#FFFFFF" },
  GS: { color: "#7C858C", text_color: "#FFFFFF" },
  H: { color: "#7C858C", text_color: "#FFFFFF" },
  J: { color: "#8E5C33", text_color: "#FFFFFF" },
  L: { color: "#7C858C", text_color: "#FFFFFF" },
  M: { color: "#EB6800", text_color: "#FFFFFF" },
  N: { color: "#F6BC26", text_color: "#000000" },
  Q: { color: "#F6BC26", text_color: "#000000" },
  R: { color: "#F6BC26", text_color: "#000000" },
  SI: { color: "#08179C", text_color: "#FFFFFF" },
  W: { color: "#F6BC26", text_color: "#000000" },
  Z: { color: "#8E5C33", text_color: "#FFFFFF" },
};

export function getSubwayLineColors(lineId: string): { color: string; text_color: string } | undefined {
  if (Object.prototype.hasOwnProperty.call(SUBWAY_LINE_COLORS, lineId)) {
    return SUBWAY_LINE_COLORS[lineId];
  }
  const found = Object.keys(SUBWAY_LINE_COLORS).find((k) => k.toLowerCase() === lineId.toLowerCase());
  return found ? SUBWAY_LINE_COLORS[found] : undefined;
}
