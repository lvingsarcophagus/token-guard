/**
 * 9-Factor Risk Algorithm Weights
 * Removed vesting factor, rebalanced for different token types
 */

export enum ChainType {
  EVM = 'EVM',
  SOLANA = 'SOLANA',
  CARDANO = 'CARDANO'
}

export interface FactorWeights {
  supply_dilution: number;
  holder_concentration: number;
  liquidity_depth: number;
  contract_control: number;
  tax_fee: number;
  distribution: number;
  burn_deflation: number;
  adoption: number;
  audit: number;
}

/**
 * Standard tokens (DeFi, utility tokens)
 * Focus: Supply control, holder distribution, liquidity
 */
export const STANDARD_WEIGHTS: FactorWeights = {
  supply_dilution: 0.18,       // 18% - Most important (inflation risk)
  holder_concentration: 0.20,  // 20% - Whale manipulation + wash trading (INCREASED)
  liquidity_depth: 0.16,       // 16% - Rug pull indicator + liquidity drops
  contract_control: 0.15,      // 15% - Security critical
  tax_fee: 0.11,              // 11% - Hidden fees
  distribution: 0.08,          // 8% - Holder spread (REDUCED - now part of holder_concentration)
  burn_deflation: 0.06,        // 6% - Deflation mechanisms
  adoption: 0.10,              // 10% - Social/on-chain activity
  audit: 0.04                  // 4% - Code verification
};

/**
 * Meme coins (sentiment-driven tokens)
 * Focus: Whales, liquidity, social adoption
 */
export const MEME_WEIGHTS: FactorWeights = {
  supply_dilution: 0.14,       // 14% - Lower - memes often have fixed supply
  holder_concentration: 0.24,  // 24% - HIGHER - whales control meme markets + wash trading
  liquidity_depth: 0.20,       // 20% - HIGHER - rug pulls extremely common + liquidity drops
  contract_control: 0.12,      // 12% - Lower - usually simple contracts
  tax_fee: 0.10,              // 10% - Same - can have high taxes
  distribution: 0.06,          // 6% - Lower - concentration matters more
  burn_deflation: 0.02,        // 2% - LOWER - memes rarely burn
  adoption: 0.15,              // 15% - HIGHER - social hype is critical
  audit: 0.01                  // 1% - LOWER - rarely audited
};

/**
 * Solana-specific weights
 * Focus: Contract control (freeze/mint authority)
 */
export const SOLANA_WEIGHTS: FactorWeights = {
  supply_dilution: 0.13,       // 13% - Lower - Solana tokens often fixed supply
  holder_concentration: 0.20,  // 20% - Standard but enhanced with wash trading detection
  liquidity_depth: 0.18,       // 18% - Slightly higher - rug pulls common + liquidity drops
  contract_control: 0.35,      // 35% - HIGHEST - Solana has unique critical risks
  tax_fee: 0.00,               // 0% - N/A - Solana doesn't have token taxes
  distribution: 0.06,          // 6% - Standard
  burn_deflation: 0.04,        // 4% - Lower
  adoption: 0.10,              // 10% - Standard
  audit: 0.02                  // 2% - Lower - SPL tokens rarely audited
};

/**
 * Cardano-specific weights
 * Focus: Supply policy and distribution
 */
export const CARDANO_WEIGHTS: FactorWeights = {
  supply_dilution: 0.25,       // HIGHER - Policy matters most
  holder_concentration: 0.15,  // Lower - Cardano has better distribution
  liquidity_depth: 0.15,       // Lower - Cardano is safer by design
  contract_control: 0.20,      // Lower - Policy lock is key indicator
  tax_fee: 0.00,               // N/A - No tax mechanism
  distribution: 0.15,          // Higher - Check policy distribution
  burn_deflation: 0.08,        // Standard
  adoption: 0.10,              // Standard
  audit: 0.07                  // Higher - Plutus scripts more audited
};

/**
 * Get weights based on token type and chain
 */
export function getWeights(
  isMeme: boolean,
  chainType: ChainType = ChainType.EVM
): FactorWeights {
  
  // Meme tokens always use meme weights regardless of chain
  if (isMeme) {
    return MEME_WEIGHTS;
  }
  
  // Chain-specific weights for utility tokens
  switch (chainType) {
    case ChainType.SOLANA:
      return SOLANA_WEIGHTS;
    case ChainType.CARDANO:
      return CARDANO_WEIGHTS;
    case ChainType.EVM:
    default:
      return STANDARD_WEIGHTS;
  }
}

/**
 * Explain why these weights are used
 */
export function getWeightingRationale(
  isMeme: boolean,
  chainType: ChainType
): string {
  
  if (isMeme) {
    return 'Meme token weights: Prioritizes whale concentration (22%), liquidity depth (20%), and social adoption (15%). Meme coins are sentiment-driven and vulnerable to influencer manipulation.';
  }
  
  switch (chainType) {
    case ChainType.SOLANA:
      return 'Solana weights: Prioritizes contract control (35%) due to unique freeze/mint authority risks. Solana SPL tokens can have authorities that lock user wallets.';
    
    case ChainType.CARDANO:
      return 'Cardano weights: Prioritizes supply policy (25%) as Cardano uses time-locked minting policies. Once a policy expires or is locked, supply is fixed forever.';
    
    case ChainType.EVM:
    default:
      return 'Standard weights: Balanced approach prioritizing supply dilution (20%), holder concentration (18%), and liquidity depth (16%) for utility tokens.';
  }
}

/**
 * Calculate weighted score from individual factor scores
 */
export function calculateWeightedScore(
  factors: Record<string, number>,
  weights: FactorWeights
): number {
  
  let score = 0;
  
  for (const [key, value] of Object.entries(weights)) {
    const factorScore = factors[key] || 0;
    score += factorScore * value;
  }
  
  return Math.round(score);
}
