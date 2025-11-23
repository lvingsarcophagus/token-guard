#!/usr/bin/env python3
"""
Script to integrate DexSearchPremium into the dashboard modal
"""

import re

# Read the file
with open('app/premium/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports
old_imports = """import AIAnalysisAccordion from '@/components/ai-analysis-accordion'
import { MorphingSquare } from '@/components/ui/morphing-square'
import TokenSearchComponent from '@/components/token-search-cmc'
import SolanaHeliusPanel from '@/components/solana-helius-panel'
import ScanLoader from '@/components/scan-loader'
import AIExplanationPanel from '@/components/ai-explanation-panel'
import { 
  Shield, TrendingUp, TrendingDown, Activity, Users, Droplet,
  Zap, Crown, AlertCircle, CheckCircle, Sparkles, BarChart3,
  Clock, Target, Plus, Search, Bell, Settings, LogOut, Menu, X,
  User, Flame, BadgeCheck, Loader2, AlertTriangle, Eye, RefreshCw,
  ChevronDown, ChevronUp, ArrowRight, Star, Bookmark
} from 'lucide-react'"""

new_imports = """import AIAnalysisAccordion from '@/components/ai-analysis-accordion'
import { MorphingSquare } from '@/components/ui/morphing-square'
import TokenSearchComponent from '@/components/token-search-cmc'
import DexSearchPremium from '@/components/dex-search-premium'
import SolanaHeliusPanel from '@/components/solana-helius-panel'
import ScanLoader from '@/components/scan-loader'
import AIExplanationPanel from '@/components/ai-explanation-panel'
import RiskOverview from '@/components/risk-overview'
import MarketMetrics from '@/components/market-metrics'
import HolderDistribution from '@/components/holder-distribution'
import { 
  Shield, TrendingUp, TrendingDown, Activity, Users, Droplet,
  Zap, Crown, AlertCircle, CheckCircle, Sparkles, BarChart3,
  Clock, Target, Plus, Search, Bell, Settings, LogOut, Menu, X,
  User, Flame, BadgeCheck, Loader2, AlertTriangle, Eye, RefreshCw,
  ChevronDown, ChevronUp, ArrowRight, Star, Bookmark, ExternalLink, Database
} from 'lucide-react'"""

content = content.replace(old_imports, new_imports)

# 2. Add state
old_state = """  const [loadingInsights, setLoadingInsights] = useState(false)
  
  // Wallet analysis state
  const [walletData, setWalletData] = useState<any>(null)
  const [loadingWallet, setLoadingWallet] = useState(false)"""

new_state = """  const [loadingInsights, setLoadingInsights] = useState(false)
  
  // Recent activity state
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  
  // Helius data state (for Solana tokens)
  const [heliusData, setHeliusData] = useState<any>(null)
  
  // Wallet analysis state
  const [walletData, setWalletData] = useState<any>(null)
  const [loadingWallet, setLoadingWallet] = useState(false)"""

content = content.replace(old_state, new_state)

# 3. Replace modal content - find the pattern and replace
# Find from {showSearchModal && to the closing before {/* Scan Results
modal_pattern = r'(\{showSearchModal && \(\s*<>\s*\{/\* Backdrop \*/\}.*?</>\s*\)\})\s*\{/\* Scan Results'

modal_replacement = """{showSearchModal && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] animate-in fade-in duration-200"
              onClick={() => setShowSearchModal(false)}
            />
            
            {/* Modal with DexSearchPremium */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
              <div className="relative w-full max-w-4xl bg-black border border-white/20 shadow-2xl animate-in zoom-in-95 duration-200">
                
                <DexSearchPremium
                  onTokenSelect={handleTokenSelectFromSearch}
                  onCMCTokenSelect={handleSelectSuggestion}
                  selectedChain={selectedChain}
                  onChainChange={(chain) => setSelectedChain(chain as any)}
                  manualTokenType={manualTokenType}
                  onTokenTypeChange={(type) => setManualTokenType(type as any)}
                  scanning={scanning}
                  error={scanError}
                  onClose={() => setShowSearchModal(false)}
                />
              </div>
            </div>
          </>
        )}

        {/* Scan Results"""

content = re.sub(modal_pattern, modal_replacement, content, flags=re.DOTALL)

# Write back
with open('app/premium/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ DexSearchPremium integrated successfully!")
print("✅ Imports added")
print("✅ State added")
print("✅ Modal replaced")
