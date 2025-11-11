'use client'

import { useState } from 'react'
import TokenSearchComponent from '@/components/token-search-cmc'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function TokenSearchPage() {
  const [selectedToken, setSelectedToken] = useState<{
    address: string
    chain: string
    symbol: string
    name: string
  } | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const handleTokenSelect = (address: string, chain: string, symbol: string, name: string) => {
    setSelectedToken({ address, chain, symbol, name })
    setAnalysisResult(null)
  }

  const handleAnalyze = async () => {
    if (!selectedToken) return

    setAnalyzing(true)
    setAnalysisResult(null)

    try {
      // Determine chainId based on chain name
      let chainId = 1 // Default to Ethereum
      const chainLower = selectedToken.chain.toLowerCase()
      
      if (chainLower.includes('bsc') || chainLower.includes('binance')) {
        chainId = 56
      } else if (chainLower.includes('solana')) {
        chainId = 1399811149
      } else if (chainLower.includes('polygon')) {
        chainId = 137
      } else if (chainLower.includes('arbitrum')) {
        chainId = 42161
      }

      console.log(`🔬 Analyzing ${selectedToken.symbol} on ${selectedToken.chain} (chainId: ${chainId})`)

      // Call analyze-token API
      const response = await fetch('/api/analyze-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: selectedToken.address,
          chainId
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      setAnalysisResult(data)

      console.log('✅ Analysis complete:', data)
    } catch (error: any) {
      console.error('Analysis error:', error)
      setAnalysisResult({ error: error.message })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Token Search & Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Search for any token by name or symbol, then analyze its risk profile
          </p>
        </div>

        {/* Search Component */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Search for Token</h2>
          <TokenSearchComponent onTokenSelect={handleTokenSelect} />
        </Card>

        {/* Selected Token */}
        {selectedToken && (
          <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Step 2: Selected Token</h2>
                <div className="space-y-2">
                  <p className="text-lg">
                    <strong>{selectedToken.name}</strong> ({selectedToken.symbol})
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Chain: {selectedToken.chain}
                  </p>
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-500 break-all">
                    {selectedToken.address}
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full"
                size="lg"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing with Mobula, Moralis, Helius...
                  </>
                ) : (
                  <>
                    Analyze Risk Profile
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Step 3: Analysis Results</h2>
            
            {analysisResult.error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
                <strong>Error:</strong> {analysisResult.error}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Risk Score */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Risk Score</p>
                      <p className="text-3xl font-bold">{analysisResult.riskScore}</p>
                    </div>
                    <div className={`text-2xl font-bold px-4 py-2 rounded ${
                      analysisResult.riskLevel === 'LOW' ? 'bg-green-500 text-white' :
                      analysisResult.riskLevel === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                      analysisResult.riskLevel === 'HIGH' ? 'bg-orange-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {analysisResult.riskLevel}
                    </div>
                  </div>
                </div>

                {/* Data Sources */}
                {analysisResult.data_sources && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Data Sources Used:</p>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.data_sources.map((source: string) => (
                        <span 
                          key={source}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Market Data */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Market Cap</p>
                    <p className="text-lg font-semibold">
                      ${analysisResult.marketCap?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Liquidity</p>
                    <p className="text-lg font-semibold">
                      ${analysisResult.liquidityUSD?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Holder Count</p>
                    <p className="text-lg font-semibold">
                      {analysisResult.holderCount?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-xs text-gray-500 dark:text-gray-400">24h Volume</p>
                    <p className="text-lg font-semibold">
                      ${analysisResult.volume24h?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Risk Factors */}
                {analysisResult.criticalFlags && analysisResult.criticalFlags.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-red-600 dark:text-red-400">
                      ⚠️ Critical Flags:
                    </p>
                    <ul className="space-y-1">
                      {analysisResult.criticalFlags.map((flag: string, idx: number) => (
                        <li key={idx} className="text-sm text-red-600 dark:text-red-400">
                          • {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Full JSON Response (for debugging) */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    View Full Response
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-900 text-gray-100 rounded overflow-x-auto">
                    {JSON.stringify(analysisResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </Card>
        )}

        {/* How It Works */}
        <Card className="p-6 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-3">🔍 How It Works</h3>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>
              <strong>1. CoinMarketCap Search:</strong> Enter a token name or symbol. We query CoinMarketCap's API to find matching tokens and their contract addresses.
            </li>
            <li>
              <strong>2. Contract Address Retrieval:</strong> CoinMarketCap provides the official contract address and blockchain network for each token.
            </li>
            <li>
              <strong>3. Multi-Source Analysis:</strong> The contract address is fed to our analysis engine which pulls data from:
              <ul className="ml-6 mt-1 space-y-1">
                <li>• <strong>Mobula:</strong> Market data (price, volume, liquidity, market cap)</li>
                <li>• <strong>Moralis:</strong> On-chain data (transactions, holder history)</li>
                <li>• <strong>Helius:</strong> Solana-specific security checks (freeze/mint authority)</li>
                <li>• <strong>GoPlus:</strong> Smart contract security analysis</li>
              </ul>
            </li>
            <li>
              <strong>4. Risk Calculation:</strong> Our 10-factor algorithm processes all data sources to generate a comprehensive risk score.
            </li>
          </ol>
        </Card>
      </div>
    </div>
  )
}
