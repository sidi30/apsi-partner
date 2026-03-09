import { useState } from "react";
import { TYPES_PROJET, STATUTS_PROJET } from "@/data/constants";
import type { Project, Member, Partner } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select-field";
import { callClaude } from "@/services/claude";
import { useTheme } from "@/hooks/use-theme";
import { config } from "@/lib/config";

/** Convert markdown-like AI output to styled HTML */
function formatAiResult(text: string, colors: Record<string, string>): string {
  return text
    // Numbered headings like "1. **Title** :" → styled section header
    .replace(/^(\d+)\.\s*\*\*([^*]+)\*\*\s*:?\s*/gm,
      `<div style="margin-top:12px;margin-bottom:4px;font-weight:700;color:${colors.accent};font-size:0.78rem">$1. $2</div>`)
    // Bold text **text**
    .replace(/\*\*([^*]+)\*\*/g,
      `<strong style="color:${colors.text};font-weight:600">$1</strong>`)
    // Bullet points "- " or "   - "
    .replace(/^(\s*)[-•]\s+/gm,
      `$1<span style="color:${colors.accent};margin-right:6px">&#x25B8;</span>`)
    // Line breaks
    .replace(/\n/g, "<br/>");
}

interface ProjectsViewProps {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  members: Member[];
  partners: Partner[];
}

const emptyForm = (): Omit<Project, "id"> => ({
  titre: "", type: TYPES_PROJET[0], description: "", statut: "Planifié", deadline: "", membres: [], partenaireId: undefined,
});

