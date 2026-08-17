/**
 * Prompt-injection and output-leak guard rails for ZETA.
 *
 * These are defence-in-depth controls that sit outside the LLM prompt itself
 * (see `zeta.langchain.ts` for the in-prompt system rules). A prompt is only
 * a request to the model; it is not a security boundary. These guards run in
 * plain TypeScript, cannot be argued with, and apply even if OPENAI_API_KEY
 * is unset (i.e. against the deterministic FakeLLM fallback too), so behaviour
 * is consistent between research/CI and a production LLM deployment.
 *
 * Two independent checks are performed:
 *  1. INPUT guard  — refuses to forward the user's raw text to the LLM at all
 *     when it looks like a jailbreak / instruction-override / role-play attempt,
 *     or an attempt to smuggle a fake CONTEXT/SYSTEM block into the prompt.
 *  2. OUTPUT guard — scans whatever the LLM (or fallback) produced for signs
 *     that a guard was bypassed: leaked secrets/config, or compliance with a
 *     request the system prompt was supposed to refuse.
 *
 * Every flagged interaction is recorded (see ZetaService) so PRAZ/researchers
 * can periodically review the guard log for false positives/negatives and for
 * patterns that might indicate systematic bias in what gets blocked — a
 * lightweight, auditable stand-in for a formal bias audit in this prototype.
 */

export interface GuardCheckResult {
  safe: boolean;
  reasons: string[];
}

// Attempts to override, ignore, or extract the system prompt / instructions.
const INJECTION_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i, reason: 'instruction-override attempt' },
  { pattern: /disregard\s+(all\s+)?(previous|prior|above)/i, reason: 'instruction-override attempt' },
  { pattern: /forget\s+(all\s+)?(your\s+)?(previous\s+)?instructions?/i, reason: 'instruction-override attempt' },
  { pattern: /you\s+are\s+now\s+(a|an)\b/i, reason: 'role-override attempt' },
  { pattern: /act\s+as\s+(if\s+you\s+are\s+)?(a|an)\s+(?!procurement|regulatory)/i, reason: 'role-override attempt' },
  { pattern: /pretend\s+(you('| a)re|to\s+be)/i, reason: 'role-override attempt' },
  { pattern: /(developer|debug|admin|god|dan|jailbreak)\s*mode/i, reason: 'jailbreak-mode attempt' },
  { pattern: /reveal\s+(your\s+)?(system\s+)?(prompt|instructions)/i, reason: 'prompt-extraction attempt' },
  { pattern: /what\s+(is|are)\s+your\s+(system\s+)?(prompt|instructions)/i, reason: 'prompt-extraction attempt' },
  { pattern: /print\s+(your\s+)?(system\s+)?(prompt|instructions)/i, reason: 'prompt-extraction attempt' },
  { pattern: /\bsystem\s*:\s*/i, reason: 'fake role-block injection' },
  { pattern: /\bcontext\s*:\s*/i, reason: 'fake context-block injection' },
  { pattern: /-{2,}\s*end\s+(of\s+)?(context|prompt|instructions)/i, reason: 'prompt-boundary spoofing' },
];

// Attempts to use ZETA to facilitate corruption or bypass procurement controls.
// The system prompt already refuses these; this catches the query before the
// model is even invoked, saving cost and closing the (small) chance the model
// complies anyway.
const CORRUPTION_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /bypass\s+(the\s+)?(statutory\s+)?threshold/i, reason: 'threshold-bypass request' },
  { pattern: /split\s+(the\s+)?(tender|requirement|purchase)s?\s+to\s+avoid/i, reason: 'threshold-splitting request' },
  { pattern: /(rig|fix)\s+the\s+bid/i, reason: 'bid-rigging request' },
  { pattern: /favou?r\s+(a\s+)?(specific\s+)?(vendor|supplier|company)/i, reason: 'favouritism request' },
  { pattern: /(decrypt|reveal|show)\s+(the\s+)?(sealed\s+)?bid\s+(amount|content)/i, reason: 'sealed-bid disclosure request' },
  { pattern: /\b(encryption\s+key|jwt_?secret|env\s+var(iable)?s?)\b/i, reason: 'secret-extraction attempt' },
];

// Signals in the model output that a guard may have been bypassed.
const OUTPUT_LEAK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b(encryption_key|jwt_secret|process\.env)\b/i, reason: 'possible secret leak' },
  { pattern: /here('|’)s\s+how\s+to\s+bypass/i, reason: 'possible corruption assistance' },
  { pattern: /here('|’)s\s+how\s+to\s+rig/i, reason: 'possible corruption assistance' },
  { pattern: /i\s+(will|can)\s+help\s+you\s+(bypass|rig|favou?r)/i, reason: 'possible corruption assistance' },
];

const REFUSAL_MESSAGE =
  'I cannot process this request. It appears to contain an attempt to override my operating instructions or to facilitate a violation of the Public Procurement and Disposal of Public Assets Act. If you have a genuine procurement question, please rephrase it.';

/**
 * Check user input before it is sent to the LLM/knowledge-base matcher.
 */
export function guardInput(query: string): GuardCheckResult {
  const reasons: string[] = [];

  for (const { pattern, reason } of INJECTION_PATTERNS) {
    if (pattern.test(query)) reasons.push(reason);
  }
  for (const { pattern, reason } of CORRUPTION_PATTERNS) {
    if (pattern.test(query)) reasons.push(reason);
  }

  return { safe: reasons.length === 0, reasons: Array.from(new Set(reasons)) };
}

/**
 * Check the composed answer (from the LLM or the deterministic fallback)
 * before it is returned to the caller or persisted.
 */
export function guardOutput(answer: string): GuardCheckResult {
  const reasons: string[] = [];

  for (const { pattern, reason } of OUTPUT_LEAK_PATTERNS) {
    if (pattern.test(answer)) reasons.push(reason);
  }

  return { safe: reasons.length === 0, reasons: Array.from(new Set(reasons)) };
}

export function getRefusalMessage(): string {
  return REFUSAL_MESSAGE;
}
