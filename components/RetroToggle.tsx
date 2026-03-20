"use client";

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
      className="flex flex-col items-center gap-2 cursor-pointer select-none group"
    >
      <span className="text-[10px] font-black tracking-[0.15em] uppercase text-ink/70 group-hover:text-ink transition-colors">
        {label}
      </span>

      {/* Hidden native checkbox */}
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />

      {/* Toggle track */}
      <div
        className="retro-toggle-track"
        style={checked ? { boxShadow: `inset 0 2px 4px rgba(0,0,0,0.5), 0 0 0 2px ${accentColor}` } : undefined}
        aria-hidden="true"
      >
        {/* Active indicator LED */}
        <span
          className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full transition-colors"
          style={{ background: checked ? accentColor : "#444" }}
        />
        {/* Knob */}
        <span
          className="retro-toggle-knob"
          style={{
            transform: checked ? "translateX(calc(100% + 4px))" : "translateX(0)",
          }}
        />
      </div>

      <span
        className="text-[9px] font-bold tracking-widest uppercase transition-colors"
        style={{ color: checked ? accentColor : "#888" }}
      >
        {checked ? "ON" : "OFF"}
      </span>
    </label>
  );
}
