import { useEffect, useState, useRef } from "react";

import type { Member, Partner, Project, Convention } from "@/data/types";
import {
  alreadyImported,
  markImported,
  importMembers,
  importPartners,
  importProjects,
  importConventions,
} from "@/services/gwani-import";

interface ImportState {
  loading: boolean;
  done: boolean;
  error: string;
  step: string;
}

/**
 * On first load (if Gwani is configured and import hasn't run yet),
 * fetches real data from the Gwani RAG API and merges it into localStorage.
 */
export function useGwaniImport(
  members: Member[],
  setMembers: (m: Member[]) => void,
  partners: Partner[],
  setPartners: (p: Partner[]) => void,
  projects: Project[],
  setProjects: (p: Project[]) => void,
  conventions: Convention[],
  setConventions: (c: Convention[]) => void,
): ImportState {
  const [state, setState] = useState<ImportState>({
    loading: false,
    done: alreadyImported(),
    error: "",
    step: "",
  });

  // Use refs to avoid re-running on every state change
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    if (alreadyImported()) return;

    ranRef.current = true;

    (async () => {
      setState({ loading: true, done: false, error: "", step: "Import des membres..." });

      try {
        // 1) Members (downloads CR files + adds founders + honorary via chat)
        const newMembers = await importMembers(members);
        setMembers(newMembers);

        // 2) Partners (local known data, no API call needed)
        setState((s) => ({ ...s, step: "Import des partenaires..." }));
        const newPartners = await importPartners(partners);
        setPartners(newPartners);

        // 3) Projects (local known data, no API call needed)
        setState((s) => ({ ...s, step: "Import des projets..." }));
        const newProjects = await importProjects(projects);
        setProjects(newProjects);

        // 4) Conventions (local known data, no API call needed)
        setState((s) => ({ ...s, step: "Import des conventions..." }));
        const newConventions = await importConventions(conventions);
        setConventions(newConventions);

        markImported();
        setState({ loading: false, done: true, error: "", step: "" });
      } catch (err) {
        console.error("[Gwani Import]", err);
        markImported(); // Don't retry endlessly on failure
        setState({
          loading: false,
          done: true,
          error: err instanceof Error ? err.message : "Erreur d'import",
          step: "",
        });
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}

// @ts-ignore -- kept for future use
// function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
