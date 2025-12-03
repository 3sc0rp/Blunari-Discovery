import { useMemo } from "react";
import { useTheme } from "../../hooks/useTheme";

export default function Badge({
  children,
  tone = "neutral",
  className = "",
  ...props
}) {
  const theme = useTheme();
  const style = useMemo(() => {
    if (tone === "success")
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
    if (tone === "warning")
      return "text-amber-300 bg-amber-300/10 border-amber-300/30";
    if (tone === "danger")
      return "text-rose-300 bg-rose-300/10 border-rose-300/30";
    return `${theme.text.muted} bg-white/5 border-white/10`;
  }, [tone, theme]);

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${style} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
