import { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTheme } from "@/hooks/use-theme";
import { useGwaniImport } from "@/hooks/use-gwani-import";
import { SEED_PARTNERS, SEED_MEMBERS, SEED_PROJECTS } from "@/data/seed";
import type { Partner, Member, Project, Convention } from "@/data/types";
import { Sidebar, type TabKey } from "@/components/sidebar";
import { Dashboard } from "@/views/dashboard";
import { CRMView } from "@/views/crm";
import { MembersView } from "@/views/members";
import { HonoraryView } from "@/views/honorary";
import { ProjectsView } from "@/views/projects";
import { ConventionsView } from "@/views/conventions";
import { ChatbotView } from "@/views/chatbot";
import { NewsView } from "@/views/news";
import { CyberLabView } from "@/views/cyberlab";
import { FloatingChat } from "@/components/floating-chat";

export default function App() {
  const { colors } = useTheme();
  const validTabs: TabKey[] = ["dashboard", "crm", "members", "honorary", "projects", "conventions", "news", "chatbot", "cyberlab"];
  const getTabFromHash = (): TabKey => {
    const hash = window.location.hash.replace("#", "");
    return validTabs.includes(hash as TabKey) ? (hash as TabKey) : "dashboard";
  };
  const [tab, setTabState] = useState<TabKey>(getTabFromHash);
  const setTab = useCallback((t: TabKey) => {
    setTabState(t);
    window.location.hash = t;
  }, []);
  useEffect(() => {
    const onHash = () => setTabState(getTabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
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

  const activeMembers = members.filter((m) => m.role !== "Membre d'honneur");
  const honoraryMembers = members.filter((m) => m.role === "Membre d'honneur");

  const counts: Partial<Record<TabKey, number>> = {
    crm: partners.length,
    members: activeMembers.length,
    honorary: honoraryMembers.length,
    projects: projects.length,
    conventions: conventions.length,
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
      <div className="sidebar-desktop"><Sidebar active={tab} setActive={setTab} counts={counts} /></div>
      <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
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
          <MembersView members={activeMembers} setMembers={setMembers} allMembers={members} />
        )}
        {tab === "honorary" && (
          <HonoraryView members={honoraryMembers} setMembers={setMembers} allMembers={members} />
        )}
        {tab === "projects" && (
          <ProjectsView projects={projects} setProjects={setProjects} members={members} partners={partners} />
        )}
        {tab === "conventions" && (
          <ConventionsView conventions={conventions} setConventions={setConventions} />
        )}
        {tab === "news" && (
          <NewsView />
        )}
        {tab === "chatbot" && (
          <ChatbotView members={members} partners={partners} projects={projects} conventions={conventions} />
        )}
        {tab === "cyberlab" && (
          <CyberLabView />
        )}
      </main>
      {/* Floating Chat - available on all pages */}
      <FloatingChat members={members} partners={partners} projects={projects} conventions={conventions} />
      {/* Mobile bottom nav */}
      <nav className="mobile-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: colors.surface, borderTop: `1px solid ${colors.border}`,
        display: "none", justifyContent: "space-around", padding: "6px 0 env(safe-area-inset-bottom, 6px)",
      }}>
        {[
          { key: "dashboard" as TabKey, label: "Accueil" },
          { key: "crm" as TabKey, label: "CRM" },
          { key: "members" as TabKey, label: "Membres" },
          { key: "honorary" as TabKey, label: "Honneur" },
          { key: "projects" as TabKey, label: "Projets" },
          { key: "conventions" as TabKey, label: "Conv." },
          { key: "news" as TabKey, label: "Actus" },
          { key: "chatbot" as TabKey, label: "Chat IA" },
          { key: "cyberlab" as TabKey, label: "CyberLab" },
        ].map((n) => (
          <button key={n.key} onClick={() => setTab(n.key)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: tab === n.key ? colors.accent : colors.muted,
              fontSize: "0.65rem", fontWeight: tab === n.key ? 700 : 500,
              fontFamily: "inherit", display: "flex", flexDirection: "column",
              alignItems: "center", gap: "2px", padding: "4px 8px",
            }}>
            <span style={{ fontSize: "0.68rem" }}>{n.label}</span>
            {(counts?.[n.key] ?? 0) > 0 && (
              <span style={{ fontSize: "0.62rem", color: colors.accent }}>{counts[n.key]}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
