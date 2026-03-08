import { config } from "@/lib/config";
import type { Member, Partner, Project, Convention } from "@/data/types";

const STORAGE_KEY = "apsi_gwani_imported";
const STORAGE_VERSION_KEY = "apsi_gwani_version";
const CURRENT_VERSION = "3"; // bump to force re-import

/** True if we already ran the import in this browser. */
export function alreadyImported(): boolean {
  return (
    localStorage.getItem(STORAGE_KEY) === "1" &&
    localStorage.getItem(STORAGE_VERSION_KEY) === CURRENT_VERSION
  );
}

export function markImported(): void {
  localStorage.setItem(STORAGE_KEY, "1");
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
}

/** Force a re-import on next load. */
export function resetImportFlag(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_VERSION_KEY);
}

// ── Gwani API helpers ──────────────────────────────────────────────

const headers = () => ({
  "Content-Type": "application/json",
  "X-API-Key": config.gwaniKey,
});

async function askGwani(message: string, scopePath = "/"): Promise<string> {
  const res = await fetch(`${config.gwaniUrl}/chat`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ message, sector: "general", scopePath }),
  });
  if (!res.ok) throw new Error(`Gwani ${res.status}`);
  const data = await res.json();
  return data.answer || "";
}

/** Download a text file directly by its fileMetadata.id */
async function downloadTextFile(fileId: string): Promise<string> {
  const res = await fetch(`${config.gwaniUrl}/files/${fileId}/download`, {
    headers: { "X-API-Key": config.gwaniKey },
  });
  if (!res.ok) throw new Error(`Download ${res.status}`);
  return res.text();
}

/** Get the full folder tree */
async function getTree(): Promise<GwaniNode[]> {
  const res = await fetch(`${config.gwaniUrl}/nodes/tree`, {
    headers: { "X-API-Key": config.gwaniKey },
  });
  if (!res.ok) throw new Error(`Tree ${res.status}`);
  return res.json();
}

interface GwaniNode {
  id: string;
  type: "FILE" | "FOLDER";
  name: string;
  path: string;
  fileMetadata?: { id: string; mimeType: string };
  children?: GwaniNode[];
}

/** Find all files matching criteria in the tree */
function findFiles(
  nodes: GwaniNode[],
  predicate: (n: GwaniNode) => boolean,
): GwaniNode[] {
  const results: GwaniNode[] = [];
  for (const n of nodes) {
    if (n.type === "FILE" && predicate(n)) results.push(n);
    if (n.children) results.push(...findFiles(n.children, predicate));
  }
  return results;
}

// ── Utilities ──────────────────────────────────────────────────────

function nextId(existing: { id: number }[]): number {
  return existing.length ? Math.max(...existing.map((e) => e.id)) + 1 : 1;
}

function nameExists(list: { nom: string }[], nom: string): boolean {
  const n = nom.toLowerCase().trim();
  return list.some((m) => m.nom.toLowerCase().trim() === n);
}

