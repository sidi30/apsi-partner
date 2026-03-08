/**
 * RSS Feed Service — fetches cybersecurity news from multiple sources.
 * Uses multiple CORS proxies with fallback + native XML parsing.
 * Smart scheduling: spreads requests between 7h-00h.
 * Caches in localStorage with TTL and a visible countdown timer.
 */

export interface RSSArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  thumbnail: string;
  source: string;
  sourceIcon: string;
  category: "monde" | "afrique" | "alertes" | "technique";
  isNew: boolean;
}

interface FeedConfig {
  name: string;
  url: string;
  category: RSSArticle["category"];
  icon: string;
  lang: "fr" | "en";
}

export const FEEDS: FeedConfig[] = [
  // ── Monde ──
  {
    name: "The Hacker News",
    url: "https://feeds.feedburner.com/TheHackersNews",
    category: "monde",
    icon: "🌐",
    lang: "en",
  },
  {
    name: "BleepingComputer",
    url: "https://www.bleepingcomputer.com/feed/",
    category: "monde",
    icon: "💻",
    lang: "en",
  },
  {
    name: "Security Affairs",
    url: "https://securityaffairs.com/feed",
    category: "monde",
    icon: "🛡️",
    lang: "en",
  },
  {
    name: "Dark Reading",
    url: "https://www.darkreading.com/rss.xml",
    category: "monde",
    icon: "🔒",
    lang: "en",
  },
  // ── Afrique & Francophone ──
  {
    name: "Africa Cybersecurity Mag",
    url: "https://cybersecuritymag.africa/feed",
    category: "afrique",
    icon: "🌍",
    lang: "fr",
  },
  {
    name: "CIO Mag Afrique",
    url: "https://cio-mag.com/feed/",
    category: "afrique",
    icon: "📡",
    lang: "fr",
  },
  // ── Alertes ──
  {
    name: "CERT-FR",
    url: "https://www.cert.ssi.gouv.fr/feed/",
    category: "alertes",
    icon: "🚨",
    lang: "fr",
  },
  // ── Technique ──
  {
    name: "Le Monde Informatique",
    url: "https://www.lemondeinformatique.fr/flux-rss/thematique/securite/rss.xml",
    category: "technique",
    icon: "📰",
    lang: "fr",
  },
  {
    name: "Krebs on Security",
    url: "https://krebsonsecurity.com/feed/",
    category: "technique",
    icon: "🔍",
    lang: "en",
  },
];

const CACHE_KEY = "apsi_rss_cache";
const LAST_FETCH_KEY = "apsi_rss_last_fetch";

/** Refresh every 2h30 */
const REFRESH_INTERVAL_MS = 2.5 * 60 * 60 * 1000;

/** Only fetch between 7h and midnight */
function isInFetchWindow(): boolean {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 24;
}

export function getNextRefreshTime(): { ms: number; label: string } {
  const lastFetch = getLastFetchTime();
  if (!lastFetch) return { ms: 0, label: "Maintenant" };

  const nextFetch = lastFetch + REFRESH_INTERVAL_MS;
  const now = Date.now();
  const diff = nextFetch - now;

  if (diff <= 0) return { ms: 0, label: "Maintenant" };

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;

  if (hours > 0) return { ms: diff, label: `${hours}h${remainMins.toString().padStart(2, "0")}` };
  return { ms: diff, label: `${mins}min` };
}

