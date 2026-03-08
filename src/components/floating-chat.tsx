import { useState, useRef, useEffect, useMemo } from "react";
import { useTheme } from "@/hooks/use-theme";
import { config } from "@/lib/config";
import { chatWithGwani, type GwaniCitation } from "@/services/claude";
import type { Partner, Member, Project, Convention } from "@/data/types";
import logoApsi from "@/assets/logo-apsi.jpeg";
import { MessageCircle, X, Minus, Send, Trash2 } from "lucide-react";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  citations?: GwaniCitation[];
  timestamp: Date;
}

function formatMsg(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/^(\d+)\.\s+/gm, '<span style="font-weight:600">$1.</span> ')
    .replace(/^[-•]\s+/gm, '<span style="margin-right:4px">&#x25B8;</span> ')
    .replace(/\n/g, "<br/>");
}

interface FloatingChatProps {
  members: Member[];
  partners: Partner[];
  projects: Project[];
  conventions: Convention[];
}

function buildSystemPrompt(members: Member[], partners: Partner[], projects: Project[], conventions: Convention[]): string {
  const activeMembers = members.filter((m) => m.role !== "Membre d'honneur");
  const honoraryMembers = members.filter((m) => m.role === "Membre d'honneur");

  const memberList = activeMembers.map((m) =>
    `- ${m.nom} | ${m.role} | ${m.niveau} | ${m.disponible ? "Dispo" : "Occupe"} | ${(m.competences || []).join(", ") || "N/A"}`
  ).join("\n");
  const honoraryList = honoraryMembers.map((m) => `- ${m.nom} | ${m.role}`).join("\n");
  const partnerList = partners.map((p) => `- ${p.nom} (${p.org}) | ${p.secteur} | ${p.statut}`).join("\n");
  const projectList = projects.map((p) => `- ${p.titre} | ${p.type} | ${p.statut}`).join("\n");
  const conventionList = conventions.map((c) => `- ${c.titre} | ${c.partenaire} | ${c.statut}`).join("\n");

  return `Tu es l'Assistant IA de l'APSI-NE (${config.orgFullName}).
Expert en cybersecurite, gouvernance IT, gestion de projets numeriques.
Reponds TOUJOURS en francais, de facon professionnelle et concise.

## Membres actifs (${activeMembers.length})
${memberList || "Aucun"}

## Membres d'honneur (${honoraryMembers.length})
${honoraryList || "Aucun"}

## Partenaires (${partners.length})
${partnerList || "Aucun"}

## Projets (${projects.length})
${projectList || "Aucun"}

## Conventions (${conventions.length})
${conventionList || "Aucune"}

Reponds de facon concise car l'espace d'affichage est limite (widget chat flottant).`;
}

