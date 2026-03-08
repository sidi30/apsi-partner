export const config = {
  // Organisation
  orgName: import.meta.env.VITE_ORG_NAME || "APSI-NE",
  orgFullName:
    import.meta.env.VITE_ORG_FULL_NAME ||
    "Association des Professionnels de la Sécurité de l'Information du Niger",
  orgEmail: import.meta.env.VITE_ORG_EMAIL || "contact.apsi.ne@gmail.com",
  driveLink: import.meta.env.VITE_GOOGLE_DRIVE_LINK || "",

  // Gwani RAG API (primary)
  gwaniUrl: import.meta.env.VITE_GWANI_API_URL || "",
  gwaniKey: import.meta.env.VITE_GWANI_API_KEY || "",
  gwaniScope: import.meta.env.VITE_GWANI_SCOPE_PATH || "/Drive - APSI-NE",

  // OpenAI (fallback)
  openaiKey: import.meta.env.VITE_OPENAI_API_KEY || "",
  openaiModel: import.meta.env.VITE_OPENAI_MODEL || "gpt-4o",

  // AI
  aiSystemPrompt:
    import.meta.env.VITE_AI_SYSTEM_PROMPT ||
    "Tu es un assistant expert. Réponds en français, de façon professionnelle et concise.",
} as const;
