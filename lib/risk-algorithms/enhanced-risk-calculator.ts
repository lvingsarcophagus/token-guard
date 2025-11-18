/**
 * Enhanced Token Risk Calculator
 * Implements 7-factor optimized scoring with dynamic confidence weighting
 */

// ============================================================================
// STEP 1: Define Core Types and Enums
// ============================================================================

enum DataQuality {
  VERIFIED = 'verified',      // Direct on-chain data (e.g., holder count)
  ESTIMATED = 'estimated',    // Calculated from proxies (e.g., contract control heuristics)
  UNKNOWN = 'unknown'         // Impossible to determine without specific API (e.g., taxes without GoPlus)
}

interface MobulaData {
  marketCap: number;
  fdv: number;
  liquidityUSD: number;
  holderCount: number;
  top10HoldersPct: number;  // 0-1 decimal (e.g., 0.15 = 15%)
  totalSupply: number;
  circulatingSupply: number;
  maxSupply?: number;       // Optional: some tokens have unlimited supply
  burnedSupply?: number;
  txCount24h: number;
  volume24h: number;
  deployerAddress?: string;
  deployerHoldingPct?: number;  // 0-1 decimal
  deployerTxLast7Days?: number;
  ageDays: number;
  liquidityLocked?: boolean;
  dataTimestamp: number;    // Unix timestamp for freshness tracking
}

interface GoPlusData {
  is_honeypot: boolean;
  is_mintable: boolean;
  owner_renounced: boolean;
  owner_address: string;
  sell_tax: number;         // 0-1 decimal (e.g., 0.10 = 10% tax)
  buy_tax: number;
  is_open_source: boolean;
  lp_holders?: Array<{
    address: string;
    locked: boolean;
    locked_until?: number;  // Unix timestamp
  }>;
  dataTimestamp: number;
}

interface TokenData extends Partial<MobulaData>, Partial<GoPlusData> {
  tokenAddress: string;
  chainId: number;
  hasGoPlusData: boolean;   // Flag to track if GoPlus loaded successfully
}

// ============================================================================
// STEP 2: Define Optimized Factor Structure (7 factors, down from 10)
// ============================================================================

enum RiskFactor {
  CONTRACT_SECURITY = 'contractSecurity',    // Honeypot, mint, taxes, ownership
  SUPPLY_RISK = 'supplyRisk',                // Circulating vs total, unlocks
  CONCENTRATION_RISK = 'concentrationRisk',  // Holder distribution, whale control
  LIQUIDITY_RISK = 'liquidityRisk',          // Pool depth, lock status
  MARKET_ACTIVITY = 'marketActivity',        // Volume, transactions, adoption
  DEFLATION_MECHANICS = 'deflationMechanics',// Burns, supply cap
  TOKEN_AGE = 'tokenAge'                     // Contract deployment age
}

const FACTOR_WEIGHTS: Record<RiskFactor, number> = {
  [RiskFactor.CONTRACT_SECURITY]: 0.25,
  [RiskFactor.SUPPLY_RISK]: 0.20,
  [RiskFactor.CONCENTRATION_RISK]: 0.10,
  [RiskFactor.LIQUIDITY_RISK]: 0.18,
  [RiskFactor.MARKET_ACTIVITY]: 0.12,
  [RiskFactor.DEFLATION_MECHANICS]: 0.08,
  [RiskFactor.TOKEN_AGE]: 0.07
};

const FACTOR_DATA_QUALITY: Record<RiskFactor, DataQuality> = {
  [RiskFactor.CONTRACT_SECURITY]: DataQuality.ESTIMATED,    // GoPlus=verified, fallback=estimated
  [RiskFactor.SUPPLY_RISK]: DataQuality.VERIFIED,
  [RiskFactor.CONCENTRATION_RISK]: DataQuality.VERIFIED,
  [RiskFactor.LIQUIDITY_RISK]: DataQuality.VERIFIED,
  [RiskFactor.MARKET_ACTIVITY]: DataQuality.VERIFIED,
  [RiskFactor.DEFLATION_MECHANICS]: DataQuality.VERIFIED,
  [RiskFactor.TOKEN_AGE]: DataQuality.VERIFIED
};