const STYLE_ID = "floating-chat-styles";
function injectChatStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes fc-slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes fc-slideDown {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to { opacity: 0; transform: translateY(20px) scale(0.95); }
    }
    @keyframes fc-fabPulse {
      0%, 100% { box-shadow: 0 4px 20px rgba(0,217,168,0.3); }
      50% { box-shadow: 0 4px 30px rgba(0,217,168,0.5); }
    }
    @keyframes fc-bounceIn {
      0% { transform: scale(0); }
      50% { transform: scale(1.15); }
      100% { transform: scale(1); }
    }
    @keyframes fc-dotPulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
  `;
  document.head.appendChild(s);
}

export function FloatingChat({ members, partners, projects, conventions }: FloatingChatProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { injectChatStyles(); }, []);

  const systemPrompt = useMemo(
    () => buildSystemPrompt(members, partners, projects, conventions),
    [members, partners, projects, conventions],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && !minimized) { setUnread(0); inputRef.current?.focus(); }
  }, [open, minimized]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = { id: Date.now(), role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { answer, sources, citations } = await chatWithGwani(text, systemPrompt);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1, role: "assistant", content: answer,
        sources, citations, timestamp: new Date(),
      }]);
      if (minimized || !open) setUnread((u) => u + 1);
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1, role: "assistant",
        content: `Erreur : ${err instanceof Error ? err.message : "Impossible de contacter l'API."}`,
        timestamp: new Date(),
      }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // FAB button (always visible)
  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setMinimized(false); }}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9000,
          width: 56, height: 56, borderRadius: "50%",
          background: colors.accent, color: "#051210",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "fc-bounceIn 0.4s ease, fc-fabPulse 3s ease infinite",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => { (e.currentTarget).style.transform = "scale(1.1)"; }}
        onMouseLeave={(e) => { (e.currentTarget).style.transform = "scale(1)"; }}
        title="Assistant IA APSI-NE"
      >
        <MessageCircle size={24} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            width: 20, height: 20, borderRadius: "50%",
            background: colors.danger, color: "#fff",
            fontSize: "0.6rem", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "fc-bounceIn 0.3s ease",
          }}>{unread}</span>
        )}
      </button>
    );
  }

  // Minimized bar
  if (minimized) {
    return (
      <div
        onClick={() => setMinimized(false)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9000,
          width: 280, padding: "10px 16px", borderRadius: 12,
          background: colors.surface, border: `1px solid ${colors.border}`,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          animation: "fc-slideUp 0.3s ease",
        }}
      >
        <img src={logoApsi} alt="" style={{ width: 24, height: 24, borderRadius: 6 }} />
        <span style={{ color: colors.text, fontSize: "0.78rem", fontWeight: 600, flex: 1 }}>Assistant IA</span>
        {unread > 0 && (
          <span style={{
            width: 18, height: 18, borderRadius: "50%", background: colors.danger,
            color: "#fff", fontSize: "0.6rem", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{unread}</span>
        )}
        <button onClick={(e) => { e.stopPropagation(); setOpen(false); setMinimized(false); }}
          style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", padding: 2 }}>
          <X size={14} />
        </button>
      </div>
    );
  }

  // Full chat panel
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9000,
      width: 380, height: 520, maxHeight: "calc(100vh - 48px)",
      borderRadius: 16, overflow: "hidden",
      background: colors.bg, border: `1px solid ${colors.border}`,
      boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
      display: "flex", flexDirection: "column",
      animation: "fc-slideUp 0.3s ease",
      fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", borderBottom: `1px solid ${colors.border}`,
        background: colors.surface, flexShrink: 0,
      }}>
        <img src={logoApsi} alt="" style={{ width: 28, height: 28, borderRadius: 8 }} />
        <div style={{ flex: 1 }}>
          <div style={{ color: colors.text, fontSize: "0.82rem", fontWeight: 700 }}>Assistant APSI-NE</div>
          <div style={{ color: colors.success, fontSize: "0.6rem", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.success, display: "inline-block" }} />
            En ligne
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} title="Effacer"
            style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", padding: 4, borderRadius: 6, transition: "color 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = colors.danger; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = colors.muted; }}>
            <Trash2 size={14} />
          </button>
        )}
        <button onClick={() => setMinimized(true)} title="Minimiser"
          style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", padding: 4 }}>
          <Minus size={14} />
        </button>
        <button onClick={() => { setOpen(false); setMinimized(false); }} title="Fermer"
          style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", padding: 4 }}>
          <X size={14} />
        </button>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 20 }}>
            <img src={logoApsi} alt="" style={{ width: 48, height: 48, borderRadius: 12, opacity: 0.7, animation: "fc-bounceIn 0.5s ease" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ color: colors.text, fontWeight: 600, fontSize: "0.85rem", marginBottom: 4 }}>Salut !</div>
              <div style={{ color: colors.muted, fontSize: "0.72rem", lineHeight: 1.5 }}>
                Pose-moi une question sur l'APSI-NE, la cybersecurite, ou les projets en cours.
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {["Membres actifs ?", "Projets en cours ?", "Que faire en cas de ransomware ?"].map((q) => (
                <button key={q} onClick={() => setInput(q)}
                  style={{
                    background: colors.surface, border: `1px solid ${colors.border}`,
                    color: colors.muted, padding: "5px 10px", borderRadius: 20,
                    fontSize: "0.65rem", cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.muted; }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: "flex", gap: 8, alignItems: "flex-start",
            flexDirection: msg.role === "user" ? "row-reverse" : "row",
            animation: "fc-slideUp 0.25s ease",
          }}>
            {msg.role === "assistant" && (
              <img src={logoApsi} alt="" style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0 }} />
            )}
            <div style={{
              maxWidth: "82%",
              background: msg.role === "user" ? colors.accent + "18" : colors.surface,
              border: `1px solid ${msg.role === "user" ? colors.accent + "30" : colors.border}`,
              borderRadius: msg.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
              padding: "8px 12px", fontSize: "0.75rem", lineHeight: 1.6, color: colors.text,
            }}>
              {msg.role === "assistant"
                ? <div dangerouslySetInnerHTML={{ __html: formatMsg(msg.content) }} />
                : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", animation: "fc-slideUp 0.25s ease" }}>
            <img src={logoApsi} alt="" style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0 }} />
            <div style={{
              background: colors.surface, border: `1px solid ${colors.border}`,
              borderRadius: "12px 12px 12px 3px", padding: "10px 16px",
              display: "flex", gap: 4,
            }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", background: colors.accent,
                  animation: `fc-dotPulse 1.2s ease ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        flexShrink: 0, padding: "8px 12px", borderTop: `1px solid ${colors.border}`,
        background: colors.surface,
      }}>
        <div style={{
          display: "flex", gap: 6, alignItems: "center",
          background: colors.bg, border: `1px solid ${colors.border}`,
          borderRadius: 10, padding: "4px 6px 4px 12px",
          transition: "border-color 0.2s",
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Votre question..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: colors.text, fontSize: "0.78rem", fontFamily: "inherit",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: input.trim() && !loading ? colors.accent : colors.border,
              color: input.trim() && !loading ? "#051210" : colors.muted,
              border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
