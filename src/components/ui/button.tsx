import { useTheme } from "@/hooks/use-theme";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  small?: boolean;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  small,
  loading,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();

  const variants: Record<Variant, React.CSSProperties> = {
    primary: { background: colors.accent, color: "#051210" },
    secondary: {
      background: colors.accent + "15",
      color: colors.accent,
      border: `1px solid ${colors.accent}40`,
    },
    danger: {
      background: colors.danger + "15",
      color: colors.danger,
      border: `1px solid ${colors.danger}40`,
    },
    ghost: {
      background: "transparent",
      color: colors.muted,
      border: `1px solid ${colors.border}`,
    },
  };

  return (
    <button
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        borderRadius: "8px",
        padding: small ? "6px 12px" : "8px 16px",
        fontSize: small ? "0.72rem" : "0.82rem",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.45 : 1,
        transition: "all 0.15s",
        border: "none",
        outline: "none",
        fontFamily: "inherit",
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {loading && (
        <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>
          &#x27F3;
        </span>
      )}
      {children}
    </button>
  );
}
