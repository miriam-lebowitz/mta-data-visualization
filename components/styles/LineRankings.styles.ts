/**
 * Tailwind class bundles for `LineRankings`.
 * Dynamic line colors for `FactorLegendItem` stay on the component (`style`).
 */

export const page =
  "mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-2 py-1.5 sm:px-4 sm:py-3";

export const fetchErrorBar =
  "mb-2 flex flex-wrap items-center justify-between gap-2 border-4 border-signal-red bg-parchment/90 px-3 py-2 sm:mb-3";

export const fetchErrorText =
  "text-[10px] font-black uppercase tracking-wide text-signal-red";

export const fetchErrorRetry =
  "retro-panel px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-ink hover:opacity-80";

export const headerPanel =
  "retro-panel mb-1.5 shrink-0 px-2.5 py-2 sm:mb-3 sm:px-5 sm:py-3 max-md:mb-1";

export const headerTopRow =
  "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between max-md:gap-1.5";

export const title =
  "text-xl font-black uppercase leading-tight tracking-[0.06em] text-ink max-md:text-base max-md:tracking-[0.04em]";

export const subtitle =
  "font-mono text-[11px] tracking-wider text-ink/50 max-md:hidden";

export const clockShareRow =
  "flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4 max-md:flex-row max-md:items-center max-md:justify-between max-md:gap-2";

export const clockBlock = "text-left sm:text-right";

export const clockTime =
  "font-mono text-xl font-bold tabular-nums tracking-widest text-ink max-md:text-lg max-md:tracking-wide";

export const clockDate =
  "text-[9px] font-bold tracking-[0.15em] text-ink/50 max-md:text-[8px]";

export const shareButton =
  "retro-panel flex min-h-11 shrink-0 items-center justify-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-ink touch-manipulation transition-opacity hover:opacity-80 disabled:opacity-30 max-md:min-h-9 max-md:px-2.5 max-md:py-1.5 max-md:text-[9px] sm:min-h-0 sm:justify-start";

/** Always a row: toggles on the left, factor legend on the right (including mobile). */
export const togglesSection =
  "mt-3 flex flex-row items-start justify-between gap-2 border-t-4 border-ink pt-3 max-md:mt-2 max-md:border-t-2 max-md:pt-2 lg:gap-6";

export const togglesLeft =
  "flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 lg:gap-6";

export const togglesLabel =
  "shrink-0 text-[9px] font-black uppercase tracking-[0.18em] text-ink/50 max-md:text-[8px] max-md:tracking-[0.14em]";

export const togglesRow =
  "flex flex-wrap justify-start gap-4 max-md:gap-2 max-md:[&>label]:origin-top max-md:[&>label]:scale-[0.86] sm:gap-6";

export const factorKeyColumn =
  "flex shrink-0 flex-col items-end gap-0.5 self-start text-right max-md:max-w-[min(52%,11rem)] max-md:pl-1 sm:max-w-none";

export const columnHeaders =
  "flex shrink-0 items-center gap-3 border-b-4 border-ink px-4 pb-1.5 max-md:gap-2 max-md:px-2 max-md:pb-1 max-md:border-b-2";

export const colRankSpacer = "w-7";

export const colBadgeSpacer = "w-9";

export const colLineLabel =
  "flex-1 text-[9px] font-black tracking-[0.15em] uppercase text-ink/50";

export const colSubScoresRow = "hidden sm:flex items-center gap-4 shrink-0";

export const colSubScoreHeader =
  "w-14 text-center text-[9px] font-black tracking-[0.1em] uppercase text-ink/50";

export const colScoreHeader =
  "w-14 text-right text-[9px] font-black tracking-[0.1em] uppercase text-ink/50";

export const listPanel = "retro-panel flex-1 min-h-0 overflow-hidden";

export const skeletonList = "space-y-3 p-6 max-md:p-3 max-md:space-y-2";

export const skeletonRow = "flex items-center gap-3";

export const skeletonRank = "skeleton h-8 w-8 rounded-full";

export const skeletonLine = "flex-1 skeleton h-5 rounded";

export const skeletonScore = "skeleton h-8 w-12 rounded";

export const emptyState = "p-10 text-center";

export const emptyMessage =
  "text-sm font-bold text-ink/50 tracking-widest uppercase";

export const scrollList = "h-full overflow-y-auto scrollbar-thin";

export const footer =
  "mt-2 flex shrink-0 flex-col gap-2 max-md:mt-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0";

export const footerNote =
  "text-[9px] font-mono leading-relaxed text-ink/40 max-md:text-[7px] max-md:leading-snug";

export const footerLegendRow = "flex items-center gap-2";

export const footerLegendItem = "flex items-center gap-1";

export const footerLegendSwatchBase = "inline-block h-2.5 w-2.5 border border-ink";

/** Composite score legend: Good / Fair / Poor swatches (order matches footer map). */
export const footerLegendSwatches: readonly string[] = [
  `${footerLegendSwatchBase} bg-signal-green`,
  `${footerLegendSwatchBase} bg-signal-yellow`,
  `${footerLegendSwatchBase} bg-signal-red`,
];

export const footerLegendLabel =
  "text-[8px] font-bold text-ink/50 uppercase tracking-wider";

export const rankRow =
  "flex items-center gap-3 border-b-2 border-ink/10 px-4 py-2 transition-colors hover:bg-ink/5 max-md:gap-2 max-md:px-2 max-md:py-1.5";

export const rankNumber =
  "w-7 shrink-0 text-right text-base font-black tabular-nums text-ink/30 max-md:w-6 max-md:text-sm";

export const lineNameBlock = "flex-1 min-w-0";

export const lineLongName =
  "truncate text-sm font-bold leading-tight tracking-wide text-ink max-md:text-xs";

export const subScoresRow = "hidden sm:flex items-center gap-4 shrink-0";

export const subScoreCell = "text-center w-14";

export const subScoreLabel =
  "text-[8px] font-black tracking-[0.1em] uppercase text-ink/40 mb-0.5";

export const subScoreValue = "text-sm font-black tabular-nums leading-none";

export const compositeBlock = "shrink-0 text-right w-14";

export const solariComposite = "text-xl font-black max-md:text-lg";

export const compositeLabel = "text-[8px] font-bold uppercase tracking-widest";

export const factorLegendRow =
  "flex items-center justify-end gap-1.5 text-right text-[11px] leading-tight text-ink/60 max-md:text-xs max-md:leading-snug";

export const factorLegendSwatch =
  "inline-block size-2 shrink-0 rounded-full max-md:size-2.5";

/** Solari / composite status hooks (see `app/globals.css`). */
export function scoreClass(score: number): string {
  if (score >= 70) return "status-ok";
  if (score >= 40) return "status-warn";
  return "status-bad";
}

export function scoreTextClass(score: number): string {
  if (score >= 70) return "text-signal-green";
  if (score >= 40) return "text-signal-yellow";
  return "text-signal-red";
}
