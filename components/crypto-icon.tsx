/**
 * Crypto Icons Component using @web3icons/react
 * Uses individual icon components for optimal tree-shaking
 */

'use client';

import { NetworkEthereum, NetworkSolana, NetworkBinanceSmartChain, NetworkPolygon, NetworkAvalanche, NetworkBase, NetworkArbitrumOne, NetworkOptimism } from '@web3icons/react';

interface CryptoIconProps {
  chain: string;
  className?: string;
}

export default function CryptoIcon({ chain, className = 'w-4 h-4' }: CryptoIconProps) {
  const chainLower = chain.toLowerCase();
  
  // Map chain names to icon components
  const iconMap: Record<string, any> = {
    ethereum: NetworkEthereum,
    eth: NetworkEthereum,
    solana: NetworkSolana,
    sol: NetworkSolana,
    bsc: NetworkBinanceSmartChain,
    'binance smart chain': NetworkBinanceSmartChain,
    polygon: NetworkPolygon,
    matic: NetworkPolygon,
    avalanche: NetworkAvalanche,
    avax: NetworkAvalanche,
    base: NetworkBase,
    arbitrum: NetworkArbitrumOne,
    optimism: NetworkOptimism,
  };

  const IconComponent = iconMap[chainLower];

  // Fallback to a simple symbol if icon not found
  if (!IconComponent) {
    return (
      <span className={`inline-flex items-center justify-center text-white/80 font-mono ${className}`}>
        ●
      </span>
    );
  }

  return <IconComponent size={24} variant="mono" className={className} />;
}

// Chain badge component with icon
export function ChainBadge({ chain, className = '' }: { chain: string; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border border-white/20 bg-white/5 ${className}`}>
      <CryptoIcon chain={chain} className="w-3 h-3" />
      <span className="text-xs font-mono text-white/60">{chain.toUpperCase()}</span>
    </div>
  );
}

// Token badge component with icon
export function TokenBadge({ 
  token, 
  chain, 
  className = '' 
}: { 
  token: string; 
  chain?: string; 
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border border-white/20 bg-white/5 ${className}`}>
      <CryptoIcon chain={chain || 'ethereum'} className="w-3 h-3" />
      <span className="text-xs font-mono text-white/60">{token.toUpperCase()}</span>
    </div>
  );
}
