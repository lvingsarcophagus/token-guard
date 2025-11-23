'use client'

import { Users } from 'lucide-react'

interface HolderData {
  address: string
  balance: number
  percentage?: number
}

interface HolderDistributionProps {
  totalHolders: number
  topHolders: HolderData[]
  totalSupply?: number
  top10Percentage?: number
  top50Percentage?: number
  top100Percentage?: number
}

export default function HolderDistribution({
  totalHolders,
  topHolders,
  totalSupply,
  top10Percentage,
  top50Percentage,
  top100Percentage
}: HolderDistributionProps) {
  // Calculate percentages if totalSupply is provided
  const holdersWithPercentages = topHolders.map(holder => {
    if (holder.percentage !== undefined) {
      return holder
    }
    if (totalSupply && totalSupply > 0) {
      return {
        ...holder,
        percentage: (holder.balance / totalSupply) * 100
      }
    }
    return holder
  })

  const formatAddress = (address: string): string => {
    if (address.length <= 10) return address
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const renderProgressBar = (percentage: number) => {
    const filled = Math.round((percentage / 100) * 10)
    const empty = 10 - filled
    return '█'.repeat(filled) + '░'.repeat(empty)
  }

  return (
    <div className="border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <h3 className="text-white font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
        <Users className="w-4 h-4" />
        HOLDER DISTRIBUTION
      </h3>

      {/* Total Holders */}
      <div className="mb-4 pb-4 border-b border-white/10">
        <div className="text-white/60 font-mono text-[10px] tracking-wider">
          TOTAL HOLDERS
        </div>
        <div className="text-white font-mono text-2xl font-bold mt-1">
          {totalHolders.toLocaleString()}
        </div>
      </div>

      {/* Concentration Metrics */}
      {(top10Percentage || top50Percentage || top100Percentage) && (
        <div className="space-y-3 mb-6">
          {top10Percentage !== undefined && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-white/60 font-mono text-[10px] tracking-wider">
                  TOP 10 HOLDERS
                </span>
                <span className="text-cyan-400 font-mono text-xs font-bold">
                  {top10Percentage.toFixed(1)}%
                </span>
              </div>
              <div className="font-mono text-cyan-400 text-xs">
                {renderProgressBar(top10Percentage)}
              </div>
            </div>
          )}

          {top50Percentage !== undefined && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-white/60 font-mono text-[10px] tracking-wider">
                  TOP 50 HOLDERS
                </span>
                <span className="text-yellow-400 font-mono text-xs font-bold">
                  {top50Percentage.toFixed(1)}%
                </span>
              </div>
              <div className="font-mono text-yellow-400 text-xs">
                {renderProgressBar(top50Percentage)}
              </div>
            </div>
          )}

          {top100Percentage !== undefined && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-white/60 font-mono text-[10px] tracking-wider">
                  TOP 100 HOLDERS
                </span>
                <span className="text-orange-400 font-mono text-xs font-bold">
                  {top100Percentage.toFixed(1)}%
                </span>
              </div>
              <div className="font-mono text-orange-400 text-xs">
                {renderProgressBar(top100Percentage)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Holders List */}
      {holdersWithPercentages.length > 0 && (
        <div>
          <div className="text-white/60 font-mono text-[10px] tracking-wider mb-3">
            TOP {Math.min(5, holdersWithPercentages.length)} HOLDERS
          </div>
          <div className="space-y-2">
            {holdersWithPercentages.slice(0, 5).map((holder, index) => (
              <div key={holder.address} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-white/40 font-mono text-xs">
                    #{index + 1}
                  </span>
                  <span className="text-white font-mono text-xs">
                    {formatAddress(holder.address)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {holder.percentage !== undefined && (
                    <>
                      <span className={`font-mono text-xs font-bold ${
                        holder.percentage > 10 ? 'text-red-400' :
                        holder.percentage > 5 ? 'text-orange-400' :
                        holder.percentage > 2 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {holder.percentage.toFixed(2)}%
                      </span>
                      <span className={`font-mono text-[10px] ${
                        holder.percentage > 10 ? 'text-red-400' :
                        holder.percentage > 5 ? 'text-orange-400' :
                        holder.percentage > 2 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {renderProgressBar(holder.percentage)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {holdersWithPercentages.length === 0 && (
        <div className="text-center py-8 text-white/40 font-mono text-xs">
          NO HOLDER DATA AVAILABLE
        </div>
      )}
    </div>
  )
}
