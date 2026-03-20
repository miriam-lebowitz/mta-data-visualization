import type { Metadata } from "next";
import TransitDashboardLoader from "@/components/TransitDashboardLoader";

export const metadata: Metadata = {
  title: "Live Map",
  description:
    "Live NYC subway map showing real-time train positions, service alerts, and station arrival times across all MTA lines.",
  keywords: [
    "NYC subway live map",
    "MTA live train tracker",
    "real-time subway map",
    "NYC subway arrivals",
    "MTA service alerts",
    "train positions",
    "subway status",
  ],
  openGraph: {
    title: "Live Map | NYC Transit",
    description:
      "Live NYC subway map showing real-time train positions, service alerts, and station arrival times across all MTA lines.",
  },
  twitter: {
    title: "Live Map | NYC Transit",
    description:
      "Live NYC subway map showing real-time train positions, service alerts, and station arrival times across all MTA lines.",
  },
};

export default function Home() {
  return <TransitDashboardLoader />;
}
