// Vercel Serverless Function - Save Wallet (Encrypted)
import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32-byte key for AES-256

// Encrypt mnemonic
function encrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt mnemonic
function decrypt(encryptedText: string, key: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, mnemonic, publicKey } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token || !userId || !mnemonic || !publicKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify JWT token (simplified - should verify properly)
    // In production, use proper JWT verification

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

    // Encrypt mnemonic
    const encryptedMnemonic = encrypt(mnemonic, ENCRYPTION_KEY);

    // Save wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .upsert({
        user_id: userId,
        mnemonic_encrypted: encryptedMnemonic,
        public_key: publicKey,
      } as any)
      .select()
      .single();

    if (walletError) {
      console.error('Supabase error:', walletError);
      return res.status(500).json({ error: 'Failed to save wallet' });
    }

    if (!wallet) {
      return res.status(500).json({ error: 'Failed to save wallet - no data returned' });
    }

    // Update user has_wallet flag (backup - should already be updated by updateUserWallet)
    console.log('🔍 Updating has_wallet flag in saveWallet (backup):', { userId, publicKey: publicKey?.substring(0, 20) + '...' });
    const { error: updateError, data: updatedUser } = await supabase
      .from('users')
      .update({
        has_wallet: true,
        wallet_address: publicKey,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update user error in saveWallet:', updateError);
    } else {
      console.log('✅ has_wallet flag updated in saveWallet:', {
        userId,
        has_wallet: (updatedUser as any)?.has_wallet,
        wallet_address: (updatedUser as any)?.wallet_address?.substring(0, 20) + '...'
      });
    }

    const walletData = wallet as any;

    return res.status(200).json({
      success: true,
      wallet: {
        id: walletData.id,
        public_key: walletData.public_key,
        created_at: walletData.created_at,
      },
    });
  } catch (error: any) {
    console.error('Save wallet error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

