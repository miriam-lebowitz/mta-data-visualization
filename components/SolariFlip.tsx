"use client";

import * as ui from "./styles/SolariFlip.styles";

interface SolariFlipProps {
  value: number;
  decimals?: number;
  className?: string;
}

function Digit({ char, animKey }: { char: string; animKey: string }) {
  return (
    <span
      key={animKey}
      className={`${ui.digitBase} ${ui.digitVariantClass(char)}`}
    >
      <span className={ui.digitInner}>{char}</span>
    </span>
  );
}

export default function SolariFlip({ value, decimals = 1, className = "" }: SolariFlipProps) {
  const displayStr = value.toFixed(decimals);
  const chars = displayStr.split("");
  const animKeyBase = `${displayStr}-${decimals}`;

  return (
    <span className={ui.rootWithClassName(className)} aria-label={displayStr}>
      {chars.map((char, i) => (
        <Digit key={i} char={char} animKey={`${animKeyBase}-${i}`} />
      ))}
    </span>
  );
}
