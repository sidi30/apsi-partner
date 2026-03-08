import { useState } from "react";
import { COMPETENCES, NIVEAUX, ROLES_MEMBRE } from "@/data/constants";
import type { Member } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select-field";
import { useTheme } from "@/hooks/use-theme";

interface MembersViewProps {
  members: Member[];
  setMembers: (members: Member[]) => void;
}

const emptyForm = (): Omit<Member, "id"> => ({
  nom: "", role: "Membre actif", email: "", competences: [], niveau: "Confirmé", bio: "", disponible: true,
});

export function MembersView({ members, setMembers }: MembersViewProps) {
  const { colors } = useTheme();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());

  const save = () => {
    if (!form.nom) return;
    if (editId) setMembers(members.map((m) => (m.id === editId ? { ...form, id: editId } : m)));
    else setMembers([...members, { ...form, id: Date.now() }]);
    setModal(false); setEditId(null);
  };

  const openEdit = (m: Member) => {
    setForm({ nom: m.nom, role: m.role, email: m.email, competences: m.competences || [], niveau: m.niveau, bio: m.bio || "", disponible: m.disponible });
    setEditId(m.id); setModal(true);
  };

  const toggleSkill = (s: string) => setForm((f) => ({ ...f, competences: f.competences.includes(s) ? f.competences.filter((x) => x !== s) : [...f.competences, s] }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h1 style={{ color: colors.text, fontSize: "1.5rem", fontWeight: 800 }}>Membres</h1>
          <p style={{ color: colors.muted, fontSize: "0.8rem", marginTop: "4px" }}>{members.length} membres &middot; {members.filter((m) => m.disponible).length} disponibles</p>
        </div>
        <Button onClick={() => { setModal(true); setEditId(null); setForm(emptyForm()); }}>+ Nouveau membre</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {members.map((m) => {
          const open = expanded === m.id;
          return (
            <div key={m.id} onClick={() => setExpanded(open ? null : m.id)}
              style={{ background: colors.card, border: `1px solid ${open ? colors.accent + "60" : colors.border}`, borderRadius: "12px", padding: "14px 16px", cursor: "pointer", transition: "border-color 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <div style={{ color: colors.text, fontWeight: 700, fontSize: "0.9rem" }}>{m.nom}</div>
                  <div style={{ color: colors.accent, fontSize: "0.72rem", marginTop: "1px" }}>{m.role}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
                  <Badge color={m.disponible ? colors.success : colors.muted}>{m.disponible ? "Disponible" : "Occupé"}</Badge>
                  <Badge color={colors.blue}>{m.niveau}</Badge>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {(m.competences || []).map((c) => (
                  <span key={c} style={{ background: colors.blue + "18", color: colors.blue, border: `1px solid ${colors.blue}28`, fontSize: "0.62rem", padding: "2px 6px", borderRadius: "999px" }}>{c}</span>
                ))}
              </div>
              {open && (
                <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: "10px", paddingTop: "10px" }}>
                  {m.bio && <p style={{ color: colors.muted, fontSize: "0.78rem", marginBottom: "8px", lineHeight: "1.5" }}>{m.bio}</p>}
                  {m.email && <div style={{ color: colors.muted, fontSize: "0.72rem", marginBottom: "10px" }}>{m.email}</div>}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <Button small variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(m); }}>Modifier</Button>
                    <Button small variant="danger" onClick={(e) => { e.stopPropagation(); setMembers(members.filter((x) => x.id !== m.id)); setExpanded(null); }}>Supprimer</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title={editId ? "Modifier le membre" : "Nouveau membre"} onClose={() => { setModal(false); setEditId(null); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field label="Nom complet" value={form.nom} onChange={(v) => setForm((f) => ({ ...f, nom: v }))} />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <SelectField label="Rôle" value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))} options={[...ROLES_MEMBRE]} />
              <SelectField label="Niveau" value={form.niveau} onChange={(v) => setForm((f) => ({ ...f, niveau: v }))} options={[...NIVEAUX]} />
            </div>
            <Field label="Bio" value={form.bio} onChange={(v) => setForm((f) => ({ ...f, bio: v }))} multiline rows={2} />
            <div>
              <label style={{ color: colors.muted, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, display: "block", marginBottom: "8px" }}>Compétences</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {COMPETENCES.map((c) => {
                  const on = form.competences.includes(c);
                  return (
                    <button key={c} onClick={() => toggleSkill(c)}
                      style={{ background: on ? colors.accent + "20" : colors.surface, color: on ? colors.accent : colors.muted, border: `1px solid ${on ? colors.accent + "55" : colors.border}`, borderRadius: "999px", padding: "3px 10px", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}>
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ color: colors.muted, fontSize: "0.78rem" }}>Disponible :</span>
              <button onClick={() => setForm((f) => ({ ...f, disponible: !f.disponible }))}
                style={{ background: form.disponible ? colors.success + "25" : colors.surface, color: form.disponible ? colors.success : colors.muted, border: `1px solid ${form.disponible ? colors.success + "55" : colors.border}`, borderRadius: "999px", padding: "3px 14px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" }}>
                {form.disponible ? "Oui" : "Non"}
              </button>
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
