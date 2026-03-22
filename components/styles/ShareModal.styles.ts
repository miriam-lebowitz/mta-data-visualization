/**
 * Tailwind class bundles for `ShareModal`.
 * Line-picker outline color stays dynamic via `style.outlineColor`.
 */

export const backdrop =
  "fixed inset-0 z-[1000] flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4";

export const dialog =
  "retro-panel w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden";

export const modalHeader =
  "flex items-center justify-between px-5 py-3 border-b-4 border-ink shrink-0";

export const modalTitle = "text-base font-black tracking-[0.08em] uppercase text-ink";

export const modalSubtitle =
  "text-[9px] font-bold tracking-[0.12em] uppercase text-ink/50 mt-0.5";

export const closeButton =
  "text-ink/50 hover:text-ink text-2xl font-black leading-none w-8 h-8 flex items-center justify-center";

export const bodyColumns =
  "flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden";

export const pickerColumn =
  "sm:w-52 shrink-0 border-b-4 sm:border-b-0 sm:border-r-4 border-ink p-4 overflow-y-auto scrollbar-thin";

export const pickerTitle =
  "text-[9px] font-black tracking-[0.16em] uppercase text-ink/50 mb-3";

export const pickerGrid = "grid grid-cols-4 sm:grid-cols-3 gap-2";

export const linePickerButtonBase =
  "flex flex-col items-center gap-1 rounded p-1.5 transition-colors hover:bg-ink/5";

export const linePickerButtonSelected = "outline outline-[3px] outline-offset-2";

export const linePickerButtonUnselected = "outline-none";

export const linePickerRank = "text-[8px] font-bold text-ink/40 tabular-nums";

export const previewColumn =
  "flex-1 px-4 py-4 flex items-center justify-center overflow-y-auto scrollbar-thin border-b-4 sm:border-b-0 sm:border-r-4 border-ink relative";

export const previewPlaceholder = "flex flex-col items-center justify-center text-center gap-3";

export const previewPlaceholderIcon =
  "flex items-center justify-center w-20 h-20 rounded-full border-4 border-ink/20 text-4xl";

export const previewPlaceholderText =
  "text-[11px] font-black tracking-widest uppercase text-ink/40";

export const toast =
  "absolute bottom-16 left-1/2 -translate-x-1/2 retro-panel px-4 py-2 text-[11px] font-black tracking-widest uppercase text-ink whitespace-nowrap z-10";

export const actionsColumn =
  "sm:w-44 shrink-0 p-4 flex flex-col gap-2 justify-start overflow-y-auto scrollbar-thin";

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

export const shareSectionTitle =
  "text-[9px] font-black tracking-[0.16em] uppercase text-ink/50 mb-1";

export const shareActionButton =
  "flex items-center gap-2 retro-panel px-3 py-2.5 text-[10px] font-black tracking-[0.1em] uppercase text-ink hover:opacity-80 transition-opacity w-full";

export const shareActionButtonDisabled =
  "flex items-center gap-2 retro-panel px-3 py-2.5 text-[10px] font-black tracking-[0.1em] uppercase text-ink hover:opacity-80 disabled:opacity-40 transition-opacity w-full";

export const shareInstagramButton =
  "flex items-center gap-2 retro-panel px-3 py-2.5 text-[10px] font-black tracking-[0.1em] uppercase text-ink hover:opacity-80 transition-opacity w-full whitespace-nowrap";
