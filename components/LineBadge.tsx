interface LineBadgeProps {
  label: string;
  color: string;
  textColor?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "w-7 h-7 text-xs border-2",
  md: "w-9 h-9 text-sm border-[3px]",
  lg: "w-12 h-12 text-base border-4",
};

export default function LineBadge({
  label,
  color,
  textColor = "#ffffff",
  size = "md",
}: LineBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-black leading-none shrink-0 border-ink ${SIZE_CLASSES[size]}`}
      style={{ background: color, color: textColor }}
      aria-label={`Line ${label}`}
    >
      {label}
    </span>
  );
}
