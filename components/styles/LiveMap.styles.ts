/**
 * Tailwind class bundles for `LiveMap` chrome (overlays, legend, markers).
 * Train / arrival dot colors remain inline `style` (API-driven).
 */

export const mapRoot =
  "relative h-full w-full touch-manipulation overflow-hidden aged-paper";

export const grainOverlay =
  "map-film-grain-overlay pointer-events-none absolute inset-0 mix-blend-multiply";

export const lastUpdatedBadge =
  "absolute right-2 top-2 z-[800] max-w-[calc(100vw-6rem)] truncate retro-panel px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-ink/60 sm:right-4 sm:top-3 sm:max-w-none sm:px-3 sm:text-[10px] sm:tracking-widest";

export const loadErrorBar =
  "absolute left-2 right-2 top-12 z-[850] flex flex-wrap items-center justify-between gap-2 retro-panel border-signal-red px-2 py-1.5 sm:left-4 sm:right-4 sm:top-14 sm:px-3";

export const loadErrorText =
  "text-[9px] font-bold uppercase tracking-wide text-signal-red";

export const loadErrorRetry =
  "shrink-0 rounded border-2 border-ink bg-panel-bg px-2 py-1 text-[9px] font-black uppercase tracking-wide text-ink hover:opacity-80";

export const loadingOverlay =
  "absolute inset-0 z-[900] flex items-center justify-center";

export const loadingPanel = "retro-panel px-8 py-6 text-center";

export const loadingText =
  "text-[11px] font-black tracking-[0.08em] uppercase text-ink/70 mb-3";

export const loadingSkeleton = "skeleton h-3 w-32 mx-auto";

export const mapFilterWrap =
  "relative w-full h-full [filter:sepia(0.15)_contrast(1.1)]";

export const stationMarkerBase =
  "size-2.5 cursor-pointer rounded-full border-2 bg-parchment/95";

export const stationMarkerActive =
  "border-black/85 shadow-[0_0_0_4px_rgba(0,0,0,0.08)]";

export const stationMarkerIdle = "border-black/25";

export const popupPanel = "retro-panel p-2";

export const popupTitle =
  "text-[10px] font-black tracking-[0.05em] text-ink capitalize";

export const popupList = "mt-1 space-y-1";

export const popupRow = "flex items-center justify-between gap-2";

export const popupLineGroup = "flex items-center gap-2 min-w-0";

export const popupLineDot = "inline-block size-2.5 rounded-full border border-ink/20";

export const popupLineName = "text-[10px] font-black text-ink/70";

export const popupTimes = "text-[10px] font-bold text-ink/70 whitespace-nowrap";

export const popupEmpty = "text-[10px] text-ink/50 font-mono";

export const trainMarkerBase =
  "relative flex size-3.5 items-center justify-center rounded-full border-2 border-ink font-sans text-[8px] font-extrabold leading-none";

export const trainMarkerAtStop = "train-pulse shadow-[0_0_0_5px_rgba(0,0,0,0.25)]";

export const trainDelayBadge =
  "absolute -right-[7px] -top-[7px] flex items-center justify-center size-2.5 rounded-full bg-signal-red border border-ink text-[7px] font-black leading-none text-white";

export const legendPanel =
  "absolute bottom-2 left-2 z-[800] max-w-[min(260px,calc(100vw-1rem))] retro-panel px-2 py-1.5 sm:bottom-3 sm:left-4 sm:max-w-[260px] sm:px-3 sm:py-2";

export const legendTitle =
  "text-[9px] font-black tracking-[0.15em] uppercase text-ink/60 mb-1";

export const legendRow = "flex items-center gap-3";

export const legendItem = "flex items-center gap-2";

export const legendDotStation =
  "inline-block size-2 rounded-full border border-ink/30 bg-parchment";

export const legendDotTrain =
  "inline-block size-2.5 rounded-full border border-ink/50 bg-signal-red";

export const legendLabel = "text-[10px] font-bold text-ink/60";

export const legendFootnote = "text-[9px] text-ink/50 font-mono mt-2";
