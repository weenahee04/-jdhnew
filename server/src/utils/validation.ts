import { PublicKey } from '@solana/web3.js';

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function validateAddress(address: string, chain: string): boolean {
  if (chain === 'solana') {
    return isValidSolanaAddress(address);
  }
  if (chain === 'ethereum' || chain === 'polygon' || chain === 'bsc') {
    return isValidEthereumAddress(address);
  }
  return false;
}

