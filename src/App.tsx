import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTheme } from "@/hooks/use-theme";
import { useGwaniImport } from "@/hooks/use-gwani-import";
import { SEED_PARTNERS, SEED_MEMBERS, SEED_PROJECTS } from "@/data/seed";
import type { Partner, Member, Project, Convention } from "@/data/types";
import { Sidebar, type TabKey } from "@/components/sidebar";
import { Dashboard } from "@/views/dashboard";
import { CRMView } from "@/views/crm";
import { MembersView } from "@/views/members";
import { ProjectsView } from "@/views/projects";
import { ConventionsView } from "@/views/conventions";

export default function App() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [partners, setPartners] = useLocalStorage<Partner[]>("apsi_partners", SEED_PARTNERS);
  const [members, setMembers] = useLocalStorage<Member[]>("apsi_members", SEED_MEMBERS);
  const [projects, setProjects] = useLocalStorage<Project[]>("apsi_projects", SEED_PROJECTS);
  const [conventions, setConventions] = useLocalStorage<Convention[]>("apsi_conventions", []);

  // Import real data from Gwani API on first load
  const gwaniImport = useGwaniImport(
    members, setMembers,
    partners, setPartners,
    projects, setProjects,
    conventions, setConventions,
  );

  const counts: Partial<Record<TabKey, number>> = {
    crm: partners.filter((p) => p.statut === "nego").length,
    projects: projects.filter((p) => p.statut === "En cours").length,
    conventions: conventions.filter((c) => c.statut !== "signe").length,
  };

  return (
    <div
      style={{
        background: colors.bg,
        color: colors.text,
        fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
        height: "100vh",
        display: "flex",
        overflow: "hidden",
      }}
    >
      <Sidebar active={tab} setActive={setTab} counts={counts} />
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {gwaniImport.loading && (
          <div style={{
            background: colors.surface,
            border: `1px solid ${colors.blue}`,
            borderRadius: 8,
            padding: "12px 20px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: "0.85rem",
            color: colors.blue,
          }}>
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>&#x21bb;</span>
            <span>Synchronisation Gwani en cours... {gwaniImport.step}</span>
          </div>
        )}
        {gwaniImport.error && (
          <div style={{
            background: colors.surface,
            border: `1px solid ${colors.warn}`,
            borderRadius: 8,
            padding: "12px 20px",
            marginBottom: 16,
            fontSize: "0.85rem",
            color: colors.warn,
          }}>
            Import Gwani partiel : {gwaniImport.error}
          </div>
        )}
        {tab === "dashboard" && (
          <Dashboard partners={partners} members={members} projects={projects} conventions={conventions} />
        )}
        {tab === "crm" && (
          <CRMView partners={partners} setPartners={setPartners} />
        )}
        {tab === "members" && (
          <MembersView members={members} setMembers={setMembers} />
        )}
        {tab === "projects" && (
          <ProjectsView projects={projects} setProjects={setProjects} members={members} partners={partners} />
        )}
        {tab === "conventions" && (
          <ConventionsView conventions={conventions} setConventions={setConventions} />
        )}
      </main>
    </div>
  );
}
