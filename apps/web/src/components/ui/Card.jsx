import { useTheme } from "../../hooks/useTheme";

export default function Card({
  as: As = "div",
  className = "",
  children,
  ...props
}) {
  const theme = useTheme();
  const cls = `rounded-xl border ${theme.bg.border} ${theme.bg.overlay} ring-1 ring-white/5 ${className}`;
  return (
    <As className={cls} {...props}>
      {children}
    </As>
  );
}
