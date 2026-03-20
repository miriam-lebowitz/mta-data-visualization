import LineRankings from "@/components/LineRankings";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Line Rankings",
  description:
    "Ranked performance leaderboard for all NYC subway lines, scored by delays, incidents, and accessibility.",
  keywords: [
    "subway line rankings",
    "MTA performance",
    "NYC subway reliability",
    "line comparison",
    "subway delay score",
    "MTA accessibility",
    "subway incident report",
  ],
  openGraph: {
    title: "Line Rankings | NYC Transit",
    description:
      "Ranked performance leaderboard for all NYC subway lines, scored by delays, incidents, and accessibility.",
  },
  twitter: {
    title: "Line Rankings | NYC Transit",
    description:
      "Ranked performance leaderboard for all NYC subway lines, scored by delays, incidents, and accessibility.",
  },
};

export default function RankingsPage() {
  return (
    <div className="flex flex-1 min-h-0 aged-paper overflow-hidden">
      <LineRankings />
    </div>
  );
}