export function ProjectsView({ projects, setProjects, members, partners }: ProjectsViewProps) {
  const { colors } = useTheme();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [aiState, setAiState] = useState<Record<number, { loading: boolean; result: string }>>({});
  const [form, setForm] = useState(emptyForm());
  const [viewFilter, setViewFilter] = useState<"all" | "apsi" | "partner">("all");
  const [partnerFilter, setPartnerFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = projects.filter((p) => {
    if (viewFilter === "apsi") return !p.partenaireId;
    if (viewFilter === "partner") {
      if (!p.partenaireId) return false;
      if (partnerFilter !== "all") return p.partenaireId === partnerFilter;
      return true;
    }
    return true;
  }).filter((p) => {
    const q = search.toLowerCase();
    return !q || p.titre.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
  });

  const SCOL: Record<string, string> = {
    "Planifié": colors.warn,
    "En cours": colors.blue,
    "Terminé": colors.success,
    "Suspendu": colors.muted,
  };

  const save = () => {
    if (!form.titre) return;
    if (editId) setProjects(projects.map((p) => (p.id === editId ? { ...form, id: editId } : p)));
    else setProjects([...projects, { ...form, id: Date.now() }]);
    setModal(false); setEditId(null);
  };

  const openEdit = (p: Project) => {
    setForm({ titre: p.titre, type: p.type, description: p.description, statut: p.statut, deadline: p.deadline || "", membres: p.membres || [], partenaireId: p.partenaireId });
    setEditId(p.id); setModal(true);
  };

  const getSuggestions = async (proj: Project) => {
    setAiState((a) => ({ ...a, [proj.id]: { loading: true, result: "" } }));
    const activeMembers = members.filter((m) => m.role !== "Membre d'honneur");
    const honoraryMembers = members.filter((m) => m.role === "Membre d'honneur");
    const activeMemberList = activeMembers.map((m) =>
      `- ${m.nom} (${m.role}, ${m.niveau}, ${m.disponible ? "dispo" : "non dispo"}, compétences: ${(m.competences || []).join(", ") || "non renseignées"}${m.commission ? `, commission: ${m.commission}` : ""})`
    ).join("\n");
    const honoraryList = honoraryMembers.map((m) =>
      `- ${m.nom} (Membre d'honneur, ${m.niveau}, compétences: ${(m.competences || []).join(", ") || "non renseignées"})`
    ).join("\n");
    const result = await callClaude([{
      role: "user",
      content: `Projet ${config.orgName} :
Titre : ${proj.titre}
Type : ${proj.type}
Description : ${proj.description}
Deadline : ${proj.deadline || "Non définie"}

=== MEMBRES ACTIFS (à privilégier) ===
${activeMemberList}

=== MEMBRES D'HONNEUR (rôle consultatif uniquement) ===
${honoraryList}

CONSIGNES STRICTES :
- Choisis UNIQUEMENT parmi les noms ci-dessus.
- PRIVILÉGIE les membres actifs et fondateurs. Sélectionne ceux dont les compétences correspondent le mieux au type de projet et à sa description.
- Tu peux proposer AU MAXIMUM 1 seul membre d'honneur, uniquement en rôle de conseiller/mentor. Les membres d'honneur ne doivent PAS avoir de rôle opérationnel.
- Classe les membres suggérés par pertinence (compétences qui matchent le projet en premier).
- Privilégie les membres disponibles.

Réponds avec :
1. Équipe recommandée (nombre de membres nécessaires)
2. Pour chaque membre : son nom, pourquoi il est adapté (lien compétences/projet), et son rôle dans le projet
3. Un risque à anticiper

Sois précis et concis.`,
    }], { forceOpenAI: true });
    setAiState((a) => ({ ...a, [proj.id]: { loading: false, result } }));
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h1 style={{ color: colors.text, fontSize: "1.5rem", fontWeight: 800 }}>Projets</h1>
          <p style={{ color: colors.muted, fontSize: "0.8rem", marginTop: "4px" }}>{projects.length} projets &middot; {projects.filter((p) => p.statut === "En cours").length} en cours</p>
        </div>
        <Button onClick={() => { setModal(true); setEditId(null); setForm(emptyForm()); }}>+ Nouveau projet</Button>
      </div>

      {/* Filtres par type */}
      <div className="filter-bar" style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
          style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, outline: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "0.8rem", flex: "1 1 140px", fontFamily: "inherit" }} />
        {([
          { key: "all" as const, label: "Tous" },
          { key: "apsi" as const, label: `Projets internes ${config.orgName}` },
          { key: "partner" as const, label: "Par partenaire" },
        ]).map((f) => (
          <button key={f.key} onClick={() => { setViewFilter(f.key); setPartnerFilter("all"); }}
            style={{ background: viewFilter === f.key ? colors.accent + "20" : "transparent", color: viewFilter === f.key ? colors.accent : colors.muted, border: `1px solid ${viewFilter === f.key ? colors.accent + "50" : colors.border}`, borderRadius: "8px", padding: "5px 14px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
            {f.label}
          </button>
        ))}

        {viewFilter === "partner" && (
          <select value={partnerFilter} onChange={(e) => setPartnerFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, borderRadius: "8px", padding: "5px 10px", fontSize: "0.72rem", fontFamily: "inherit", cursor: "pointer", outline: "none" }}>
            <option value="all">Tous les partenaires</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.org} ({p.nom})</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filtered.map((proj) => {
          const projMembers = members.filter((m) => (proj.membres || []).includes(m.id));
          const ai = aiState[proj.id] || { loading: false, result: "" };
          const linkedPartner = proj.partenaireId ? partners.find((p) => p.id === proj.partenaireId) : null;
          return (
            <div key={proj.id} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px 18px" }}>
              <div className="card-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div style={{ flex: 1 }}>
                  <div className="badge-row" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" }}>
                    <span style={{ color: colors.text, fontWeight: 800, fontSize: "0.95rem" }}>{proj.titre}</span>
                    <Badge color={SCOL[proj.statut] || colors.muted}>{proj.statut}</Badge>
                    <Badge color={colors.muted}>{proj.type}</Badge>
                    {linkedPartner && <Badge color={colors.accent}>{linkedPartner.org}</Badge>}
                    {!linkedPartner && <Badge color={colors.blue}>{config.orgName} interne</Badge>}
                  </div>
                  <p style={{ color: colors.muted, fontSize: "0.8rem", lineHeight: "1.5", margin: "4px 0" }}>{proj.description}</p>
                </div>
                {proj.deadline && <span style={{ color: colors.muted, fontSize: "0.72rem", marginLeft: "12px" }}>{proj.deadline}</span>}
              </div>

              {projMembers.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
                  {projMembers.map((m) => (
                    <span key={m.id} style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontSize: "0.7rem", padding: "2px 10px", borderRadius: "999px" }}>{m.nom}</span>
                  ))}
                </div>
              )}

              <div className="card-actions" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <Button small variant="secondary" onClick={() => getSuggestions(proj)} loading={ai.loading}>Suggestions IA</Button>
                <Button small variant="ghost" onClick={() => openEdit(proj)}>Modifier</Button>
                <Button small variant="danger" onClick={() => setProjects(projects.filter((p) => p.id !== proj.id))}>Suppr.</Button>
              </div>

              {!ai.loading && ai.result && (
                <div style={{ background: colors.surface, border: `1px solid ${colors.accent}25`, borderRadius: "10px", padding: "16px 18px", marginTop: "12px", fontSize: "0.8rem", color: colors.text, lineHeight: "1.7" }}>
                  <div style={{ color: colors.accent, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px", fontWeight: 700 }}>Analyse IA</div>
                  <div dangerouslySetInnerHTML={{ __html: formatAiResult(ai.result, colors) }} />
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ background: colors.card, border: `1px dashed ${colors.border}`, borderRadius: "12px", padding: "40px", textAlign: "center" }}>
            <div style={{ color: colors.muted, fontWeight: 600 }}>Aucun projet dans cette catégorie</div>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={editId ? "Modifier le projet" : "Nouveau projet"} onClose={() => { setModal(false); setEditId(null); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field label="Titre" value={form.titre} onChange={(v) => setForm((f) => ({ ...f, titre: v }))} />
              <SelectField label="Type" value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v }))} options={[...TYPES_PROJET]} />
            </div>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <SelectField label="Statut" value={form.statut} onChange={(v) => setForm((f) => ({ ...f, statut: v }))} options={[...STATUTS_PROJET]} />
              <Field label="Deadline" type="date" value={form.deadline} onChange={(v) => setForm((f) => ({ ...f, deadline: v }))} />
            </div>

            {/* Lien partenaire */}
            <SelectField
              label="Partenaire associé"
              value={form.partenaireId ? String(form.partenaireId) : ""}
              onChange={(v) => setForm((f) => ({ ...f, partenaireId: v ? Number(v) : undefined }))}
              options={[
                { value: "", label: `-- Projet interne ${config.orgName} --` },
                ...partners.map((p) => ({ value: String(p.id), label: `${p.org} (${p.nom})` })),
              ]}
            />

            <Field label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} multiline rows={3} />
            <div>
              <label style={{ color: colors.muted, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, display: "block", marginBottom: "8px" }}>Membres assignés</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {members.map((m) => {
                  const on = form.membres.includes(m.id);
                  return (
                    <button key={m.id} onClick={() => setForm((f) => ({ ...f, membres: on ? f.membres.filter((x) => x !== m.id) : [...f.membres, m.id] }))}
                      style={{ background: on ? colors.accent + "20" : colors.surface, color: on ? colors.accent : colors.muted, border: `1px solid ${on ? colors.accent + "55" : colors.border}`, borderRadius: "999px", padding: "3px 10px", fontSize: "0.7rem", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                      {m.nom}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => { setModal(false); setEditId(null); }}>Annuler</Button>
              <Button onClick={save}>Enregistrer</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
