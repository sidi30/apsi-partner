import { useTheme } from "@/hooks/use-theme";

interface ModalProps {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}

export function Modal({ title, onClose, wide, children }: ModalProps) {
  const { colors } = useTheme();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="modal-body"
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: "16px",
          padding: "24px",
          maxWidth: wide ? "760px" : "560px",
          width: "92%",
          maxHeight: "88vh",
          overflowY: "auto",
          boxShadow: `0 0 60px ${colors.accent}08`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              color: colors.accent,
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: "0.04em",
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              color: colors.muted,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.2rem",
              lineHeight: 1,
              padding: "8px",
              minWidth: "36px",
              minHeight: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            &#x2715;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