// ── Known members (verified from Gwani RAG + CR meeting minutes) ───
// Founding members from AGC 06/10/2024
const FOUNDERS: Array<{ nom: string; bio: string; competences: string[] }> = [
  { nom: "Aboubacar YACOUBA MAI BIRNI", bio: "Président APSI-NE. Ingénieur cybersécurité.", competences: ["Gouvernance", "Gestion des risques"] },
  { nom: "Abdoul-Razak OUMAROU MAKAMA", bio: "Ingénieur réseaux et télécoms.", competences: ["Architecture réseau"] },
  { nom: "DJIBO ISSA Yahaya", bio: "Ingénieur cybersécurité.", competences: ["Pentest", "SOC/SIEM"] },
  { nom: "Yacoubou ATTO Housseini", bio: "Ingénieur sécurité des systèmes d'information.", competences: ["ISO 27001", "Gouvernance"] },
  { nom: "ABDRAMANE CISSÉ Ousseini", bio: "Ingénieur sécurité des systèmes d'information.", competences: ["ISO 27001"] },
  { nom: "Maliki Harouna Assad", bio: "Ingénieur sécurité des systèmes d'information.", competences: ["ISO 27001", "Gestion des risques"] },
  { nom: "CHAIBOU ABDOU Abdoul Latif", bio: "Ingénieur sécurité des systèmes d'information.", competences: ["ISO 27001"] },
  { nom: "Mamadou Coulibaly Boubacar", bio: "Ingénieur d'affaires.", competences: ["Gestion des risques", "Gouvernance"] },
  { nom: "IBRAHIM LY SOULEYMANE Ibrahim", bio: "Ingénieur cybersécurité.", competences: ["Pentest", "Gouvernance"] },
  { nom: "Abdoulkassoum Mahaman Laouan Djibril", bio: "Ingénieur sécurité des systèmes d'information.", competences: ["ISO 27001"] },
  { nom: "ABOUBACAR AMADOU Abdoul Djafar", bio: "Responsable Commission R&D. Ingénieur sécurité des systèmes d'information.", competences: ["ISO 27001", "OSINT", "Dev sécurisé"] },
];

// Active members extracted from CR meeting minutes + Gwani chat enrichment
const ACTIVE_MEMBERS: Array<{ nom: string; bio: string; competences: string[]; niveau: string }> = [
  { nom: "Abdoul Karim", bio: "Digital Project Manager. Chef du Département Homologation ARCEP Niger. Responsable groupe de travail CyberNiger 2025.", competences: ["Gouvernance", "Gestion des risques"], niveau: "Senior" },
  { nom: "Marah Galy Adam", bio: "Responsable Commission CSEN (Sensibilisation et Éducation Numérique).", competences: ["Formation", "Gouvernance"], niveau: "Senior" },
  { nom: "Ramzi SIDI IBRAHIM", bio: "Responsable Commission CPRI (Partenariats & Rayonnement Institutionnel).", competences: ["Gouvernance", "Gestion des risques"], niveau: "Senior" },
  { nom: "Magassouba Sory Oulen", bio: "Responsable Commission CIATN (Insertion et Accompagnement des Talents Numériques).", competences: ["Formation", "Gouvernance"], niveau: "Senior" },
  { nom: "Hafiz Mahaman Sanoussi", bio: "Membre actif APSI-NE.", competences: ["Gouvernance"], niveau: "Confirmé" },
  { nom: "Abdourahamane Noury", bio: "Membre actif APSI-NE.", competences: ["Gouvernance"], niveau: "Confirmé" },
  { nom: "Fadima", bio: "Membre actif APSI-NE. Impliquée dans les dossiers FORCYN.", competences: ["Gouvernance"], niveau: "Confirmé" },
  { nom: "Hacksparo", bio: "Membre actif APSI-NE.", competences: ["Pentest", "OSINT"], niveau: "Confirmé" },
  { nom: "Maman Rabiou", bio: "Membre actif APSI-NE.", competences: ["Gouvernance"], niveau: "Confirmé" },
  { nom: "Mahamadou Soumaila", bio: "Membre actif APSI-NE.", competences: ["Gouvernance"], niveau: "Confirmé" },
  { nom: "Yacine", bio: "Nouveau membre actif APSI-NE (depuis mai 2025).", competences: [], niveau: "Junior" },
  { nom: "Rahmata", bio: "Membre actif APSI-NE. Impliquée dans les dossiers FORCYN.", competences: ["Gouvernance"], niveau: "Confirmé" },
  { nom: "Kalilou", bio: "Membre actif APSI-NE. Volontaire formateur (légal, compliance, cryptographie).", competences: ["Formation"], niveau: "Confirmé" },
  { nom: "Issaka", bio: "Membre actif APSI-NE.", competences: [], niveau: "Junior" },
  { nom: "Aboubakar Oumar", bio: "Membre actif APSI-NE.", competences: [], niveau: "Confirmé" },
];

