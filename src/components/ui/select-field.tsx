import { useTheme } from "@/hooks/use-theme";

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | Option)[];
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: SelectFieldProps) {
  const { colors } = useTheme();

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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          color: colors.text,
          outline: "none",
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "0.83rem",
          fontFamily: "inherit",
          width: "100%",
          cursor: "pointer",
        }}
      >
        {options.map((o) => {
          const val = typeof o === "string" ? o : o.value;
          const lab = typeof o === "string" ? o : o.label;
          return (
            <option key={val} value={val}>
              {lab}
            </option>
          );
        })}
      </select>
    </div>
  );
}
