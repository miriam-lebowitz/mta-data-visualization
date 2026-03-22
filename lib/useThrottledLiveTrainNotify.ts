"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { LiveTrainLocation } from "@/lib/types";

const DEFAULT_INTERVAL_MS = 4000;

/**
 * Notifies parent of train positions at most every `intervalMs`, while still
 * pushing immediately when the visible train *count* changes (e.g. filters).
 */
export function useThrottledLiveTrainNotify(
  trains: LiveTrainLocation[],
  onNotify: ((t: LiveTrainLocation[]) => void) | undefined,
  intervalMs = DEFAULT_INTERVAL_MS,
) {
  const trainsRef = useRef(trains);
  useLayoutEffect(() => {
    trainsRef.current = trains;
  }, [trains]);

  const prevLenRef = useRef(-1);

  useEffect(() => {
    if (!onNotify) return;
    const len = trains.length;
    if (len !== prevLenRef.current) {
      prevLenRef.current = len;
      onNotify(trains);
    }
  }, [trains, trains.length, onNotify]);

  useEffect(() => {
    if (!onNotify) return;
    const id = window.setInterval(() => {
      onNotify(trainsRef.current);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [onNotify, intervalMs]);
}
