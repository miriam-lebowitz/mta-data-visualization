/** Size tokens for `LineBadge`. Line colors use inline `style` (API). */

export const base =
  "inline-flex items-center justify-center rounded-full font-black leading-none shrink-0 border-ink";

export const sizeSm = "w-7 h-7 text-xs border-2";

export const sizeMd = "w-9 h-9 text-sm border-[3px]";

export const sizeLg = "w-12 h-12 text-base border-4";

export const sizes = {
  sm: sizeSm,
  md: sizeMd,
  lg: sizeLg,
} as const;

export function classNameForSize(size: keyof typeof sizes): string {
  return `${base} ${sizes[size]}`;
}
