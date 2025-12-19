import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HeliusRpcProvider } from './helius.js';

// Mock undici fetch
vi.mock('undici', () => ({
  fetch: vi.fn(),
}));

describe('HeliusRpcProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with HELIUS_RPC_URL', () => {
    process.env.HELIUS_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=test';
    const provider = new HeliusRpcProvider();
    expect(provider.getConnection()).toBeTruthy();
  });

  it('should throw error if RPC not configured', async () => {
    process.env.HELIUS_RPC_URL = '';
    const provider = new HeliusRpcProvider();
    await expect(provider.getBalance('test')).rejects.toThrow('Helius RPC not configured');
  });
});