// ── Import members from CR meeting minutes ─────────────────────────

export async function importMembers(existing: Member[]): Promise<Member[]> {
  const merged = [...existing];

  // Helper: check if a member already exists by partial name match
  const alreadyExists = (nom: string) => {
    if (nameExists(merged, nom)) return true;
    const parts = nom.split(/\s+/);
    return merged.some((m) =>
      parts.some((p) => p.length > 3 && m.nom.toLowerCase().includes(p.toLowerCase()))
    );
  };

  // 1) Add founding members
  for (const f of FOUNDERS) {
    if (alreadyExists(f.nom)) continue;
    merged.push({
      id: nextId(merged),
      nom: f.nom,
      role: "Membre fondateur",
      email: "",
      competences: f.competences,
      niveau: "Senior",
      bio: f.bio,
      disponible: true,
    });
  }

  // 2) Add known active members (enriched from Gwani chat + CR parsing)
  for (const am of ACTIVE_MEMBERS) {
    if (alreadyExists(am.nom)) continue;
    merged.push({
      id: nextId(merged),
      nom: am.nom,
      role: "Membre actif",
      email: "",
      competences: am.competences,
      niveau: am.niveau,
      bio: am.bio,
      disponible: true,
    });
  }

  // 3) Parse CR meeting minutes to discover any NEW participants not in our lists
  try {
    const tree = await getTree();
    const crFiles = findFiles(tree, (n) =>
      n.path.includes("crétariat") &&
      n.name.includes("CR") &&
      n.fileMetadata?.mimeType === "text/plain"
    );

    for (const file of crFiles) {
      if (!file.fileMetadata?.id) continue;
      try {
        const text = await downloadTextFile(file.fileMetadata.id);
        const match = text.match(/Participants\s*:\s*([^\n]+)/i);
        if (match) {
          const names = match[1].split(",").map((n) => n.trim()).filter(Boolean);
          for (const name of names) {
            if (name.length < 2 || alreadyExists(name)) continue;
            merged.push({
              id: nextId(merged),
              nom: name,
              role: "Membre actif",
              email: "",
              competences: [],
              niveau: "Confirmé",
              bio: "Membre actif APSI-NE. Participe aux réunions hebdomadaires.",
              disponible: true,
            });
          }
        }
      } catch { /* skip individual file errors */ }
    }
  } catch (err) {
    console.warn("[Gwani Import] CR parsing failed:", err);
  }

  // 4) Fetch honorary members via chat
  try {
    const honAnswer = await askGwani(
      "Qui sont les membres d'honneur de APSI-NE ? Noms complets, fonctions et organisations."
    );
    if (honAnswer) {
      const honLines = honAnswer.match(/\*\*([^*]+)\*\*\s*[—–-]\s*(.+)/g) || [];
      for (const line of honLines) {
        const m = line.match(/\*\*([^*]+)\*\*\s*[—–-]\s*(.+)/);
        if (!m) continue;
        const nom = m[1].trim();
        const bio = m[2].trim();
        if (alreadyExists(nom)) continue;
        if (nom.toLowerCase().includes("synthèse") || nom.toLowerCase().includes("remarque")) continue;

        merged.push({
          id: nextId(merged),
          nom,
          role: "Membre d'honneur",
          email: "",
          competences: extractCompetences(bio),
          niveau: "Expert",
          bio,
          disponible: true,
        });
      }
    }
  } catch { /* skip */ }

  return merged;
}

// ── Import partners ────────────────────────────────────────────────

