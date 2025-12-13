// Vercel Serverless Function - Commit Merkle Root to Solana
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { createMerkleTree } from '../../../lib/merkle';
import bs58 from 'bs58';
import crypto from 'crypto';

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
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Database configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get uncommitted events (last 100 or all if less)
    const { data: uncommittedEvents } = await supabase
      .from('mining_events')
      .select('*')
      .is('merkle_commitment_id', null)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!uncommittedEvents || uncommittedEvents.length === 0) {
      return res.status(200).json({ 
        message: 'No events to commit',
        committed: false,
      });
    }

    // Convert to MiningEvent format
    const events = uncommittedEvents.map((e: any) => ({
      id: e.id,
      walletAddress: e.wallet_address,
      challengeId: e.challenge_id,
      solutionHash: e.solution_hash,
      pointsAwarded: e.points_awarded,
      difficulty: e.difficulty,
      timestamp: new Date(e.created_at).getTime(),
    }));

    // Create Merkle tree
    const merkleTree = createMerkleTree(events);
    const merkleRoot = merkleTree.getRoot();

    // Generate proofs for each event
    const eventsWithProofs = events.map((event, index) => ({
      ...event,
      proof: merkleTree.getProof(index),
    }));

    // Commit to Solana (simplified - in production, use your Solana program)
    const connection = new Connection(getRpcEndpoint(), 'confirmed');
    
    // For now, we'll create a simple transaction that stores the merkle root
    // In production, this would call your Solana program's commit function
    const commitmentKeypair = Keypair.fromSecretKey(
      bs58.decode(process.env.MINING_COMMITMENT_KEYPAIR || '')
    );

    // Create a simple instruction (placeholder - replace with actual program call)
    const instruction = SystemProgram.transfer({
      fromPubkey: commitmentKeypair.publicKey,
      toPubkey: commitmentKeypair.publicKey, // Self-transfer as placeholder
      lamports: 0,
    });

    const transaction = new Transaction().add(instruction);
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.sign(commitmentKeypair);

    // For now, we'll skip actual transaction and just store in database
    // In production, send transaction and get signature
    const transactionSignature = 'placeholder_signature'; // await connection.sendTransaction(transaction, [commitmentKeypair]);

    // Store commitment in database
    const { data: commitment, error: commitError } = await supabase
      .from('merkle_commitments')
      .insert({
        merkle_root: merkleRoot,
        transaction_signature: transactionSignature,
        event_count: events.length,
        events_hash: crypto.createHash('sha256').update(JSON.stringify(events)).digest('hex'),
      } as any)
      .select()
      .single();

    if (commitError) {
      throw commitError;
    }

    // Update events with commitment ID and proofs
    for (let i = 0; i < uncommittedEvents.length; i++) {
      await supabase
        .from('mining_events')
        .update({
          merkle_commitment_id: commitment.id,
          merkle_proof: JSON.stringify(eventsWithProofs[i].proof),
        } as any)
        .eq('id', uncommittedEvents[i].id);
    }

    return res.status(200).json({
      success: true,
      merkleRoot,
      transactionSignature,
      eventCount: events.length,
      commitmentId: commitment.id,
    });

  } catch (error: any) {
    console.error('Commit error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}



