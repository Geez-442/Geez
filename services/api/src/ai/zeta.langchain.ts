import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { FakeLLM } from '@langchain/core/utils/testing';
import { ChatOpenAI } from '@langchain/openai';
import { Logger } from '@nestjs/common';
import { Role } from '../auth.stub';

export interface ZetaKnowledgeEntry {
  id: string;
  title: string;
  content: string;
  sources: string[];
  roles: Role[];
}

const logger = new Logger('ZetaLangChain');

/** Requests are abandoned after this long so a slow LLM cannot hang the portal. */
const LLM_TIMEOUT_MS = 12000;

const SYSTEM_PROMPT = `You are ZETA (Zimbabwe Electronic Tender Assistant), the official AI procurement compliance and support agent for the Procurement Regulatory Authority of Zimbabwe (PRAZ) e-procurement portal.

Your primary function is to assist Procurement Management Units (PMUs), Suppliers, and PRAZ regulators with navigating tender processes, clarifying regulatory guidelines, and interpreting specific tender documents.

CRITICAL RULES:
1. STRICT GROUNDING: You must answer the user's question ONLY using the information provided in the "Context" block below.
2. NO HALLUCINATION: If the provided context does not contain the answer, you must state exactly: "I cannot answer this based on the provided documents. Please consult the official PRAZ guidelines or contact the issuing PMU directly." Do not guess, infer, or use external knowledge.
3. ZERO TOLERANCE FOR MANIPULATION: You must instantly refuse any requests asking how to bypass statutory procurement thresholds, manipulate evaluation criteria, engage in bid-rigging, or unfairly favor a specific vendor. If asked, state clearly: "I cannot assist with this request. Such actions violate the Public Procurement and Disposal of Public Assets Act."
4. CONFIDENTIALITY: You have no access to sealed bid amounts, supplier pricing, or evaluation scores. Never speculate about them. If asked, explain that sealed bids are encrypted and unavailable until the tender deadline has passed.
5. PROFESSIONALISM: Maintain a strictly objective, regulatory tone. Use bullet points for readability when listing requirements.

====================
CONTEXT:
{context}
====================

USER QUESTION:
{question}

ZETA RESPONSE:`;

/**
 * Reject obvious placeholder values copied from .env.example so the system does
 * not waste a round-trip (and then fail) on a key that was never real.
 */
function isUsableApiKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.length < 25) return false;
  if (/^sk-\.+$/.test(trimmed)) return false;
  const placeholders = ['sk-your-key', 'sk-xxx', 'changeme', 'placeholder', 'your-api-key', 'replace-me'];
  const lower = trimmed.toLowerCase();
  return !placeholders.some((p) => lower.startsWith(p) || lower === p);
}

/** Resolve the deterministic, knowledge-base-grounded answer through a FakeLLM. */
async function composeDeterministicAnswer(context: string, query: string, fallbackAnswer: string): Promise<string> {
  const prompt = PromptTemplate.fromTemplate(SYSTEM_PROMPT);
  const formatted = await prompt.format({ context, question: query });
  const llm = new FakeLLM({ response: fallbackAnswer });
  const result = await llm.invoke(formatted);
  return String(result).trim();
}

/**
 * LangChain-based prompt construction for ZETA.
 *
 * When a usable OPENAI_API_KEY is configured, the grounded context is sent to
 * GPT-4o-mini for natural-language composition. In every other case — no key, a
 * placeholder key, an authentication failure, a rate limit, a network error, or a
 * timeout — the deterministic knowledge-base answer is returned instead.
 *
 * ZETA therefore degrades gracefully and never surfaces an error to the user: the
 * LLM improves phrasing, it is not required for correctness.
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

  // No point calling the LLM when there is nothing grounded to summarise.
  if (!isUsableApiKey(openAiApiKey) || matches.length === 0) {
    return composeDeterministicAnswer(context, query, fallbackAnswer);
  }

  try {
    const chat = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0,
      openAIApiKey: openAiApiKey,
      timeout: LLM_TIMEOUT_MS,
      maxRetries: 1,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      ['human', `USER QUESTION:\n{question}\n\nZETA RESPONSE:`],
    ]);

    const messages = await prompt.formatMessages({ context, question: query });
    const result = await chat.invoke(messages);
    const answer = String(result.content).trim();

    // An empty completion is treated as a failure rather than returned blank.
    if (!answer) {
      logger.warn('LLM returned an empty completion; using grounded knowledge-base answer.');
      return composeDeterministicAnswer(context, query, fallbackAnswer);
    }
    return answer;
  } catch (err: any) {
    // Never propagate LLM failures to the caller — ZETA stays available.
    logger.warn(
      `LLM composition unavailable (${err?.code || err?.lc_error_code || err?.message || 'unknown error'}); using grounded knowledge-base answer.`,
    );
    return composeDeterministicAnswer(context, query, fallbackAnswer);
  }
}
