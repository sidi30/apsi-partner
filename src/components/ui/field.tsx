import { useTheme } from "@/hooks/use-theme";

interface FieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  rows?: number;
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline,
  rows = 4,
}: FieldProps) {
  const { colors } = useTheme();

  const inputStyle: React.CSSProperties = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    outline: "none",
    width: "100%",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "0.83rem",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label
          style={{
            color: colors.muted,
            fontSize: "0.68rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 600,
          }}
        >
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
        />
      )}
    </div>
  );
}
