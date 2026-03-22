import * as ui from "./styles/ScoreBar.styles";

interface ScoreBarProps {
  score: number; // 0–100
  width?: string;
}

export default function ScoreBar({ score, width = "100%" }: ScoreBarProps) {
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <div
      className={`${ui.trackBase} ${width === "100%" ? ui.trackFullWidth : ""}`}
      style={width === "100%" ? undefined : { width }}
      role="meter"
      aria-valuenow={clampedScore}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Segmented tick marks */}
      <span className={`${ui.tick} ${ui.tick25}`} aria-hidden />
      <span className={`${ui.tick} ${ui.tick50}`} aria-hidden />
      <span className={`${ui.tick} ${ui.tick75}`} aria-hidden />
      {/* Fill */}
      <span
        className={`${ui.fillBase} ${ui.fillToneClass(clampedScore)}`}
        style={{ width: `${clampedScore}%` }}
      />
    </div>
  );
}
