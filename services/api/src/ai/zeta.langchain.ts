import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { FakeLLM } from '@langchain/core/utils/testing';
import { ChatOpenAI } from '@langchain/openai';
import { Role } from '../auth.stub';

export interface ZetaKnowledgeEntry {
  id: string;
  title: string;
  content: string;
  sources: string[];
  roles: Role[];
}

const SYSTEM_PROMPT = `You are ZETA, the Zimbabwe E-Tender Assistant.
Respond to the user in a helpful, concise, role-aware manner.

Use ONLY the provided verified PRAZ / PPDPA knowledge context. Do NOT invent facts.
Do NOT reveal sealed-bid contents, bid amounts, raw evaluation scores, or supplier identities.
If the context does not contain a relevant answer, reply EXACTLY with:
"INSUFFICIENT DATA — ESCALATE TO HUMAN."

Always include a disclaimer that this guidance is advisory-only and not a substitute for the PPDPA Act, PRAZ regulations, or professional legal advice.`;

/**
 * LangChain-based prompt construction for ZETA.
 *
 * This adapter wires a domain-specific PRAZ prompt template to an LLM. If the
 * OPENAI_API_KEY environment variable is set, it uses OpenAI's GPT-4o-mini model.
 * Otherwise it falls back to a deterministic FakeLLM so the system works without
 * external API keys in research / CI environments.
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

  const openAiApiKey = process.env.OPENAI_API_KEY?.trim();

  if (openAiApiKey) {
    const chat = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0,
      openAIApiKey: openAiApiKey,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      [
        'human',
        `User role: {role}\n\n---\nContext:\n{context}\n---\n\nQuestion: {query}\n\nAnswer:`,
      ],
    ]);

    const messages = await prompt.formatMessages({ role, context, query });
    const result = await chat.invoke(messages);
    return String(result.content).trim();
  }

  const prompt = PromptTemplate.fromTemplate(`${SYSTEM_PROMPT}

User role: {role}

---
Context:
{context}
---

Question: {query}

Answer:`);

  const formatted = await prompt.format({ role, context, query });

  // Deterministic stand-in for an LLM when no real API key is configured.
  const llm = new FakeLLM({ response: fallbackAnswer });
  const result = await llm.invoke(formatted);
  return String(result).trim();
}