// ============================================================================
// STEP 3: Implement Individual Risk Factor Calculators
// ============================================================================

function calculateContractSecurity(data: TokenData): { 
  score: number; 
  quality: DataQuality;
  flags: string[];
} {
  const flags: string[] = [];
  
  // Critical: Honeypot detection
  if (data.is_honeypot) {
    flags.push('🚨 HONEYPOT DETECTED - Cannot sell tokens');
    return { score: 100, quality: DataQuality.VERIFIED, flags };
  }
  
  // Override: Battle-tested large caps
  if (data.marketCap && data.marketCap > 50_000_000_000) {
    return { score: 0, quality: DataQuality.VERIFIED, flags };
  }
  
  let score = 0;
  let quality = DataQuality.ESTIMATED;
  
  if (data.hasGoPlusData) {
    quality = DataQuality.VERIFIED;
    
    // Ownership & Mint risks
    if (data.is_mintable && !data.owner_renounced) {
      score += 60;
      flags.push('⚠️ Owner can mint unlimited tokens');
    } else if (!data.owner_renounced && !data.is_mintable) {
      score += 30;
      flags.push('⚠️ Owner has control but cannot mint');
    }
    
    // Tax analysis
    if (data.sell_tax) {
      if (data.sell_tax > 0.30) {
        score += 60;
        flags.push(`🚨 ${(data.sell_tax * 100).toFixed(0)}% sell tax - Exit heavily taxed`);
      } else if (data.sell_tax > 0.20) {
        score += 40;
        flags.push(`⚠️ ${(data.sell_tax * 100).toFixed(0)}% sell tax`);
      } else if (data.sell_tax > 0.10) {
        score += 20;
        flags.push(`⚠️ ${(data.sell_tax * 100).toFixed(0)}% sell tax`);
      }
    }
    
    if (data.buy_tax && data.buy_tax > 0.15) {
      score += 20;
      flags.push(`⚠️ ${(data.buy_tax * 100).toFixed(0)}% buy tax`);
    }
    
    // Transparency
    if (!data.is_open_source) {
      score += 20;
      flags.push('⚠️ Contract not verified/open source');
    }
  } else {
    // Fallback heuristic
    quality = DataQuality.ESTIMATED;
    score = 20; // Base uncertainty
    
    if (data.deployerHoldingPct !== undefined) {
      if (data.deployerHoldingPct > 0.20) {
        score += 30;
        flags.push('⚠️ Deployer holds >20% of supply');
      } else if (data.deployerHoldingPct > 0.10) {
        score += 15;
        flags.push('⚠️ Deployer holds >10% of supply');
      }
    }
    
    // Only flag if we have explicit data that liquidity is NOT locked
    // Don't flag if data is unavailable (undefined/null)
    if (data.liquidityLocked === false) {
      score += 25;
      flags.push('⚠️ Liquidity not locked');
    } else if (data.liquidityLocked === true) {
      // Bonus for locked liquidity
      score = Math.max(0, score - 10);
    }
    
    if (data.deployerTxLast7Days && data.deployerTxLast7Days > 5) {
      score += 20;
      flags.push('⚠️ High deployer wallet activity');
    }
    
    if (data.holderCount && data.ageDays) {
      const holderGrowthRate = data.holderCount / Math.max(data.ageDays, 1);
      if (holderGrowthRate < 2 && data.ageDays > 30) {
        score += 15;
        flags.push('⚠️ Low holder growth for token age');
      }
    }
    
    if (data.totalSupply && data.maxSupply && data.totalSupply !== data.maxSupply) {
      score += 10;
      flags.push('⚠️ Supply can increase (mintable)');
    }
  }
  
  return { score: Math.min(score, 100), quality, flags };
}

