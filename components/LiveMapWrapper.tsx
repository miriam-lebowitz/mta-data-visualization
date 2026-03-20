"use client";

import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

export default function LiveMapWrapper({
  visibleLineSlugs,
}: {
  visibleLineSlugs?: string[] | null;
}) {
  return <LiveMap visibleLineSlugs={visibleLineSlugs} />;
}

