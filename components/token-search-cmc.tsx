'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'

interface TokenSearchResult {
  name: string
  symbol: string
  address: string | null
  chain: string | null
  cmcId: number
  rank: number
  slug: string
}

interface TokenSearchProps {
  onTokenSelect: (address: string, chain: string, symbol: string, name: string) => void
}

export default function TokenSearchComponent({ onTokenSelect }: TokenSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TokenSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a token name or symbol')
      return
    }

    setLoading(true)
    setError(null)
    setResults([])

    try {
      // First try simple symbol search
      const response = await fetch(`/api/search-token?query=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()

      let searchResults = []
      
      if (data.results && data.results.length > 0) {
        searchResults = data.results
        setResults(data.results)
      } else {
        // If no results, try advanced search (name matching)
        const advancedResponse = await fetch('/api/search-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, limit: 10 })
        })

        if (advancedResponse.ok) {
          const advancedData = await advancedResponse.json()
          searchResults = advancedData.results || []
          setResults(advancedData.results || [])
        }
      }

      if (searchResults.length === 0) {
        setError(`No tokens found for "${query}"`)
      }
    } catch (err: any) {
      setError(err.message || 'Search failed')
      console.error('Token search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectToken = (token: TokenSearchResult) => {
    if (!token.address) {
      setError(`${token.symbol} doesn't have a contract address (native blockchain token)`)
      return
    }

    onTokenSelect(token.address, token.chain || 'Unknown', token.symbol, token.name)
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by token name or symbol (e.g., BONK, Dogwifhat)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={loading}
          className="min-w-[100px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching
            </>
          ) : (
            'Search'
          )}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="relative z-[100] space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Found {results.length} token{results.length > 1 ? 's' : ''}
          </p>
          <div className="grid gap-2 max-h-[400px] overflow-y-auto shadow-2xl">
            {results.map((token) => (
              <Card
                key={token.cmcId}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => handleSelectToken(token)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{token.name}</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {token.symbol}
                      </span>
                      {token.rank && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                          #{token.rank}
                        </span>
                      )}
                    </div>
                    
                    {token.chain && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Chain: {token.chain}
                      </p>
                    )}
                    
                    {token.address ? (
                      <p className="text-xs font-mono text-gray-500 dark:text-gray-500 truncate">
                        {token.address}
                      </p>
                    ) : (
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        No contract address (native token)
                      </p>
                    )}
                  </div>

                  {token.address && (
                    <Button size="sm" variant="outline">
                      Analyze
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>💡 <strong>Tip:</strong> Search by token symbol for fastest results</p>
        <p>🔍 Supports both exact symbol match and name search</p>
        <p>📍 Returns contract addresses for blockchain analysis</p>
      </div>
    </div>
  )
}