function calculateSupplyRisk(data: TokenData): {
  score: number;
  quality: DataQuality;
  flags: string[];
} {
  let score = 0;
  const flags: string[] = [];
  
  // FDV vs Market Cap ratio
  if (data.marketCap && data.fdv && data.fdv > 0) {
    const ratio = data.marketCap / data.fdv;
    
    if (ratio < 0.02) {
      score += 38;
      flags.push('🚨 <2% tokens circulating - extreme dilution risk');
    } else if (ratio < 0.05) {
      score += 32;
      flags.push('⚠️ <5% tokens circulating');
    } else if (ratio < 0.10) {
      score += 27;
      flags.push('⚠️ <10% tokens circulating');
    } else if (ratio < 0.15) {
      score += 22;
      flags.push('⚠️ <15% tokens circulating');
    } else if (ratio < 0.25) {
      score += 17;
    } else if (ratio < 0.35) {
      score += 12;
    } else if (ratio < 0.50) {
      score += 7;
    }
  }
  
  // Circulating vs Total supply ratio
  if (data.circulatingSupply && data.totalSupply && data.totalSupply > 0) {
    const circRatio = data.circulatingSupply / data.totalSupply;
    
    if (circRatio < 0.05) {
      score += 32;
      flags.push('🚨 <5% supply in circulation');
    } else if (circRatio < 0.10) {
      score += 26;
    } else if (circRatio < 0.20) {
      score += 21;
    } else if (circRatio < 0.30) {
      score += 16;
    } else if (circRatio < 0.40) {
      score += 11;
    } else if (circRatio < 0.50) {
      score += 6;
    }
  }
  
  // Unlimited supply check
  if (!data.maxSupply || data.maxSupply === 0) {
    if (!data.burnedSupply || data.burnedSupply === 0) {
      score += 22;
      flags.push('⚠️ Unlimited supply with no burns');
    } else {
      score += 10;
      flags.push('⚠️ Unlimited supply but has burns');
    }
  }
  
  return { score: Math.min(score, 100), quality: DataQuality.VERIFIED, flags };
}

function calculateConcentrationRisk(data: TokenData): {
  score: number;
  quality: DataQuality;
  flags: string[];
} {
  let score = 0;
  const flags: string[] = [];
  
  // Top 10 holders percentage
  if (data.top10HoldersPct !== undefined) {
    if (data.top10HoldersPct > 0.80) {
      score += 50;
      flags.push('🚨 Top 10 holders control >80% of supply');
    } else if (data.top10HoldersPct > 0.70) {
      score += 40;
      flags.push('⚠️ Top 10 holders control >70%');
    } else if (data.top10HoldersPct > 0.60) {
      score += 35;
      flags.push('⚠️ Top 10 holders control >60%');
    } else if (data.top10HoldersPct > 0.50) {
      score += 28;
      flags.push('⚠️ Top 10 holders control >50%');
    } else if (data.top10HoldersPct > 0.40) {
      score += 20;
    } else if (data.top10HoldersPct > 0.30) {
      score += 12;
    } else if (data.top10HoldersPct > 0.20) {
      score += 5;
    }
  }
  
  // Total holder count
  if (data.holderCount !== undefined) {
    if (data.holderCount < 50) {
      score += 35;
      flags.push('🚨 <50 holders - highly centralized');
    } else if (data.holderCount < 100) {
      score += 30;
    } else if (data.holderCount < 200) {
      score += 25;
    } else if (data.holderCount < 500) {
      score += 18;
    } else if (data.holderCount < 1000) {
      score += 10;
    } else if (data.holderCount < 5000) {
      score += 5;
    }
  } else {
    // Missing holder data
    return { score: 50, quality: DataQuality.UNKNOWN, flags: ['⚠️ Holder data unavailable'] };
  }
  
  return { score: Math.min(score, 100), quality: DataQuality.VERIFIED, flags };
}

