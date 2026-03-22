/**
 * Style objects for the share-card PNG (next/og + Satori).
 *
 * Satori does not support Tailwind, className, or external stylesheets — only
 * inline `style` with a subset of CSS. Keeping tokens and layouts here keeps
 * `app/api/share-card/route.tsx` readable.
 */

import type { CSSProperties } from "react";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1080;

export const palette = {
  parchment: "#f5f0e8",
  panel: "#ebe6dc",
  ink: "#1a1a1a",
  inkMuted: "rgba(26,26,26,0.45)",
  inkSoft: "rgba(26,26,26,0.55)",
  inkTagline: "rgba(26,26,26,0.75)",
  inkCaption: "rgba(26,26,26,0.35)",
  inkFooter: "rgba(26,26,26,0.45)",
  divider: "rgba(26,26,26,0.12)",
  nyRed: "#D82233",
  white: "#ffffff",
} as const;

export const ogStyles = {
  root: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    display: "flex",
    flexDirection: "column",
    background: palette.parchment,
    fontFamily: "Barlow Condensed, sans-serif",
  } satisfies CSSProperties,

  headerBar: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    padding: "24px 56px",
    borderBottom: `5px solid ${palette.ink}`,
    background: palette.panel,
    flexShrink: 0,
  } satisfies CSSProperties,

  headerNyCircle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    borderRadius: 999,
    border: `3px solid ${palette.ink}`,
    background: palette.nyRed,
    color: palette.white,
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: "0.04em",
  } satisfies CSSProperties,

  headerTitlesCol: {
    display: "flex",
    flexDirection: "column",
  } satisfies CSSProperties,

  headerSubtitle: {
    fontSize: 18,
    fontWeight: 400,
    letterSpacing: "0.2em",
    color: palette.inkSoft,
    textTransform: "uppercase",
  } satisfies CSSProperties,

  headerTitle: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: "0.08em",
    color: palette.ink,
    textTransform: "uppercase",
  } satisfies CSSProperties,

  mainBody: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    padding: "56px 80px 48px",
    justifyContent: "space-between",
  } satisfies CSSProperties,

  topBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  } satisfies CSSProperties,

  badge: (lineColor: string, lineTextColor: string): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 280,
    height: 280,
    borderRadius: 999,
    background: lineColor,
    border: `8px solid ${palette.ink}`,
    color: lineTextColor,
    fontSize: 140,
    fontWeight: 900,
    lineHeight: 1,
    boxShadow: "6px 6px 0 rgba(0,0,0,0.2)",
    marginBottom: 36,
  }),

  rankLine: {
    fontSize: 52,
    fontWeight: 900,
    color: palette.ink,
    textAlign: "center",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    lineHeight: 1.1,
    margin: 0,
    marginBottom: 6,
  } satisfies CSSProperties,

  snapshotLine: {
    fontSize: 26,
    fontWeight: 400,
    color: palette.inkMuted,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    margin: 0,
    marginBottom: 28,
  } satisfies CSSProperties,

  tagline: {
    fontSize: 34,
    fontWeight: 400,
    color: palette.inkTagline,
    textAlign: "center",
    lineHeight: 1.45,
    fontStyle: "italic",
    margin: 0,
    maxWidth: 780,
  } satisfies CSSProperties,

  scoreGrid: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    borderTop: `3px solid ${palette.divider}`,
    paddingTop: 36,
  } satisfies CSSProperties,

  scoreColumn: (index: number, total: number): CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    borderRight: index < total - 1 ? `3px solid ${palette.divider}` : "none",
    padding: "0 16px",
  }),

  scoreValue: (color: string): CSSProperties => ({
    fontSize: 80,
    fontWeight: 900,
    color,
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
    marginBottom: 10,
  }),

  scoreTierText: (color: string): CSSProperties => ({
    fontSize: 30,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color,
    marginBottom: 12,
  }),

  scoreCategory: {
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: palette.inkFooter,
  } satisfies CSSProperties,

  footerBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 56px",
    borderTop: `5px solid ${palette.ink}`,
    background: palette.panel,
    flexShrink: 0,
  } satisfies CSSProperties,

  footerUrl: {
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: palette.inkFooter,
  } satisfies CSSProperties,

  footerCaption: {
    fontSize: 18,
    fontWeight: 400,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: palette.inkCaption,
  } satisfies CSSProperties,
};
