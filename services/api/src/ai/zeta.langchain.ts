import { PromptTemplate } from '@langchain/core/prompts';
import { FakeLLM } from '@langchain/core/utils/testing';
import { Role } from '../auth.stub';

export interface ZetaKnowledgeEntry {
  id: string;
  title: string;
  content: string;
  sources: string[];
  roles: Role[];
}

/**
 * LangChain-based prompt construction for ZETA.
 *
 * This adapter wires a domain-specific PRAZ prompt template to an LLM. In the
 * research prototype the LLM is a deterministic FakeLLM so the system works
 * without API keys or external services; in production the FakeLLM can be
 * swapped for a sandboxed ChatOpenAI / local Ollama model.
 *
 * Safety constraints enforced by the prompt:
 * - Only use the provided knowledge context.
 * - Never reveal sealed-bid amounts or raw evaluation data.
 * - Escalate when the context is insufficient.
 */
export async function composeAnswerWithLangChain(
  role: Role,
  query: string,
  matches: ZetaKnowledgeEntry[],
  fallbackAnswer: string,
): Promise<string> {
  const context = matches
    .map((m, idx) => `[${idx + 1}] ${m.title}\n${m.content}\nSources: ${m.sources.join(', ')}`)
    .join('\n\n');

  const prompt = PromptTemplate.fromTemplate(`You are ZETA, the Zimbabwe E-Tender Assistant.
Respond to the user in a helpful, concise, role-aware manner.

User role: {role}

Use ONLY the following verified PRAZ / PPDPA knowledge context. Do NOT invent facts.
Do NOT reveal sealed-bid contents, bid amounts, raw evaluation scores, or supplier identities.
If the context does not contain a relevant answer, reply EXACTLY with:
"INSUFFICIENT DATA — ESCALATE TO HUMAN."

---
Context:
{context}
---

Question: {query}

Answer:`);

  const formatted = await prompt.format({ role, context, query });

  // Deterministic stand-in for an LLM. Replace with a real model when an API key is available.
  const llm = new FakeLLM({ response: fallbackAnswer });
  const result = await llm.invoke(formatted);
  return String(result).trim();
}