function calculateLiquidityRisk(data: TokenData): {
  score: number;
  quality: DataQuality;
  flags: string[];
} {
  let score = 0;
  const flags: string[] = [];
  
  if (!data.liquidityUSD || data.liquidityUSD === 0) {
    return { 
      score: 85, 
      quality: DataQuality.UNKNOWN, 
      flags: ['🚨 No liquidity data - cannot determine sellability'] 
    };
  }
  
  // Absolute liquidity amount
  if (data.liquidityUSD < 1000) {
    score += 50;
    flags.push('🚨 <$1k liquidity - severe rug pull risk');
  } else if (data.liquidityUSD < 5000) {
    score += 42;
    flags.push('⚠️ <$5k liquidity');
  } else if (data.liquidityUSD < 10000) {
    score += 36;
  } else if (data.liquidityUSD < 25000) {
    score += 28;
  } else if (data.liquidityUSD < 50000) {
    score += 22;
  } else if (data.liquidityUSD < 100000) {
    score += 15;
  } else if (data.liquidityUSD < 250000) {
    score += 8;
  } else if (data.liquidityUSD < 500000) {
    score += 3;
  }
  
  // Market Cap to Liquidity ratio
  if (data.marketCap && data.liquidityUSD > 0) {
    const ratio = data.marketCap / data.liquidityUSD;
    
    if (ratio > 500) {
      score += 38;
      flags.push('🚨 Market cap 500x+ larger than liquidity');
    } else if (ratio > 300) {
      score += 32;
    } else if (ratio > 200) {
      score += 28;
    } else if (ratio > 100) {
      score += 22;
    } else if (ratio > 50) {
      score += 15;
    } else if (ratio > 20) {
      score += 8;
    }
  }
  
  // LP lock status (from GoPlus)
  if (data.liquidityLocked === false) {
    score += 20;
    flags.push('⚠️ Liquidity not locked - rug pull possible');
  } else if (data.liquidityLocked === true) {
    score -= 5; // Bonus for locked LP
  }
  
  return { score: Math.max(0, Math.min(score, 100)), quality: DataQuality.VERIFIED, flags };
}

function calculateMarketActivity(data: TokenData): {
  score: number;
  quality: DataQuality;
  flags: string[];
} {
  let score = 0;
  const flags: string[] = [];
  
  // Transaction count (24h)
  if (data.txCount24h !== undefined) {
    if (data.txCount24h === 0) {
      // Only flag as dead if volume is also low/missing
      // Sometimes Mobula returns txCount=0 but has volume data (data inconsistency)
      if (!data.volume24h || data.volume24h < 1000) {
        score += 45;
        flags.push('🚨 No transactions in 24h - dead token');
      } else {
        // Has volume but txCount=0 (Mobula data issue), score moderately
        score += 15;
        flags.push('⚠️ Transaction data unavailable (but has volume)');
      }
    } else if (data.txCount24h < 5) {
      score += 38;
      flags.push('⚠️ <5 transactions in 24h');
    } else if (data.txCount24h < 10) {
      score += 32;
    } else if (data.txCount24h < 25) {
      score += 26;
    } else if (data.txCount24h < 50) {
      score += 20;
    } else if (data.txCount24h < 100) {
      score += 14;
    } else if (data.txCount24h < 250) {
      score += 8;
    } else if (data.txCount24h < 500) {
      score += 3;
    }
  }
  
  // Volume to Market Cap ratio
  if (data.volume24h && data.marketCap && data.marketCap > 0) {
    const volumeRatio = data.volume24h / data.marketCap;
    
    if (volumeRatio < 0.0001) {
      score += 20;
      flags.push('⚠️ Extremely low trading volume');
    } else if (volumeRatio > 0.50) {
      // Very active (good sign)
      score -= 5;
    }
  }
  
  return { score: Math.min(score, 100), quality: DataQuality.VERIFIED, flags };
}

function calculateDeflationMechanics(data: TokenData): {
  score: number;
  quality: DataQuality;
  flags: string[];
} {
  let score = 60; // Default neutral
  const flags: string[] = [];
  
  if (!data.totalSupply) {
    return { score: 50, quality: DataQuality.UNKNOWN, flags: ['⚠️ Supply data unavailable'] };
  }
  
  // Burn percentage
  if (data.burnedSupply && data.totalSupply > 0) {
    const burnPct = data.burnedSupply / data.totalSupply;
    
    if (burnPct > 0.50) {
      score = 10;
      flags.push(`✅ ${(burnPct * 100).toFixed(0)}% supply burned - highly deflationary`);
    } else if (burnPct > 0.20) {
      score = 30;
      flags.push(`✅ ${(burnPct * 100).toFixed(0)}% supply burned`);
    } else if (burnPct > 0.05) {
      score = 50;
    } else {
      score = 60;
    }
  }
  
  // No max supply + no burns = inflationary
  if ((!data.maxSupply || data.maxSupply === 0) && (!data.burnedSupply || data.burnedSupply === 0)) {
    score = 80;
    flags.push('⚠️ Unlimited supply with no burns - inflationary');
  }
  
  // Capped supply with low burns
  if (data.maxSupply && data.maxSupply > 0) {
    if (!data.burnedSupply || data.burnedSupply === 0) {
      score = 60;
    } else {
      score = 40;
    }
  }
  
  return { score, quality: DataQuality.VERIFIED, flags };
}

