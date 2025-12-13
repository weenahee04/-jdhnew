import { useCallback, useMemo, useState } from 'react';
import { Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { connection, createMnemonic, mnemonicToKeypair, getPublicKeyBase58, getBalanceSol, sendSol, sendToken, explorerUrl, importKeypairFromSecret } from '../services/solanaClient';

export interface WalletInfo {
  mnemonic?: string;
  publicKey?: string;
  keypair?: Keypair;
}

export const useSolanaWallet = () => {
  const [wallet, setWallet] = useState<WalletInfo>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async () => {
    setError(null);
    const mnemonic = createMnemonic();
    const kp = mnemonicToKeypair(mnemonic);
    setWallet({ mnemonic, keypair: kp, publicKey: getPublicKeyBase58(kp) });
    return mnemonic;
  }, []);

  const loadFromMnemonic = useCallback(async (mnemonic: string) => {
    setError(null);
    const kp = mnemonicToKeypair(mnemonic);
    setWallet({ mnemonic, keypair: kp, publicKey: getPublicKeyBase58(kp) });
    return kp;
  }, []);

  const loadFromSecret = useCallback(async (secret: string) => {
    setError(null);
    const kp = importKeypairFromSecret(secret);
    setWallet({ keypair: kp, publicKey: getPublicKeyBase58(kp) });
    return kp;
  }, []);

  const balance = useCallback(async () => {
    if (!wallet.keypair) throw new Error('Wallet not loaded');
    return getBalanceSol(wallet.keypair.publicKey);
  }, [wallet.keypair]);

  const transferSol = useCallback(async (to: string, amountSol: number) => {
    if (!wallet.keypair) throw new Error('Wallet not loaded');
    setLoading(true);
    setError(null);
    try {
      const sig = await sendSol(wallet.keypair, to, amountSol);
      return { signature: sig, explorer: explorerUrl(sig) };
    } catch (e: any) {
      setError(e?.message || 'Transfer failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [wallet.keypair]);

  const transferToken = useCallback(async (to: string, mintAddress: string, amount: number, decimals?: number) => {
    if (!wallet.keypair) throw new Error('Wallet not loaded');
    setLoading(true);
    setError(null);
    try {
      const sig = await sendToken(wallet.keypair, to, mintAddress, amount, decimals);
      return { signature: sig, explorer: explorerUrl(sig) };
    } catch (e: any) {
      setError(e?.message || 'Token transfer failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [wallet.keypair]);

  const signAndSendVersioned = useCallback(async (serialized: string) => {
    if (!wallet.keypair) throw new Error('Wallet not loaded');
    const tx = VersionedTransaction.deserialize(Buffer.from(serialized, 'base64'));
    tx.sign([wallet.keypair]);
    const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
    await connection.confirmTransaction(sig, 'confirmed');
    return { signature: sig, explorer: explorerUrl(sig) };
  }, [wallet.keypair]);

  const publicKey = useMemo(() => wallet.publicKey ? new PublicKey(wallet.publicKey) : null, [wallet.publicKey]);

  return {
    wallet,
    publicKey,
    loading,
    error,
    create,
    loadFromMnemonic,
    loadFromSecret,
    balance,
    transferSol,
    transferToken,
    signAndSendVersioned,
    reset: () => setWallet({}),
  };
};

