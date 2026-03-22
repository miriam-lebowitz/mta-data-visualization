"use client";

import type { CSSProperties } from "react";
import * as ui from "./styles/RetroToggle.styles";

interface RetroToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  accentColor?: string;
}

export default function RetroToggle({
  id,
  label,
  checked,
  onChange,
  accentColor = "#2d6a4f",
}: RetroToggleProps) {
  return (
    <label
      htmlFor={id}
      className={ui.label}
      style={{ "--toggle-accent": accentColor } as CSSProperties}
    >
      <span className={ui.labelText}>
        {label}
      </span>

      {/* Hidden native checkbox */}
      <input
        id={id}
        type="checkbox"
        className={ui.inputHidden}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />

      {/* Toggle track */}
      <div
        className={ui.track}
        data-state={checked ? "on" : "off"}
        aria-hidden="true"
      >
        {/* Active indicator LED */}
        <span
          className={ui.led}
          data-on={checked ? "true" : "false"}
        />
        {/* Knob */}
        <span className={ui.knobClassName(checked)} />
      </div>

      <span
        className={ui.stateLabel}
        data-on={checked ? "true" : "false"}
      >
        {checked ? "ON" : "OFF"}
      </span>
    </label>
  );
}