function calculateTokenAge(data: TokenData): {
  score: number;
  quality: DataQuality;
  flags: string[];
} {
  let score = 50;
  const flags: string[] = [];
  
  if (!data.ageDays) {
    return { score: 50, quality: DataQuality.UNKNOWN, flags: ['⚠️ Token age unknown'] };
  }
  
  if (data.ageDays < 7) {
    score = 80;
    flags.push('⚠️ Token <7 days old - extreme risk');
  } else if (data.ageDays < 30) {
    score = 60;
    flags.push('⚠️ Token <30 days old');
  } else if (data.ageDays < 90) {
    score = 40;
  } else if (data.ageDays < 365) {
    score = 20;
  } else {
    score = 5;
    flags.push('✅ Token >1 year old - established');
  }
  
  return { score, quality: DataQuality.VERIFIED, flags };
}

// ============================================================================
// STEP 4: Implement Graduated Market Cap Discount
// ============================================================================

function applyMarketCapDiscount(baseRiskScore: number, marketCap?: number): number {
  if (!marketCap) return baseRiskScore;
  
  if (marketCap > 50_000_000_000) return 0;
  if (marketCap > 10_000_000_000) return baseRiskScore * 0.3;
  if (marketCap > 1_000_000_000) return baseRiskScore * 0.6;
  if (marketCap > 100_000_000) return baseRiskScore * 0.8;
  return baseRiskScore;
}

// ============================================================================
// STEP 5: Implement Data Freshness Decay
// ============================================================================

function calculateDataFreshness(dataTimestamp: number): number {
  const ageMinutes = (Date.now() - dataTimestamp) / (1000 * 60);
  
  if (ageMinutes < 5) return 1.0;
  if (ageMinutes < 15) return 0.95;
  if (ageMinutes < 60) return 0.85;
  if (ageMinutes < 360) return 0.70;
  if (ageMinutes < 1440) return 0.50;
  return 0.30;
}

// ============================================================================
// STEP 6: Implement Dynamic Confidence Weighting
// ============================================================================

interface RiskAnalysisResult {
  overall_risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence_score: number;
  data_freshness: number;
  data_tier: 'TIER_1_PREMIUM' | 'TIER_2_STANDARD' | 'TIER_3_LIMITED' | 'TIER_4_INSUFFICIENT';
  factor_scores: Record<RiskFactor, {
    score: number;
    weight: number;
    quality: DataQuality;
    flags: string[];
  }>;
  critical_flags: string[];
  warning_flags: string[];
  positive_signals: string[];
  override_applied?: boolean;        // NEW: Indicates if graduated penalty was applied
  override_reason?: string;          // NEW: Explanation of why score was adjusted
  calculated_score?: number;         // NEW: Original score before override
  analyzed_at: string;
  data_sources: string[];
}

