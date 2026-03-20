"use client";

import { useCallback, useEffect, useState } from "react";
import AlertsSidebar from "@/components/AlertsSidebar";
import LiveMapWrapper from "@/components/LiveMapWrapper";
import type { GeoLocation, LineOption, LiveTrainLocation } from "@/lib/types";

export default function TransitDashboard() {
  const [lineOptions, setLineOptions] = useState<LineOption[]>([]);
  const [visibleLineSlugs, setVisibleLineSlugs] = useState<string[] | null>(null);
  const [visibleTrains, setVisibleTrains] = useState<LiveTrainLocation[]>([]);
  const [focusLocation, setFocusLocation] = useState<GeoLocation | null>(null);

  const fetchLines = useCallback(async () => {
    try {
      const res = await fetch("/api/lines");
      const json = await res.json();
      if (!json?.ok || !json?.data?.lines) return;

      const lines = json.data.lines as LineOption[];
      setLineOptions(lines);
      setVisibleLineSlugs((prev) => {
        if (prev === null) return null;
        const available = new Set(lines.map((l) => l.slug));
        const pruned = prev.filter((slug) => available.has(slug));
        return pruned;
      });
    } catch {
      // Keep current filter state if lines endpoint fails.
    }
  }, []);

  useEffect(() => {
    const bootstrapId = window.setTimeout(() => void fetchLines(), 0);
    const intervalId = window.setInterval(() => void fetchLines(), 300_000);
    return () => {
      window.clearTimeout(bootstrapId);
      window.clearInterval(intervalId);
    };
  }, [fetchLines]);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
        <LiveMapWrapper
          visibleLineSlugs={visibleLineSlugs}
          onVisibleTrainsChange={setVisibleTrains}
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
        onShowAllLines={() => {
          setVisibleLineSlugs(null);
        }}
        onHideAllLines={() => {
          setVisibleLineSlugs([]);
        }}
        liveTrains={visibleTrains}
        onResolvedLocation={setFocusLocation}
      />
    </div>
  );
}
