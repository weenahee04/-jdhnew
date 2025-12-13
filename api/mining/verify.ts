// Vercel Serverless Function - Verify PoW Solution
import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { activeChallenges } from './challenge';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { challengeId, walletAddress, nonce, solution } = req.body;

    if (!challengeId || !walletAddress || !nonce || !solution) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Get challenge
    const challenge = activeChallenges.get(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found or expired' });
    }

    // Check expiry
    if (Date.now() > challenge.expiresAt) {
      activeChallenges.delete(challengeId);
      return res.status(410).json({ success: false, error: 'Challenge expired' });
    }

    // Check wallet address matches
    if (challenge.walletAddress !== walletAddress) {
      return res.status(403).json({ success: false, error: 'Wallet address mismatch' });
    }

    // Verify solution: sha256(seed + walletAddress + nonce + salt)
    const hashInput = challenge.seed + walletAddress + nonce + challenge.salt;
    const computedHash = crypto.createHash('sha256').update(hashInput).digest('hex');

    if (computedHash !== solution) {
      // Log failed attempt
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        await supabase.from('mining_audit_logs').insert({
          wallet_address: walletAddress,
          action: 'solution_failed',
          challenge_id: challengeId,
        } as any);
      }
      return res.status(400).json({ success: false, error: 'Invalid solution' });
    }

    // Check difficulty (leading zeros)
    const targetPrefix = '0'.repeat(challenge.difficulty);
    if (!solution.startsWith(targetPrefix)) {
      return res.status(400).json({ success: false, error: 'Solution does not meet difficulty requirement' });
    }

    // Solution is valid - remove challenge (one-time use)
    activeChallenges.delete(challengeId);

    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Database configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check daily cap (get from user deposit or default)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayPointsData, error: todayPointsError } = await supabase
      .from('mining_points')
      .select('points')
      .eq('wallet_address', walletAddress)
      .eq('date', today)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid error if no data

    const currentPoints = todayPointsData?.points || 0;
    
    // Get user tier (from on-chain data or cache)
    // For now, use default tier (Bronze: 1000 points/day)
    const dailyCap = 1000; // Will be fetched from on-chain UserMiningDeposit
    const pointsPerSolution = 10; // Base points per solution

    if (currentPoints + pointsPerSolution > dailyCap) {
      return res.status(429).json({ 
        success: false,
        error: 'Daily points cap reached',
        currentPoints,
        dailyCap,
      });
    }

    // Award points
    const newPoints = currentPoints + pointsPerSolution;
    const { error: pointsError } = await supabase.from('mining_points').upsert({
      wallet_address: walletAddress,
      date: today,
      points: newPoints,
      last_updated: new Date().toISOString(),
    } as any, {
      onConflict: 'wallet_address,date',
    });

    if (pointsError) {
      console.error('Error updating mining points:', pointsError);
      throw new Error(`Failed to update mining points: ${pointsError.message}`);
    }

    // Log successful solution
    const { error: auditError } = await supabase.from('mining_audit_logs').insert({
      wallet_address: walletAddress,
      action: 'solution_accepted',
      challenge_id: challengeId,
      points_awarded: pointsPerSolution,
      difficulty: challenge.difficulty,
    } as any);

    if (auditError) {
      console.error('Error logging audit:', auditError);
      // Don't throw - logging is non-critical
    }

    // Store mining event for Merkle tree
    const { error: eventError } = await supabase.from('mining_events').insert({
      wallet_address: walletAddress,
      challenge_id: challengeId,
      solution_hash: solution,
      points_awarded: pointsPerSolution,
      difficulty: challenge.difficulty,
    } as any);

    if (eventError) {
      console.error('Error storing mining event:', eventError);
      // Don't throw - event storage is non-critical for basic flow
    }

    // Update mining session
    const { data: session, error: sessionError } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('is_active', true)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid error if no data

    if (session && !sessionError) {
      const { error: updateError } = await supabase
        .from('mining_sessions')
        .update({
          last_activity: new Date().toISOString(),
          total_solutions: (session.total_solutions || 0) + 1,
          total_points: (session.total_points || 0) + pointsPerSolution,
        })
        .eq('id', session.id);

      if (updateError) {
        console.error('Error updating mining session:', updateError);
        // Don't throw - session update is non-critical
      }
    } else {
      const { error: insertError } = await supabase.from('mining_sessions').insert({
        wallet_address: walletAddress,
        total_solutions: 1,
        total_points: pointsPerSolution,
        is_active: true,
      } as any);

      if (insertError) {
        console.error('Error creating mining session:', insertError);
        // Don't throw - session creation is non-critical
      }
    }

    // Get total points across all dates for this wallet
    const { data: allPoints } = await supabase
      .from('mining_points')
      .select('points')
      .eq('wallet_address', walletAddress);

    const totalPoints = allPoints?.reduce((sum: number, row: any) => sum + (row.points || 0), 0) || 0;

    // Broadcast to WebSocket clients (via Redis pub/sub or similar)
    // For now, return success

    return res.status(200).json({
      success: true,
      points: pointsPerSolution,
      totalPoints,
      dailyPoints: newPoints,
      dailyCap,
    });

  } catch (error: any) {
    console.error('Solution verification error:', error);
    const errorMessage = error?.message || error?.toString() || 'Internal server error';
    return res.status(500).json({ 
      success: false,
      error: errorMessage 
    });
  }
}

