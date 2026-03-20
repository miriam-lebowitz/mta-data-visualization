"use client";

import dynamic from "next/dynamic";

const TransitDashboard = dynamic(
  () => import("@/components/TransitDashboard"),
  { ssr: false }
);

export default function TransitDashboardLoader() {
  return <TransitDashboard />;
}
