import { STATUTS } from "@/data/constants";
import type { Partner, Member, Project, Convention } from "@/data/types";
import { useTheme } from "@/hooks/use-theme";
import { config } from "@/lib/config";
import { resetImportFlag } from "@/services/gwani-import";

interface DashboardProps {
  partners: Partner[];
  members: Member[];
  projects: Project[];
  conventions: Convention[];
}

export function Dashboard({ partners, members, projects, conventions }: DashboardProps) {
  const { colors } = useTheme();

  const stats = [
    { label: "Partenaires signés", val: partners.filter((p) => p.statut === "signe").length, total: partners.length, color: colors.success },
    { label: "Membres disponibles", val: members.filter((m) => m.disponible).length, total: members.length, color: colors.accent },
    { label: "Projets en cours", val: projects.filter((p) => p.statut === "En cours").length, total: projects.length, color: colors.blue },
    { label: "Conventions signées", val: conventions.filter((c) => c.statut === "signe").length, total: conventions.length || 0, color: colors.warn },
  ];

  const pipeline = STATUTS.map((s) => ({
    ...s,
    count: partners.filter((p) => p.statut === s.key).length,
  }));

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: colors.text, fontSize: "1.5rem", fontWeight: 800 }}>Tableau de bord</h1>
        <p style={{ color: colors.muted, fontSize: "0.8rem", marginTop: "4px" }}>Vue d'ensemble &middot; {config.orgName}</p>
        <button
          onClick={() => { resetImportFlag(); window.location.reload(); }}
          style={{
            marginTop: 8,
            background: "transparent",
            border: `1px solid ${colors.border}`,
            color: colors.muted,
            padding: "4px 12px",
            borderRadius: 6,
            fontSize: "0.72rem",
            cursor: "pointer",
          }}
        >
          &#x21bb; Re-synchroniser Gwani
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <span style={{ color: colors.muted, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</span>
            </div>
            <div style={{ color: s.color, fontSize: "2rem", fontWeight: 800, lineHeight: 1 }}>{s.val}</div>
            <div style={{ color: colors.muted, fontSize: "0.7rem", marginTop: "4px" }}>sur {s.total} au total</div>
            <div style={{ background: colors.border, height: "2px", borderRadius: "999px", marginTop: "10px" }}>
              <div style={{ background: s.color, width: `${s.total ? Math.round((s.val / s.total) * 100) : 0}%`, height: "100%", borderRadius: "999px", transition: "width 1s ease" }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px 18px" }}>
          <div style={{ color: colors.muted, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Pipeline partenaires</div>
          {pipeline.map((s) => (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ color: s.color, fontSize: "0.7rem", width: "90px" }}>{s.label}</span>
              <div style={{ flex: 1, background: colors.border, height: "6px", borderRadius: "999px" }}>
                <div style={{ background: s.color, width: `${partners.length ? Math.round((s.count / partners.length) * 100) : 0}%`, height: "100%", borderRadius: "999px" }} />
              </div>
              <span style={{ color: colors.muted, fontSize: "0.72rem", width: "16px", textAlign: "right" }}>{s.count}</span>
            </div>
          ))}
        </div>

        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px 18px" }}>
          <div style={{ color: colors.muted, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Projets actifs</div>
          {projects.filter((p) => p.statut === "En cours").map((p) => (
            <div key={p.id} style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: "8px", marginBottom: "8px" }}>
              <div style={{ color: colors.text, fontSize: "0.82rem", fontWeight: 600 }}>{p.titre}</div>
              <div style={{ color: colors.muted, fontSize: "0.7rem" }}>{p.deadline || p.type}</div>
            </div>
          ))}
          {projects.filter((p) => p.statut === "En cours").length === 0 && (
            <p style={{ color: colors.muted, fontSize: "0.8rem", opacity: 0.6 }}>Aucun projet en cours</p>
          )}
        </div>
      </div>
    </div>
  );
}
