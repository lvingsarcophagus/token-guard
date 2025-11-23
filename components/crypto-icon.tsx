/**
 * Monochrome Crypto Icons Component
 * Consistent with app's monotone design using Lucide icons
 */

import { Circle } from 'lucide-react'

interface CryptoIconProps {
  chain: string
  className?: string
}

export default function CryptoIcon({ chain, className = 'w-4 h-4' }: CryptoIconProps) {
  const chainLower = chain.toLowerCase()
  
  // Monochrome symbols for each chain
  const symbols: Record<string, string> = {
    ethereum: '⟠',
    eth: '⟠',
    solana: '◎',
    sol: '◎',
    bsc: 'BNB',
    'binance smart chain': 'BNB',
    polygon: 'MATIC',
    matic: 'MATIC',
    avalanche: '🔺',
    avax: '🔺',
    base: '🔵',
    arbitrum: 'ARB',
    optimism: 'OP',
    cardano: 'ADA',
    ton: 'TON'
  }

  const symbol = symbols[chainLower] || '●'

  return (
    <span className={`inline-flex items-center justify-center text-white/60 font-mono ${className}`}>
      {symbol}
    </span>
  )
}

// Chain badge component with icon
export function ChainBadge({ chain, className = '' }: { chain: string; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border border-white/20 bg-white/5 ${className}`}>
      <CryptoIcon chain={chain} className="w-3 h-3" />
      <span className="text-xs font-mono text-white/60">{chain.toUpperCase()}</span>
    </div>
  )
}
