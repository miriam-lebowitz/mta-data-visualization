/** Tailwind class bundles for `ScoreBar`. Width % and optional custom width use inline `style`. */

export const trackBase =
  "relative h-3 overflow-hidden border-2 border-ink bg-[#2a2a2a]";

export const trackFullWidth = "w-full";

export const tick =
  "absolute top-0 bottom-0 w-px bg-white/15";

export const tick25 = "left-1/4";

export const tick50 = "left-1/2";

export const tick75 = "left-3/4";

export const fillBase = "absolute inset-y-0 left-0 transition-all duration-700";

export function fillToneClass(score: number): string {
  if (score >= 70) return "bg-signal-green";
  if (score >= 40) return "bg-signal-yellow";
  return "bg-signal-red";
}
