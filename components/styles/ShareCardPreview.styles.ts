/**
 * Tailwind class bundles for `ShareCardPreview`.
 *
 * The card is authored at a fixed pixel size then scaled with CSS `zoom`; line
 * badge `background` / `color` still come from API data via inline `style` on the
 * component (see ShareCardPreview.tsx).
 */

export const root = "mx-auto w-[300px] max-w-full shrink-0 overflow-hidden";

export const card =
  "flex flex-col overflow-hidden border-4 border-ink bg-parchment";

export const header =
  "flex shrink-0 items-center gap-2 border-b-[3px] border-ink bg-panel-bg px-[18px] py-2";

export const headerNyBadge =
  "flex size-[26px] shrink-0 items-center justify-center rounded-full border-2 border-ink bg-[#D82233] text-[8px] font-black text-white";

export const headerTextCol = "flex flex-col leading-tight";

export const headerEyebrow =
  "text-[7px] font-bold uppercase tracking-[0.18em] text-ink/55";

export const headerTitle =
  "text-[11px] font-black uppercase tracking-[0.06em] text-ink";

export const body =
  "flex flex-1 flex-col items-center justify-between px-[26px] pb-3.5 pt-[18px]";

export const bodyTop = "flex flex-col items-center";

export const lineBadge =
  "mb-3 flex size-[90px] shrink-0 items-center justify-center rounded-full border-4 border-ink text-[44px] font-black leading-none shadow-[3px_3px_0_rgba(0,0,0,0.2)]";

export const rankText =
  "mb-1 text-center text-[20px] font-black uppercase leading-tight tracking-[0.04em] text-ink";

export const snapshotText =
  "mb-3 text-center text-[8px] font-bold uppercase tracking-[0.12em] text-ink/45";

export const tagline =
  "max-w-[260px] break-words text-center text-[11px] italic leading-snug text-ink/75";

export const scoresRow =
  "flex w-full flex-row border-t-2 border-ink/12 pt-3";

export const scoreCol = "flex flex-1 flex-col items-center px-1";

export const scoreColDivider = "border-r border-ink/12";

export const scoreValue = "mb-0.5 text-2xl font-black leading-none";

export const scoreLabel =
  "mb-1 text-[8px] font-black uppercase tracking-[0.08em]";

export const scoreName =
  "text-[7px] font-black uppercase tracking-[0.1em] text-ink/40";

export const footer =
  "flex shrink-0 items-center justify-between border-t-[3px] border-ink bg-panel-bg px-4 py-1.5";

export const footerLeft =
  "text-[7px] font-black uppercase tracking-[0.16em] text-ink/40";

export const footerRight =
  "text-[7px] font-bold uppercase tracking-[0.1em] text-ink/30";

export function scoreTextToneClass(score: number): string {
  if (score >= 70) return "text-signal-green";
  if (score >= 40) return "text-signal-yellow";
  return "text-signal-red";
}

export function scoreBandLabel(score: number): string {
  if (score >= 70) return "GOOD";
  if (score >= 40) return "FAIR";
  return "POOR";
}
