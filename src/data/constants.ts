// ── Statuts pipeline partenaires ──

export const STATUTS = [
  { key: "prospect", label: "Prospecté", color: "#6B7280" },
  { key: "contacte", label: "Contacté", color: "#F59E0B" },
  { key: "nego", label: "Négociation", color: "#4F83F7" },
  { key: "signe", label: "Signé ✓", color: "#10B981" },
  { key: "archive", label: "Archivé", color: "#374151" },
] as const;

export type StatutKey = (typeof STATUTS)[number]["key"];

// ── Listes de référence ──

export const SECTEURS = [
  "Banque / Finance",
  "Télécoms",
  "Gouvernement / État",
  "ONG / Org. Int.",
  "Éducation / Université",
  "Santé",
  "Industrie",
  "Tech / Startup",
  "Média",
  "Autre",
] as const;

export const COMPETENCES = [
  "Pentest",
  "SOC/SIEM",
  "ISO 27001",
  "Cloud Security",
  "DevSecOps",
  "Forensique",
  "OSINT",
  "Gestion des risques",
  "Formation",
  "Gouvernance",
  "Dev sécurisé",
  "Architecture réseau",
  "Incident Response",
  "DPO/RGPD",
  "SBOM/CRA",
  "CTI",
] as const;

export const NIVEAUX = ["Junior", "Confirmé", "Senior", "Expert"] as const;

export const TYPES_PROJET = [
  "Audit de sécurité",
  "Formation / Sensibilisation",
  "Certification",
  "Événement",
  "Conseil stratégique",
  "R&D",
  "Partenariat",
] as const;

export const EMAIL_TYPES = [
  { key: "prospection", label: "Prospection initiale" },
  { key: "relance", label: "Relance (sans réponse)" },
  { key: "proposition", label: "Proposition de partenariat" },
  { key: "invitation_forcyn", label: "Invitation FORCYN 2025" },
  { key: "remerciement", label: "Remerciement post-réunion" },
  { key: "suivi", label: "Suivi de convention" },
] as const;

export const ROLES_MEMBRE = [
  "Membre fondateur",
  "Membre d'honneur",
  "Membre actif",
  "Étudiant",
] as const;

export const DUREES_CONVENTION = [
  "6 mois",
  "1 an",
  "2 ans",
  "3 ans",
  "Indéterminée",
] as const;

export const STATUTS_PROJET = [
  "Planifié",
  "En cours",
  "Terminé",
  "Suspendu",
] as const;
