"use client";

interface SolariFlipProps {
  value: number;
  decimals?: number;
  className?: string;
}

function Digit({ char, animKey }: { char: string; animKey: string }) {
  return (
    <span
      key={animKey}
      className="solari-digit inline-block relative"
      style={{ minWidth: char === "." ? "0.4ch" : "0.85ch" }}
    >
      <span className="solari-digit-inner block">{char}</span>
    </span>
  );
}

export default function SolariFlip({ value, decimals = 1, className = "" }: SolariFlipProps) {
  const displayStr = value.toFixed(decimals);
  const chars = displayStr.split("");
  const animKeyBase = `${displayStr}-${decimals}`;

  return (
    <span className={`font-mono tabular-nums ${className}`} aria-label={displayStr}>
      {chars.map((char, i) => (
        <Digit key={i} char={char} animKey={`${animKeyBase}-${i}`} />
      ))}
    </span>
  );
}
