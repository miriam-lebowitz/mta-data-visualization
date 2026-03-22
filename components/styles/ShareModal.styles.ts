/**
 * Tailwind class bundles for `ShareModal`.
 * Line-picker outline color stays dynamic via `style.outlineColor`.
 */

export const backdrop =
  "fixed inset-0 z-[1000] flex items-stretch justify-center bg-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-4";

export const dialog =
  "retro-panel flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col overflow-hidden sm:h-auto sm:max-h-[min(90vh,900px)] sm:max-w-4xl";

export const modalHeader =
  "flex shrink-0 items-center justify-between border-b-4 border-ink px-3 py-2.5 sm:px-5 sm:py-3";

export const modalTitle = "text-base font-black tracking-[0.08em] uppercase text-ink";

export const modalSubtitle =
  "text-[9px] font-bold tracking-[0.12em] uppercase text-ink/50 mt-0.5";

export const closeButton =
  "flex h-11 w-11 min-h-11 min-w-11 items-center justify-center text-2xl font-black leading-none text-ink/50 touch-manipulation hover:text-ink sm:h-8 sm:w-8 sm:min-h-0 sm:min-w-0";

/** Mobile: single vertical scroll through picker → preview → actions. Desktop: row + column scroll. */
export const bodyColumns =
  "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain sm:flex-row sm:overflow-hidden";

export const pickerColumn =
  "shrink-0 border-b-4 border-ink p-3 sm:w-52 sm:shrink-0 sm:overflow-y-auto sm:border-b-0 sm:border-r-4 sm:p-4 sm:scrollbar-thin";

export const pickerTitle =
  "text-[9px] font-black tracking-[0.16em] uppercase text-ink/50 mb-3";

export const pickerGrid =
  "grid grid-cols-4 gap-1.5 sm:grid-cols-3 sm:gap-2";

export const linePickerButtonBase =
  "flex flex-col items-center gap-1 rounded p-1.5 transition-colors hover:bg-ink/5";

export const linePickerButtonSelected = "outline outline-[3px] outline-offset-2";

export const linePickerButtonUnselected = "outline-none";

export const linePickerRank = "text-[8px] font-bold text-ink/40 tabular-nums";

export const previewColumn =
  "relative flex shrink-0 flex-col items-center justify-center border-b-4 border-ink px-3 py-3 max-sm:overflow-x-auto sm:flex-1 sm:overflow-y-auto sm:border-r-4 sm:border-b-0 sm:px-4 sm:py-4 sm:scrollbar-thin";

export const previewPlaceholder = "flex flex-col items-center justify-center text-center gap-3";

export const previewPlaceholderIcon =
  "flex items-center justify-center w-20 h-20 rounded-full border-4 border-ink/20 text-4xl";

export const previewPlaceholderText =
  "text-[11px] font-black tracking-widest uppercase text-ink/40";

export const toast =
  "absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-10 max-w-[min(100%,calc(100vw-2rem))] -translate-x-1/2 whitespace-normal break-words px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest text-ink retro-panel sm:bottom-16 sm:max-w-none sm:whitespace-nowrap sm:text-[11px]";

export const actionsColumn =
  "flex shrink-0 flex-col justify-start gap-2 border-t-4 border-ink p-4 sm:w-44 sm:overflow-y-auto sm:border-l-4 sm:border-t-0 sm:border-ink sm:scrollbar-thin";

export const actionsLockedHint =
  "px-1 py-4 text-center text-[10px] font-bold uppercase leading-relaxed tracking-wider text-ink/45";

export const taglineSection = "flex flex-col gap-1 mb-2";

export const taglineLabelRow = "flex items-center justify-between";

export const taglineLabel =
  "text-[9px] font-black tracking-[0.16em] uppercase text-ink/50";

export const taglineReset =
  "text-[8px] font-bold tracking-[0.1em] uppercase text-ink/40 hover:text-ink/70 transition-colors";

export const taglineTextarea =
  "w-full resize-none border-2 border-ink bg-panel-bg px-2 py-1.5 text-[10px] font-bold text-ink leading-relaxed focus:outline-none focus:border-ink scrollbar-thin";

export const taglineCountBase = "text-[8px] text-right tabular-nums";

export const taglineCountWarn = "text-amber-600";

export const taglineCountMuted = "text-ink/30";

export function taglineCountClassName(length: number): string {
  return `${taglineCountBase} ${length >= 130 ? taglineCountWarn : taglineCountMuted}`;
}

export const shareSectionTitle =
  "text-[9px] font-black tracking-[0.16em] uppercase text-ink/50 mb-1";

export const shareActionButton =
  "flex items-center gap-2 retro-panel px-3 py-2.5 text-[10px] font-black tracking-[0.1em] uppercase text-ink hover:opacity-80 transition-opacity w-full";

export const shareActionButtonDisabled =
  "flex items-center gap-2 retro-panel px-3 py-2.5 text-[10px] font-black tracking-[0.1em] uppercase text-ink hover:opacity-80 disabled:opacity-40 transition-opacity w-full";

export const shareInstagramButton =
  "flex items-center gap-2 retro-panel px-3 py-2.5 text-[10px] font-black tracking-[0.1em] uppercase text-ink hover:opacity-80 transition-opacity w-full whitespace-nowrap";
