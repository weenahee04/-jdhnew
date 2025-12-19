import type { TokenMetadata, Chain } from '../../types/index.js';

export interface MetadataProvider {
  chain: Chain;
  getTokenMetadata(mintOrContract: string): Promise<TokenMetadata | null>;
  getMultipleTokenMetadata(mintsOrContracts: string[]): Promise<Map<string, TokenMetadata>>;
}

