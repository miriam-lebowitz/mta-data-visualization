import LineRankings from "@/components/LineRankings";

export const metadata = {
  title: "Line Rankings — NYC Transit",
  description: "Ranked performance leaderboard for all NYC subway lines.",
};

export default function RankingsPage() {
  return (
    <div className="flex flex-1 min-h-0 aged-paper overflow-hidden">
      <LineRankings />
    </div>
  );
}
