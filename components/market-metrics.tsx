'use client'

import { TrendingUp, TrendingDown, Users, Droplet, DollarSign, Clock } from 'lucide-react'

interface MarketMetricsProps {
  marketCap: string
  liquidity: string
  volume24h?: string
  price: number
  holders: number
  age: string
}

export default function MarketMetrics({
  marketCap,
  liquidity,
  volume24h,
  price,
  holders,
  age
}: MarketMetricsProps) {
  const formatPrice = (price: number): string => {
    if (price >= 1) return `$${price.toFixed(2)}`
    if (price >= 0.01) return `$${price.toFixed(4)}`
    if (price >= 0.0001) return `$${price.toFixed(6)}`
    return `$${price.toExponential(2)}`
  }

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toString()
  }

  return (
    <div className="border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <h3 className="text-white font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        MARKET METRICS
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Market Cap */}
        <div className="border border-white/10 bg-black/20 p-4 text-center">
          <div className="text-white/60 font-mono text-[10px] tracking-wider mb-2">
            MARKET CAP
          </div>
          <div className="text-white font-mono text-lg font-bold">
            {marketCap}
          </div>
        </div>

        {/* Liquidity */}
        <div className="border border-white/10 bg-black/20 p-4 text-center">
          <div className="text-white/60 font-mono text-[10px] tracking-wider mb-2 flex items-center justify-center gap-1">
            <Droplet className="w-3 h-3" />
            LIQUIDITY
          </div>
          <div className="text-cyan-400 font-mono text-lg font-bold">
            {liquidity}
          </div>
        </div>

        {/* Volume 24h */}
        {volume24h && (
          <div className="border border-white/10 bg-black/20 p-4 text-center">
            <div className="text-white/60 font-mono text-[10px] tracking-wider mb-2">
              VOLUME 24H
            </div>
            <div className="text-white font-mono text-lg font-bold">
              {volume24h}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="border border-white/10 bg-black/20 p-4 text-center">
          <div className="text-white/60 font-mono text-[10px] tracking-wider mb-2 flex items-center justify-center gap-1">
            <DollarSign className="w-3 h-3" />
            PRICE
          </div>
          <div className="text-green-400 font-mono text-lg font-bold">
            {formatPrice(price)}
          </div>
        </div>

        {/* Holders */}
        <div className="border border-white/10 bg-black/20 p-4 text-center">
          <div className="text-white/60 font-mono text-[10px] tracking-wider mb-2 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" />
            HOLDERS
          </div>
          <div className="text-white font-mono text-lg font-bold">
            {formatNumber(holders)}
          </div>
        </div>

        {/* Age */}
        <div className="border border-white/10 bg-black/20 p-4 text-center">
          <div className="text-white/60 font-mono text-[10px] tracking-wider mb-2 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            TOKEN AGE
          </div>
          <div className="text-white font-mono text-lg font-bold">
            {age}
          </div>
        </div>
      </div>
    </div>
  )
}