export async function importPartners(existing: Partner[]): Promise<Partner[]> {
  const merged = [...existing];

  // Known partners from verified Gwani data
  const knownPartners: Array<{
    nom: string; org: string; secteur: string;
    statut: "prospect" | "contacte" | "nego" | "signe";
    notes: string;
  }> = [
    { nom: "Samira Jean-Louis", org: "FemmesTech Niger", secteur: "ONG / Org. Int.", statut: "signe", notes: "Convention signée 24/02/2025. Promotion des femmes en cybersécurité, formations et ateliers conjoints. Partage 50/50." },
    { nom: "Maman Lourwana Issaka", org: "Digital Niger", secteur: "Tech / Startup", statut: "signe", notes: "Convention signée. Rapport de recherche bisannuel sur la transformation numérique et la cybersécurité au Niger." },
    { nom: "ESPA-MT", org: "ESPA-MT", secteur: "Éducation / Université", statut: "nego", notes: "Catalogue formations conjoint. 20% pour APSI sur rémunération formateurs. Badge Numérique. Co-création centre certification." },
    { nom: "Anne-Rachel Inné", org: "ANSI (Agence Nationale de la Sécurité Informatique)", secteur: "Gouvernement / État", statut: "contacte", notes: "Rencontre avec la DG. Formalisation partenariat via Tari Bako. Intégration Programme Excellence." },
    { nom: "Président HAPDP", org: "HAPDP", secteur: "Gouvernement / État", statut: "nego", notes: "Souhaite être acteur clé de FORCYN. Documents transmis. Suivi par Assad. Intervention Télé Sahel envisagée." },
    { nom: "MOUGANI LAB", org: "MOUGANI LAB / ADN", secteur: "Tech / Startup", statut: "contacte", notes: "Négociations pour Centre de conférence Mahatma Gandhi pour CyberNiger 2025. Pistes cyberhygiène." },
  ];

  for (const kp of knownPartners) {
    const orgLower = kp.org.toLowerCase();
    if (merged.some((p) => p.org.toLowerCase().includes(orgLower) || orgLower.includes(p.org.toLowerCase()))) continue;

    merged.push({
      id: nextId(merged),
      nom: kp.nom,
      org: kp.org,
      email: "",
      tel: "",
      secteur: kp.secteur,
      statut: kp.statut,
      notes: kp.notes,
      date: new Date().toISOString().slice(0, 10),
    });
  }

  return merged;
}

// ── Import projects ────────────────────────────────────────────────

export async function importProjects(existing: Project[]): Promise<Project[]> {
  const merged = [...existing];

  const knownProjects: Array<{
    titre: string; type: string; description: string; statut: string; deadline: string;
  }> = [
    {
      titre: "CyberNiger / FORCYN 2025",
      type: "Événement",
      description: "Conférence annuelle sur la cybersécurité au Niger. Décembre 2025. Partenaires: ESPA, HAPDP, ANSI. Responsable comité: Abdoul Karim. Plan B: événement en ligne si contraintes financières.",
      statut: "En cours",
      deadline: "2025-12-31",
    },
    {
      titre: "Programme Excellence Cybersécurité",
      type: "Formation / Sensibilisation",
      description: "Phase 1: tronc commun (2 mois). Phase 2: spécialisation + mentorat individuel (4 mois). Attestation à l'issue. Éligibilité: Nigériens et résidents au Niger. Les 5 meilleurs projets présentés à FORCYN.",
      statut: "En cours",
      deadline: "2025-04-26",
    },
    {
      titre: "Spaces & Webinaires hebdomadaires",
      type: "Formation / Sensibilisation",
      description: "Spaces hebdomadaires sur X (samedi). Sensibilisation, débats publics, renforcement des compétences. Masterclass avec experts.",
      statut: "En cours",
      deadline: "",
    },
    {
      titre: "Niger Ethical Hacking (NEH)",
      type: "R&D",
      description: "Communauté de CTF et challenges cybersécurité pour structurer les compétitions au Niger.",
      statut: "Planifié",
      deadline: "",
    },
    {
      titre: "Livre Blanc Cybersécurité Niger",
      type: "R&D",
      description: "Rapport sur la transformation numérique et la cybersécurité au Niger. Piloté par Atto. Mise à jour tous les 2 ans.",
      statut: "En cours",
      deadline: "",
    },
    {
      titre: "Partenariat Formations ESPA-MT",
      type: "Formation / Sensibilisation",
      description: "Catalogue de formations conjoint avec ESPA-MT. Formateurs APSI interviennent, 20% reversé à APSI. Thèmes: légal, compliance, cryptographie.",
      statut: "En cours",
      deadline: "",
    },
  ];

  for (const proj of knownProjects) {
    if (merged.some((p) => p.titre.toLowerCase().includes(proj.titre.toLowerCase().split("/")[0].trim().split(" ")[0]))) continue;

    merged.push({
      id: nextId(merged),
      titre: proj.titre,
      type: proj.type,
      description: proj.description,
      statut: proj.statut,
      deadline: proj.deadline,
      membres: [],
    });
  }

  return merged;
}

