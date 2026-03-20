import LineRankings from "@/components/LineRankings";

export const metadata = {
  title: "Line Rankings — NYC Transit",
  description: "Ranked performance leaderboard for all NYC subway lines.",
};

export default function RankingsPage() {
  return (
    <div className="flex flex-1 aged-paper overflow-auto py-2">
      <LineRankings />
    </div>
  );
}
