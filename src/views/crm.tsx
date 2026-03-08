import { useState } from "react";
import { STATUTS, SECTEURS, EMAIL_TYPES } from "@/data/constants";
import type { Partner } from "@/data/types";
import type { StatutKey } from "@/data/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select-field";
import { callClaude } from "@/services/claude";
import { useTheme } from "@/hooks/use-theme";
import { config } from "@/lib/config";

interface CRMViewProps {
  partners: Partner[];
  setPartners: (partners: Partner[]) => void;
}

const emptyForm = (): Omit<Partner, "id" | "date"> => ({
  nom: "", org: "", email: "", tel: "", secteur: SECTEURS[0], statut: "prospect", notes: "",
});

export function CRMView({ partners, setPartners }: CRMViewProps) {
  const { colors } = useTheme();
  const [modal, setModal] = useState<null | "form" | "email">(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [emailTarget, setEmailTarget] = useState<Partner | null>(null);
  const [filter, setFilter] = useState<"all" | StatutKey>("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [ai, setAi] = useState({ type: "prospection", loading: false, result: "" });

  const filtered = partners.filter((p) => {
    if (filter !== "all" && p.statut !== filter) return false;
    const q = search.toLowerCase();
    return !q || p.nom.toLowerCase().includes(q) || p.org.toLowerCase().includes(q);
  });

  const save = () => {
    if (!form.nom || !form.org) return;
    if (editId) {
      setPartners(partners.map((p) => (p.id === editId ? { ...form, id: editId, date: p.date } : p)));
    } else {
      setPartners([...partners, { ...form, id: Date.now(), date: new Date().toISOString().slice(0, 10) }]);
    }
    setModal(null); setEditId(null); setForm(emptyForm());
  };

  const openEdit = (p: Partner) => {
    setForm({ nom: p.nom, org: p.org, email: p.email, tel: p.tel, secteur: p.secteur, statut: p.statut, notes: p.notes });
    setEditId(p.id); setModal("form");
  };

  const openEmail = (p: Partner) => {
    setEmailTarget(p); setAi({ type: "prospection", loading: false, result: "" }); setModal("email");
  };

  const genEmail = async () => {
    if (!emailTarget) return;
    setAi((a) => ({ ...a, loading: true, result: "" }));
    const label = EMAIL_TYPES.find((t) => t.key === ai.type)?.label;
    const result = await callClaude([{
      role: "user",
      content: `Rédige un email professionnel de type "${label}" pour ce contact de l'${config.orgName} :\n- Nom : ${emailTarget.nom}\n- Organisation : ${emailTarget.org}\n- Secteur : ${emailTarget.secteur}\n- Notes : ${emailTarget.notes || "Aucune"}\n\nL'email est envoyé au nom de l'${config.orgName}. Commence par une ligne [OBJET: ...]. Sois percutant et chaleureux.`,
    }]);
    setAi((a) => ({ ...a, loading: false, result }));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h1 style={{ color: colors.text, fontSize: "1.5rem", fontWeight: 800 }}>Partenaires</h1>
          <p style={{ color: colors.muted, fontSize: "0.8rem", marginTop: "4px" }}>{partners.length} partenaires &middot; {partners.filter((p) => p.statut === "signe").length} signés</p>
        </div>
        <Button onClick={() => { setModal("form"); setEditId(null); setForm(emptyForm()); }}>+ Nouveau</Button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
          style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, outline: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "0.8rem", flex: "1 1 140px", fontFamily: "inherit" }} />
        {[{ key: "all" as const, label: "Tous", color: colors.muted }, ...STATUTS].map((s) => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            style={{ background: filter === s.key ? s.color + "20" : "transparent", color: filter === s.key ? s.color : colors.muted, border: `1px solid ${filter === s.key ? s.color + "50" : colors.border}`, borderRadius: "8px", padding: "5px 12px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.map((p) => {
          const st = STATUTS.find((s) => s.key === p.statut);
          return (
            <div key={p.id} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                  <span style={{ color: colors.text, fontWeight: 700, fontSize: "0.88rem" }}>{p.nom}</span>
                  {st && <Badge color={st.color}>{st.label}</Badge>}
                </div>
                <div style={{ color: colors.accent, fontSize: "0.78rem", fontWeight: 600 }}>{p.org}</div>
                <div style={{ color: colors.muted, fontSize: "0.72rem", marginTop: "2px" }}>{p.secteur}{p.email ? ` · ${p.email}` : ""}</div>
                {p.notes && <div style={{ color: colors.muted, fontSize: "0.7rem", marginTop: "4px", opacity: 0.8 }}>{p.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <Button small variant="secondary" onClick={() => openEmail(p)}>Email IA</Button>
                <Button small variant="ghost" onClick={() => openEdit(p)}>Modifier</Button>
                <Button small variant="danger" onClick={() => setPartners(partners.filter((x) => x.id !== p.id))}>Suppr.</Button>
              </div>
            </div>
          );
        })}
      </div>

      {modal === "form" && (
        <Modal title={editId ? "Modifier le partenaire" : "Nouveau partenaire"} onClose={() => { setModal(null); setEditId(null); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field label="Nom complet" value={form.nom} onChange={(v) => setForm((f) => ({ ...f, nom: v }))} />
              <Field label="Organisation" value={form.org} onChange={(v) => setForm((f) => ({ ...f, org: v }))} />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
              <Field label="Téléphone" value={form.tel} onChange={(v) => setForm((f) => ({ ...f, tel: v }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <SelectField label="Secteur" value={form.secteur} onChange={(v) => setForm((f) => ({ ...f, secteur: v }))} options={[...SECTEURS]} />
              <SelectField label="Statut" value={form.statut} onChange={(v) => setForm((f) => ({ ...f, statut: v as StatutKey }))} options={STATUTS.map((s) => ({ value: s.key, label: s.label }))} />
            </div>
            <Field label="Notes" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} multiline rows={2} />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
              <Button variant="ghost" onClick={() => { setModal(null); setEditId(null); }}>Annuler</Button>
              <Button onClick={save}>Enregistrer</Button>
            </div>
          </div>
        </Modal>
      )}

      {modal === "email" && emailTarget && (
        <Modal title={`Email IA — ${emailTarget.nom}`} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <SelectField label="Type d'email" value={ai.type} onChange={(v) => setAi((a) => ({ ...a, type: v, result: "" }))} options={EMAIL_TYPES.map((t) => ({ value: t.key, label: t.label }))} />
            <Button onClick={genEmail} loading={ai.loading}>Générer avec Claude</Button>
            {ai.result && (
              <>
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "14px", whiteSpace: "pre-wrap", fontSize: "0.8rem", color: colors.text, maxHeight: "280px", overflowY: "auto", lineHeight: "1.6" }}>
                  {ai.result}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button small variant="secondary" onClick={() => navigator.clipboard?.writeText(ai.result)}>Copier</Button>
                  <Button small variant="ghost" onClick={() => window.open(`mailto:${emailTarget.email}?body=${encodeURIComponent(ai.result)}`)}>Ouvrir Mail</Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
