import { useState, useRef, useEffect, useMemo } from "react";
import { useTheme } from "@/hooks/use-theme";
import { config } from "@/lib/config";
import { chatWithGwani, type GwaniCitation } from "@/services/claude";
import type { Partner, Member, Project, Convention } from "@/data/types";
import logoApsi from "@/assets/logo-apsi.jpeg";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  citations?: GwaniCitation[];
  timestamp: Date;
}

function formatMessage(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/^(\d+)\.\s+/gm, '<span style="font-weight:600">$1.</span> ')
    .replace(/^[-•]\s+/gm, '<span style="margin-right:4px">&#x25B8;</span> ')
    .replace(/\n/g, "<br/>");
}

function relevanceColor(score: number | undefined, colors: Record<string, string>) {
  if (!score) return { bg: colors.muted + "20", fg: colors.muted, label: "?" };
  if (score >= 0.7) return { bg: colors.success + "20", fg: colors.success, label: `${Math.round(score * 100)}%` };
  if (score >= 0.4) return { bg: colors.warn + "20", fg: colors.warn, label: `${Math.round(score * 100)}%` };
  return { bg: colors.danger + "20", fg: colors.danger, label: `${Math.round(score * 100)}%` };
}

interface ChatbotProps {
  members: Member[];
  partners: Partner[];
  projects: Project[];
  conventions: Convention[];
}

function buildSystemPrompt(members: Member[], partners: Partner[], projects: Project[], conventions: Convention[]): string {
  const activeMembers = members.filter((m) => m.role !== "Membre d'honneur");
  const honoraryMembers = members.filter((m) => m.role === "Membre d'honneur");

  const memberList = activeMembers.map((m) =>
    `- ${m.nom} | Rôle: ${m.role} | Niveau: ${m.niveau} | ${m.disponible ? "Disponible" : "Occupé"} | Compétences: ${(m.competences || []).join(", ") || "N/A"}${m.commission ? ` | Commission: ${m.commission}` : ""}${m.email ? ` | Email: ${m.email}` : ""}`
  ).join("\n");

  const honoraryList = honoraryMembers.map((m) =>
    `- ${m.nom} | ${m.role} | ${m.bio || ""}${m.competences?.length ? ` | Compétences: ${m.competences.join(", ")}` : ""}`
  ).join("\n");

  const partnerList = partners.map((p) =>
    `- ${p.nom} (${p.org}) | Secteur: ${p.secteur} | Statut: ${p.statut}${p.notes ? ` | Notes: ${p.notes}` : ""}`
  ).join("\n");

  const projectList = projects.map((p) =>
    `- ${p.titre} | Type: ${p.type} | Statut: ${p.statut} | ${p.description}${p.deadline ? ` | Deadline: ${p.deadline}` : ""}`
  ).join("\n");

  const conventionList = conventions.map((c) =>
    `- ${c.titre} | Partenaire: ${c.partenaire} | Statut: ${c.statut} | Objet: ${c.objet} | Durée: ${c.duree}`
  ).join("\n");

  return `Tu es l'Assistant IA officiel de l'APSI-NE (${config.orgFullName}).
Tu es un expert en cybersécurité, sécurité de l'information, gouvernance IT, et gestion de projets numériques en Afrique.
Tu réponds TOUJOURS en français, de façon professionnelle, précise et structurée.

## Ton identité
- Tu représentes l'APSI-NE, association professionnelle basée au Niger
- Email de contact : ${config.orgEmail}
- Tu as accès aux données internes de l'association (membres, partenaires, projets, conventions)

## Membres actifs de l'APSI-NE (${activeMembers.length})
${memberList || "Aucun membre actif enregistré."}

## Membres d'honneur (${honoraryMembers.length})
${honoraryList || "Aucun membre d'honneur enregistré."}

## Partenaires (${partners.length})
${partnerList || "Aucun partenaire enregistré."}

## Projets en cours (${projects.length})
${projectList || "Aucun projet enregistré."}

## Conventions (${conventions.length})
${conventionList || "Aucune convention enregistrée."}

## Tes capacités
1. **Questions sur l'APSI-NE** : membres, projets, partenaires, conventions, organigramme, commissions
2. **Cybersécurité** : conseils en cas d'incident (attaque, phishing, ransomware, intrusion), bonnes pratiques, normes (ISO 27001, NIST, RGPD), audit de sécurité
3. **Scénarios d'incident** : guide étape par étape en cas d'attaque informatique, plan de réponse aux incidents, investigation forensique
4. **Projets et partenariats** : expliquer les projets en cours, les partenariats avec l'ANSI, les conventions
5. **Gouvernance IT** : politiques de sécurité, gestion des risques, conformité réglementaire au Niger et en Afrique

## Règles
- Utilise les données ci-dessus pour répondre aux questions sur l'association
- Si tu ne connais pas une information spécifique, dis-le clairement
- Pour les scénarios de cybersécurité, donne des réponses détaillées et actionnables
- Structure tes réponses avec des listes et des étapes numérotées quand c'est pertinent
- Cite les membres par leur nom quand c'est pertinent (ex: "Le président Aboubacar..." ou "Le projet X est porté par...")`;
}

