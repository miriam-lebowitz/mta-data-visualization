/** Tailwind class bundles for `RetroToggle`. Accent color uses CSS var from label `style`. */

export const label =
  "group flex cursor-pointer select-none flex-col items-center gap-2";

export const labelText =
  "text-[10px] font-black tracking-[0.15em] uppercase text-ink/70 group-hover:text-ink transition-colors";

export const inputHidden = "sr-only";

export const led =
  "absolute right-1.5 top-1 size-1.5 rounded-full bg-[#444] transition-colors data-[on=true]:bg-[var(--toggle-accent)]";

export const stateLabel =
  "text-[9px] font-bold uppercase tracking-widest text-[#888] transition-colors data-[on=true]:text-[var(--toggle-accent)]";
