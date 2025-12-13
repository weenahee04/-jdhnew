// Vercel Serverless Function - Claim Airdrop
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, createTransferInstruction, TOKEN_PROGRAM_ID, getMint } from '@solana/spl-token';
import { createClient } from '@supabase/supabase-js';
import bs58 from 'bs58';

// JDH Token Mint Address
const JDH_MINT_ADDRESS = '5FaVDbaQtdZ4dizCqZcmpDscByWfcc1ssvu8snbcemjx';
const AIRDROP_AMOUNT = 10000; // 10000 JDH
const CODE_PREFIX = 'JI-68006751';

// Get RPC endpoint
function getRpcEndpoint(): string {
  if (process.env.HELIUS_RPC_URL) {
    return process.env.HELIUS_RPC_URL;
  }
  const cluster = process.env.SOLANA_CLUSTER || 'mainnet-beta';
  return cluster === 'mainnet-beta'
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, walletAddress } = req.body;

    if (!code || !walletAddress) {
      return res.status(400).json({ error: 'Missing required fields: code and walletAddress' });
    }

    // Validate code format
    const trimmedCode = code.trim();
    if (!trimmedCode.startsWith(CODE_PREFIX)) {
      return res.status(400).json({ error: `Code must start with "${CODE_PREFIX}"` });
    }

    // Validate wallet address
    try {
      new PublicKey(walletAddress);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // Get Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Database configuration error' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if code was already used
    const { data: existingClaim, error: checkError } = await supabase
      .from('airdrop_claims')
      .select('*')
      .eq('code', trimmedCode)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking airdrop code:', checkError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingClaim) {
      return res.status(400).json({ error: 'This airdrop code has already been used' });
    }

    // Get airdrop wallet private key from environment
    const airdropPrivateKey = process.env.AIRDROP_WALLET_PRIVATE_KEY;
    if (!airdropPrivateKey) {
      console.error('AIRDROP_WALLET_PRIVATE_KEY not configured');
      return res.status(500).json({ error: 'Airdrop service not configured' });
    }

    // Create airdrop wallet keypair
    let airdropKeypair: Keypair;
    try {
      // Support both base58 and hex format
      const privateKeyBytes = airdropPrivateKey.startsWith('[') 
        ? new Uint8Array(JSON.parse(airdropPrivateKey))
        : bs58.decode(airdropPrivateKey);
      airdropKeypair = Keypair.fromSecretKey(privateKeyBytes);
    } catch (e) {
      console.error('Error parsing airdrop private key:', e);
      return res.status(500).json({ error: 'Invalid airdrop wallet configuration' });
    }

    // Connect to Solana
    const connection = new Connection(getRpcEndpoint(), 'confirmed');
    const mintPubkey = new PublicKey(JDH_MINT_ADDRESS);
    const recipientPubkey = new PublicKey(walletAddress);

    // Get token decimals
    const mintInfo = await getMint(connection, mintPubkey);
    const decimals = mintInfo.decimals;

    // Get or create associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      airdropKeypair.publicKey
    );

    const toTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      recipientPubkey
    );

    // Check if airdrop wallet has token account and balance
    try {
      const fromAccount = await getAccount(connection, fromTokenAccount);
      const balance = Number(fromAccount.amount) / Math.pow(10, decimals);
      
      if (balance < AIRDROP_AMOUNT) {
        return res.status(500).json({ 
          error: `Insufficient airdrop balance. Available: ${balance.toFixed(2)} JDH, Required: ${AIRDROP_AMOUNT} JDH` 
        });
      }
    } catch (e) {
      return res.status(500).json({ error: 'Airdrop wallet does not have JDH tokens' });
    }

    // Convert amount to smallest unit
    const amountRaw = Math.floor(AIRDROP_AMOUNT * Math.pow(10, decimals));

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      airdropKeypair.publicKey,
      amountRaw,
      [],
      TOKEN_PROGRAM_ID
    );

    // Build and send transaction
    const transaction = new Transaction().add(transferInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = airdropKeypair.publicKey;

    // Sign and send transaction
    transaction.sign(airdropKeypair);
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');

    // Record the claim in database
    const { error: insertError } = await supabase
      .from('airdrop_claims')
      .insert({
        code: trimmedCode,
        wallet_address: walletAddress,
        amount: AIRDROP_AMOUNT,
        transaction_signature: signature,
        claimed_at: new Date().toISOString(),
      } as any);

    if (insertError) {
      console.error('Error recording airdrop claim:', insertError);
      // Transaction already sent, so we'll still return success
      // but log the error for manual tracking
    }

    return res.status(200).json({
      success: true,
      signature,
      amount: AIRDROP_AMOUNT,
      message: `Successfully sent ${AIRDROP_AMOUNT} JDH to ${walletAddress}`,
    });
  } catch (error: any) {
    console.error('Airdrop claim error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}



