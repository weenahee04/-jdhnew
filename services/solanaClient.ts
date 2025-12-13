import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, clusterApiUrl, ParsedAccountData } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, createTransferInstruction, getMint } from '@solana/spl-token';
import bs58 from 'bs58';
import { derivePath } from 'ed25519-hd-key';
import { mnemonicToSeedSync, generateMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

const DEFAULT_PATH = "m/44'/501'/0'/0'";

const getRpcEndpoint = () => {
  // @ts-ignore - Vite injects these
  if (typeof process !== 'undefined' && process.env?.HELIUS_RPC_URL) {
    // @ts-ignore
    console.log('🌐 Using Helius RPC URL:', process.env.HELIUS_RPC_URL.substring(0, 50) + '...');
    // @ts-ignore
    return process.env.HELIUS_RPC_URL;
  }
  // @ts-ignore
  // Default to mainnet-beta for production, devnet for development
  const cluster = (typeof process !== 'undefined' && process.env?.SOLANA_CLUSTER) || 
    (import.meta.env.PROD ? 'mainnet-beta' : 'devnet');
  console.log('🌐 Using Solana cluster:', cluster);
  return clusterApiUrl(cluster as any);
};

// Lazy initialization to avoid initialization order issues
let _connection: Connection | null = null;

const getConnection = (): Connection => {
  if (!_connection) {
    _connection = new Connection(getRpcEndpoint(), 'confirmed');
  }
  return _connection;
};

// Export connection as a getter function to avoid initialization order issues
export const connection = new Proxy({} as Connection, {
  get(_target, prop) {
    const conn = getConnection();
    const value = (conn as any)[prop];
    if (typeof value === 'function') {
      return value.bind(conn);
    }
    return value;
  },
  set(_target, prop, value) {
    (getConnection() as any)[prop] = value;
    return true;
  }
});

export const createMnemonic = (strength: 128 | 256 = 128) => generateMnemonic(wordlist, strength);

export const mnemonicToKeypair = (mnemonic: string, path: string = DEFAULT_PATH): Keypair => {
  if (!validateMnemonic(mnemonic, wordlist)) {
    throw new Error('Invalid mnemonic');
  }
  const seed = mnemonicToSeedSync(mnemonic);
  const derived = derivePath(path, seed.toString('hex'));
  return Keypair.fromSeed(derived.key.slice(0, 32));
};

export const getPublicKeyBase58 = (kp: Keypair) => kp.publicKey.toBase58();

export const getBalanceSol = async (pubkey: PublicKey) => {
  try {
    const lamports = await connection.getBalance(pubkey, { commitment: 'confirmed' });
    return lamports / LAMPORTS_PER_SOL;
  } catch (error: any) {
    console.error('Get balance error:', error);
    // Check if error message contains upgrade/purchase/subscription keywords
    const errorMsg = error?.message || error?.toString() || '';
    if (errorMsg.toLowerCase().includes('upgrade') || 
        errorMsg.toLowerCase().includes('purchase') || 
        errorMsg.toLowerCase().includes('subscription') ||
        errorMsg.toLowerCase().includes('1200') ||
        errorMsg.toLowerCase().includes('api key') ||
        errorMsg.toLowerCase().includes('rate limit')) {
      throw new Error('RPC endpoint error. Please check your RPC configuration.');
    }
    throw error;
  }
};

export const sendSol = async (from: Keypair, to: string, amountSol: number) => {
  try {
    const toPubkey = new PublicKey(to);
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey,
        lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
      })
    );

    const sig = await connection.sendTransaction(tx, [from], { skipPreflight: false, preflightCommitment: 'confirmed' });
    await connection.confirmTransaction(sig, 'confirmed');
    return sig;
  } catch (error: any) {
    console.error('Send SOL error:', error);
    // Check if error message contains upgrade/purchase/subscription keywords
    const errorMsg = error?.message || error?.toString() || '';
    if (errorMsg.toLowerCase().includes('upgrade') || 
        errorMsg.toLowerCase().includes('purchase') || 
        errorMsg.toLowerCase().includes('subscription') ||
        errorMsg.toLowerCase().includes('1200') ||
        errorMsg.toLowerCase().includes('api key') ||
        errorMsg.toLowerCase().includes('rate limit')) {
      throw new Error('RPC endpoint error. Please check your RPC configuration or contact support.');
    }
    throw new Error(error.message || 'การโอน SOL ล้มเหลว');
  }
};

