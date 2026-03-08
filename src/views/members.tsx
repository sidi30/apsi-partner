import { useState, useRef } from "react";
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
  allMembers: Member[];
}

const emptyForm = (): Omit<Member, "id"> => ({
  nom: "", role: "Membre actif", email: "", competences: [], niveau: "Confirmé", bio: "", disponible: true,
  photo: "", trigramme: "", linkedin: "", cv: "",
});

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Initials({ nom, size = 40, colors }: { nom: string; size?: number; colors: Record<string, string> }) {
  const initials = nom.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: colors.accent + "20", color: colors.accent,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export function MembersView({ members, setMembers, allMembers }: MembersViewProps) {
  const { colors } = useTheme();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const photoRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [availFilter, setAvailFilter] = useState<"all" | "dispo" | "occupe">("all");

  const filteredMembers = members.filter((m) => {
    if (availFilter === "dispo" && !m.disponible) return false;
    if (availFilter === "occupe" && m.disponible) return false;
    const q = search.toLowerCase();
    return !q || m.nom.toLowerCase().includes(q) || (m.competences || []).some(c => c.toLowerCase().includes(q)) || (m.commission || "").toLowerCase().includes(q);
  });

  const save = () => {
    if (!form.nom) return;
    if (editId) setMembers(allMembers.map((m) => (m.id === editId ? { ...form, id: editId } : m)));
    else setMembers([...allMembers, { ...form, id: Date.now() }]);
    setModal(false); setEditId(null);
  };

  const openEdit = (m: Member) => {
    setForm({
      nom: m.nom, role: m.role, email: m.email, competences: m.competences || [],
      niveau: m.niveau, bio: m.bio || "", disponible: m.disponible,
      commission: m.commission, photo: m.photo || "", trigramme: m.trigramme || "",
      linkedin: m.linkedin || "", cv: m.cv || "",
    });
    setEditId(m.id); setModal(true);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await toBase64(file);
    setForm((f) => ({ ...f, photo: b64 }));
  };

  const handleCv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await toBase64(file);
    setForm((f) => ({ ...f, cv: b64 }));
  };

  const toggleSkill = (s: string) => setForm((f) => ({ ...f, competences: f.competences.includes(s) ? f.competences.filter((x) => x !== s) : [...f.competences, s] }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h1 style={{ color: colors.text, fontSize: "1.5rem", fontWeight: 800 }}>Membres</h1>
          <p style={{ color: colors.muted, fontSize: "0.8rem", marginTop: "4px" }}>
            {search || availFilter !== "all" ? `${filteredMembers.length} / ` : ""}{members.length} membres &middot; {members.filter((m) => m.disponible).length} disponibles
          </p>
        </div>
        <Button onClick={() => { setModal(true); setEditId(null); setForm(emptyForm()); }}>+ Nouveau membre</Button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher nom, compétence..."
          style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, outline: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "0.8rem", flex: "1 1 140px", fontFamily: "inherit" }} />
        {[
          { key: "all" as const, label: "Tous", color: colors.muted },
          { key: "dispo" as const, label: "Disponibles", color: colors.success },
          { key: "occupe" as const, label: "Occupés", color: colors.warn },
        ].map((s) => (
          <button key={s.key} onClick={() => setAvailFilter(s.key)}
            style={{ background: availFilter === s.key ? s.color + "20" : "transparent", color: availFilter === s.key ? s.color : colors.muted, border: `1px solid ${availFilter === s.key ? s.color + "50" : colors.border}`, borderRadius: "8px", padding: "5px 12px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {filteredMembers.map((m) => {
          const open = expanded === m.id;
          return (
            <div key={m.id} onClick={() => setExpanded(open ? null : m.id)}
              style={{ background: colors.card, border: `1px solid ${open ? colors.accent + "60" : colors.border}`, borderRadius: "12px", padding: "14px 16px", cursor: "pointer", transition: "border-color 0.2s" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "8px" }}>
                {m.photo ? (
                  <img src={m.photo} alt={m.nom} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <Initials nom={m.nom} colors={colors} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: colors.text, fontWeight: 700, fontSize: "0.9rem" }}>{m.nom}</span>
                    {m.trigramme && <span style={{ color: colors.muted, fontSize: "0.62rem", fontWeight: 600 }}>({m.trigramme})</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px", flexWrap: "wrap" }}>
                    <span style={{ color: colors.accent, fontSize: "0.72rem" }}>{m.role}</span>
                    {m.commission && (
                      <span style={{ background: colors.warn + "20", color: colors.warn, border: `1px solid ${colors.warn}35`, fontSize: "0.6rem", padding: "1px 7px", borderRadius: "999px", fontWeight: 600 }}>{m.commission}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end", flexShrink: 0 }}>
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
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px", fontSize: "0.72rem" }}>
                    {m.email && <span style={{ color: colors.muted }}>{m.email}</span>}
                    {m.linkedin && (
                      <a href={m.linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        style={{ color: colors.blue, textDecoration: "none" }}>
                        LinkedIn
                      </a>
                    )}
                    {m.cv && (
                      <a href={m.cv} download={`CV_${m.nom}.pdf`} onClick={(e) => e.stopPropagation()}
                        style={{ color: colors.accent, textDecoration: "none" }}>
                        CV
                      </a>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <Button small variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(m); }}>Modifier</Button>
                    <Button small variant="danger" onClick={(e) => { e.stopPropagation(); setMembers(allMembers.filter((x) => x.id !== m.id)); setExpanded(null); }}>Supprimer</Button>
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
            {/* Photo */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {form.photo ? (
                <img src={form.photo} alt="Photo" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: colors.surface, border: `2px dashed ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted, fontSize: "0.7rem" }}>Photo</div>
              )}
              <div>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
                <Button small variant="secondary" onClick={() => photoRef.current?.click()}>Importer photo</Button>
                {form.photo && <button onClick={() => setForm((f) => ({ ...f, photo: "" }))} style={{ background: "none", border: "none", color: colors.muted, fontSize: "0.68rem", cursor: "pointer", marginLeft: 8 }}>Retirer</button>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field label="Nom complet" value={form.nom} onChange={(v) => setForm((f) => ({ ...f, nom: v }))} />
              <Field label="Trigramme" value={form.trigramme || ""} onChange={(v) => setForm((f) => ({ ...f, trigramme: v.toUpperCase() }))} placeholder="ex: RSI" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
              <Field label="LinkedIn" value={form.linkedin || ""} onChange={(v) => setForm((f) => ({ ...f, linkedin: v }))} placeholder="https://linkedin.com/in/..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <SelectField label="Rôle" value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))} options={[...ROLES_MEMBRE]} />
              <SelectField label="Niveau" value={form.niveau} onChange={(v) => setForm((f) => ({ ...f, niveau: v }))} options={[...NIVEAUX]} />
            </div>
            <Field label="Bio" value={form.bio} onChange={(v) => setForm((f) => ({ ...f, bio: v }))} multiline rows={2} />

            {/* CV upload */}
            <div>
              <label style={{ color: colors.muted, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, display: "block", marginBottom: "6px" }}>CV / Pièce jointe</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input ref={cvRef} type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={handleCv} />
                <Button small variant="secondary" onClick={() => cvRef.current?.click()}>{form.cv ? "Remplacer CV" : "Importer CV"}</Button>
                {form.cv && <span style={{ color: colors.success, fontSize: "0.7rem" }}>CV ajouté</span>}
                {form.cv && <button onClick={() => setForm((f) => ({ ...f, cv: "" }))} style={{ background: "none", border: "none", color: colors.muted, fontSize: "0.68rem", cursor: "pointer" }}>Retirer</button>}
              </div>
            </div>

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
