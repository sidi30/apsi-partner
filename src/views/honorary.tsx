import { useState } from "react";
import type { Member } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { useTheme } from "@/hooks/use-theme";

interface HonoraryViewProps {
  members: Member[];
  setMembers: (members: Member[]) => void;
  allMembers: Member[];
}

function Initials({ nom, size = 48, colors }: { nom: string; size?: number; colors: Record<string, string> }) {
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

export function HonoraryView({ members, setMembers, allMembers }: HonoraryViewProps) {
  const { colors } = useTheme();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nom: "", bio: "", email: "" });

  const save = () => {
    if (!form.nom) return;
    setMembers([...allMembers, {
      id: Date.now(),
      nom: form.nom,
      role: "Membre d'honneur",
      email: form.email,
      competences: [],
      niveau: "Expert",
      bio: form.bio,
      disponible: true,
    }]);
    setModal(false);
    setForm({ nom: "", bio: "", email: "" });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h1 style={{ color: colors.text, fontSize: "1.5rem", fontWeight: 800 }}>Membres d'honneur</h1>
          <p style={{ color: colors.muted, fontSize: "0.8rem", marginTop: "4px" }}>
            {members.length} membre{members.length > 1 ? "s" : ""} d'honneur
          </p>
        </div>
        <Button onClick={() => { setModal(true); setForm({ nom: "", bio: "", email: "" }); }}>+ Ajouter</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {members.map((m) => (
          <div key={m.id} style={{
            background: colors.card, border: `1px solid ${colors.border}`, borderRadius: "12px",
            padding: "16px", display: "flex", gap: "14px", alignItems: "flex-start",
          }}>
            {m.photo ? (
              <img src={m.photo} alt={m.nom} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <Initials nom={m.nom} colors={colors} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ color: colors.text, fontWeight: 700, fontSize: "0.92rem" }}>{m.nom}</span>
                <Badge color={colors.accent}>Honneur</Badge>
              </div>
              {m.bio && <p style={{ color: colors.muted, fontSize: "0.76rem", lineHeight: "1.5", margin: 0 }}>{m.bio}</p>}
              {(m.competences || []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                  {m.competences.map((c) => (
                    <span key={c} style={{ background: colors.blue + "18", color: colors.blue, border: `1px solid ${colors.blue}28`, fontSize: "0.62rem", padding: "2px 6px", borderRadius: "999px" }}>{c}</span>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                <Button small variant="danger" onClick={() => { setMembers(allMembers.filter((x) => x.id !== m.id)); }}>Retirer</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: colors.muted, fontSize: "0.85rem" }}>
          Aucun membre d'honneur pour le moment.
        </div>
      )}

      {modal && (
        <Modal title="Nouveau membre d'honneur" onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Field label="Nom complet" value={form.nom} onChange={(v) => setForm((f) => ({ ...f, nom: v }))} />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
            <Field label="Bio / Fonction" value={form.bio} onChange={(v) => setForm((f) => ({ ...f, bio: v }))} multiline rows={3} />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setModal(false)}>Annuler</Button>
              <Button onClick={save}>Enregistrer</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
