'use client'

import { Shield, AlertTriangle, CheckCircle, Lock, Unlock, Coins } from 'lucide-react'

interface ChainSpecificInfoProps {
  chain: string
  data: any
}

export default function ChainSpecificInfo({ chain, data }: ChainSpecificInfoProps) {
  if (!data) return null

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
      <h3 className="text-lg font-bold text-white font-mono tracking-wider mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5" />
        CHAIN-SPECIFIC INFORMATION
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <span className="text-white/60 font-mono text-sm">Chain</span>
          <span className="text-white font-mono text-sm font-bold uppercase">{chain}</span>
        </div>
        
        {data.contractVerified !== undefined && (
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-white/60 font-mono text-sm">Contract Verified</span>
            <span className={`font-mono text-sm font-bold flex items-center gap-2 ${data.contractVerified ? 'text-green-400' : 'text-red-400'}`}>
              {data.contractVerified ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {data.contractVerified ? 'YES' : 'NO'}
            </span>
          </div>
        )}
        
        {data.isProxy !== undefined && (
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-white/60 font-mono text-sm">Proxy Contract</span>
            <span className={`font-mono text-sm font-bold ${data.isProxy ? 'text-yellow-400' : 'text-green-400'}`}>
              {data.isProxy ? 'YES' : 'NO'}
            </span>
          </div>
        )}
        
        {data.ownershipRenounced !== undefined && (
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-white/60 font-mono text-sm">Ownership Renounced</span>
            <span className={`font-mono text-sm font-bold flex items-center gap-2 ${data.ownershipRenounced ? 'text-green-400' : 'text-yellow-400'}`}>
              {data.ownershipRenounced ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {data.ownershipRenounced ? 'YES' : 'NO'}
            </span>
          </div>
        )}
        
        {data.totalSupply && (
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-white/60 font-mono text-sm">Total Supply</span>
            <span className="text-white font-mono text-sm font-bold flex items-center gap-2">
              <Coins className="w-4 h-4" />
              {Number(data.totalSupply).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
