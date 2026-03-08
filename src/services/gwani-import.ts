import { config } from "@/lib/config";
import type { Member, Partner, Project, Convention } from "@/data/types";

const STORAGE_KEY = "apsi_gwani_imported";
const STORAGE_VERSION_KEY = "apsi_gwani_version";
const CURRENT_VERSION = "6"; // bump to force re-import

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

interface KnownMember {
  nom: string;
  role: "Membre fondateur" | "Membre actif" | "Membre d'honneur";
  bio: string;
  competences: string[];
  niveau: string;
  commission?: string; // Commission badge
}

const KNOWN_MEMBERS: KnownMember[] = [
  // ── Fondateurs (AGC 06/10/2024) ──
  { nom: "Aboubacar YACOUBA MAI BIRNI", role: "Membre fondateur", niveau: "Expert",
    bio: "Président APSI-NE. Consultant cybersécurité, Resp. ISAC/CSIRT & Cyber Capacity Building à l'ACRC. Ex-Mazars Sénégal. Audit IT/SI, tests d'intrusion, GRC, formation et stratégie cybersécurité.",
    competences: ["Pentest", "Gouvernance", "Gestion des risques", "Formation"] },
  { nom: "Abdoul-Razak OUMAROU MAKAMA", role: "Membre fondateur", niveau: "Senior",
    bio: "Responsable Commission Marketing et Communication. Ingénieur réseaux et télécoms. Animateur AG constitutive.",
    competences: ["Architecture réseau"], commission: "Marketing & Com" },
  { nom: "Yahaya DJIBO ISSA", role: "Membre fondateur", niveau: "Senior",
    bio: "Ingénieur Systèmes, Réseaux & Cybersécurité chez LDC Groupe. Cybersécurité offensive et défensive. Ex-BECYCURE, Groupe AYOR, Orange Niger, BAGRI.",
    competences: ["Pentest", "SOC/SIEM", "Architecture réseau", "Incident Response"] },
  { nom: "Yacoubou ATTO Housseini", role: "Membre fondateur", niveau: "Senior",
    bio: "Ingénieur Réseau & Sécurité, Resp. équipe Support IT chez INQ DIGITAL CI. Politiques de sécurité, surveillance incidents, formation/sensibilisation.",
    competences: ["Architecture réseau", "Incident Response", "Formation", "Gouvernance"] },
  { nom: "ABDRAMANE CISSÉ Ousseini", role: "Membre fondateur", niveau: "Senior",
    bio: "Ingénieur sécurité des systèmes d'information.",
    competences: ["ISO 27001"] },
  { nom: "Maliki Harouna Assad", role: "Membre fondateur", niveau: "Senior",
    bio: "1er Vice-Président APSI-NE. Ingénieur systèmes & dev full-stack Python chez SIME Informatique. Admin Linux, sécurité & cryptographie, CTF. Ex-American Tower Africa, Orozen.",
    competences: ["Dev sécurisé", "ISO 27001", "Pentest", "Architecture réseau"] },
  { nom: "CHAIBOU ABDOU Abdoul Latif", role: "Membre fondateur", niveau: "Senior",
    bio: "Ingénieur sécurité des systèmes d'information.",
    competences: ["ISO 27001"] },
  { nom: "Mamadou Coulibaly Boubacar", role: "Membre fondateur", niveau: "Senior",
    bio: "Ingénieur d'affaires.",
    competences: ["Gestion des risques", "Gouvernance"] },
  { nom: "IBRAHIM LY SOULEYMANE Ibrahim", role: "Membre fondateur", niveau: "Senior",
    bio: "Ingénieur cybersécurité.",
    competences: ["Pentest", "Gouvernance"] },
  { nom: "Abdoulkassoum Mahaman Laouan Djibril", role: "Membre fondateur", niveau: "Senior",
    bio: "Ingénieur sécurité des systèmes d'information.",
    competences: ["ISO 27001"] },
  { nom: "ABOUBACAR AMADOU Abdoul Djafar", role: "Membre fondateur", niveau: "Senior",
    bio: "Responsable Commission R&D. Ingénieur sécurité des systèmes d'information. Modérateur Masterclass Space sur X.",
    competences: ["ISO 27001", "OSINT", "Dev sécurisé"], commission: "R&D" },

  // ── Membres actifs (enrichis depuis Gwani + CR) ──
  { nom: "Abdoul Karim", role: "Membre actif", niveau: "Expert",
    bio: "Chef Département Homologation ARCEP Niger. 14 ans d'expérience télécoms & régulation. Master Gestion Politiques Cybersécurité. Expert ingénierie cybersécurité. Responsable groupe CyberNiger 2025.",
    competences: ["Gouvernance", "Architecture réseau", "Gestion des risques", "ISO 27001"] },
  { nom: "Marah Galy Adam", role: "Membre actif", niveau: "Expert",
    bio: "Responsable Commission CSEN. Security Architect à la Banque Mondiale. Master Cryptologie (Univ. Limoges). Ex-Société Générale CIB, Deloitte, Airbus Red Team. 1er prix DGSE Tracs 2019, 1er STHack CTF 2019. Créateur VulnHub Wakanda.",
    competences: ["Pentest", "Cloud Security", "Gestion des risques", "Formation", "Dev sécurisé"], commission: "CSEN" },
  { nom: "Ramzi SIDI IBRAHIM", role: "Membre actif", niveau: "Senior",
    bio: "Responsable Commission CPRI. Lead Software Developer spécialisé Java, Angular et DevSecOps. Expert développement sécurisé et audits de sécurité applicative.",
    competences: ["DevSecOps", "Dev sécurisé", "Gouvernance"], commission: "CPRI" },
  { nom: "Magassouba Sory Oulen", role: "Membre actif", niveau: "Senior",
    bio: "Responsable Commission CIATN (Insertion et Accompagnement des Talents Numériques). Présentation du programme aux nouveaux membres.",
    competences: ["Formation", "Gouvernance"], commission: "CIATN" },
  { nom: "Maliki Soumana Hamidou", role: "Membre actif", niveau: "Expert",
    bio: "Ingénieur consultant senior cybersécurité, expert IAM/IGA/PKI et sécurité Cloud. Certifié VENAFI. Ex-Clay Group, Beneva, Capgemini, BNP Paribas, Business & Decision. AWS, Azure, Terraform, DevSecOps.",
    competences: ["Cloud Security", "DevSecOps", "ISO 27001", "Gouvernance"] },
  { nom: "Hafiz Mahaman Sanoussi", role: "Membre actif", niveau: "Confirmé",
    bio: "Administrateur Réseau chez SIME Informatique. Ex-Orange Burkina Faso, ANPTIC. Spécialiste infrastructure IT, fibre optique, gestion sites web.",
    competences: ["Architecture réseau"] },
  { nom: "Abdourahamane Noury", role: "Membre actif", niveau: "Confirmé",
    bio: "Membre actif APSI-NE. Participe aux réunions hebdomadaires.",
    competences: ["Gouvernance"] },
  { nom: "Fadima", role: "Membre actif", niveau: "Confirmé",
    bio: "Membre actif APSI-NE. Impliquée dans les dossiers FORCYN et le traitement documentaire.",
    competences: ["Gouvernance"] },
  { nom: "Hacksparo", role: "Membre actif", niveau: "Confirmé",
    bio: "Membre actif APSI-NE.",
    competences: ["Pentest", "OSINT"] },
  { nom: "Maman Rabiou", role: "Membre actif", niveau: "Confirmé",
    bio: "Membre actif APSI-NE. Participe aux réunions hebdomadaires.",
    competences: ["Gouvernance"] },
  { nom: "Mahamadou Soumaila", role: "Membre actif", niveau: "Confirmé",
    bio: "Membre actif APSI-NE. Volontaire formateur.",
    competences: ["Formation"] },
  { nom: "Yacine", role: "Membre actif", niveau: "Junior",
    bio: "Nouveau membre actif APSI-NE (depuis mai 2025). A présenté Hakim comme second nouveau membre.",
    competences: [] },
  { nom: "Rahmata", role: "Membre actif", niveau: "Confirmé",
    bio: "Membre actif APSI-NE. Impliquée dans les dossiers FORCYN.",
    competences: ["Gouvernance"] },
  { nom: "Kalilou", role: "Membre actif", niveau: "Confirmé",
    bio: "Membre actif APSI-NE. Volontaire formateur (légal, compliance, cryptographie).",
    competences: ["Formation"] },
  { nom: "Issaka", role: "Membre actif", niveau: "Junior",
    bio: "Membre actif APSI-NE.",
    competences: [] },
  { nom: "Aboubakar Oumar", role: "Membre actif", niveau: "Confirmé",
    bio: "Membre actif APSI-NE.",
    competences: [] },
];

