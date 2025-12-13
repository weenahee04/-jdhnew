/**
 * React Hook for Token Metadata
 * 
 * Usage:
 * const { data, loading, error } = useTokenMeta(mintAddress);
 */

import { useState, useEffect } from 'react';
import { getTokenMeta, TokenMeta } from '../lib/tokenMetadata';

interface UseTokenMetaResult {
  data: TokenMeta | null;
  loading: boolean;
  error: Error | null;
}

export function useTokenMeta(mint: string | null): UseTokenMetaResult {
  const [data, setData] = useState<TokenMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!mint) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchMeta = async () => {
      setLoading(true);
      setError(null);

      try {
        const meta = await getTokenMeta(mint);
        if (!cancelled) {
          setData(meta);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
          // Set fallback data even on error
          setData({
            mint,
            name: 'Unknown Token',
            symbol: 'UNKNOWN',
            decimals: 9,
            logoURI: undefined,
            source: 'unknown',
          });
        }
      }
    };

    fetchMeta();

    return () => {
      cancelled = true;
    };
  }, [mint]);

  return { data, loading, error };
}