function calculateTokenRisk(data: TokenData): RiskAnalysisResult {
  // Calculate all factor scores
  const factorResults = {
    [RiskFactor.CONTRACT_SECURITY]: calculateContractSecurity(data),
    [RiskFactor.SUPPLY_RISK]: calculateSupplyRisk(data),
    [RiskFactor.CONCENTRATION_RISK]: calculateConcentrationRisk(data),
    [RiskFactor.LIQUIDITY_RISK]: calculateLiquidityRisk(data),
    [RiskFactor.MARKET_ACTIVITY]: calculateMarketActivity(data),
    [RiskFactor.DEFLATION_MECHANICS]: calculateDeflationMechanics(data),
    [RiskFactor.TOKEN_AGE]: calculateTokenAge(data)
  };
  
  // Apply market cap discounts to applicable factors
  const contractScore = applyMarketCapDiscount(
    factorResults[RiskFactor.CONTRACT_SECURITY].score,
    data.marketCap
  );
  
  // Adaptive weighting: only use factors with data
  let totalWeight = 0;
  let weightedSum = 0;
  let verifiedWeight = 0;
  let estimatedWeight = 0;
  let unknownWeight = 0;
  
  const factorScores: Record<RiskFactor, any> = {} as any;
  
  Object.entries(factorResults).forEach(([factorKey, result]) => {
    const factor = factorKey as RiskFactor;
    const weight = FACTOR_WEIGHTS[factor];
    
    // Special handling for contract security (market cap discount)
    const score = factor === RiskFactor.CONTRACT_SECURITY ? contractScore : result.score;
    
    factorScores[factor] = {
      score,
      weight,
      quality: result.quality,
      flags: result.flags
    };
    
    // Only include if not UNKNOWN
    if (result.quality !== DataQuality.UNKNOWN) {
      totalWeight += weight;
      weightedSum += score * weight;
      
      if (result.quality === DataQuality.VERIFIED) {
        verifiedWeight += weight;
      } else {
        estimatedWeight += weight;
      }
    } else {
      unknownWeight += weight;
    }
  });
  
  // Normalize to 0-100 scale
  const finalScore = totalWeight > 0 ? (weightedSum / totalWeight) : 50;
  
  // Calculate base confidence
  const baseConfidence = 
    (verifiedWeight * 100) +
    (estimatedWeight * 70) +
    (unknownWeight * 0);
  
  // Apply freshness decay
  const freshness = calculateDataFreshness(data.dataTimestamp || Date.now());
  const finalConfidence = baseConfidence * freshness;
  
  // Determine data tier
  let dataTier: RiskAnalysisResult['data_tier'];
  if (data.hasGoPlusData && freshness > 0.85 && verifiedWeight > 0.80) {
    dataTier = 'TIER_1_PREMIUM';
  } else if (freshness > 0.70 && verifiedWeight > 0.60) {
    dataTier = 'TIER_2_STANDARD';
  } else if (verifiedWeight > 0.40) {
    dataTier = 'TIER_3_LIMITED';
  } else {
    dataTier = 'TIER_4_INSUFFICIENT';
  }
  
  // Collect all flags
  const criticalFlags: string[] = [];
  const warningFlags: string[] = [];
  const positiveSignals: string[] = [];
  
  Object.values(factorResults).forEach(result => {
    result.flags.forEach(flag => {
      if (flag.startsWith('🚨')) {
        criticalFlags.push(flag);
      } else if (flag.startsWith('⚠️')) {
        warningFlags.push(flag);
      } else if (flag.startsWith('✅')) {
        positiveSignals.push(flag);
      }
    });
  });
  
  // Determine risk level (with critical flag override)
  let riskLevel: RiskAnalysisResult['risk_level'];
  const overrideScore = criticalFlags.length > 0 ? Math.max(finalScore, 75) : finalScore;
  
  if (overrideScore >= 75 || criticalFlags.length > 0) {
    riskLevel = 'CRITICAL';
  } else if (overrideScore >= 50) {
    riskLevel = 'HIGH';
  } else if (overrideScore >= 30) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }
  
  return {
    overall_risk_score: Math.round(overrideScore),
    risk_level: riskLevel,
    confidence_score: Math.round(finalConfidence),
    data_freshness: freshness,
    data_tier: dataTier,
    factor_scores: factorScores,
    critical_flags: criticalFlags,
    warning_flags: warningFlags,
    positive_signals: positiveSignals,
    analyzed_at: new Date().toISOString(),
    data_sources: data.hasGoPlusData 
      ? ['Mobula API', 'GoPlus Security API']
      : ['Mobula API (GoPlus fallback mode)']
  };
}

// ============================================================================
// STEP 7: Export Main Function
// ============================================================================

export { calculateTokenRisk };
export type { TokenData, RiskAnalysisResult, MobulaData, GoPlusData };
export { RiskFactor, DataQuality };

// Export internal functions for multi-chain calculator
export {
  calculateContractSecurity,
  calculateSupplyRisk,
  calculateConcentrationRisk,
  calculateLiquidityRisk,
  calculateMarketActivity,
  calculateDeflationMechanics,
  calculateTokenAge,
  applyMarketCapDiscount,
  calculateDataFreshness,
  FACTOR_WEIGHTS
};
