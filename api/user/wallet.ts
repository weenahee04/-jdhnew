// Vercel Serverless Function - Update User Wallet
import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    console.log('🔍 Update wallet API - Request:', {
      hasAuthHeader: !!authHeader,
      hasToken: !!token,
      tokenLength: token?.length,
      walletAddress: walletAddress?.substring(0, 20) + '...'
    });

    if (!token) {
      console.error('❌ No token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token verified, userId:', decoded.userId);
    } catch (error: any) {
      console.error('❌ Token verification failed:', error.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.userId;

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

    // Update user
    console.log('🔍 Updating user wallet:', { userId, walletAddress: walletAddress?.substring(0, 20) + '...' });
    const { data: user, error } = await supabase
      .from('users')
      .update({
        wallet_address: walletAddress,
        has_wallet: true,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error updating user wallet:', error);
      return res.status(500).json({ error: 'Failed to update wallet' });
    }

    if (!user) {
      console.error('❌ User not found after update:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User wallet updated successfully:', {
      userId,
      has_wallet: (user as any).has_wallet,
      wallet_address: (user as any).wallet_address?.substring(0, 20) + '...'
    });

    // Return updated user (without password_hash)
    const userData = user as any;
    const { password_hash, ...userWithoutPassword } = userData;

    return res.status(200).json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Update wallet error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

