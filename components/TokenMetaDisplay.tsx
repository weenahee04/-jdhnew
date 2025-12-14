/**
 * Token Metadata Display Component
 * 
 * Displays token information with logo, symbol, and name
 * Handles loading and error states
 */

import React from 'react';
import { useTokenMeta } from '../hooks/useTokenMeta';
import { Loader2 } from 'lucide-react';

interface TokenMetaDisplayProps {
  mint: string | null;
  showLogo?: boolean;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TokenMetaDisplay: React.FC<TokenMetaDisplayProps> = ({
  mint,
  showLogo = true,
  showName = true,
  size = 'md',
  className = '',
}) => {
  const { data, loading, error } = useTokenMeta(mint);

  if (!mint) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLogo && (
          <div className={`rounded-full bg-zinc-700 flex items-center justify-center ${
            size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'
          }`}>
            <span className="text-white text-xs font-bold">?</span>
          </div>
        )}
        <div className="flex flex-col">
          <span className={`text-white font-medium ${
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          }`}>Unknown</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLogo && (
          <div className={`rounded-full bg-zinc-700 flex items-center justify-center ${
            size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'
          }`}>
            <Loader2 className="text-zinc-400 animate-spin" size={size === 'sm' ? 12 : size === 'md' ? 16 : 20} />
          </div>
        )}
        <div className="flex flex-col">
          <span className={`text-zinc-400 ${
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          }`}>Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLogo && (
          <div className={`rounded-full bg-zinc-700 flex items-center justify-center ${
            size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'
          }`}>
            <span className="text-white text-xs font-bold">?</span>
          </div>
        )}
        <div className="flex flex-col">
          <span className={`text-white font-medium ${
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          }`}>Unknown Token</span>
        </div>
      </div>
    );
  }

  const { name, symbol, logoURI } = data;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLogo && (
        <div className={`relative ${
          size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'
        }`}>
          {logoURI ? (
            <img
              src={logoURI}
              alt={symbol}
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                // Fallback to placeholder on error
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`rounded-full bg-zinc-700 flex items-center justify-center ${
              size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'
            } ${logoURI ? 'hidden' : 'flex'}`}
            style={{ backgroundColor: `#${mint.slice(0, 6)}` }}
          >
            <span className={`text-white font-bold ${
              size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-xs' : 'text-sm'
            }`}>
              {symbol.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
      )}
      {showName && (
        <div className="flex flex-col">
          <span className={`text-white font-medium ${
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          }`}>
            {symbol}
          </span>
          {size !== 'sm' && (
            <span className={`text-zinc-400 ${
              size === 'md' ? 'text-[10px]' : 'text-xs'
            }`}>
              {name}
            </span>
          )}
        </div>
      )}
    </div>
  );
};




