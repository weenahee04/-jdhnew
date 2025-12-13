// Vercel Serverless Function - Get Mining Statistics
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

    const walletAddress = req.query.wallet as string | undefined;

    // Get active miners (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: activeMiners } = await supabase
      .from('mining_audit_logs')
      .select('wallet_address')
      .eq('action', 'solution_accepted')
      .gte('created_at', fiveMinutesAgo);

    const uniqueMiners = new Set(activeMiners?.map(m => m.wallet_address) || []);
    const minersOnline = uniqueMiners.size;

    // Estimate hashrate (solutions per minute in last 5 minutes)
    const { data: recentSolutions } = await supabase
      .from('mining_audit_logs')
      .select('created_at')
      .eq('action', 'solution_accepted')
      .gte('created_at', fiveMinutesAgo);

    const solutionsCount = recentSolutions?.length || 0;
    const hashrateEstimate = Math.round((solutionsCount / 5) * 60); // Solutions per hour

    // Get leaderboard (top 10 by total points across all dates)
    const { data: allPoints } = await supabase
      .from('mining_points')
      .select('wallet_address, points');

    // Aggregate points by wallet
    const pointsByWallet = new Map<string, number>();
    allPoints?.forEach((row: any) => {
      const current = pointsByWallet.get(row.wallet_address) || 0;
      pointsByWallet.set(row.wallet_address, current + (row.points || 0));
    });

    // Convert to array and sort
    const leaderboard = Array.from(pointsByWallet.entries())
      .map(([wallet_address, points]) => ({ wallet_address, points }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);

    // Get recent accepted solutions (last 20)
    const { data: recentAccepted } = await supabase
      .from('mining_audit_logs')
      .select('wallet_address, created_at, points_awarded')
      .eq('action', 'solution_accepted')
      .order('created_at', { ascending: false })
      .limit(20);

    // If wallet address provided, include user-specific stats
    let userStats: any = {};
    if (walletAddress) {
      // Get total user points
      const { data: userPointsData } = await supabase
        .from('mining_points')
        .select('points')
        .eq('wallet_address', walletAddress);

      const totalUserPoints = userPointsData?.reduce((sum: number, row: any) => sum + (row.points || 0), 0) || 0;

      // Get today's points
      const today = new Date().toISOString().split('T')[0];
      const { data: todayPoints } = await supabase
        .from('mining_points')
        .select('points')
        .eq('wallet_address', walletAddress)
        .eq('date', today)
        .single();

      const dailyPoints = todayPoints?.points || 0;

      // Determine tier based on deposit (would come from on-chain, default to Bronze)
      // For now, use a placeholder - in production, fetch from Solana
      const depositAmount = 0; // TODO: Fetch from on-chain UserMiningDeposit
      let userTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' = 'Bronze';
      let dailyCap = 1000;
      
      if (depositAmount >= 100000) {
        userTier = 'Platinum';
        dailyCap = 100000;
      } else if (depositAmount >= 10000) {
        userTier = 'Gold';
        dailyCap = 25000;
      } else if (depositAmount >= 1000) {
        userTier = 'Silver';
        dailyCap = 5000;
      }

      userStats = {
        userPoints: totalUserPoints,
        userTier,
        depositAmount,
        dailyPoints,
        dailyCap,
      };
    }

    return res.status(200).json({
      minersOnline,
      hashrateEstimate,
      leaderboard: leaderboard || [],
      recentAccepted: recentAccepted || [],
      ...userStats,
    });

  } catch (error: any) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}



