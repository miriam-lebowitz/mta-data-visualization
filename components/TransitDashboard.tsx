"use client";

import { useCallback, useState } from "react";
import AlertsSidebar from "@/components/AlertsSidebar";
import LiveMapWrapper from "@/components/LiveMapWrapper";
import type { GeoLocation, LineOption, LiveTrainLocation } from "@/lib/types";

export default function TransitDashboard() {
  const [lineOptions, setLineOptions] = useState<LineOption[]>([]);
  const [visibleLineSlugs, setVisibleLineSlugs] = useState<string[] | null>(null);
  const [visibleTrains, setVisibleTrains] = useState<LiveTrainLocation[]>([]);
  const [focusLocation, setFocusLocation] = useState<GeoLocation | null>(null);

  // Receive line metadata emitted by LiveMap after each refresh — no separate fetch needed.
  const handleLinesChange = useCallback((lines: LineOption[]) => {
    setLineOptions(lines);
    setVisibleLineSlugs((prev) => {
      if (prev === null) return null;
      const available = new Set(lines.map((l) => l.slug));
      return prev.filter((slug) => available.has(slug));
    });
  }, []);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
        <LiveMapWrapper
          visibleLineSlugs={visibleLineSlugs}
          onVisibleTrainsChange={setVisibleTrains}
          onLinesChange={handleLinesChange}
          focusLocation={focusLocation}
        />
      </div>
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
  );
}
