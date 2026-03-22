import { classNameForSize, sizes } from "./styles/LineBadge.styles";

interface LineBadgeProps {
  label: string;
  color: string;
  textColor?: string;
  size?: keyof typeof sizes;
}

export default function LineBadge({
  label,
  color,
  textColor = "#ffffff",
  size = "md",
}: LineBadgeProps) {
  return (
    <span
      className={classNameForSize(size)}
      style={{ background: color, color: textColor }}
      aria-label={`Line ${label}`}
    >
      {label}
    </span>
  );
}
