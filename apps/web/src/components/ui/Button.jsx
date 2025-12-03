import { useMemo } from "react";
import { useTheme } from "../../hooks/useTheme";

export default function Button({
  as: As = "button",
  variant = "primary", // primary | secondary | ghost
  size = "md", // sm | md | lg
  className = "",
  disabled,
  children,
  ...props
}) {
  const theme = useTheme();

  const base =
    "inline-flex items-center justify-center rounded-lg font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition-colors";
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base",
  }[size];

  const style = useMemo(() => {
    if (variant === "secondary") {
      return `border ${theme.bg.border} ${theme.bg.overlay} ${theme.hover.bg}`;
    }
    if (variant === "ghost") {
      return `${theme.hover.bg}`;
    }
    // primary
    return `${theme.bg.accent} ${theme.bg.accentText} shadow-sm ${theme.brand.ring}`;
  }, [variant, theme]);

  const cls = `${base} ${sizes} ${style} ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`;

  return (
    <As className={cls} disabled={disabled} {...props}>
      {children}
    </As>
  );
}
