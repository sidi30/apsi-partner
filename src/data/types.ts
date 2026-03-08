import type { StatutKey } from "./constants";

export interface Partner {
  id: number;
  nom: string;
  org: string;
  email: string;
  tel: string;
  secteur: string;
  statut: StatutKey;
  notes: string;
  date: string;
}

export interface Member {
  id: number;
  nom: string;
  role: string;
  email: string;
  competences: string[];
  niveau: string;
  bio: string;
  disponible: boolean;
  commission?: string;
  photo?: string;
  trigramme?: string;
  linkedin?: string;
  cv?: string;
}

export interface Project {
  id: number;
  titre: string;
  type: string;
  description: string;
  statut: string;
  deadline: string;
  membres: number[];
  partenaireId?: number;
}

export interface Convention {
  id: number;
  titre: string;
  partenaire: string;
  objet: string;
  duree: string;
  contenu: string;
  statut: "brouillon" | "en_attente" | "signe";
  dateCreation: string;
  dateSigne?: string;
  signature: string | null;
}
