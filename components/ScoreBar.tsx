interface ScoreBarProps {
  score: number; // 0–100
  width?: string;
}

function scoreColor(score: number): string {
  if (score >= 70) return "var(--signal-green)";
  if (score >= 40) return "var(--signal-yellow)";
  return "var(--signal-red)";
}

export default function ScoreBar({ score, width = "100%" }: ScoreBarProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const color = scoreColor(clampedScore);

  return (
    <div
      className="relative h-3 border-2 border-ink overflow-hidden"
      style={{ width, background: "#2a2a2a" }}
      role="meter"
      aria-valuenow={clampedScore}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Segmented tick marks */}
      {[25, 50, 75].map((tick) => (
        <span
          key={tick}
          className="absolute top-0 bottom-0 w-px"
          style={{ left: `${tick}%`, background: "rgba(255,255,255,0.15)" }}
        />
      ))}
      {/* Fill */}
      <span
        className="absolute inset-y-0 left-0 transition-all duration-700"
        style={{ width: `${clampedScore}%`, background: color }}
      />
    </div>
  );
}
