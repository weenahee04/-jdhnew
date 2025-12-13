// Vercel Serverless Function - Get Wallet (Decrypted)
import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { supabase } from '../../lib/supabase';

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
    const supabase = getSupabaseClient();

    // Get wallet
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Decrypt mnemonic
    const decryptedMnemonic = decrypt(wallet.mnemonic_encrypted, ENCRYPTION_KEY);

    return res.status(200).json({
      success: true,
      wallet: {
        id: wallet.id,
        public_key: wallet.public_key,
        mnemonic: decryptedMnemonic, // Return decrypted mnemonic
        created_at: wallet.created_at,
      },
    });
  } catch (error: any) {
    console.error('Get wallet error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

