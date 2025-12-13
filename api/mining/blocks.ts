// Vercel Serverless Function - Block Explorer API
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
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

    const blockHeight = req.query.height ? parseInt(req.query.height as string) : null;
    const blockHash = req.query.hash as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    // Get specific block by height or hash
    if (blockHeight !== null || blockHash) {
      let query = supabase
        .from('blocks')
        .select('*')
        .order('block_height', { ascending: false });

      if (blockHeight !== null) {
        query = query.eq('block_height', blockHeight);
      } else if (blockHash) {
        query = query.eq('block_hash', blockHash);
      }

      const { data: block, error } = await query.single();

      if (error || !block) {
        return res.status(404).json({ error: 'Block not found' });
      }

      // Get transactions (mining events) for this block
      const { data: transactions } = await supabase
        .from('mining_events')
        .select('*')
        .eq('block_id', block.id)
        .order('created_at', { ascending: true });

      return res.status(200).json({
        ...block,
        transactions: transactions || [],
      });
    }

    // Get latest blocks (block explorer list)
    const { data: blocks, error } = await supabase
      .from('blocks')
      .select('*')
      .order('block_height', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Get latest block info
    const { data: latestBlock } = await supabase
      .from('blocks')
      .select('block_height, block_hash, mined_at')
      .order('block_height', { ascending: false })
      .limit(1)
      .single();

    // Get uncommitted transactions (mempool)
    const { data: mempool } = await supabase
      .from('mining_events')
      .select('*')
      .or('block_id.is.null,merkle_commitment_id.is.null')
      .order('created_at', { ascending: true });

    return res.status(200).json({
      blocks: blocks || [],
      latestBlock: latestBlock || null,
      totalBlocks: latestBlock?.block_height || 0,
      mempoolSize: mempool?.length || 0,
    });

  } catch (error: any) {
    console.error('Blocks API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
