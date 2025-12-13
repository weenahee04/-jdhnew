// Vercel Serverless Function - Generate PoW Challenge
import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

interface Challenge {
  challengeId: string;
  seed: string;
  salt: string;
  difficulty: number;
  expiresAt: number;
  walletAddress: string;
}

// Store challenges in memory (in production, use Redis or database)
export const activeChallenges = new Map<string, Challenge>();

// Cleanup expired challenges every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [id, challenge] of activeChallenges.entries()) {
      if (challenge.expiresAt < now) {
        activeChallenges.delete(id);
      }
    }
  }, 5 * 60 * 1000);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, userAgent } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Missing walletAddress' });
    }

    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Database configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if user has deposit (from on-chain data or cache)
    // For now, we'll check rate limits
    const rateLimitKey = `mining:ratelimit:${walletAddress}`;
    const lastChallenge = await supabase
      .from('mining_audit_logs')
      .select('created_at')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Rate limit: max 1 challenge per 10 seconds
    if (lastChallenge.data) {
      const lastTime = new Date(lastChallenge.data.created_at).getTime();
      const now = Date.now();
      if (now - lastTime < 10000) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded. Please wait before requesting a new challenge.' 
        });
      }
    }

    // Determine difficulty based on user agent (mobile vs desktop)
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent || '');
    const baseDifficulty = isMobile ? 4 : 6; // Mobile: 4 leading zeros, Desktop: 6

    // Generate challenge
    const challengeId = crypto.randomBytes(16).toString('hex');
    const seed = crypto.randomBytes(16).toString('hex');
    const salt = crypto.randomBytes(8).toString('hex');
    const expiresAt = Date.now() + 60000; // 1 minute expiry

    const challenge: Challenge = {
      challengeId,
      seed,
      salt,
      difficulty: baseDifficulty,
      expiresAt,
      walletAddress,
    };

    activeChallenges.set(challengeId, challenge);

    // Log challenge generation
    await supabase.from('mining_audit_logs').insert({
      wallet_address: walletAddress,
      action: 'challenge_generated',
      challenge_id: challengeId,
      difficulty: baseDifficulty,
      user_agent: userAgent,
    } as any);

    return res.status(200).json({
      challengeId,
      seed,
      salt,
      difficulty: baseDifficulty,
      expiresAt,
    });

  } catch (error: any) {
    console.error('Challenge generation error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}


