"use client";

import dynamic from "next/dynamic";
import type { GeoLocation, LiveTrainLocation } from "@/lib/types";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

export default function LiveMapWrapper({
  visibleLineSlugs,
  onVisibleTrainsChange,
  focusLocation,
}: {
  visibleLineSlugs?: string[] | null;
  onVisibleTrainsChange?: (trains: LiveTrainLocation[]) => void;
  focusLocation?: GeoLocation | null;
}) {
  return (
    <LiveMap
      visibleLineSlugs={visibleLineSlugs}
      onVisibleTrainsChange={onVisibleTrainsChange}
      focusLocation={focusLocation}
    />
  );
}

