/**
 * Tailwind class strings and style helpers for `AlertsSidebar`.
 *
 * MTA line badge colors come from the API at runtime, so the “on” state for line
 * toggles still uses `style={lineToggleOnStyle(line)}` — Tailwind cannot emit
 * those hex values at build time.
 */
import type { CSSProperties } from "react";

export type AlertSeverity = "normal" | "minor" | "major";

export const alertSeverityStripe: Record<AlertSeverity, string> = {
  major: "bg-signal-red",
  minor: "bg-signal-yellow",
  normal: "bg-signal-green",
};

export const alertSeverityText: Record<AlertSeverity, string> = {
  major: "text-signal-red",
  minor: "text-signal-yellow",
  normal: "text-signal-green",
};

export const alertSeverityLabel: Record<AlertSeverity, string> = {
  major: "SERVICE CHANGE",
  minor: "DELAYS",
  normal: "ADVISORY",
};

/* ─── Shell ─────────────────────────────────────────────────────────────── */

export const aside =
  "flex h-full min-h-0 w-full shrink-0 flex-col retro-panel border-y-0 border-r-0 md:w-72";

export const header = "px-4 py-3 border-b-4 border-ink";

export const headerTitle = "text-xs font-black tracking-[0.18em] uppercase text-ink";

export const headerTime = "text-[9px] text-ink/50 font-mono mt-0.5";

export const scrollArea = "flex-1 overflow-y-auto p-2 scrollbar-thin";

export const footer = "px-3 py-2 border-t-4 border-ink";

export const footerMeta = "text-[8px] text-ink/40 font-mono leading-tight";

/* ─── Line visibility panel ───────────────────────────────────────────────── */

export const panel = "retro-panel p-2 mb-2";

export const panelSectionHeader = "flex items-center justify-between gap-2 mb-2";

export const panelLabel = "text-[9px] font-black tracking-[0.14em] uppercase text-ink/60";

/** “Nearest Trains” heading — same as `panelLabel` with spacing below. */
export const nearestTrainsPanelLabel = `${panelLabel} mb-2`;

export const stationWalkSlug = "capitalize";

export const panelHeaderActions = "flex items-center gap-2";

export const textButtonMuted = "text-[9px] font-bold text-ink/60 hover:text-ink";

export const lineToggleGrid =
  "grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-1.5 sm:grid-cols-4";

const lineToggleBase =
  "h-6 rounded border text-[10px] font-black transition-opacity";

const lineToggleOn = "border-black/20 opacity-100";

const lineToggleOff = "border-black/[0.18] bg-black/[0.04] text-ink opacity-70";

export function lineToggleClassName(isOn: boolean): string {
  return `${lineToggleBase} ${isOn ? lineToggleOn : lineToggleOff}`;
}

/** Only when the toggle is on — MTA hex colors from API */
export function lineToggleOnStyle(line: {
  color: string;
  text_color: string;
}): CSSProperties {
  return {
    backgroundColor: line.color,
    color: line.text_color || "#ffffff",
  };
}

/* ─── Nearest trains ──────────────────────────────────────────────────────── */

export const addressRow = "flex flex-col gap-2 sm:flex-row sm:items-center";

export const addressInput =
  "min-h-11 min-w-0 flex-1 rounded border border-ink/20 bg-parchment/70 px-3 py-2 text-base text-ink sm:h-7 sm:min-h-0 sm:px-2 sm:py-0 sm:text-[10px]";

export const findButton =
  "min-h-11 shrink-0 rounded border border-ink/20 px-4 text-xs font-bold text-ink/70 touch-manipulation hover:text-ink disabled:opacity-50 sm:h-7 sm:min-h-0 sm:px-2 sm:text-[10px]";

export const errorText = "text-[9px] text-signal-red mt-1 font-bold";

export const mutedHint = "text-[9px] text-ink/50 mt-2";

export const stationWalkMeta = "text-[9px] text-ink/60 mt-2 font-mono";

export const trainList = "mt-2 space-y-1.5";

export const trainRow = "flex items-center justify-between gap-2 text-[10px]";

export const trainRowLeft = "flex items-center gap-2 min-w-0";

const trainBadgeBase =
  "inline-flex items-center justify-center w-4 h-4 rounded-full border border-ink/30 text-[9px] font-black text-white shrink-0";

export function trainLineBadgeClassName(delayed: boolean): string {
  return `${trainBadgeBase} ${delayed ? "bg-signal-red" : "bg-ink"}`;
}

export const trainDirection = "text-ink/70 font-bold uppercase truncate";

export const trainDelayedTag = "text-[8px] font-black text-signal-red shrink-0";

export const trainMeta = "font-mono text-ink/60 whitespace-nowrap";

/* ─── Loading / empty / error ─────────────────────────────────────────────── */

export const skeletonStack = "space-y-2";

export const skeletonBlock = "skeleton h-12 rounded";

export const errorState = "text-center py-8";

export const errorTitle = "text-[11px] font-bold status-bad";

export const errorSub = "text-[10px] text-ink/50 mt-1";

export const goodServiceRow = "flex items-center gap-2 py-1.5 px-1";

export const goodServiceIcon =
  "text-base leading-none text-signal-green shrink-0";

export const goodServiceTitle =
  "text-[11px] font-black tracking-widest uppercase status-ok leading-tight";

export const goodServiceSub = "text-[9px] text-ink/50 leading-tight";

/* ─── Alert card ─────────────────────────────────────────────────────────── */

export const alertCardButton =
  "w-full text-left retro-panel mb-2 p-0 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity";

export const alertCardRow = "flex items-stretch";

export const alertCardStripe = "w-2 shrink-0";

export const alertCardBody = "flex-1 px-2 py-1.5";

export const alertCardMetaRow = "flex items-center justify-between gap-2";

export const alertCardSeverity =
  "text-[9px] font-black tracking-[0.12em] uppercase";

export const alertCardLine = "text-[9px] font-bold text-ink/40 shrink-0";

/** Line id pill when `lineColor` is set from the API (MTA route color). */
export const alertCardLineColored =
  "text-[9px] font-black shrink-0 rounded px-1.5 py-0.5 border border-black/15";

export const alertCardHeader =
  "text-[11px] font-bold text-ink leading-tight mt-0.5 line-clamp-2";

export const alertCardExpanded = "px-3 pb-2 pt-1 border-t-2 border-ink/20";

export const alertCardDescription = "text-[10px] text-ink/70 leading-relaxed";

export const alertCardUpdated = "text-[9px] text-ink/40 mt-1 font-mono";
