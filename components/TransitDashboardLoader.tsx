"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import * as ui from "./styles/TransitDashboard.styles";

const TransitDashboard = dynamic(() => import("@/components/TransitDashboard"), {
  ssr: false,
});

/**
 * `dynamic(..., { ssr: false })` alone can still produce a server HTML vs client
 * hydration mismatch. We render an identical skeleton until `useEffect` runs so
 * the first client paint matches the server, then mount the real dashboard.
 */
function TransitDashboardSkeleton() {
  return (
    <div className={ui.root}>
      <div className={ui.mapPane} aria-busy="true">
        <div className={ui.skeletonMapLoadingOverlay}>
          <p className={ui.skeletonMapLoadingText}>Loading map…</p>
        </div>
      </div>
      <div className={ui.resizeHandle} aria-hidden>
        <span className={ui.resizeHandleGrip} />
      </div>
      <div className={ui.sidebarShellSkeleton} aria-hidden />
    </div>
  );
}

export default function TransitDashboardLoader() {
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  if (!clientReady) {
    return <TransitDashboardSkeleton />;
  }

  return <TransitDashboard />;
}