function getLastFetchTime(): number {
  try {
    return parseInt(localStorage.getItem(LAST_FETCH_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

function setLastFetchTime() {
  localStorage.setItem(LAST_FETCH_KEY, Date.now().toString());
}

export function isCacheValid(): boolean {
  const last = getLastFetchTime();
  if (!last) return false;
  return Date.now() - last < REFRESH_INTERVAL_MS;
}

export function getCachedArticles(): RSSArticle[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const articles: RSSArticle[] = JSON.parse(raw);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return articles.map((a) => ({
      ...a,
      isNew: new Date(a.pubDate).getTime() > oneDayAgo,
    }));
  } catch {
    return [];
  }
}

function cacheArticles(articles: RSSArticle[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(articles));
  } catch {
    const trimmed = articles.slice(0, 50);
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  }
}

/** Strip HTML tags and decode entities */
function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
}

function truncate(text: string, max = 200): string {
  const clean = stripHtml(text);
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

/* ── CORS Proxies with fallback ── */

const PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

/** Fetch with proxy fallback chain */
async function fetchWithProxy(feedUrl: string): Promise<string> {
  for (let i = 0; i < PROXIES.length; i++) {
    try {
      const proxyUrl = PROXIES[i](feedUrl);
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      // Verify it's actually XML/RSS
      if (!text.includes("<") || text.length < 100) throw new Error("Invalid XML");
      return text;
    } catch {
      if (i === PROXIES.length - 1) throw new Error(`Tous les proxies ont échoué pour ${feedUrl}`);
    }
  }
  throw new Error("unreachable");
}

/** Get text content of an XML element */
function xmlText(item: Element, tagName: string): string {
  // Try direct child
  const el = item.getElementsByTagName(tagName)[0];
  if (!el) return "";
  // Handle CDATA
  return el.textContent || "";
}

/** Extract thumbnail from RSS item */
function extractThumbnail(item: Element, xmlText_: string): string {
  // Try media:content
  const mediaContent = item.getElementsByTagName("media:content")[0]
    || item.getElementsByTagName("media:thumbnail")[0];
  if (mediaContent) {
    const url = mediaContent.getAttribute("url");
    if (url) return url;
  }

  // Try enclosure
  const enclosure = item.getElementsByTagName("enclosure")[0];
  if (enclosure) {
    const type = enclosure.getAttribute("type") || "";
    if (type.startsWith("image")) {
      const url = enclosure.getAttribute("url");
      if (url) return url;
    }
  }

  // Try to find first <img> in description/content
  const desc = xmlText(item, "description") || xmlText(item, "content:encoded") || "";
  const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  // Try og:image style attrs
  const content = xmlText_;
  const ogMatch = content.match(/og:image[^>]+content=["']([^"']+)["']/i);
  if (ogMatch) return ogMatch[1];

  return "";
}

/** Parse XML RSS/Atom feed to articles */
function parseRSSXml(xmlText_: string, feed: FeedConfig): RSSArticle[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText_, "text/xml");
  const articles: RSSArticle[] = [];
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  // RSS 2.0 items
  let items = Array.from(doc.querySelectorAll("item"));

  // Atom entries fallback
  if (items.length === 0) {
    items = Array.from(doc.querySelectorAll("entry"));
  }

  for (const item of items.slice(0, 15)) {
    const title = (xmlText(item, "title") || "").trim();
    if (!title) continue;

    // Link: RSS uses <link>, Atom uses <link href="...">
    let link = xmlText(item, "link").trim();
    if (!link) {
      const linkEl = item.getElementsByTagName("link")[0];
      if (linkEl) link = linkEl.getAttribute("href") || "";
    }

    const description = xmlText(item, "description")
      || xmlText(item, "content:encoded")
      || xmlText(item, "summary")
      || xmlText(item, "content")
      || "";

    const pubDate = xmlText(item, "pubDate")
      || xmlText(item, "published")
      || xmlText(item, "dc:date")
      || xmlText(item, "updated")
      || new Date().toISOString();

    const guid = xmlText(item, "guid") || xmlText(item, "id") || link;
    const thumbnail = extractThumbnail(item, xmlText_);

    articles.push({
      id: `${feed.name}-${guid || Math.random()}`,
      title,
      link,
      description: truncate(description),
      pubDate,
      thumbnail,
      source: feed.name,
      sourceIcon: feed.icon,
      category: feed.category,
      isNew: new Date(pubDate).getTime() > oneDayAgo,
    });
  }

  return articles;
}

/** Fetch and parse a single feed */
async function fetchFeed(feed: FeedConfig): Promise<RSSArticle[]> {
  const xml = await fetchWithProxy(feed.url);
  return parseRSSXml(xml, feed);
}

/** Fetch all feeds with staggered delays */
export async function fetchAllFeeds(
  onProgress?: (done: number, total: number) => void,
): Promise<RSSArticle[]> {
  const allArticles: RSSArticle[] = [];
  const errors: string[] = [];
  const successes: string[] = [];

  for (let i = 0; i < FEEDS.length; i++) {
    const feed = FEEDS[i];
    try {
      const articles = await fetchFeed(feed);
      allArticles.push(...articles);
      successes.push(feed.name);
    } catch (err) {
      errors.push(`${feed.name}: ${err instanceof Error ? err.message : "erreur"}`);
    }
    onProgress?.(i + 1, FEEDS.length);
    // Stagger requests
    if (i < FEEDS.length - 1) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  if (errors.length > 0) {
    console.warn("[RSS] Erreurs:", errors);
  }
  if (successes.length > 0) {
    console.info(`[RSS] OK: ${successes.join(", ")} (${allArticles.length} articles)`);
  }

  // Sort by date (newest first)
  allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const unique = allArticles.filter((a) => {
    const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const final = unique.slice(0, 120);

  // Only cache if we got at least some articles
  if (final.length > 0) {
    cacheArticles(final);
    setLastFetchTime();
  }

  return final;
}

/** Smart fetch: use cache if valid, fetch if needed */
export async function smartFetch(
  onProgress?: (done: number, total: number) => void,
): Promise<{ articles: RSSArticle[]; fromCache: boolean }> {
  const cached = getCachedArticles();

  if (isCacheValid() && cached.length > 0) {
    return { articles: cached, fromCache: true };
  }

  if (!isInFetchWindow() && cached.length > 0) {
    return { articles: cached, fromCache: true };
  }

  const articles = await fetchAllFeeds(onProgress);

  // If fetch returned nothing, fall back to cache
  if (articles.length === 0 && cached.length > 0) {
    return { articles: cached, fromCache: true };
  }

  return { articles, fromCache: false };
}

/** Force refresh regardless of cache */
export async function forceRefresh(
  onProgress?: (done: number, total: number) => void,
): Promise<RSSArticle[]> {
  return fetchAllFeeds(onProgress);
}

/** Get stats from articles */
export function getStats(articles: RSSArticle[]) {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  const today = articles.filter((a) => now - new Date(a.pubDate).getTime() < oneDay);
  const thisWeek = articles.filter((a) => now - new Date(a.pubDate).getTime() < oneWeek);

  const byCat = {
    monde: articles.filter((a) => a.category === "monde").length,
    afrique: articles.filter((a) => a.category === "afrique").length,
    alertes: articles.filter((a) => a.category === "alertes").length,
    technique: articles.filter((a) => a.category === "technique").length,
  };

  const bySource: Record<string, number> = {};
  for (const a of articles) {
    bySource[a.source] = (bySource[a.source] || 0) + 1;
  }

  return { today: today.length, thisWeek: thisWeek.length, total: articles.length, byCat, bySource };
}