export function ChatbotView({ members, partners, projects, conventions }: ChatbotProps) {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const systemPrompt = useMemo(
    () => buildSystemPrompt(members, partners, projects, conventions),
    [members, partners, projects, conventions],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1, role: "assistant",
        content: `Erreur : ${err instanceof Error ? err.message : "Impossible de contacter l'API."}`,
        timestamp: new Date(),
      }]);
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const quickQuestions = [
    "Qui sont les membres actifs de l'APSI-NE ?",
    "Quels sont les projets en cours ?",
    "En cas d'attaque ransomware, que faire ?",
    "Explique-moi le partenariat avec l'ANSI",
    "Quels membres sont disponibles pour un projet ?",
    "Comment sécuriser un réseau d'entreprise ?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", maxHeight: "calc(100vh - 56px)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexShrink: 0 }}>
        <div>
          <h1 style={{ color: colors.text, fontSize: "1.5rem", fontWeight: 800 }}>Assistant APSI-NE</h1>
          <p style={{ color: colors.muted, fontSize: "0.8rem", marginTop: "4px" }}>
            Posez vos questions sur les documents du Drive APSI-NE
          </p>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])}
            style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.muted, padding: "5px 12px", borderRadius: "8px", fontSize: "0.72rem", cursor: "pointer", fontFamily: "inherit" }}>
            Effacer
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px", padding: "8px 0", minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
            <img src={logoApsi} alt="APSI-NE" style={{ width: 64, height: 64, borderRadius: "16px", opacity: 0.8 }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ color: colors.text, fontWeight: 700, fontSize: "1rem", marginBottom: "6px" }}>Assistant documentaire APSI-NE</div>
              <div style={{ color: colors.muted, fontSize: "0.78rem", maxWidth: "400px", lineHeight: "1.5" }}>
                Je réponds en me basant sur les documents du Drive via l'API Gwani. Je cite mes sources.
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", maxWidth: "500px" }}>
              {quickQuestions.map((q) => (
                <button key={q} onClick={() => { setInput(q); }}
                  style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.muted, padding: "6px 12px", borderRadius: "999px", fontSize: "0.7rem", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.muted; }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
            {/* Avatar */}
            {msg.role === "assistant" ? (
              <img src={logoApsi} alt="Bot" style={{ width: 32, height: 32, borderRadius: "8px", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "8px", background: colors.accent + "20", color: colors.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 }}>
                Vous
              </div>
            )}

            {/* Bubble */}
            <div style={{ maxWidth: "78%", minWidth: 0 }}>
              <div style={{
                background: msg.role === "user" ? colors.accent + "15" : colors.surface,
                border: `1px solid ${msg.role === "user" ? colors.accent + "30" : colors.border}`,
                borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                padding: "10px 14px", fontSize: "0.82rem", lineHeight: "1.6", color: colors.text,
              }}>
                {msg.role === "assistant" ? (
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                ) : msg.content}
              </div>

              {/* Citations from Gwani */}
              {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
                <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ fontSize: "0.62rem", color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Sources ({msg.citations.length} document{msg.citations.length > 1 ? "s" : ""})
                  </div>
                  {msg.citations.map((cit, i) => {
                    const rel = relevanceColor(cit.relevanceScore, colors);
                    return (
                      <div key={i} style={{
                        background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "8px",
                        padding: "8px 10px", fontSize: "0.72rem",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: cit.excerpt ? "4px" : 0 }}>
                          <span style={{ color: colors.blue, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            title={cit.filePath || cit.fileName || ""}>
                            {cit.fileName || cit.filePath || `Document ${i + 1}`}
                          </span>
                          {cit.pageStart != null && (
                            <span style={{ color: colors.muted, fontSize: "0.62rem" }}>
                              p.{cit.pageStart}{cit.pageEnd && cit.pageEnd !== cit.pageStart ? `-${cit.pageEnd}` : ""}
                            </span>
                          )}
                          <span style={{ fontSize: "0.58rem", padding: "1px 6px", borderRadius: "999px", fontWeight: 600, background: rel.bg, color: rel.fg, border: `1px solid ${rel.fg}30` }}>
                            {rel.label}
                          </span>
                          {cit.downloadUrl && (
                            <a href={cit.downloadUrl} target="_blank" rel="noopener noreferrer"
                              style={{ color: colors.accent, fontSize: "0.62rem", textDecoration: "none", fontWeight: 600 }}
                              onClick={(e) => e.stopPropagation()}>
                              Ouvrir
                            </a>
                          )}
                          {!cit.downloadUrl && cit.fileId && (
                            <a href={`${config.gwaniUrl}/files/${cit.fileId}/download`} target="_blank" rel="noopener noreferrer"
                              style={{ color: colors.accent, fontSize: "0.62rem", textDecoration: "none", fontWeight: 600 }}
                              onClick={(e) => e.stopPropagation()}>
                              Ouvrir
                            </a>
                          )}
                        </div>
                        {cit.excerpt && (
                          <div style={{ color: colors.muted, fontSize: "0.68rem", lineHeight: "1.4", fontStyle: "italic", borderLeft: `2px solid ${colors.border}`, paddingLeft: "8px", marginTop: "4px" }}>
                            "{cit.excerpt}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sources fallback (simple list if no citations) */}
              {msg.role === "assistant" && (!msg.citations || msg.citations.length === 0) && msg.sources && msg.sources.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                  {msg.sources.map((src, i) => (
                    <span key={i} style={{ fontSize: "0.6rem", padding: "2px 8px", borderRadius: "999px", fontWeight: 500, background: colors.blue + "15", color: colors.blue, border: `1px solid ${colors.blue}25`, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={src}>
                      {src}
                    </span>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <div style={{ fontSize: "0.58rem", color: colors.muted, marginTop: "4px", opacity: 0.5, textAlign: msg.role === "user" ? "right" : "left" }}>
                {msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <img src={logoApsi} alt="Bot" style={{ width: 32, height: 32, borderRadius: "8px", flexShrink: 0 }} />
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "14px 14px 14px 4px", padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <span style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: "0.85rem", color: colors.accent }}>&#x27F3;</span>
                <span style={{ color: colors.muted, fontSize: "0.78rem" }}>Recherche dans le Drive...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, paddingTop: "12px", borderTop: `1px solid ${colors.border}` }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "6px 8px 6px 14px" }}>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Posez votre question..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: colors.text, fontSize: "0.85rem", fontFamily: "inherit" }} />
          <button onClick={sendMessage} disabled={!input.trim() || loading}
            style={{
              background: input.trim() && !loading ? colors.accent : colors.border,
              color: input.trim() && !loading ? "#051210" : colors.muted,
              border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "0.78rem", fontWeight: 700,
              cursor: input.trim() && !loading ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all 0.15s",
            }}>
            Envoyer
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: "6px" }}>
          <span style={{ color: colors.muted, fontSize: "0.58rem", opacity: 0.5 }}>
            Propulsé par Gwani RAG &middot; Réponses basées sur les documents du Drive APSI-NE
          </span>
        </div>
      </div>
    </div>
  );
}
