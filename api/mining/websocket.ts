// WebSocket Server for Real-time Mining Dashboard
// Note: Vercel doesn't support WebSocket natively, so this would need to run on a separate server
// For Vercel, use Server-Sent Events (SSE) or polling instead

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// For Vercel, we'll use Server-Sent Events (SSE) instead of WebSocket
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    res.write('data: {"error": "Database configuration error"}\n\n');
    res.end();
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Send initial data
  const sendUpdate = async () => {
    try {
      // Get active miners (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: activeMiners } = await supabase
        .from('mining_audit_logs')
        .select('wallet_address')
        .eq('action', 'solution_accepted')
        .gte('created_at', fiveMinutesAgo);

      const uniqueMiners = new Set(activeMiners?.map(m => m.wallet_address) || []);
      const minersOnline = uniqueMiners.size;

      // Estimate hashrate
      const { data: recentSolutions } = await supabase
        .from('mining_audit_logs')
        .select('created_at')
        .eq('action', 'solution_accepted')
        .gte('created_at', fiveMinutesAgo);

      const solutionsCount = recentSolutions?.length || 0;
      const hashrateEstimate = Math.round((solutionsCount / 5) * 60);

      // Get recent accepted solutions
      const { data: recentAccepted } = await supabase
        .from('mining_audit_logs')
        .select('wallet_address, created_at, points_awarded')
        .eq('action', 'solution_accepted')
        .order('created_at', { ascending: false })
        .limit(20);

      // Get leaderboard
      const { data: leaderboard } = await supabase
        .from('mining_points')
        .select('wallet_address, points')
        .order('points', { ascending: false })
        .limit(10);

      // Get latest Merkle commitment
      const { data: latestCommitment } = await supabase
        .from('merkle_commitments')
        .select('*')
        .order('committed_at', { ascending: false })
        .limit(1)
        .single();

      const data = {
        minersOnline,
        hashrateEstimate,
        recentAccepted: recentAccepted || [],
        leaderboard: leaderboard || [],
        latestCommitment: latestCommitment || null,
        timestamp: Date.now(),
      };

      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: 'Update error' })}\n\n`);
    }
  };

  // Send updates every 2 seconds
  const interval = setInterval(sendUpdate, 2000);

  // Send initial update
  await sendUpdate();

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
}



