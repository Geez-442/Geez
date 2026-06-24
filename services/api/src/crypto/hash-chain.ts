import * as crypto from 'crypto';

/**
 * Hash-chain utility for creating append-only audit trail.
 * Each action creates SHA-256(previousHash + newPayload).
 * This provides tamper evidence (not full immutability, but good for audit logs).
 */

const HASH_ALGO = 'sha256';

/**
 * Compute SHA-256 hash of input.
 * @param input - Data to hash (string or JSON)
 * @returns Hex-encoded hash
 */
export function computeHash(input: string): string {
  return crypto.createHash(HASH_ALGO).update(input).digest('hex');
}

/**
 * Compute next hash in chain: SHA-256(previousHash + newPayload).
 * @param previousHash - Hash from previous event (or empty string for first)
 * @param newPayload - New event data (string or JSON serialized)
 * @returns Hex-encoded hash
 */
export function computeChainHash(previousHash: string, newPayload: string): string {
  const combined = `${previousHash}:${newPayload}`;
  return computeHash(combined);
}

/**
 * Verify integrity of a hash chain.
 * Given a list of (payload, expectedHash) tuples, recompute chain and verify.
 * @param events - Array of { payload: string, hash: string }
 * @returns True if chain is intact, false if any link is broken
 */
export function verifyChain(events: Array<{ payload: string; hash: string }>): boolean {
  if (events.length === 0) return true;

  let previousHash = '';
  for (const event of events) {
    const expectedHash = computeChainHash(previousHash, event.payload);
    if (expectedHash !== event.hash) {
      console.warn('Chain integrity check failed at event:', event);
      return false;
    }
    previousHash = event.hash;
  }
  return true;
}
