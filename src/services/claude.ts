import { config } from "@/lib/config";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * Appelle l'API Gwani (RAG sur le Drive APSI-NE).
 * Gwani a accès à tous les profils, projets, conventions et documents du Drive.
 */
async function callGwani(prompt: string): Promise<string> {
  const res = await fetch(`${config.gwaniUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.gwaniKey,
    },
    body: JSON.stringify({
      message: prompt,
      sector: "general",
      scopePath: config.gwaniScope,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gwani ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.answer || data.response || data.message || JSON.stringify(data);
}

/**
 * Fallback OpenAI si Gwani n'est pas configuré ou échoue.
 */
async function callOpenAI(messages: Message[]): Promise<string> {
  if (!config.openaiKey) {
    return "[Erreur] Aucune API configurée. Vérifiez VITE_GWANI_API_KEY ou VITE_OPENAI_API_KEY dans .env";
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openaiKey}`,
    },
    body: JSON.stringify({
      model: config.openaiModel,
      max_tokens: 1000,
      messages: [
        { role: "system", content: config.aiSystemPrompt },
        ...messages,
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return `[Erreur OpenAI] ${res.status}: ${err}`;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Erreur de génération.";
}

export interface CallOptions {
  /** Skip Gwani and go straight to OpenAI (useful when local context like member list matters). */
  forceOpenAI?: boolean;
}

/**
 * Point d'entrée IA unique.
 * Priorité : Gwani (RAG Drive) → OpenAI (fallback)
 * Pass { forceOpenAI: true } when you embed local data (members, etc.) in the prompt
 * and need the model to use that context instead of RAG documents.
 */
export async function callClaude(messages: Message[], opts?: CallOptions): Promise<string> {
  const lastMessage = messages[messages.length - 1]?.content || "";

  // Si Gwani est configuré et qu'on ne force pas OpenAI, l'utiliser en priorité
  if (!opts?.forceOpenAI && config.gwaniUrl && config.gwaniKey) {
    try {
      return await callGwani(lastMessage);
    } catch (err) {
      console.warn("[Gwani] Erreur, fallback OpenAI:", err);
    }
  }

  // OpenAI (fallback ou forcé)
  return callOpenAI(messages);
}
