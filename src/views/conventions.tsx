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

/** Convert markdown-like AI output to styled HTML */
function formatAiResult(text: string, colors: Record<string, string>): string {
  return text
    .replace(/^(\d+)\.\s*\*\*([^*]+)\*\*\s*:?\s*/gm,
      `<div style="margin-top:12px;margin-bottom:4px;font-weight:700;color:${colors.accent};font-size:0.78rem">$1. $2</div>`)
    .replace(/\*\*([^*]+)\*\*/g,
      `<strong style="color:${colors.text};font-weight:600">$1</strong>`)
    .replace(/^(\s*)[-•]\s+/gm,
      `$1<span style="color:${colors.accent};margin-right:6px">&#x25B8;</span>`)
    .replace(/\n/g, "<br/>");
}

/** Generate a professional PDF-ready HTML document for a convention */
function generateConventionHTML(conv: Convention): string {
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const dateCreation = conv.dateCreation
    ? new Date(conv.dateCreation).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : today;

  // Convert the raw content to formatted HTML paragraphs
  const contentHTML = conv.contenu
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      // Article headers
      if (/^(Article|Art\.?\s*)\s*\d+/i.test(trimmed)) {
        return `<h3 style="font-size:13pt;font-weight:bold;margin:24pt 0 8pt 0;color:#1a1a1a;border-bottom:1px solid #ccc;padding-bottom:4pt">${trimmed}</h3>`;
      }
      // Section headers (PREAMBULE, ENTRE, etc.)
      if (/^(PR[ÉE]AMBULE|ENTRE LES SOUSSIGN|CONVENTION|IL A [ÉE]T[ÉE] CONVENU|TITRE|CHAPITRE)/i.test(trimmed)) {
        return `<h2 style="font-size:14pt;font-weight:bold;margin:28pt 0 12pt 0;text-align:center;color:#1a1a1a;text-transform:uppercase;letter-spacing:1pt">${trimmed}</h2>`;
      }
      // Bullet points
      if (/^[-•–]\s+/.test(trimmed)) {
        return `<p style="margin:3pt 0 3pt 24pt;font-size:11pt;line-height:1.6">${trimmed.replace(/^[-•–]\s+/, "&#8226; ")}</p>`;
      }
      // Regular paragraphs
      return `<p style="margin:4pt 0;font-size:11pt;line-height:1.8;text-align:justify">${trimmed}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${conv.titre}</title>
  <style>
    @page { margin: 25mm 20mm 30mm 20mm; size: A4; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    body {
      font-family: "Georgia", "Times New Roman", serif;
      color: #1a1a1a;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      background: #fff;
      font-size: 11pt;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      border-bottom: 3px double #1a3a5c;
      padding-bottom: 16pt;
      margin-bottom: 24pt;
    }
    .header h1 {
      font-size: 11pt;
      font-weight: bold;
      color: #1a3a5c;
      margin: 0 0 4pt 0;
      letter-spacing: 2pt;
      text-transform: uppercase;
    }
    .header .subtitle {
      font-size: 9pt;
      color: #555;
      letter-spacing: 1pt;
    }
    .doc-title {
      text-align: center;
      margin: 32pt 0;
    }
    .doc-title h2 {
      font-size: 18pt;
      font-weight: bold;
      color: #1a3a5c;
      margin: 0 0 8pt 0;
      text-transform: uppercase;
      letter-spacing: 1pt;
    }
    .doc-title .ref {
      font-size: 9pt;
      color: #777;
    }
    .meta-box {
      border: 1px solid #ccc;
      border-radius: 4pt;
      padding: 12pt 16pt;
      margin: 16pt 0 24pt 0;
      background: #f9f9fb;
      font-size: 10pt;
    }
    .meta-box td { padding: 3pt 8pt; vertical-align: top; }
    .meta-box .label { font-weight: bold; color: #1a3a5c; white-space: nowrap; }
    .content { margin: 16pt 0; }
    .signatures {
      margin-top: 48pt;
      page-break-inside: avoid;
    }
    .signatures h3 {
      text-align: center;
      font-size: 13pt;
      margin-bottom: 32pt;
      border-bottom: 1px solid #ccc;
      padding-bottom: 8pt;
    }
    .sig-grid {
      display: flex;
      justify-content: space-between;
      gap: 40pt;
    }
    .sig-block {
      flex: 1;
      text-align: center;
    }
    .sig-block .role {
      font-size: 10pt;
      font-weight: bold;
      color: #1a3a5c;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
    .sig-block .org {
      font-size: 10pt;
      color: #555;
      margin: 4pt 0;
    }
    .sig-block .name {
      font-size: 11pt;
      font-weight: bold;
      margin-top: 4pt;
    }
    .sig-block .sig-line {
      border-bottom: 1px solid #1a1a1a;
      height: 60pt;
      margin: 16pt 0 8pt 0;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 4pt;
    }
    .sig-block .sig-line img {
      max-height: 50pt;
    }
    .sig-block .date-line {
      font-size: 9pt;
      color: #777;
      margin-top: 8pt;
    }
    .footer {
      margin-top: 40pt;
      padding-top: 12pt;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 8pt;
      color: #999;
    }
    .btn-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: #1a3a5c;
      padding: 10px 20px;
      display: flex;
      gap: 12px;
      justify-content: center;
      z-index: 100;
    }
    .btn-bar button {
      background: #fff;
      color: #1a3a5c;
      border: none;
      padding: 8px 24px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-bar button:hover { background: #e8eef5; }
  </style>
</head>
<body>
  <div class="no-print btn-bar">
    <button onclick="window.print()">Imprimer / Enregistrer PDF</button>
    <button onclick="window.close()">Fermer</button>
  </div>

  <!-- EN-TÊTE -->
  <div class="header">
    <h1>${config.orgName}</h1>
    <div class="subtitle">${config.orgFullName || "Association des Professionnels de la S&eacute;curit&eacute; de l'Information du Niger"}</div>
    <div class="subtitle" style="margin-top:4pt">${config.orgEmail || "contact.apsi.ne@gmail.com"}</div>
  </div>

  <!-- TITRE DU DOCUMENT -->
  <div class="doc-title">
    <h2>${conv.titre}</h2>
    <div class="ref">R&eacute;f&eacute;rence : CONV-${config.orgName}-${conv.dateCreation ? conv.dateCreation.replace(/-/g, "") : new Date().toISOString().slice(0, 10).replace(/-/g, "")}</div>
  </div>

  <!-- INFORMATIONS -->
  <div class="meta-box">
    <table style="width:100%;border-collapse:collapse">
      <tr><td class="label">Partenaire :</td><td>${conv.partenaire}</td></tr>
      <tr><td class="label">Objet :</td><td>${conv.objet}</td></tr>
      <tr><td class="label">Dur&eacute;e :</td><td>${conv.duree}</td></tr>
      <tr><td class="label">Date :</td><td>${dateCreation}</td></tr>
      <tr><td class="label">Statut :</td><td>${conv.statut === "signe" ? "Sign&eacute;e" : conv.statut === "en_attente" ? "En attente de signature" : "Brouillon"}</td></tr>
    </table>
  </div>

  <!-- CONTENU -->
  <div class="content">
    ${contentHTML}
  </div>

  <!-- SIGNATURES -->
  <div class="signatures">
    <h3>Signatures</h3>
    <div class="sig-grid">
      <div class="sig-block">
        <div class="role">Pour ${config.orgName}</div>
        <div class="org">${config.orgFullName || ""}</div>
        <div class="name">Aboubacar YACOUBA MAI BIRNI</div>
        <div class="role" style="font-size:9pt;margin-top:2pt">Pr&eacute;sident</div>
        <div class="sig-line">${conv.signature ? `<img src="${conv.signature}" alt="Signature"/>` : ""}</div>
        <div class="date-line">Date : ${conv.dateSigne ? new Date(conv.dateSigne).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "____________________"}</div>
        <div class="date-line">Lieu : Niamey, Niger</div>
      </div>
      <div class="sig-block">
        <div class="role">Pour le partenaire</div>
        <div class="org">${conv.partenaire}</div>
        <div class="name">&nbsp;</div>
        <div class="role" style="font-size:9pt;margin-top:2pt">Repr&eacute;sentant(e) autoris&eacute;(e)</div>
        <div class="sig-line"></div>
        <div class="date-line">Date : ____________________</div>
        <div class="date-line">Lieu : ____________________</div>
      </div>
    </div>
  </div>

  <!-- PIED DE PAGE -->
  <div class="footer">
    <p>${config.orgName} &mdash; ${config.orgFullName || ""}</p>
    <p>${config.orgEmail || ""}</p>
    <p>Document g&eacute;n&eacute;r&eacute; le ${today} &mdash; Confidentiel</p>
  </div>
</body>
</html>`;
}