// ── Import conventions ─────────────────────────────────────────────

export async function importConventions(existing: Convention[]): Promise<Convention[]> {
  const merged = [...existing];

  const knownConventions: Array<Omit<Convention, "id">> = [
    {
      titre: "Convention APSI-NE × FemmesTech Niger",
      partenaire: "FemmesTech Niger (Présidente: Samira Jean-Louis)",
      objet: "Promouvoir la participation des femmes en cybersécurité. Formations/ateliers conjoints, campagnes de sensibilisation, événements, orientation professionnelle.",
      duree: "Indéterminée",
      contenu: "Partage des bénéfices 50/50 pour initiatives rémunérées après déduction des charges. Obligation d'apposer les logos des deux parties. Résiliation avec préavis de 3 mois.",
      statut: "signe",
      dateCreation: "2025-02-24",
      dateSigne: "2025-02-24",
      signature: "Samira Jean-Louis / Aboubacar YACOUBA MAI BIRNI",
    },
    {
      titre: "Convention APSI-NE × Digital Niger",
      partenaire: "Digital Niger (Responsable: Maman Lourwana Issaka)",
      objet: "Renforcer la culture cybersécurité (entreprises, administrations, citoyens). Formations continues, partage d'expertise, opportunités internationales.",
      duree: "2 ans",
      contenu: "Rapport conjoint 'La transformation numérique et la cybersécurité au Niger' avec au moins 2 membres de chaque association. Mise à jour tous les 2 ans (2025, 2027...).",
      statut: "signe",
      dateCreation: "2025-01-01",
      dateSigne: undefined,
      signature: "Maman Lourwana Issaka / Aboubacar YACOUBA MAI BIRNI",
    },
  ];

  for (const conv of knownConventions) {
    if (merged.some((c) => c.partenaire.toLowerCase().includes(conv.partenaire.toLowerCase().split("(")[0].trim().split(" ")[0]))) continue;

    merged.push({ ...conv, id: nextId(merged) });
  }

  return merged;
}

// ── Helpers ────────────────────────────────────────────────────────

function extractCompetences(text: string): string[] {
  const comps: string[] = [];
  const lower = text.toLowerCase();
  if (lower.includes("cybersécurité") || lower.includes("cyber")) comps.push("Gouvernance");
  if (lower.includes("réseau") || lower.includes("télécom")) comps.push("Architecture réseau");
  if (lower.includes("sécurité des systèmes") || lower.includes("information")) comps.push("ISO 27001");
  if (lower.includes("banque") || lower.includes("finance") || lower.includes("dsi")) comps.push("Gestion des risques");
  if (lower.includes("pentest") || lower.includes("intrusion")) comps.push("Pentest");
  if (lower.includes("forensi")) comps.push("Forensique");
  if (lower.includes("formation") || lower.includes("mentorat")) comps.push("Formation");
  if (lower.includes("soc") || lower.includes("siem")) comps.push("SOC/SIEM");
  if (lower.includes("cloud")) comps.push("Cloud Security");
  if (lower.includes("devsecops")) comps.push("DevSecOps");
  if (lower.includes("cio") || lower.includes("chief")) comps.push("Gouvernance");
  if (comps.length === 0) comps.push("Gouvernance");
  return comps;
}
