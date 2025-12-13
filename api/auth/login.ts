// Vercel Serverless Function - User Login
import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
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

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Type assertion for user
    const userData = user as any;

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userData.id, email: userData.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user (without password_hash) and token
    const { password_hash, ...userWithoutPassword } = userData;

    // Ensure has_wallet and wallet_address are properly set
    // Check if wallet exists in wallets table
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('public_key')
      .eq('user_id', userData.id)
      .single();

    console.log('🔍 Login - Wallet check:', {
      userId: userData.id,
      hasWallet: !!wallet,
      walletError: walletError?.message,
      currentHasWallet: userWithoutPassword.has_wallet,
      currentWalletAddress: userWithoutPassword.wallet_address
    });

    // If wallet exists but has_wallet is false, update it
    if (wallet && wallet.public_key) {
      if (!userWithoutPassword.has_wallet || !userWithoutPassword.wallet_address || userWithoutPassword.wallet_address !== wallet.public_key) {
        console.log('🔍 Updating has_wallet flag for user:', userData.id);
        const { error: updateError } = await supabase
          .from('users')
          .update({
            has_wallet: true,
            wallet_address: wallet.public_key,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', userData.id);

        if (updateError) {
          console.error('❌ Failed to update has_wallet flag:', updateError);
        } else {
          console.log('✅ Updated has_wallet flag successfully');
        }

        // Update userWithoutPassword
        userWithoutPassword.has_wallet = true;
        userWithoutPassword.wallet_address = wallet.public_key;
      }
    } else if (!wallet && userWithoutPassword.has_wallet) {
      // Wallet doesn't exist but has_wallet flag is true - this is inconsistent
      console.warn('⚠️ Wallet not found but has_wallet flag is true for user:', userData.id);
      // Set has_wallet to false to prevent going to WALLET_CREATE
      userWithoutPassword.has_wallet = false;
      userWithoutPassword.wallet_address = null;
    }

    return res.status(200).json({
      success: true,
      user: userWithoutPassword,
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