/** Open convention as a professional printable document in a new window */
function downloadConventionPDF(conv: Convention) {
  const html = generateConventionHTML(conv);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.addEventListener("afterprint", () => URL.revokeObjectURL(url));
  }
}

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "brouillon" | "en_attente" | "signe">("all");
  const [aiState, setAiState] = useState<Record<number, { loading: boolean; result: string }>>({});

  const filteredConventions = conventions.filter((c) => {
    if (statusFilter !== "all" && c.statut !== statusFilter) return false;
    const q = search.toLowerCase();
    return !q || c.titre.toLowerCase().includes(q) || c.partenaire.toLowerCase().includes(q);
  });

  const CST: Record<string, { color: string; label: string }> = {
    brouillon: { color: colors.muted, label: "Brouillon" },
    en_attente: { color: colors.warn, label: "En attente" },
    signe: { color: colors.success, label: "Signé" },
  };

  const analyzeConvention = async (conv: Convention) => {
    setAiState((a) => ({ ...a, [conv.id]: { loading: true, result: "" } }));

    let existingContext = "";
    const otherConvs = conventions.filter(c => c.id !== conv.id && c.contenu);
    if (otherConvs.length > 0) {
      existingContext = `\n\nConventions existantes de ${config.orgName} pour comparaison :\n` +
        otherConvs.slice(0, 2).map((c, i) => `--- ${c.titre} (${c.statut}) ---\nPartenaire: ${c.partenaire}\nObjet: ${c.objet}\nDurée: ${c.duree}\nExtrait: ${c.contenu.slice(0, 800)}`).join("\n\n");
    }

    let gwaniContext = "";
    if (config.gwaniUrl && config.gwaniKey) {
      try {
        const res = await fetch(`${config.gwaniUrl}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-Key": config.gwaniKey },
          body: JSON.stringify({
            message: `Quelles informations as-tu sur les conventions et accords de partenariat de APSI-NE ? Donne les détails sur la structure, les clauses habituelles, et les partenaires.`,
            sector: "general",
            scopePath: "/",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.answer) gwaniContext = `\n\nInformations du Drive APSI-NE :\n${data.answer.slice(0, 2000)}`;
        }
      } catch { /* ignore */ }
    }

    const result = await callClaude([{
      role: "user",
      content: `Analyse cette convention de ${config.orgName} :

Titre : ${conv.titre}
Partenaire : ${conv.partenaire}
Objet : ${conv.objet}
Durée : ${conv.duree}
Statut : ${conv.statut}
Contenu : ${conv.contenu.slice(0, 3000)}
${existingContext}
${gwaniContext}

Donne-moi :
1. **Points forts** de cette convention
2. **Points d'amélioration** ou clauses manquantes par rapport aux conventions existantes
3. **Suggestions** d'ajouts ou modifications pour renforcer le partenariat
4. **Prochaines étapes** recommandées (actions concrètes)

Sois précis et concis. Réponds en français.`,
    }], { forceOpenAI: true });
    setAiState((a) => ({ ...a, [conv.id]: { loading: false, result } }));
  };

  const genConvention = async () => {
    if (!form.partenaire || !form.objet) return;
    setGenLoading(true);

    let conventionContext = "";
    try {
      const existingConvs = conventions.filter(c => c.contenu).slice(0, 2);
      if (existingConvs.length > 0) {
        conventionContext = `\n\nVoici des exemples de conventions existantes de ${config.orgName} pour t'inspirer du style et de la structure :\n` +
          existingConvs.map((c, i) => `--- Convention ${i + 1} : ${c.titre} ---\n${c.contenu.slice(0, 1500)}`).join("\n\n");
      }
    } catch { /* ignore */ }

    let gwaniContext = "";
    if (config.gwaniUrl && config.gwaniKey) {
      try {
        const res = await fetch(`${config.gwaniUrl}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-Key": config.gwaniKey },
          body: JSON.stringify({
            message: `Trouve les conventions ou accords de partenariat de APSI-NE dans le Drive. Donne-moi la structure, les articles et le style utilisé.`,
            sector: "general",
            scopePath: "/",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.answer) gwaniContext = `\n\nInformations supplémentaires trouvées dans le Drive APSI-NE :\n${data.answer.slice(0, 2000)}`;
        }
      } catch { /* ignore */ }
    }

    const result = await callClaude([{
      role: "user",
      content: `Rédige une convention de partenariat COMPLÈTE et PROFESSIONNELLE, prête à être signée, entre :

PARTIE 1 : ${config.orgName} (${config.orgFullName || "Association des Professionnels de la Sécurité de l'Information du Niger"})
- Siège : Niamey, Niger
- Représentée par : Aboubacar YACOUBA MAI BIRNI, Président
- Email : ${config.orgEmail || "contact.apsi.ne@gmail.com"}

PARTIE 2 : "${form.partenaire}"

Objet : ${form.objet}
Durée : ${form.duree}
${conventionContext}
${gwaniContext}

STRUCTURE OBLIGATOIRE :

ENTRE LES SOUSSIGNÉS
(Présentation complète des deux parties avec dénomination, siège, représentant légal)

PRÉAMBULE
(Contexte, motivations, objectifs communs - 2 à 3 paragraphes)

Article 1 - OBJET DE LA CONVENTION
(Description précise et détaillée de l'objet du partenariat)

Article 2 - ENGAGEMENTS DE ${config.orgName}
(Liste détaillée des engagements, minimum 4 points)

Article 3 - ENGAGEMENTS DU PARTENAIRE
(Liste détaillée des engagements, minimum 4 points)

Article 4 - MODALITÉS DE COLLABORATION
(Organisation pratique : réunions, comité de pilotage, fréquence, interlocuteurs)

Article 5 - MOYENS ET RESSOURCES
(Contributions de chaque partie : humaines, matérielles, financières. Répartition des charges et bénéfices si applicable)

Article 6 - PROPRIÉTÉ INTELLECTUELLE
(Droits sur les productions communes, utilisation des logos et marques)

Article 7 - COMMUNICATION ET VISIBILITÉ
(Utilisation des logos, mentions obligatoires, communication conjointe)

Article 8 - DURÉE ET RECONDUCTION
(Durée initiale, conditions de reconduction, tacite reconduction)

Article 9 - CONFIDENTIALITÉ
(Clause de confidentialité sur les informations échangées)

Article 10 - RÉSILIATION
(Conditions de résiliation, préavis de 3 mois, motifs légitimes)

Article 11 - RÈGLEMENT DES DIFFÉRENDS
(Résolution amiable, médiation, juridiction compétente - tribunaux de Niamey)

Article 12 - DISPOSITIONS FINALES
(Nombre d'exemplaires, annexes éventuelles, droit applicable - droit nigérien)

SIGNATURES
(Bloc signature pour chaque partie avec : "Fait à Niamey, le [date]", "En deux exemplaires originaux")

CONSIGNES DE RÉDACTION :
- Style juridique formel et professionnel
- Vocabulaire précis et sans ambiguïté
- Adapté au contexte juridique nigérien
- Chaque article doit être substantiel (pas de phrases génériques vides)
- Le document doit être COMPLET et prêt à imprimer tel quel
- NE PAS inclure de crochets [ ] ou de placeholder à remplir sauf pour la date de signature
- Sois exhaustif et détaillé`,
    }], { forceOpenAI: true });
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

      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
          style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, outline: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "0.8rem", flex: "1 1 140px", fontFamily: "inherit" }} />
        {[
          { key: "all" as const, label: "Toutes", color: colors.muted },
          { key: "brouillon" as const, label: "Brouillon", color: colors.muted },
          { key: "en_attente" as const, label: "En attente", color: colors.warn },
          { key: "signe" as const, label: "Signées", color: colors.success },
        ].map((s) => (
          <button key={s.key} onClick={() => setStatusFilter(s.key)}
            style={{ background: statusFilter === s.key ? s.color + "20" : "transparent", color: statusFilter === s.key ? s.color : colors.muted, border: `1px solid ${statusFilter === s.key ? s.color + "50" : colors.border}`, borderRadius: "8px", padding: "5px 12px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
            {s.label}
          </button>
        ))}
      </div>

      {filteredConventions.length === 0 && (
        <div style={{ background: colors.card, border: `1px dashed ${colors.border}`, borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <div style={{ color: colors.border, fontSize: "2.5rem", marginBottom: "10px" }}>&#x25FB;</div>
          <div style={{ color: colors.muted, fontWeight: 600 }}>Aucune convention créée</div>
          <div style={{ color: colors.muted, fontSize: "0.78rem", marginTop: "4px", opacity: 0.7 }}>Créez et signez des conventions à distance avec l'aide de l'IA</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filteredConventions.map((c) => {
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
                <div style={{ display: "flex", gap: "6px", marginLeft: "12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <Button small variant="secondary" onClick={() => { setTarget(c); setModal("preview"); }}>Voir</Button>
                  <Button small variant="secondary" onClick={() => downloadConventionPDF(c)}>PDF</Button>
                  <Button small variant="secondary" onClick={() => analyzeConvention(c)} loading={(aiState[c.id] || {}).loading}>Analyse IA</Button>
                  {c.statut !== "signe" && <Button small onClick={() => { setTarget(c); setModal("sign"); }}>Signer</Button>}
                  <Button small variant="danger" onClick={() => setConventions(conventions.filter((x) => x.id !== c.id))}>Suppr.</Button>
                </div>
              </div>
              {(aiState[c.id] && !aiState[c.id].loading && aiState[c.id].result) && (
                <div style={{ background: colors.surface, border: `1px solid ${colors.accent}25`, borderRadius: "10px", padding: "16px 18px", marginTop: "12px", fontSize: "0.8rem", color: colors.text, lineHeight: "1.7" }}>
                  <div style={{ color: colors.accent, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px", fontWeight: 700 }}>Analyse IA</div>
                  <div dangerouslySetInnerHTML={{ __html: formatAiResult(aiState[c.id].result, colors) }} />
                </div>
              )}
              {c.signature && (
                <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: "10px", paddingTop: "8px" }}>
                  <div style={{ color: colors.muted, fontSize: "0.68rem", marginBottom: "4px" }}>Signature :</div>
                  <img src={c.signature} alt="sig" style={{ maxHeight: "50px", borderRadius: "4px" }} />
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
              <Field label="Titre" value={form.titre} onChange={(v) => setForm((f) => ({ ...f, titre: v }))} placeholder={`Convention ${config.orgName} / ...`} />
              <Field label="Partenaire" value={form.partenaire} onChange={(v) => setForm((f) => ({ ...f, partenaire: v }))} placeholder="Nom de l'organisation" />
              <Field label="Objet du partenariat" value={form.objet} onChange={(v) => setForm((f) => ({ ...f, objet: v }))} placeholder="ex: Formation cybersécurité" />
              <SelectField label="Durée" value={form.duree} onChange={(v) => setForm((f) => ({ ...f, duree: v }))} options={[...DUREES_CONVENTION]} />
            </div>
            <Button onClick={genConvention} loading={genLoading} disabled={!form.partenaire || !form.objet}>Générer la convention avec IA</Button>
            <Field label="Contenu de la convention" value={form.contenu} onChange={(v) => setForm((f) => ({ ...f, contenu: v }))} multiline rows={14} placeholder="Le texte complet sera généré par l'IA, ou saisissez manuellement..." />
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
            <Button small variant="secondary" onClick={() => navigator.clipboard?.writeText(target.contenu)}>Copier le texte</Button>
            <Button small variant="secondary" onClick={() => downloadConventionPDF(target)}>Télécharger PDF</Button>
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
