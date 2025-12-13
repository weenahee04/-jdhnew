// Vercel Serverless Function - Get Wallet (Decrypted)
import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify JWT token (simplified - should verify properly)

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

    // Get wallet
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('🔍 Get wallet API - Query result:', {
      userId,
      hasWallet: !!wallet,
      error: error?.message,
      errorCode: error?.code
    });

    if (error) {
      console.error('❌ Supabase wallet query error:', error);
      // Check if it's a "not found" error (PGRST116) or other error
      if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('not found')) {
        console.log('⚠️ Wallet not found for user:', userId);
        return res.status(404).json({ error: 'Wallet not found' });
      }
      return res.status(500).json({ error: 'Database query error' });
    }

    if (!wallet) {
      console.log('⚠️ Wallet not found for user:', userId);
      return res.status(404).json({ error: 'Wallet not found' });
    }

    console.log('✅ Wallet found for user:', userId, 'public_key:', wallet.public_key?.substring(0, 20) + '...');

    // Type assertion for wallet
    const walletData = wallet as any;

    // Check if mnemonic_encrypted exists
    if (!walletData.mnemonic_encrypted) {
      console.error('❌ Wallet found but mnemonic_encrypted is missing for user:', userId);
      return res.status(500).json({ error: 'Wallet data is incomplete' });
    }

    // Decrypt mnemonic
    try {
      const decryptedMnemonic = decrypt(walletData.mnemonic_encrypted, ENCRYPTION_KEY);
      console.log('✅ Wallet mnemonic decrypted successfully for user:', userId);

      return res.status(200).json({
        success: true,
        wallet: {
          id: walletData.id,
          public_key: walletData.public_key,
          mnemonic: decryptedMnemonic, // Return decrypted mnemonic
          created_at: walletData.created_at,
        },
      });
    } catch (decryptError: any) {
      console.error('❌ Failed to decrypt mnemonic for user:', userId, 'error:', decryptError.message);
      return res.status(500).json({ error: 'Failed to decrypt wallet data' });
    }
  } catch (error: any) {
    console.error('Get wallet error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

