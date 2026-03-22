/** Layout shell for `TransitDashboard` — stack on small screens, row from `md`. */

export const root =
  "flex flex-1 min-h-0 flex-col overflow-hidden md:flex-row";

/** Map fills space above the mobile resize handle + sidebar; min height while resizing. */
export const mapPane =
  "relative min-h-[180px] flex-1 overflow-hidden md:min-h-0";

/**
 * Wide, tall touch target between map and alerts on mobile (`md:hidden`).
 * ~52px min height for comfortable thumbs; `touch-none` reduces scroll fighting.
 */
export const resizeHandle =
  "relative z-20 flex min-h-[52px] shrink-0 cursor-row-resize touch-none select-none flex-col items-center justify-center gap-1 border-t-4 border-ink bg-panel-bg px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/35 focus-visible:ring-offset-2 focus-visible:ring-offset-panel-bg active:bg-ink/[0.08] md:hidden";

export const resizeHandleDragging =
  "bg-ink/[0.12] ring-2 ring-ink/25 ring-inset";

export const resizeHandleGripsRow =
  "pointer-events-none flex flex-col items-center gap-1";

export const resizeHandleGrip =
  "h-1 w-20 rounded-full bg-ink/45";

export const resizeHandleLabel =
  "pointer-events-none text-[9px] font-black uppercase tracking-[0.2em] text-ink/40";

/** Alerts: explicit height on mobile (set inline); fixed rail on `md+`. Border comes from `AlertsSidebar` retro-panel. */
export const sidebarShell =
  "flex min-h-0 flex-col overflow-hidden md:h-full md:w-72 md:flex-none md:shrink-0";

/** `TransitDashboardLoader` skeleton: map pane loading overlay. */
export const skeletonMapLoadingOverlay =
  "absolute inset-0 flex items-center justify-center bg-parchment/90";

export const skeletonMapLoadingText =
  "text-[11px] font-black uppercase tracking-widest text-ink/40";

/** Skeleton sidebar placeholder — fills space under map on mobile before dashboard mounts. */
export const sidebarShellSkeleton = `${sidebarShell} flex-1 border-t-0 md:flex-none`;