// ── Import members from CR meeting minutes ─────────────────────────

export async function importMembers(existing: Member[]): Promise<Member[]> {
  const merged = [...existing];

  // Known aliases: short CR names → parts of full KNOWN_MEMBERS names
  const ALIASES: Record<string, string> = {
    "maibirni": "mai birni", "razak makama": "oumarou makama",
    "abdoul razak": "oumarou makama", "atto housseini": "atto",
    "abdoul djafar": "amadou abdoul djafar", "djafar": "amadou abdoul djafar",
    "abdoul latif": "chaibou abdou", "assad": "maliki harouna assad",
    "maliki": "maliki harouna", "magass": "magassouba",
    "noury abdourahamane": "abdourahamane noury", "abdourahamane": "abdourahamane noury",
    "mamane rabiou": "maman rabiou", "mahamadou": "mahamadou soumaila",
    "aboubakar": "aboubakar oumar", "marah": "marah galy", "ramzi": "ramzi sidi",
    "hafiz": "hafiz mahaman", "atto": "atto housseini",
    "yahaya": "djibo issa yahaya",
  };

  // Helper: check if a member already exists
  const alreadyExists = (nom: string) => {
    if (nameExists(merged, nom)) return true;
    const nl = nom.toLowerCase().trim();
    // Check aliases
    const alias = ALIASES[nl];
    if (alias && merged.some((m) => m.nom.toLowerCase().includes(alias))) return true;
    // Check: at least 2 name parts (>3 chars) must match the same existing member
    const parts = nl.split(/\s+/).filter((p) => p.length > 3);
    if (parts.length === 0) return false;
    // For single-word names, require exact match only
    if (parts.length === 1) return false;
    return merged.some((m) => {
      const ml = m.nom.toLowerCase();
      const matchCount = parts.filter((p) => ml.includes(p)).length;
      return matchCount >= 2;
    });
  };

  // 1) Add all known members (founders + active)
  for (const km of KNOWN_MEMBERS) {
    if (alreadyExists(km.nom)) continue;
    merged.push({
      id: nextId(merged),
      nom: km.nom,
      role: km.role,
      email: "",
      competences: km.competences,
      niveau: km.niveau,
      bio: km.bio,
      disponible: true,
      commission: km.commission,
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
