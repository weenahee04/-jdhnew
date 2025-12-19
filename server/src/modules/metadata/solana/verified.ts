import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { TokenMetadata } from '../../../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let verifiedTokens: Record<string, Record<string, TokenMetadata>> | null = null;

export function loadVerifiedTokens(): Record<string, Record<string, TokenMetadata>> {
  if (verifiedTokens) return verifiedTokens;

  try {
    const filePath = join(__dirname, '../../../assets/verifiedTokens.json');
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Transform to our format
    verifiedTokens = {};
    for (const [chain, tokens] of Object.entries(data)) {
      verifiedTokens[chain] = {};
      for (const [mint, token] of Object.entries(tokens as Record<string, any>)) {
        verifiedTokens[chain][mint] = {
          mintOrContract: mint,
          chain: chain as any,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          logoURI: token.logoURI,
          verified: token.verified || true,
          tags: token.tags,
        };
      }
    }

    return verifiedTokens;
  } catch (error) {
    console.error('Failed to load verified tokens', error);
    return {};
  }
}

export function getVerifiedToken(chain: string, mint: string): TokenMetadata | null {
  const tokens = loadVerifiedTokens();
  return tokens[chain]?.[mint] || null;
}

