"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import AlertsSidebar from "@/components/AlertsSidebar";
import LiveMapWrapper from "@/components/LiveMapWrapper";
import type { GeoLocation, LineOption, LiveTrainLocation } from "@/lib/types";
import * as ui from "./styles/TransitDashboard.styles";

const STORAGE_KEY = "transit-mobile-sidebar-height-px";
const MIN_MAP_PX = 180;
const MIN_SIDEBAR_PX = 160;
const MAX_SIDEBAR_FRAC = 0.82;
/** Match `resizeHandle` min height in `TransitDashboard.styles` for clamp math. */
const HANDLE_PX = 52;

function readStoredHeight(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function clampSidebarHeight(height: number, rootHeight: number): number {
  if (rootHeight <= 0) return height;
  const maxSidebar = Math.min(
    Math.floor(rootHeight * MAX_SIDEBAR_FRAC),
    rootHeight - MIN_MAP_PX - HANDLE_PX,
  );
  const lo = MIN_SIDEBAR_PX;
  const hi = Math.max(lo, maxSidebar);
  return Math.min(hi, Math.max(lo, Math.round(height)));
}

function updateSidebarMax(rootHeight: number, setMax: (n: number) => void) {
  const maxSidebar = Math.min(
    Math.floor(rootHeight * MAX_SIDEBAR_FRAC),
    rootHeight - MIN_MAP_PX - HANDLE_PX,
  );
  setMax(Math.max(MIN_SIDEBAR_PX, maxSidebar));
}

export default function TransitDashboard() {
  const [lineOptions, setLineOptions] = useState<LineOption[]>([]);
  const [visibleLineSlugs, setVisibleLineSlugs] = useState<string[] | null>(null);
  const [visibleTrains, setVisibleTrains] = useState<LiveTrainLocation[]>([]);
  const [focusLocation, setFocusLocation] = useState<GeoLocation | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [sidebarHeightPx, setSidebarHeightPx] = useState(300);
  const [sidebarMaxPx, setSidebarMaxPx] = useState(600);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const sidebarHeightRef = useRef(sidebarHeightPx);
  sidebarHeightRef.current = sidebarHeightPx;
  const [isResizing, setIsResizing] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      const mobile = mq.matches;
      setIsMobileLayout(mobile);
      const el = rootRef.current;
      if (!mobile || !el) return;
      requestAnimationFrame(() => {
        const rootH = el.getBoundingClientRect().height;
        const stored = readStoredHeight();
        setSidebarHeightPx((prev) =>
          stored !== null ? clampSidebarHeight(stored, rootH) : clampSidebarHeight(prev, rootH),
        );
        updateSidebarMax(rootH, setSidebarMaxPx);
      });
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isMobileLayout || !rootRef.current) return;

    const el = rootRef.current;
    const ro = new ResizeObserver(() => {
      const rootH = el.getBoundingClientRect().height;
      setSidebarHeightPx((prev) => clampSidebarHeight(prev, rootH));
      updateSidebarMax(rootH, setSidebarMaxPx);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobileLayout]);

  const handleLinesChange = useCallback((lines: LineOption[]) => {
    setLineOptions(lines);
    setVisibleLineSlugs((prev) => {
      if (prev === null) return null;
      const available = new Set(lines.map((l) => l.slug));
      return prev.filter((slug) => available.has(slug));
    });
  }, []);

  const persistSidebarHeight = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(sidebarHeightRef.current));
    } catch {
      /* ignore */
    }
  }, []);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isMobileLayout || !rootRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        startY: e.clientY,
        startHeight: sidebarHeightRef.current,
      };
    },
    [isMobileLayout],
  );

  const onResizePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !rootRef.current) return;
    e.preventDefault();
    const rootH = rootRef.current.getBoundingClientRect().height;
    const delta = e.clientY - dragRef.current.startY;
    const next = dragRef.current.startHeight + delta;
    setSidebarHeightPx(clampSidebarHeight(next, rootH));
  }, []);

  const onResizePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    setIsResizing(false);
    persistSidebarHeight();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, [persistSidebarHeight]);

  const onResizeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isMobileLayout || !rootRef.current) return;
      const rootH = rootRef.current.getBoundingClientRect().height;
      const step = Math.max(24, Math.round(rootH * 0.06));

      const save = (n: number) => {
        try {
          localStorage.setItem(STORAGE_KEY, String(n));
        } catch {
          /* ignore */
        }
      };

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSidebarHeightPx((prev) => {
          const n = clampSidebarHeight(prev + step, rootH);
          save(n);
          return n;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSidebarHeightPx((prev) => {
          const n = clampSidebarHeight(prev - step, rootH);
          save(n);
          return n;
        });
      } else if (e.key === "End") {
        e.preventDefault();
        setSidebarHeightPx(() => {
          const max = Math.min(
            Math.floor(rootH * MAX_SIDEBAR_FRAC),
            rootH - MIN_MAP_PX - HANDLE_PX,
          );
          const n = clampSidebarHeight(max, rootH);
          save(n);
          return n;
        });
      } else if (e.key === "Home") {
        e.preventDefault();
        setSidebarHeightPx(() => {
          const n = clampSidebarHeight(MIN_SIDEBAR_PX, rootH);
          save(n);
          return n;
        });
      }
    },
    [isMobileLayout],
  );

  return (
    <div ref={rootRef} className={ui.root}>
      <div className={ui.mapPane}>
        <LiveMapWrapper
          visibleLineSlugs={visibleLineSlugs}
          onVisibleTrainsChange={setVisibleTrains}
          onLinesChange={handleLinesChange}
          focusLocation={focusLocation}
        />
      </div>

      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize map and alerts: drag vertically, or use arrow keys, Home for smallest panel, End for largest"
        aria-valuemin={MIN_SIDEBAR_PX}
        aria-valuemax={sidebarMaxPx}
        aria-valuenow={Math.round(sidebarHeightPx)}
        tabIndex={0}
        className={`${ui.resizeHandle}${isResizing ? ` ${ui.resizeHandleDragging}` : ""}`}
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
        onKeyDown={onResizeKeyDown}
      >
        <div className={ui.resizeHandleGripsRow} aria-hidden>
          <span className={ui.resizeHandleGrip} />
          <span className={ui.resizeHandleGrip} />
        </div>
        <span className={ui.resizeHandleLabel}>Drag to resize</span>
      </div>

      <div
        className={ui.sidebarShell}
        style={
          isMobileLayout
            ? {
                height: sidebarHeightPx,
                flex: "0 0 auto",
              }
            : undefined
        }
      >
        <AlertsSidebar
          lineOptions={lineOptions}
          visibleLineSlugs={visibleLineSlugs}
          onToggleLine={(slug) => {
            setVisibleLineSlugs((prev) => {
              const current = prev ?? lineOptions.map((l) => l.slug);
              return current.includes(slug)
                ? current.filter((s) => s !== slug)
                : [...current, slug];
            });
          }}
          onShowAllLines={() => setVisibleLineSlugs(null)}
          onHideAllLines={() => setVisibleLineSlugs([])}
          liveTrains={visibleTrains}
          onResolvedLocation={setFocusLocation}
        />
      </div>
    </div>
  );
}
