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
