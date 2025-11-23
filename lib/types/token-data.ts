export interface TokenData {
  // === MOBULA DATA (Always Available) ===
  marketCap: number;
  fdv: number;
  liquidityUSD: number;
  totalSupply: number;
  circulatingSupply: number;
  maxSupply: number | null;
  holderCount: number;
  top10HoldersPct: number; // 0-1 decimal (0.65 = 65%)
  top50HoldersPct?: number; // 0-1 decimal (NEW: top 50 holders %)
  top100HoldersPct?: number; // 0-1 decimal (NEW: top 100 holders %)
  volume24h: number;
  ageDays: number;
  burnedSupply: number;
  txCount24h: number;
  uniqueBuyers24h?: number; // NEW: unique buyers in 24h (for wash trading detection)

  // Vesting data (from Mobula or DropsTab)
  nextUnlock30dPct?: number; // 0-1 decimal
  teamVestingMonths?: number;
  teamAllocationPct?: number;

  // === GOPLUS DATA (Optional - fallback when unavailable) ===
  is_honeypot?: boolean;
  is_mintable?: boolean;
  owner_renounced?: boolean;
  buy_tax?: number; // 0-1 decimal (0.12 = 12%)
  sell_tax?: number; // 0-1 decimal
  tax_modifiable?: boolean;
  is_open_source?: boolean;
  lp_locked?: boolean;
  lp_in_owner_wallet?: boolean; // ✅ NEW: LP not burned/locked = rug risk
  creator_balance?: number;
  // === SOLANA SPECIFIC ===
  freeze_authority_exists?: boolean; // ✅ NEW: Solana freeze authority (critical flag)
  mint_authority_exists?: boolean; // ✅ NEW: Solana mint authority (inflation risk)

  // === CHAIN IDENTIFIER ===
  chain?: string; // ✅ NEW: "EVM", "SOLANA", "CARDANO", etc.
  
  // === LIQUIDITY TRACKING (NEW: for rug detection) ===
  liquidity1hAgo?: number; // Liquidity 1 hour ago for drop detection
  liquidity24hAgo?: number; // Liquidity 24 hours ago for drop detection
  
  // === DATA SOURCE TRACKING (Internal Use Only - Don't Show to Users) ===
  _txCount24h_is_estimated?: boolean; // TRUE = heuristic estimate, FALSE/undefined = real API data
  _ageDays_is_estimated?: boolean; // TRUE = heuristic estimate, FALSE/undefined = real API data
}

export interface RiskResult {
  overall_risk_score: number; // 0-100
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence_score: number; // 70-96 based on data availability
  breakdown: Partial<RiskBreakdown>;
  data_sources: string[];
  goplus_status?: "active" | "fallback";

  // Premium only fields
  critical_flags?: string[];
  upcoming_risks?: {
    next_30_days: number;
    forecast: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  };
  detailed_insights?: string[];
  upgrade_message?: string; // Free users only
  plan?: "FREE" | "PREMIUM";
  
  // AI & Social Metrics (Premium only)
  ai_insights?: {
    classification: 'MEME_TOKEN' | 'UTILITY_TOKEN';
    confidence: number;
    reasoning: string;
    meme_baseline_applied: boolean;
    is_manual_override?: boolean;
  };
  twitter_metrics?: {
    followers: number;
    engagement_rate: number;
    tweets_7d: number;
    adoption_score: number;
    handle: string;
  };

  // Comprehensive AI Analysis (Premium only)
  ai_summary?: {
    executive_summary: string;
    recommendation: 'BUY' | 'RESEARCH_MORE' | 'AVOID';
    classification: {
      type: 'MEME_TOKEN' | 'UTILITY_TOKEN';
      confidence: number;
    };
    factor_explanations: {
      [key: string]: string;
    };
    top_risk_factors: Array<{
      name: string;
      score: number;
      explanation: string;
      impact: string;
    }>;
    key_insights: string[];
    generated_at?: string;
  };

  // Positive Signals (Solana-specific good indicators)
  positive_signals?: string[];
}

export interface RiskBreakdown {
  supplyDilution: number;
  holderConcentration: number;
  liquidityDepth: number;
  vestingUnlock: number;
  contractControl: number;
  taxFee: number;
  distribution: number;
  burnDeflation: number;
  adoption: number;
  auditTransparency: number;
}


