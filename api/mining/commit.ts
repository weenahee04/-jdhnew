// Vercel Serverless Function - Commit Merkle Root to Solana
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { createMerkleTree } from '../../lib/merkle';
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
    // Prioritize events without block_id, but also check merkle_commitment_id for backward compatibility
    const { data: uncommittedEvents } = await supabase
      .from('mining_events')
      .select('*')
      .or('block_id.is.null,merkle_commitment_id.is.null')
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

    // Get previous block for chain linking
    const { data: previousBlock } = await supabase
      .from('blocks')
      .select('block_hash, block_height')
      .order('block_height', { ascending: false })
      .limit(1)
      .single();

    const previousHash = previousBlock?.block_hash || null;
    const blockHeight = (previousBlock?.block_height || -1) + 1;
    
    // Calculate block time (time since previous block)
    let blockTimeSeconds = null;
    if (previousBlock) {
      const { data: prevBlockData } = await supabase
        .from('blocks')
        .select('mined_at')
        .eq('block_height', previousBlock.block_height)
        .single();
      
      if (prevBlockData?.mined_at) {
        const prevTime = new Date(prevBlockData.mined_at).getTime();
        blockTimeSeconds = Math.round((Date.now() - prevTime) / 1000);
      }
    }

    // Calculate total block reward (sum of all points)
    const blockReward = events.reduce((sum, e) => sum + e.pointsAwarded, 0);
    
    // Get miner address (wallet of first transaction)
    const minerAddress = events[0]?.walletAddress || null;
    
    // Calculate average difficulty
    const avgDifficulty = Math.round(events.reduce((sum, e) => sum + e.difficulty, 0) / events.length);

    // Create block hash: sha256(previous_hash + block_height + merkle_root + block_reward + timestamp)
    const blockHashInput = `${previousHash || 'genesis'}-${blockHeight}-${merkleRoot}-${blockReward}-${Date.now()}`;
    const blockHash = crypto.createHash('sha256').update(blockHashInput).digest('hex');

    // Store block in database
    const { data: block, error: blockError } = await supabase
      .from('blocks')
      .insert({
        block_height: blockHeight,
        block_hash: blockHash,
        previous_hash: previousHash,
        merkle_root: merkleRoot,
        transaction_count: events.length,
        block_reward: blockReward,
        difficulty: avgDifficulty,
        miner_address: minerAddress,
        block_time_seconds: blockTimeSeconds,
        solana_signature: transactionSignature,
      } as any)
      .select()
      .single();

    if (blockError) {
      throw blockError;
    }

    // Also store in merkle_commitments for backward compatibility
    const { data: commitment, error: commitError } = await supabase
      .from('merkle_commitments')
      .insert({
        merkle_root: merkleRoot,
        block_height: blockHeight,
        transaction_signature: transactionSignature,
        event_count: events.length,
        events_hash: crypto.createHash('sha256').update(JSON.stringify(events)).digest('hex'),
        block_id: block.id,
      } as any)
      .select()
      .single();

    if (commitError) {
      console.warn('Warning: Could not create merkle_commitment:', commitError);
    }

    // Update events with block ID and proofs
    for (let i = 0; i < uncommittedEvents.length; i++) {
      await supabase
        .from('mining_events')
        .update({
          block_id: block.id,
          merkle_commitment_id: commitment?.id || null,
          merkle_proof: JSON.stringify(eventsWithProofs[i].proof),
        } as any)
        .eq('id', uncommittedEvents[i].id);
    }

    return res.status(200).json({
      success: true,
      blockHeight,
      blockHash,
      previousHash,
      merkleRoot,
      transactionSignature,
      eventCount: events.length,
      blockReward,
      blockTimeSeconds,
      blockId: block.id,
    });

  } catch (error: any) {
    console.error('Commit error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}