export const explorerUrl = (signature: string) => {
  // @ts-ignore
  // Default to mainnet-beta for production, devnet for development
  const cluster = (typeof process !== 'undefined' && process.env?.SOLANA_CLUSTER) || 
    (import.meta.env.PROD ? 'mainnet-beta' : 'devnet');
  const suffix = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `https://explorer.solana.com/tx/${signature}${suffix}`;
};

export const importKeypairFromSecret = (secret: string) => {
  // Accept base58 or comma-separated array
  try {
    const decoded = bs58.decode(secret);
    if (decoded.length === 64) return Keypair.fromSecretKey(decoded);
  } catch (e) {
    // ignore
  }
  const parts = secret.split(',').map(p => Number(p.trim())).filter(n => !Number.isNaN(n));
  if (parts.length === 64) {
    return Keypair.fromSecretKey(Uint8Array.from(parts));
  }
  throw new Error('Invalid secret key format');
};

export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  name?: string;
}

export const getTokenBalances = async (pubkey: PublicKey): Promise<TokenBalance[]> => {
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: TOKEN_PROGRAM_ID,
    });

    return tokenAccounts.value.map(account => {
      const parsed = account.account.data as ParsedAccountData;
      const info = parsed.parsed.info;
      return {
        mint: info.mint,
        amount: Number(info.tokenAmount.amount),
        decimals: info.tokenAmount.decimals,
        uiAmount: Number(info.tokenAmount.uiAmount) || 0,
      };
    }).filter(t => t.uiAmount > 0);
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return [];
  }
};

// Transfer SPL Token
export const sendToken = async (
  from: Keypair,
  to: string,
  mintAddress: string,
  amount: number,
  decimals?: number
) => {
  try {
    const toPubkey = new PublicKey(to);
    const mintPubkey = new PublicKey(mintAddress);
    
    // Get decimals if not provided
    let tokenDecimals = decimals;
    if (!tokenDecimals) {
      const mintInfo = await getMint(connection, mintPubkey);
      tokenDecimals = mintInfo.decimals;
    }
    
    // Get or create associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      from.publicKey
    );
    
    const toTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      toPubkey
    );
    
    // Check if sender has token account
    try {
      await getAccount(connection, fromTokenAccount);
    } catch (e) {
      throw new Error('คุณไม่มีเหรียญนี้ในกระเป๋า');
    }
    
    // Convert amount to smallest unit
    const amountRaw = Math.floor(amount * Math.pow(10, tokenDecimals));
    
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      from.publicKey,
      amountRaw,
      [],
      TOKEN_PROGRAM_ID
    );
    
    // Build and send transaction
    const tx = new Transaction().add(transferInstruction);
    const sig = await connection.sendTransaction(tx, [from], { 
      skipPreflight: false, 
      preflightCommitment: 'confirmed' 
    });
    
    await connection.confirmTransaction(sig, 'confirmed');
    return sig;
  } catch (error: any) {
    console.error('Token transfer error:', error);
    // Check if error message contains upgrade/purchase/subscription keywords
    const errorMsg = error?.message || error?.toString() || '';
    if (errorMsg.toLowerCase().includes('upgrade') || 
        errorMsg.toLowerCase().includes('purchase') || 
        errorMsg.toLowerCase().includes('subscription') ||
        errorMsg.toLowerCase().includes('1200') ||
        errorMsg.toLowerCase().includes('api key') ||
        errorMsg.toLowerCase().includes('rate limit')) {
      throw new Error('RPC endpoint error. Please check your RPC configuration or contact support.');
    }
    throw new Error(error.message || 'การโอนเหรียญล้มเหลว');
  }
};
