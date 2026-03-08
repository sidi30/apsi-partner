import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/hooks/use-theme";
import {
  smartFetch,
  forceRefresh,
  getNextRefreshTime,
  getStats,
  FEEDS,
  type RSSArticle,
} from "@/services/rss";

type CategoryFilter = "all" | "monde" | "afrique" | "alertes" | "technique";

const CATEGORY_META: Record<CategoryFilter, { label: string; color: string; icon: string }> = {
  all: { label: "Tout", color: "accent", icon: "&#x25C9;" },
  monde: { label: "Monde", color: "blue", icon: "&#x1F310;" },
  afrique: { label: "Afrique", color: "success", icon: "&#x1F30D;" },
  alertes: { label: "Alertes", color: "danger", icon: "&#x1F6A8;" },
  technique: { label: "Technique", color: "warn", icon: "&#x1F4F0;" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NewsView() {
  const { colors } = useTheme();
  const [articles, setArticles] = useState<RSSArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [countdown, setCountdown] = useState("--:--");
  const [lastUpdate, setLastUpdate] = useState("");
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  // Countdown timer
  const updateCountdown = useCallback(() => {
    const { label } = getNextRefreshTime();
    setCountdown(label);
  }, []);

  useEffect(() => {
    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 30000);
    return () => clearInterval(countdownRef.current);
  }, [updateCountdown]);

  // Initial load
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const { articles: fetched, fromCache } = await smartFetch((done, total) =>
        setProgress({ done, total }),
      );
      setArticles(fetched);
      setLastUpdate(fromCache ? "Cache" : new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      // keep existing articles
    }
    setLoading(false);
    updateCountdown();
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const fetched = await forceRefresh((done, total) => setProgress({ done, total }));
      setArticles(fetched);
      setLastUpdate(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      // keep existing
    }
    setLoading(false);
    updateCountdown();
  };

  // Filter articles
  const filtered = articles.filter((a) => {
    if (filter !== "all" && a.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.source.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = getStats(articles);

  // Separate featured (first 3) and rest
  const featured = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ── Header ── */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ color: colors.text, fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
            Cyber Actualités
          </h1>
          <p style={{ color: colors.muted, fontSize: "0.78rem", marginTop: "4px" }}>
            Veille cybersécurité en temps réel — Monde & Afrique
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Countdown */}
          <div style={{
            background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "10px",
            padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <div style={{ fontSize: "0.6rem", color: colors.muted, lineHeight: "1.3" }}>
              <div>Prochain refresh</div>
              <div style={{ color: colors.accent, fontWeight: 700, fontSize: "0.85rem" }}>{countdown}</div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              background: colors.accent, color: "#051210", border: "none", borderRadius: "10px",
              padding: "10px 18px", fontSize: "0.75rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", opacity: loading ? 0.6 : 1, transition: "all 0.15s",
            }}
          >
            {loading ? `${progress.done}/${progress.total}` : "Actualiser"}
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid-2col dashboard-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {([
          { label: "Aujourd'hui", value: stats.today, color: colors.accent, icon: "&#x26A1;" },
          { label: "Cette semaine", value: stats.thisWeek, color: colors.blue, icon: "&#x1F4C5;" },
          { label: "Sources", value: FEEDS.length, color: colors.success, icon: "&#x1F4E1;" },
          { label: "Total articles", value: stats.total, color: colors.warn, icon: "&#x1F4F0;" },
        ] as const).map((s) => (
          <div key={s.label} style={{
            background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px",
            padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px",
          }}>
            <div style={{ fontSize: "1.4rem" }} dangerouslySetInnerHTML={{ __html: s.icon }} />
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.62rem", color: colors.muted }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Cyber Intelligence Dashboard ── */}
      <CyberDashboard colors={colors} />

      {/* ── Filters ── */}
      <div className="filter-bar" style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {(Object.keys(CATEGORY_META) as CategoryFilter[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const isActive = filter === cat;
          const catColor = (colors as Record<string, string>)[meta.color] || colors.accent;
          const count = cat === "all" ? articles.length : articles.filter((a) => a.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                background: isActive ? catColor + "18" : "transparent",
                border: `1px solid ${isActive ? catColor + "50" : colors.border}`,
                color: isActive ? catColor : colors.muted,
                borderRadius: "999px", padding: "6px 14px", fontSize: "0.72rem",
                fontWeight: isActive ? 700 : 500, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s", display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: meta.icon }} style={{ fontSize: "0.8rem" }} />
              {meta.label}
              <span style={{
                fontSize: "0.6rem", background: isActive ? catColor + "30" : colors.surface,
                padding: "1px 6px", borderRadius: "999px", fontWeight: 700,
              }}>{count}</span>
            </button>
          );
        })}

        <div style={{ flex: 1 }} />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          style={{
            background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "10px",
            padding: "7px 14px", fontSize: "0.75rem", color: colors.text, fontFamily: "inherit",
            outline: "none", minWidth: "180px", maxWidth: "280px",
          }}
        />

        {lastUpdate && (
          <span style={{ fontSize: "0.6rem", color: colors.muted }}>
            MAJ: {lastUpdate}
          </span>
        )}
      </div>

      {/* ── Loading bar ── */}
      {loading && (
        <div style={{
          background: colors.surface, borderRadius: "8px", overflow: "hidden", height: "4px",
        }}>
          <div style={{
            width: progress.total ? `${(progress.done / progress.total) * 100}%` : "30%",
            height: "100%", background: colors.accent, borderRadius: "8px",
            transition: "width 0.3s ease",
            animation: progress.total ? "none" : "pulse 1.5s ease-in-out infinite",
          }} />
        </div>
      )}

      {/* ── Featured articles (top 3) ── */}
      {filtered.length > 0 && (
        <div className="grid-2col" style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "12px",
        }}>
          {/* Main featured */}
          {featured[0] && (
            <a
              href={featured[0].link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                gridRow: "1 / 3",
                background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px",
                overflow: "hidden", textDecoration: "none", color: "inherit",
                display: "flex", flexDirection: "column", transition: "all 0.2s",
                position: "relative",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = "none"; }}
            >
              {featured[0].thumbnail && (
                <div style={{
                  height: "200px", background: `url(${featured[0].thumbnail}) center/cover no-repeat`,
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: "80px",
                    background: `linear-gradient(transparent, ${colors.surface})`,
                  }} />
                </div>
              )}
              <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <CategoryBadge category={featured[0].category} colors={colors} />
                  {featured[0].isNew && <NewBadge colors={colors} />}
                  <span style={{ fontSize: "0.6rem", color: colors.muted, marginLeft: "auto" }}>
                    {featured[0].sourceIcon} {featured[0].source}
                  </span>
                </div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: colors.text, lineHeight: "1.4", margin: "0 0 10px 0" }}>
                  {featured[0].title}
                </h2>
                <p style={{ fontSize: "0.78rem", color: colors.muted, lineHeight: "1.6", flex: 1 }}>
                  {featured[0].description}
                </p>
                <div style={{ fontSize: "0.62rem", color: colors.muted, marginTop: "10px", display: "flex", justifyContent: "space-between" }}>
                  <span>{timeAgo(featured[0].pubDate)}</span>
                  <span>{formatDate(featured[0].pubDate)}</span>
                </div>
              </div>
            </a>
          )}

          {/* Side featured */}
          {featured.slice(1, 3).map((article) => (
            <ArticleCard key={article.id} article={article} colors={colors} variant="compact" />
          ))}
        </div>
      )}

      {/* ── Source badges ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
        <span style={{ fontSize: "0.6rem", color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginRight: "4px" }}>
          Sources actives :
        </span>
        {FEEDS.map((f) => (
          <span key={f.name} style={{
            fontSize: "0.58rem", padding: "3px 8px", borderRadius: "999px",
            background: colors.surface, border: `1px solid ${colors.border}`,
            color: colors.muted, fontWeight: 500,
          }}>
            {f.icon} {f.name}
          </span>
        ))}
      </div>

      {/* ── Articles grid ── */}
      {rest.length > 0 && (
        <div className="grid-2col" style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px",
        }}>
          {rest.map((article) => (
            <ArticleCard key={article.id} article={article} colors={colors} variant="full" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          color: colors.muted,
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>&#x1F4E1;</div>
          <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>
            {articles.length === 0 ? "Aucun article chargé" : "Aucun résultat pour ce filtre"}
          </div>
          <div style={{ fontSize: "0.75rem", marginTop: "6px" }}>
            {articles.length === 0
              ? "Cliquez sur \"Actualiser\" pour charger les flux RSS"
              : "Essayez un autre filtre ou terme de recherche"}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function CategoryBadge({ category, colors }: { category: RSSArticle["category"]; colors: Record<string, string> }) {
  const meta: Record<string, { label: string; color: string }> = {
    monde: { label: "Monde", color: colors.blue },
    afrique: { label: "Afrique", color: colors.success },
    alertes: { label: "Alerte", color: colors.danger },
    technique: { label: "Tech", color: colors.warn },
  };
  const m = meta[category] || meta.monde;
  return (
    <span style={{
      fontSize: "0.55rem", padding: "2px 8px", borderRadius: "999px", fontWeight: 700,
      background: m.color + "18", color: m.color, border: `1px solid ${m.color}35`,
      textTransform: "uppercase", letterSpacing: "0.08em",
    }}>
      {m.label}
    </span>
  );
}

function NewBadge({ colors }: { colors: Record<string, string> }) {
  return (
    <span style={{
      fontSize: "0.5rem", padding: "2px 6px", borderRadius: "999px", fontWeight: 800,
      background: colors.danger + "20", color: colors.danger, border: `1px solid ${colors.danger}40`,
      animation: "pulse 2s ease-in-out infinite",
    }}>
      NEW
    </span>
  );
}

/* ── Cyber Intelligence Dashboard ── */

const THREAT_LANDSCAPE = [
  { type: "Ransomware", pct: 32, trend: "+12%", icon: "🔐", desc: "LockBit, BlackCat, Cl0p dominent" },
  { type: "Phishing / BEC", pct: 25, trend: "+8%", icon: "🎣", desc: "IA générative amplifie les campagnes" },
  { type: "Supply Chain", pct: 15, trend: "+22%", icon: "🔗", desc: "Attaques via dépendances logicielles" },
  { type: "Zero-Day", pct: 11, trend: "+18%", icon: "💥", desc: "Vulnérabilités exploitées avant patch" },
  { type: "DDoS", pct: 9, trend: "+5%", icon: "🌊", desc: "Hacktivisme et extorsion" },
  { type: "Insider Threat", pct: 8, trend: "-3%", icon: "👤", desc: "Menaces internes et négligence" },
];

const GLOBAL_STATS = [
  { label: "Coût moyen ransomware", value: "$4.7M", sub: "par incident (2025)", color: "danger" },
  { label: "Attaques/jour (monde)", value: "4 000+", sub: "tentatives quotidiennes", color: "warn" },
  { label: "Temps moyen détection", value: "194j", sub: "avant identification breach", color: "blue" },
  { label: "Pénurie cyber talents", value: "3.5M", sub: "postes non pourvus", color: "accent" },
];

const AFRICA_STATS = [
  { label: "Pertes cybercrime Afrique", value: "$3.7Mds", sub: "estimation annuelle 2025", icon: "💰" },
  { label: "Pays avec CERT national", value: "38/54", sub: "dont Niger (ANSI)", icon: "🏛️" },
  { label: "Hausse attaques Afrique", value: "+23%", sub: "vs 2024 (INTERPOL)", icon: "📈" },
  { label: "Mobile banking ciblé", value: "45%", sub: "des fraudes en Afrique de l'Ouest", icon: "📱" },
];

const SECTORS_TARGETED = [
  { sector: "Finance / Banque", pct: 22, color: "#F59E0B" },
  { sector: "Santé", pct: 18, color: "#EF4444" },
  { sector: "Gouvernement", pct: 16, color: "#3B82F6" },
  { sector: "Éducation", pct: 12, color: "#8B5CF6" },
  { sector: "Énergie", pct: 10, color: "#10B981" },
  { sector: "Télécoms", pct: 9, color: "#EC4899" },
  { sector: "Industrie", pct: 8, color: "#6366F1" },
  { sector: "Autre", pct: 5, color: "#94A3B8" },
];

function CyberDashboard({ colors }: { colors: Record<string, string> }) {
  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem("apsi_cyber_dash") !== "0"; } catch { return true; }
  });
  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    localStorage.setItem("apsi_cyber_dash", next ? "1" : "0");
  };

  return (
    <div style={{
      background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px",
      overflow: "hidden",
    }}>
      {/* Toggle header */}
      <button
        onClick={toggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "inherit", color: colors.text,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.1rem" }}>&#x1F4CA;</span>
          <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>Tableau de bord Cyber Intelligence</span>
          <span style={{
            fontSize: "0.55rem", padding: "2px 8px", borderRadius: "999px", fontWeight: 700,
            background: colors.accent + "18", color: colors.accent, border: `1px solid ${colors.accent}35`,
          }}>LIVE 2025</span>
        </div>
        <span style={{ color: colors.muted, fontSize: "0.75rem", transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none" }}>
          &#x25BC;
        </span>
      </button>

      {expanded && (
        <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* ── Row 1: Global stats ── */}
          <div className="grid-2col dashboard-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            {GLOBAL_STATS.map((s) => (
              <div key={s.label} style={{
                background: colors.bg, borderRadius: "12px", padding: "14px 16px",
                borderLeft: `3px solid ${(colors as Record<string, string>)[s.color]}`,
              }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: (colors as Record<string, string>)[s.color] }}>{s.value}</div>
                <div style={{ fontSize: "0.68rem", color: colors.text, fontWeight: 600, marginTop: "2px" }}>{s.label}</div>
                <div style={{ fontSize: "0.58rem", color: colors.muted, marginTop: "2px" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Row 2: Threat landscape + Sectors ── */}
          <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "14px" }}>
            {/* Threat types ranking */}
            <div style={{ background: colors.bg, borderRadius: "12px", padding: "16px" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: colors.text, marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>&#x1F3AF;</span> Classement des menaces 2025
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {THREAT_LANDSCAPE.map((t, i) => (
                  <div key={t.type}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.85rem", width: "20px", textAlign: "center" }}>{t.icon}</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: colors.text, flex: 1 }}>
                        <span style={{ color: colors.muted, fontWeight: 500, marginRight: "6px" }}>#{i + 1}</span>
                        {t.type}
                      </span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: colors.accent }}>{t.pct}%</span>
                      <span style={{
                        fontSize: "0.55rem", fontWeight: 700, padding: "1px 6px", borderRadius: "999px",
                        background: t.trend.startsWith("+") ? colors.danger + "15" : colors.success + "15",
                        color: t.trend.startsWith("+") ? colors.danger : colors.success,
                      }}>{t.trend}</span>
                    </div>
                    {/* Bar */}
                    <div style={{ marginLeft: "28px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1, height: "6px", background: colors.border, borderRadius: "999px", overflow: "hidden" }}>
                        <div style={{
                          width: `${t.pct}%`, height: "100%", borderRadius: "999px",
                          background: `linear-gradient(90deg, ${colors.accent}, ${colors.blue})`,
                          transition: "width 0.8s ease",
                        }} />
                      </div>
                      <span style={{ fontSize: "0.55rem", color: colors.muted, minWidth: "90px" }}>{t.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sectors targeted */}
            <div style={{ background: colors.bg, borderRadius: "12px", padding: "16px" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: colors.text, marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>&#x1F3E2;</span> Secteurs les plus ciblés
              </div>
              {/* Donut-style visual */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {SECTORS_TARGETED.map((s) => (
                  <div key={s.sector} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "10px", height: "10px", borderRadius: "3px",
                      background: s.color, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: "0.7rem", color: colors.text, flex: 1, fontWeight: 500 }}>{s.sector}</span>
                    <div style={{ width: "100px", height: "8px", background: colors.border, borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{
                        width: `${(s.pct / 22) * 100}%`, height: "100%", borderRadius: "999px",
                        background: s.color, transition: "width 0.8s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: s.color, minWidth: "30px", textAlign: "right" }}>{s.pct}%</span>
                  </div>
                ))}
              </div>

              {/* Highlight */}
              <div style={{
                marginTop: "14px", padding: "10px 12px", background: colors.danger + "10",
                border: `1px solid ${colors.danger}25`, borderRadius: "10px",
              }}>
                <div style={{ fontSize: "0.62rem", color: colors.danger, fontWeight: 700, marginBottom: "3px" }}>
                  &#x26A0; Alerte sectorielle
                </div>
                <div style={{ fontSize: "0.6rem", color: colors.muted, lineHeight: "1.5" }}>
                  Le secteur financier reste la cible #1 avec une hausse de 35% des attaques sur les services bancaires mobiles en Afrique de l'Ouest.
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 3: Africa Focus ── */}
          <div style={{
            background: `linear-gradient(135deg, ${colors.success}08, ${colors.bg})`,
            border: `1px solid ${colors.success}25`, borderRadius: "12px", padding: "16px",
          }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: colors.success, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1rem" }}>&#x1F30D;</span>
              Focus Afrique — Cybersécurité 2025
              <span style={{
                fontSize: "0.5rem", padding: "2px 8px", borderRadius: "999px", fontWeight: 700,
                background: colors.success + "18", color: colors.success,
                marginLeft: "auto",
              }}>
                Source: INTERPOL / ITU / AfricaCERT
              </span>
            </div>
            <div className="grid-2col dashboard-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
              {AFRICA_STATS.map((s) => (
                <div key={s.label} style={{
                  background: colors.surface, borderRadius: "10px", padding: "14px",
                  display: "flex", alignItems: "flex-start", gap: "10px",
                }}>
                  <span style={{ fontSize: "1.3rem" }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: colors.success }}>{s.value}</div>
                    <div style={{ fontSize: "0.65rem", color: colors.text, fontWeight: 600, marginTop: "2px" }}>{s.label}</div>
                    <div style={{ fontSize: "0.55rem", color: colors.muted, marginTop: "2px" }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Africa highlights */}
            <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
              <div style={{ background: colors.surface, borderRadius: "10px", padding: "12px 14px" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: colors.warn, marginBottom: "6px" }}>
                  &#x1F4A1; Tendances Afrique de l'Ouest
                </div>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.6rem", color: colors.muted, lineHeight: "1.8" }}>
                  <li>Fraude au <strong style={{ color: colors.text }}>mobile money</strong> en forte hausse (+45%)</li>
                  <li>Campagnes de <strong style={{ color: colors.text }}>phishing SMS</strong> ciblant Orange Money, MTN</li>
                  <li>Ransomware sur les <strong style={{ color: colors.text }}>institutions publiques</strong></li>
                  <li>Manque de <strong style={{ color: colors.text }}>formation</strong> en réponse aux incidents</li>
                </ul>
              </div>
              <div style={{ background: colors.surface, borderRadius: "10px", padding: "12px 14px" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: colors.blue, marginBottom: "6px" }}>
                  &#x1F6E1; Initiatives régionales
                </div>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.6rem", color: colors.muted, lineHeight: "1.8" }}>
                  <li><strong style={{ color: colors.text }}>Convention de Malabo</strong> — cadre juridique UA</li>
                  <li><strong style={{ color: colors.text }}>AfricaCERT</strong> — coordination CSIRT continentale</li>
                  <li><strong style={{ color: colors.text }}>ANSI Niger</strong> — Agence Nationale de Sécurité Informatique</li>
                  <li><strong style={{ color: colors.text }}>Cyber Africa Forum</strong> — Abidjan, événement annuel</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ArticleCard({
  article,
  colors,
  variant,
}: {
  article: RSSArticle;
  colors: Record<string, string>;
  variant: "full" | "compact";
}) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: "14px",
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.accent;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 24px ${colors.accent}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {variant === "full" && article.thumbnail && (
        <div style={{
          height: "120px",
          background: `url(${article.thumbnail}) center/cover no-repeat`,
          position: "relative",
        }}>
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "40px",
            background: `linear-gradient(transparent, ${colors.surface})`,
          }} />
        </div>
      )}
      <div style={{ padding: variant === "compact" ? "14px 16px" : "14px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
          <CategoryBadge category={article.category} colors={colors} />
          {article.isNew && <NewBadge colors={colors} />}
          <span style={{ fontSize: "0.55rem", color: colors.muted, marginLeft: "auto" }}>
            {timeAgo(article.pubDate)}
          </span>
        </div>
        <h3 style={{
          fontSize: variant === "compact" ? "0.82rem" : "0.85rem",
          fontWeight: 700,
          color: colors.text,
          lineHeight: "1.4",
          margin: "0 0 6px 0",
          display: "-webkit-box",
          WebkitLineClamp: variant === "compact" ? 2 : 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {article.title}
        </h3>
        {variant === "full" && (
          <p style={{
            fontSize: "0.72rem", color: colors.muted, lineHeight: "1.5", margin: 0,
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
            flex: 1,
          }}>
            {article.description}
          </p>
        )}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: "8px", fontSize: "0.58rem", color: colors.muted,
        }}>
          <span>{article.sourceIcon} {article.source}</span>
          <span style={{ color: colors.accent, fontWeight: 600 }}>Lire &rarr;</span>
        </div>
      </div>
    </a>
  );
}
