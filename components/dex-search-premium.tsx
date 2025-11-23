"use client"

import { useState, useEffect, useRef } from 'react'
import {
    Search, Sparkles, TrendingUp, Clock, Filter,
    ArrowRight, Star, Zap, Activity, ChevronDown,
    Flame, Shield, AlertTriangle, CheckCircle, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TokenSearchResult {
    name: string
    symbol: string
    address: string | null
    chain: string | null
    cmcId: number
    rank: number
    slug: string
}

interface DexSearchPremiumProps {
    onTokenSelect: (data: any) => void
    onCMCTokenSelect: (address: string, chain: string, symbol: string, name: string) => void
    selectedChain: string
    onChainChange: (chain: string) => void
    manualTokenType: 'MEME_TOKEN' | 'UTILITY_TOKEN' | null
    onTokenTypeChange: (type: string) => void
    scanning: boolean
    error: string
    onClose?: () => void
}

export default function DexSearchPremium({
    onTokenSelect,
    onCMCTokenSelect,
    selectedChain,
    onChainChange,
    manualTokenType,
    onTokenTypeChange,
    scanning,
    error,
    onClose
}: DexSearchPremiumProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<TokenSearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [activeTab, setActiveTab] = useState<'trending' | 'recent' | 'gainers'>('trending')

    // Mock trending data with real icons
    const trendingTokens = [
        { symbol: 'BONK', name: 'Bonk', chain: 'Solana', price: '$0.00001234', change: '+15.4%', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/23095.png' },
        { symbol: 'WIF', name: 'dogwifhat', chain: 'Solana', price: '$2.45', change: '+8.2%', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/28752.png' },
        { symbol: 'PEPE', name: 'Pepe', chain: 'Ethereum', price: '$0.00000891', change: '-2.1%', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png' },
        { symbol: 'BRETT', name: 'Brett', chain: 'Base', price: '$0.045', change: '+32.5%', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/29743.png' },
        { symbol: 'JUP', name: 'Jupiter', chain: 'Solana', price: '$1.12', change: '+5.6%', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/29210.png' },
        { symbol: 'POPCAT', name: 'Popcat', chain: 'Solana', price: '$0.45', change: '+12.3%', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/29235.png' },
    ]

    const chains = [
        { id: 'ethereum', name: 'ETHEREUM', icon: '⟠', color: 'text-white' },
        { id: 'solana', name: 'SOLANA', icon: '◎', color: 'text-white' },
        { id: 'bsc', name: 'BSC', icon: 'BNB', color: 'text-white' },
        { id: 'base', name: 'BASE', icon: '🔵', color: 'text-white' },
        { id: 'polygon', name: 'POLYGON', icon: 'MATIC', color: 'text-white' },
        { id: 'avalanche', name: 'AVALANCHE', icon: '🔺', color: 'text-white' },
    ]

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                // Check if query is a direct address
                const isSolanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(query.trim())
                const isEVMAddress = /^0x[a-fA-F0-9]{40}$/i.test(query.trim())

                if (isSolanaAddress) {
                    onChainChange('solana')
                } else if (isEVMAddress && selectedChain === 'solana') {
                    // If it looks like EVM but we're on Solana, switch to Ethereum (or keep current if EVM)
                    onChainChange('ethereum')
                }

                const chainParam = selectedChain ? `&chain=${encodeURIComponent(selectedChain)}` : ''
                const res = await fetch(`/api/search-token?query=${encodeURIComponent(query)}${chainParam}`)
                const data = await res.json()

                let searchResults = data.results || []

                // If no results from API but it looks like a valid address, create a direct scan option
                if (searchResults.length === 0 && (isSolanaAddress || isEVMAddress)) {
                    searchResults = [{
                        name: 'Direct Contract Scan',
                        symbol: isSolanaAddress ? 'SOL-TOKEN' : 'TOKEN',
                        address: query.trim(),
                        chain: isSolanaAddress ? 'Solana' : (selectedChain === 'solana' ? 'Ethereum' : chains.find(c => c.id === selectedChain)?.name || 'Unknown'),
                        cmcId: 0,
                        rank: 0,
                        slug: 'direct-scan'
                    }]
                }

                setResults(searchResults)
            } catch (e) {
                console.error('Search failed', e)
                // Fallback for address input on error
                const isSolanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(query.trim())
                const isEVMAddress = /^0x[a-fA-F0-9]{40}$/i.test(query.trim())

                if (isSolanaAddress || isEVMAddress) {
                    setResults([{
                        name: 'Direct Contract Scan',
                        symbol: 'SCAN',
                        address: query.trim(),
                        chain: isSolanaAddress ? 'Solana' : 'Unknown',
                        cmcId: 0,
                        rank: 0,
                        slug: 'direct-scan'
                    }])
                }
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query, selectedChain])

    const handleSelect = (token: TokenSearchResult) => {
        console.log('[DexSearchPremium] Token selected:', token)
        if (!token.address) {
            console.warn('[DexSearchPremium] Token has no address, ignoring selection')
            return
        }

        // Clear dropdown immediately
        setQuery('')
        setResults([])

        // Call the parent callback
        onCMCTokenSelect(token.address, token.chain || 'Unknown', token.symbol, token.name)

        // Explicitly close the modal if the prop is provided
        if (onClose) {
            console.log('[DexSearchPremium] Closing modal via onClose prop')
            onClose()
        }
    }

    return (
        <div className="w-full h-full bg-black/80 backdrop-blur-xl text-white p-6 md:p-8 relative flex flex-col items-center">
            {/* Close Button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-3 rounded-full hover:bg-white/10 transition-colors z-[60] group border border-transparent hover:border-white/20"
                >
                    <X className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                </button>
            )}

            <div className="w-full max-w-5xl space-y-8 pb-24">
                {/* Header Section - Improved */}
                <div className="flex flex-col gap-6 text-center items-center pt-4">
                    <div className="space-y-3">
                        <h2 className="text-4xl md:text-5xl font-bold text-white font-mono tracking-tight flex items-center justify-center gap-3">
                            <Search className="w-9 h-9 text-white" />
                            TOKEN EXPLORER
                        </h2>
                        <p className="text-white/50 text-xs font-mono tracking-widest uppercase">
                            Advanced Multi-Chain Analysis & Risk Detection
                        </p>
                    </div>

                    {/* Chain Selector Pills - Improved */}
                    <div className="flex flex-wrap justify-center gap-2.5">
                        {chains.map((chain) => (
                            <button
                                key={chain.id}
                                onClick={() => onChainChange(chain.id)}
                                className={cn(
                                    "px-5 py-2.5 border text-[10px] font-mono transition-all duration-300 flex items-center gap-2 uppercase tracking-widest backdrop-blur-md",
                                    selectedChain === chain.id
                                        ? "bg-white text-black border-white font-bold shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105"
                                        : "bg-black/30 text-white/50 border-white/10 hover:border-white/30 hover:text-white hover:bg-white/5 hover:scale-102"
                                )}
                            >
                                <span className={cn("text-sm", selectedChain === chain.id ? "text-black" : "text-white/50")}>{chain.icon}</span>
                                {chain.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Large Search Bar Area - Enhanced */}
                <div className="relative z-40">
                    <div className="relative bg-black/50 backdrop-blur-xl border border-white/20 flex items-center gap-4 px-6 py-5 transition-all duration-300 focus-within:border-white focus-within:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:border-white/40 group">
                        <Search className="w-5 h-5 text-white/50 group-focus-within:text-white transition-colors duration-300" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="SEARCH TOKEN NAME, SYMBOL, OR ADDRESS..."
                            className="flex-1 bg-transparent border-none text-white placeholder:text-white/30 focus:ring-0 font-mono text-base md:text-lg h-8 uppercase tracking-wide focus:outline-none"
                            autoFocus
                        />
                        <div className="flex items-center gap-3">
                            {query && (
                                <button
                                    onClick={() => setQuery('')}
                                    className="p-1.5 hover:bg-white/10 rounded-full transition-all duration-200"
                                >
                                    <X className="w-4 h-4 text-white/50 hover:text-white transition-colors" />
                                </button>
                            )}
                            <div className="w-px h-6 bg-white/10"></div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn(
                                    "p-2 transition-all duration-300 border",
                                    showFilters ? "bg-white text-black border-white" : "hover:bg-white/10 text-white/60 hover:border-white/30 border-transparent"
                                )}
                            >
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Inline Search Results */}
                    <AnimatePresence>
                        {(query.length > 0 || results.length > 0) && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-4 bg-black/80 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl z-50 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                            >
                                {loading ? (
                                    <div className="py-12 flex justify-center items-center text-white/40 font-mono text-sm tracking-wider">
                                        <div className="animate-spin mr-3">⟳</div> SEARCHING...
                                    </div>
                                ) : results.length > 0 ? (
                                    <div className="divide-y divide-white/5">
                                        {results.map((token, i) => (
                                            <button
                                                key={i}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleSelect(token)
                                                }}
                                                className="w-full p-4 hover:bg-white/10 text-left group transition-all duration-200 flex items-center gap-4 cursor-pointer"
                                            >
                                                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-lg group-hover:bg-white group-hover:text-black transition-colors">
                                                    {token.symbol[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-white font-mono tracking-wider">{token.name}</span>
                                                        <span className="text-xs text-white/40 font-mono border border-white/10 px-1.5 rounded">{token.symbol}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-white/40 font-mono">
                                                        <span className="flex items-center gap-1">
                                                            {token.chain === 'Solana' ? '◎' : '⟠'} {token.chain || 'Unknown'}
                                                        </span>
                                                        {token.address && (
                                                            <span className="truncate max-w-[200px] opacity-60">
                                                                {token.address.slice(0, 6)}...{token.address.slice(-4)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <p className="text-white/40 font-mono text-sm mb-2">NO TOKENS FOUND</p>
                                        <p className="text-white/20 text-xs">Try searching by contract address</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Advanced Filters (Collapsible) */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border border-white/10 p-6 bg-white/5 backdrop-blur-md rounded-xl"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4 block">Token Type</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onTokenTypeChange('auto')}
                                            className={cn(
                                                "px-4 py-2 border text-xs font-mono flex-1 transition-all uppercase tracking-wider rounded-lg",
                                                !manualTokenType ? "bg-white text-black border-white font-bold" : "bg-transparent border-white/20 text-white/40 hover:border-white hover:text-white"
                                            )}
                                        >
                                            AUTO
                                        </button>
                                        <button
                                            onClick={() => onTokenTypeChange('MEME_TOKEN')}
                                            className={cn(
                                                "px-4 py-2 border text-xs font-mono flex-1 transition-all uppercase tracking-wider rounded-lg",
                                                manualTokenType === 'MEME_TOKEN' ? "bg-white text-black border-white font-bold" : "bg-transparent border-white/20 text-white/40 hover:border-white hover:text-white"
                                            )}
                                        >
                                            MEME
                                        </button>
                                        <button
                                            onClick={() => onTokenTypeChange('UTILITY_TOKEN')}
                                            className={cn(
                                                "px-4 py-2 border text-xs font-mono flex-1 transition-all uppercase tracking-wider rounded-lg",
                                                manualTokenType === 'UTILITY_TOKEN' ? "bg-white text-black border-white font-bold" : "bg-transparent border-white/20 text-white/40 hover:border-white hover:text-white"
                                            )}
                                        >
                                            UTILITY
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Trending / Recent Tabs */}
                {!query && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-8 border-b border-white/10">
                            <button
                                onClick={() => setActiveTab('trending')}
                                className={cn(
                                    "text-sm font-mono flex items-center gap-2 pb-4 border-b-2 transition-all tracking-wider",
                                    activeTab === 'trending' ? "border-white text-white" : "border-transparent text-white/40 hover:text-white"
                                )}
                            >
                                <Flame className="w-4 h-4" />
                                TRENDING
                            </button>
                            <button
                                onClick={() => setActiveTab('recent')}
                                className={cn(
                                    "text-sm font-mono flex items-center gap-2 pb-4 border-b-2 transition-all tracking-wider",
                                    activeTab === 'recent' ? "border-white text-white" : "border-transparent text-white/40 hover:text-white"
                                )}
                            >
                                <Clock className="w-4 h-4" />
                                RECENT
                            </button>
                        </div>

                        {/* Grid Layout for Cards - Enhanced */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {trendingTokens.map((token, i) => (
                                <div
                                    key={i}
                                    className="bg-black/30 backdrop-blur-md border border-white/10 p-5 hover:border-white/40 hover:bg-black/40 transition-all duration-300 cursor-pointer group hover:scale-102"
                                    onClick={() => {
                                        setQuery(token.symbol)
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-white/30 transition-all duration-300 p-1">
                                            {token.icon.startsWith('http') ? (
                                                <img src={token.icon} alt={token.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-2xl">{token.icon}</span>
                                            )}
                                        </div>
                                        <span className={cn(
                                            "text-[9px] font-mono px-2.5 py-1 border font-bold",
                                            token.change.startsWith('+') ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-red-500/40 text-red-400 bg-red-500/10"
                                        )}>
                                            {token.change}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="mb-3">
                                            <h3 className="text-white font-bold font-mono text-xl tracking-tight mb-0.5">{token.symbol}</h3>
                                            <p className="text-white/50 text-[10px] font-mono uppercase tracking-wider">{token.name}</p>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                            <span className="text-white font-mono text-sm font-bold">{token.price}</span>
                                            <span className="text-[9px] text-white/40 font-mono uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="text-xs">{token.chain === 'Solana' ? '◎' : '⟠'}</span>
                                                {token.chain}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="p-6 bg-red-500/5 border border-red-500/20 flex items-center gap-4 text-red-400 font-mono text-sm tracking-wider rounded-xl backdrop-blur-md">
                        <AlertTriangle className="w-5 h-5" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    )
}
