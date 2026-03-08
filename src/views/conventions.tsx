import { useState } from "react";
import { DUREES_CONVENTION } from "@/data/constants";
import type { Convention } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select-field";
import { SignatureCanvas } from "@/components/signature-canvas";
import { callClaude } from "@/services/claude";
import { useTheme } from "@/hooks/use-theme";
import { config } from "@/lib/config";

interface ConventionsViewProps {
  conventions: Convention[];
  setConventions: (conventions: Convention[]) => void;
}

export function ConventionsView({ conventions, setConventions }: ConventionsViewProps) {
  const { colors } = useTheme();
  const [modal, setModal] = useState<null | "create" | "preview" | "sign">(null);
  const [target, setTarget] = useState<Convention | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [form, setForm] = useState({ titre: "", partenaire: "", objet: "", duree: "1 an", contenu: "" });

  const CST: Record<string, { color: string; label: string }> = {
    brouillon: { color: colors.muted, label: "Brouillon" },
    en_attente: { color: colors.warn, label: "En attente" },
    signe: { color: colors.success, label: "Signé" },
  };

  const genConvention = async () => {
    if (!form.partenaire || !form.objet) return;
    setGenLoading(true);
    const result = await callClaude([{
      role: "user",
      content: `Rédige une convention de partenariat professionnelle entre l'${config.orgName} (Association des Professionnels de la Sécurité de l'Information du Niger) et "${form.partenaire}".\nObjet : ${form.objet}\nDurée : ${form.duree}\n\nInclure : Préambule, Art.1 Objet, Art.2 Engagements ${config.orgName}, Art.3 Engagements partenaire, Art.4 Durée, Art.5 Confidentialité, Art.6 Résiliation, Art.7 Signatures.\nTexte formel, complet, adapté au contexte nigérien.`,
    }]);
    setForm((f) => ({ ...f, contenu: result }));
    setGenLoading(false);
  };

  const saveConv = () => {
    if (!form.titre || !form.contenu) return;
    setConventions([...conventions, { ...form, id: Date.now(), statut: "brouillon", dateCreation: new Date().toISOString().slice(0, 10), signature: null }]);
    setModal(null);
    setForm({ titre: "", partenaire: "", objet: "", duree: "1 an", contenu: "" });
  };

  const sign = (id: number, sig: string) => {
    setConventions(conventions.map((c) => c.id === id ? { ...c, statut: "signe" as const, signature: sig, dateSigne: new Date().toISOString().slice(0, 10) } : c));
    setModal(null); setTarget(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h1 style={{ color: colors.text, fontSize: "1.5rem", fontWeight: 800 }}>Conventions</h1>
          <p style={{ color: colors.muted, fontSize: "0.8rem", marginTop: "4px" }}>{conventions.length} conventions &middot; {conventions.filter((c) => c.statut === "signe").length} signées</p>
        </div>
        <Button onClick={() => { setModal("create"); setForm({ titre: "", partenaire: "", objet: "", duree: "1 an", contenu: "" }); }}>+ Nouvelle convention</Button>
      </div>

      {conventions.length === 0 && (
        <div style={{ background: colors.card, border: `1px dashed ${colors.border}`, borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <div style={{ color: colors.border, fontSize: "2.5rem", marginBottom: "10px" }}>&#x25FB;</div>
          <div style={{ color: colors.muted, fontWeight: 600 }}>Aucune convention créée</div>
          <div style={{ color: colors.muted, fontSize: "0.78rem", marginTop: "4px", opacity: 0.7 }}>Créez et signez des conventions à distance avec l'aide de l'IA</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {conventions.map((c) => {
          const st = CST[c.statut] || CST.brouillon;
          return (
            <div key={c.id} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <span style={{ color: colors.text, fontWeight: 700 }}>{c.titre}</span>
                    <Badge color={st.color}>{st.label}</Badge>
                  </div>
                  <div style={{ color: colors.accent, fontSize: "0.78rem" }}>{c.partenaire}</div>
                  <div style={{ color: colors.muted, fontSize: "0.72rem", marginTop: "2px" }}>Objet : {c.objet} &middot; Durée : {c.duree}</div>
                  <div style={{ color: colors.muted, fontSize: "0.68rem", marginTop: "3px" }}>Créée le {c.dateCreation}{c.dateSigne ? ` · Signée le ${c.dateSigne}` : ""}</div>
                </div>
                <div style={{ display: "flex", gap: "6px", marginLeft: "12px" }}>
                  <Button small variant="secondary" onClick={() => { setTarget(c); setModal("preview"); }}>Voir</Button>
                  {c.statut !== "signe" && <Button small onClick={() => { setTarget(c); setModal("sign"); }}>Signer</Button>}
                  <Button small variant="danger" onClick={() => setConventions(conventions.filter((x) => x.id !== c.id))}>Suppr.</Button>
                </div>
              </div>
              {c.signature && (
                <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: "10px", paddingTop: "8px" }}>
                  <div style={{ color: colors.muted, fontSize: "0.68rem", marginBottom: "4px" }}>Signature :</div>
                  <img src={c.signature} alt="sig" style={{ maxHeight: "50px", filter: "brightness(10) sepia(1) hue-rotate(120deg) saturate(3)" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal === "create" && (
        <Modal title="Nouvelle convention" onClose={() => setModal(null)} wide>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field label="Titre" value={form.titre} onChange={(v) => setForm((f) => ({ ...f, titre: v }))} placeholder="Convention ${config.orgName} / ..." />
              <Field label="Partenaire" value={form.partenaire} onChange={(v) => setForm((f) => ({ ...f, partenaire: v }))} placeholder="Nom de l'organisation" />
              <Field label="Objet du partenariat" value={form.objet} onChange={(v) => setForm((f) => ({ ...f, objet: v }))} placeholder="ex: Formation cybersécurité" />
              <SelectField label="Durée" value={form.duree} onChange={(v) => setForm((f) => ({ ...f, duree: v }))} options={[...DUREES_CONVENTION]} />
            </div>
            <Button onClick={genConvention} loading={genLoading} disabled={!form.partenaire || !form.objet}>Générer la convention avec Claude</Button>
            <Field label="Contenu de la convention" value={form.contenu} onChange={(v) => setForm((f) => ({ ...f, contenu: v }))} multiline rows={12} placeholder="Le texte sera généré par l'IA, ou saisissez manuellement..." />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setModal(null)}>Annuler</Button>
              <Button onClick={saveConv} disabled={!form.titre || !form.contenu}>Enregistrer</Button>
            </div>
          </div>
        </Modal>
      )}

      {modal === "preview" && target && (
        <Modal title={target.titre} onClose={() => setModal(null)} wide>
          <div style={{ background: colors.surface, borderRadius: "8px", padding: "16px", whiteSpace: "pre-wrap", fontSize: "0.8rem", color: colors.text, maxHeight: "400px", overflowY: "auto", lineHeight: "1.7" }}>
            {target.contenu}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            <Button small variant="secondary" onClick={() => navigator.clipboard?.writeText(target.contenu)}>Copier</Button>
            {target.statut !== "signe" && <Button small onClick={() => { setModal("sign"); }}>Signer</Button>}
          </div>
        </Modal>
      )}

      {modal === "sign" && target && (
        <Modal title={`Signature — ${target.titre}`} onClose={() => setModal(null)}>
          <p style={{ color: colors.muted, fontSize: "0.82rem", marginBottom: "16px", lineHeight: "1.5" }}>
            En signant, vous approuvez la convention de partenariat avec <strong style={{ color: colors.text }}>{target.partenaire}</strong>.
          </p>
          <SignatureCanvas onSave={(sig) => sign(target.id, sig)} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
