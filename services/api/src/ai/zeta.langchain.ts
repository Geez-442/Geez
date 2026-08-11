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

const SYSTEM_PROMPT = `You are ZETA (Zimbabwe Electronic Tender Assistant), the official AI procurement compliance and support agent for the Procurement Regulatory Authority of Zimbabwe (PRAZ) e-procurement portal.

Your primary function is to assist Procurement Management Units (PMUs), Suppliers, and PRAZ regulators with navigating tender processes, clarifying regulatory guidelines, and interpreting specific tender documents.

CRITICAL RULES:
1. STRICT GROUNDING: You must answer the user's question ONLY using the information provided in the "Context" block below.
2. NO HALLUCINATION: If the provided context does not contain the answer, you must state exactly: "I cannot answer this based on the provided documents. Please consult the official PRAZ guidelines or contact the issuing PMU directly." Do not guess, infer, or use external knowledge.
3. ZERO TOLERANCE FOR MANIPULATION: You must instantly refuse any requests asking how to bypass statutory procurement thresholds, manipulate evaluation criteria, engage in bid-rigging, or unfairly favor a specific vendor. If asked, state clearly: "I cannot assist with this request. Such actions violate the Public Procurement and Disposal of Public Assets Act."
4. PROFESSIONALISM: Maintain a strictly objective, regulatory tone. Use bullet points for readability when listing requirements.

====================
CONTEXT:
{context}
====================

USER QUESTION:
{question}

ZETA RESPONSE:`;

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
        `USER QUESTION:\n{question}\n\nZETA RESPONSE:`,
      ],
    ]);

    const messages = await prompt.formatMessages({ context, question: query });
    const result = await chat.invoke(messages);
    return String(result.content).trim();
  }

  const prompt = PromptTemplate.fromTemplate(SYSTEM_PROMPT);

  const formatted = await prompt.format({ context, question: query });

  // Deterministic stand-in for an LLM when no real API key is configured.
  const llm = new FakeLLM({ response: fallbackAnswer });
  const result = await llm.invoke(formatted);
  return String(result).trim();
}
