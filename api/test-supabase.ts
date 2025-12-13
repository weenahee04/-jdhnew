// Test Supabase Connection
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Check environment variables
    const envCheck = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      SUPABASE_URL_VALUE: process.env.SUPABASE_URL ? 'Set' : 'Missing',
    };

    // Try to get Supabase client
    let supabase;
    try {
      if (!envCheck.SUPABASE_URL || !envCheck.SUPABASE_SERVICE_KEY) {
        return res.status(500).json({
          success: false,
          error: 'Missing environment variables',
          envCheck,
        });
      }
      
      supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize Supabase',
        message: error.message,
        envCheck,
        stack: error.stack,
      });
    }

    // Try to query users table
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .limit(1);

    return res.status(200).json({
      success: true,
      envCheck,
      supabaseConnected: !!supabase,
      tableQuery: {
        success: !error,
        error: error?.message || null,
        dataCount: count || 0,
        sampleData: data?.[0] || null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}

