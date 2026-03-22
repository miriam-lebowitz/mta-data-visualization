/** Tailwind / class hooks for `SolariFlip`. */

export const root = "font-mono tabular-nums";

export const digitBase = "solari-digit relative inline-block";

export const digitInner = "solari-digit-inner block";

const digitDot = "solari-digit--dot";

const digitNarrow = "solari-digit--narrow";

/** Modifier classes live in `app/globals.css`. */
export function digitVariantClass(char: string): string {
  return char === "." ? digitDot : digitNarrow;
}

export function rootWithClassName(className: string): string {
  return className ? `${root} ${className}` : root;
}
