import {
  LayoutDashboard,
  Users,
  UserCheck,
  FolderKanban,
  FileText,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { config } from "@/lib/config";
import { useTheme, THEME_LABELS, type ThemeKey } from "@/hooks/use-theme";

const NAV = [
  { key: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { key: "crm", icon: UserCheck, label: "Partenaires" },
  { key: "members", icon: Users, label: "Membres" },
  { key: "projects", icon: FolderKanban, label: "Projets" },
  { key: "conventions", icon: FileText, label: "Conventions" },
] as const;

export type TabKey = (typeof NAV)[number]["key"];

interface SidebarProps {
  active: TabKey;
  setActive: (tab: TabKey) => void;
  counts?: Partial<Record<TabKey, number>>;
}

const THEME_KEYS: ThemeKey[] = ["dark", "light", "pro-blue"];

export function Sidebar({ active, setActive, counts }: SidebarProps) {
  const { theme, setTheme, colors } = useTheme();

  return (
    <div
      className="w-[210px] min-w-[210px] flex flex-col h-full shrink-0"
      style={{
        background: colors.surface,
        borderRight: `1px solid ${colors.border}`,
      }}
    >
      {/* Logo */}
      <div
        className="px-4 pt-5 pb-3.5"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <div
          className="font-extrabold text-lg tracking-[0.12em]"
          style={{ color: colors.accent }}
        >
          {config.orgName}
        </div>
        <div
          className="text-[0.58rem] tracking-[0.18em] mt-0.5"
          style={{ color: colors.muted }}
        >
          PLATEFORME PARTENARIATS
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 flex flex-col gap-0.5 mt-1">
        {NAV.map((n) => {
          const isActive = active === n.key;
          const Icon = n.icon;
          return (
            <button
              key={n.key}
              onClick={() => setActive(n.key)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[0.8rem] font-medium cursor-pointer transition-all text-left font-mono"
              style={{
                background: isActive ? colors.accent + "14" : "transparent",
                color: isActive ? colors.accent : colors.muted,
                border: `1px solid ${isActive ? colors.accent + "35" : "transparent"}`,
                fontWeight: isActive ? 700 : 500,
              }}
            >
              <Icon
                size={16}
                className={cn(isActive ? "opacity-100" : "opacity-70")}
              />
              {n.label}
              {(counts?.[n.key] ?? 0) > 0 && (
                <span
                  className="ml-auto rounded-full text-[0.65rem] px-1.5 py-px font-bold"
                  style={{
                    background: colors.accent + "25",
                    color: colors.accent,
                  }}
                >
                  {counts?.[n.key]}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Theme picker */}
      <div
        className="px-4 py-3"
        style={{ borderTop: `1px solid ${colors.border}` }}
      >
        <div
          className="flex items-center gap-1.5 text-[0.68rem] mb-2"
          style={{ color: colors.muted }}
        >
          <Palette size={12} />
          Thème
        </div>
        <div className="flex gap-1.5">
          {THEME_KEYS.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className="flex-1 rounded-md px-1 py-1 text-[0.62rem] font-semibold cursor-pointer transition-all font-mono"
              style={{
                background: theme === t ? colors.accent + "20" : "transparent",
                color: theme === t ? colors.accent : colors.muted,
                border: `1px solid ${theme === t ? colors.accent + "50" : colors.border}`,
              }}
              title={THEME_LABELS[t]}
            >
              {THEME_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3.5"
        style={{ borderTop: `1px solid ${colors.border}` }}
      >
        <div
          className="text-[0.68rem] flex items-center gap-1.5"
          style={{ color: colors.muted }}
        >
          <span className="text-[0.6rem]" style={{ color: colors.success }}>
            &#x25CF;
          </span>
          {config.driveLink ? (
            <a
              href={config.driveLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Drive connecté
            </a>
          ) : (
            "Drive non configuré"
          )}
        </div>
        <div
          className="text-[0.6rem] mt-0.5 opacity-60"
          style={{ color: colors.muted }}
        >
          {config.orgEmail}
        </div>
      </div>
    </div>
  );
}
