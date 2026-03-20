"use client";

import dynamic from "next/dynamic";
import type { GeoLocation, LineOption, LiveTrainLocation } from "@/lib/types";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

export default function LiveMapWrapper({
  visibleLineSlugs,
  onVisibleTrainsChange,
  onLinesChange,
  focusLocation,
}: {
  visibleLineSlugs?: string[] | null;
  onVisibleTrainsChange?: (trains: LiveTrainLocation[]) => void;
  onLinesChange?: (lines: LineOption[]) => void;
  focusLocation?: GeoLocation | null;
}) {
  return (
    <LiveMap
      visibleLineSlugs={visibleLineSlugs}
      onVisibleTrainsChange={onVisibleTrainsChange}
      onLinesChange={onLinesChange}
      focusLocation={focusLocation}
    />
  );
}
