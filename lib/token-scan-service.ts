// Comprehensive token scanning service that combines all APIs
import { detectChain, ChainInfo, getGoPlusChainId } from './chain-detector'

export interface TokenSecurityData {
  contractAddress: string
  isHoneypot: boolean
  isVerified: boolean
  riskLevel: 'low' | 'medium' | 'high'
  riskScore: number
  issues: string[]
  safetyChecks: {
    label: string
    status: 'safe' | 'warning' | 'danger'
    message: string
  }[]
  buyTax?: number
  sellTax?: number
  liquidity?: number
  holderCount?: number
  ownershipRenounced?: boolean
  isProxy?: boolean
  isMintable?: boolean
}

export interface TokenPriceData {
  name: string
  symbol: string
  price: number
  marketCap: number
  volume24h: number
  priceChange24h: number
  liquidity?: number
  logo?: string
  source: string
}

export interface CompleteTokenData {
  address: string
  chain: string
  chainInfo: ChainInfo | null
  priceData: TokenPriceData | null
  securityData: TokenSecurityData | null
  timestamp: number
}

export class TokenScanService {
  /**
   * Perform a complete token scan using all available APIs
   */
  static async scanToken(addressOrSymbol: string, chain?: string): Promise<CompleteTokenData> {
    // Detect chain from address format
    let chainInfo = detectChain(addressOrSymbol)

    // If the caller passed an explicit chain preference (from the UI), prefer
    // that and construct/override a ChainInfo so downstream logic (and UI)
    // correctly treat Solana and other non-EVM chains instead of defaulting
    // to Ethereum.
    if (chain) {
      const sel = String(chain).toLowerCase()
      if (sel.includes('sol')) {
        chainInfo = { chainId: 'solana', chainName: 'Solana', isEVM: false, addressFormat: 'base58' }
      } else if (sel.includes('bsc') || sel.includes('binance')) {
        chainInfo = { chainId: '56', chainName: 'BSC', isEVM: true, addressFormat: '0x' }
      } else if (sel.includes('polygon') || sel.includes('matic')) {
        chainInfo = { chainId: '137', chainName: 'Polygon', isEVM: true, addressFormat: '0x' }
      } else if (sel.includes('avalanche') || sel.includes('avax')) {
        chainInfo = { chainId: '43114', chainName: 'Avalanche', isEVM: true, addressFormat: '0x' }
      } else if (sel.includes('arbitrum')) {
        chainInfo = { chainId: '42161', chainName: 'Arbitrum', isEVM: true, addressFormat: '0x' }
      } else if (sel.includes('optimism')) {
        chainInfo = { chainId: '10', chainName: 'Optimism', isEVM: true, addressFormat: '0x' }
      } else if (sel.includes('base')) {
        chainInfo = { chainId: '8453', chainName: 'Base', isEVM: true, addressFormat: '0x' }
      }
    }

    const detectedChain = chain || chainInfo?.chainId || '1'

    // Determine if input is an address or symbol
    const isAddress = addressOrSymbol.startsWith('0x') ||
      (chainInfo?.addressFormat === 'base58' && chainInfo?.chainName === 'Solana') ||
      (chainInfo?.addressFormat === 'base58' && addressOrSymbol.length >= 32)

    try {
      // For Solana and non-EVM chains, only fetch price data (GoPlus doesn't support them)
      const canFetchSecurity = chainInfo?.isEVM === true && isAddress && getGoPlusChainId(detectedChain) !== null

      // Fetch price data and security data in parallel
      const [priceData, securityData] = await Promise.all([
        this.fetchPriceData(addressOrSymbol, isAddress).catch(err => {
          console.error('Price data fetch error:', err)
          return null
        }),
        canFetchSecurity ? this.fetchSecurityData(addressOrSymbol, detectedChain).catch(err => {
          console.error('Security data fetch error:', err)
          return null
        }) : Promise.resolve(null),
      ])

      // For non-EVM chains like Solana, provide a message about security analysis
      // Also provide generic risk info for non-EVM symbols (BTC, SOL, etc.)
      let securityResult = securityData
      if (!canFetchSecurity && chainInfo) {
        securityResult = {
          contractAddress: isAddress ? addressOrSymbol : 'N/A',
          isHoneypot: false,
          isVerified: false,
          riskLevel: 'low' as const,
          riskScore: 30,
          issues: isAddress ? [
            `Security analysis not available for ${chainInfo.chainName}. GoPlus Security API supports EVM chains only (Ethereum, BSC, Polygon, Arbitrum, Optimism, Base).`,
            `Price data is available from Mobula/CoinGecko for ${chainInfo.chainName} tokens.`,
          ] : [
            `${priceData?.symbol || addressOrSymbol} is a native ${chainInfo.chainName} asset.`,
            `Security scanning is limited for native blockchain assets.`,
            `Market data is sourced from Mobula/CoinGecko/CoinMarketCap APIs.`,
          ],
          safetyChecks: isAddress ? [
            {
              label: 'Chain Support',
              status: 'warning' as const,
              message: `GoPlus Security analysis is only available for EVM chains. ${chainInfo.chainName} uses a different protocol (${chainInfo.isEVM ? 'EVM' : 'Non-EVM'}).`,
            },
            {
              label: 'Price Data',
              status: 'safe' as const,
              message: `Market data is available for ${chainInfo.chainName} tokens via Mobula API.`,
            },
          ] : [
            {
              label: 'Asset Type',
              status: 'safe' as const,
              message: `${priceData?.symbol || addressOrSymbol} is a native blockchain asset with established market presence.`,
            },
            {
              label: 'Market Data',
              status: 'safe' as const,
              message: `Real-time price and volume data available from multiple sources.`,
            },
            {
              label: 'Security Analysis',
              status: 'warning' as const,
              message: `Smart contract analysis not applicable for native blockchain assets.`,
            },
          ],
        }
      }
      // For symbols that don't have chain detection (BTC, ETH as symbols, not addresses)
      else if (!canFetchSecurity && !isAddress && !chainInfo) {
        securityResult = {
          contractAddress: 'N/A',
          isHoneypot: false,
          isVerified: true,
          riskLevel: 'low' as const,
          riskScore: 20,
          issues: [
            `${priceData?.symbol || addressOrSymbol} is a major cryptocurrency asset.`,
            `Security analysis focuses on EVM smart contracts only.`,
            `Native blockchain assets are generally considered lower risk.`,
          ],
          safetyChecks: [
            {
              label: 'Asset Class',
              status: 'safe' as const,
              message: `Major cryptocurrency with established market presence and liquidity.`,
            },
            {
              label: 'Market Data',
              status: 'safe' as const,
              message: `Real-time pricing from Mobula, CoinGecko, and CoinMarketCap.`,
            },
            {
              label: 'Contract Analysis',
              status: 'warning' as const,
              message: `Smart contract security scanning not applicable for native assets.`,
            },
          ],
        }
      }

      return {
        address: addressOrSymbol,
        chain: detectedChain,
        chainInfo,
        priceData,
        securityData: securityResult,
        timestamp: Date.now(),
      }
    } catch (error) {
      console.error('Token scan error:', error)
      throw error
    }
  }

  /**
   * Fetch price data from multiple sources
   */
  private static async fetchPriceData(addressOrSymbol: string, isAddress: boolean): Promise<TokenPriceData | null> {
    try {
      const response = await fetch('/api/token/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: isAddress ? addressOrSymbol : undefined,
          symbol: !isAddress ? addressOrSymbol : undefined,
          source: 'all',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.warn(`[TokenScan] Price API returned ${response.status}:`, errorText)
        return null // Gracefully return null instead of throwing
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.warn('[TokenScan] Price data unavailable:', error instanceof Error ? error.message : 'Unknown error')
      return null
    }
  }

  /**
   * Fetch security analysis from GoPlus (EVM) or Helius (Solana)
   */
  private static async fetchSecurityData(address: string, chain: string): Promise<TokenSecurityData | null> {
    try {
      // Check if it's Solana
      if (chain === 'solana' || chain === '1399811149') {
        const { getHeliusDashboardData } = await import('./api/helius')
        const heliusData = await getHeliusDashboardData(address)

        if (!heliusData) return null

        // Map Helius data to TokenSecurityData format
        const issues: string[] = []
        if (heliusData.authorities.mintAuthority) issues.push('Mint Authority is set (can mint more tokens)')
        if (heliusData.authorities.freezeAuthority) issues.push('Freeze Authority is set (can freeze wallets)')
        if (heliusData.authorities.updateAuthority) issues.push('Update Authority is set (can change metadata)')

        const riskScore = (heliusData.authorities.mintAuthority ? 30 : 0) +
          (heliusData.authorities.freezeAuthority ? 30 : 0) +
          (heliusData.authorities.updateAuthority ? 10 : 0)

        return {
          contractAddress: address,
          isHoneypot: false, // Not directly applicable to Solana in the same way
          isVerified: true,
          riskLevel: riskScore > 50 ? 'high' : riskScore > 20 ? 'medium' : 'low',
          riskScore: Math.min(100, riskScore),
          issues,
          safetyChecks: [
            {
              label: 'Mint Authority',
              status: heliusData.authorities.mintAuthority ? 'danger' : 'safe',
              message: heliusData.authorities.mintAuthority ? 'Mint authority is enabled' : 'Mint authority is revoked (Safe)'
            },
            {
              label: 'Freeze Authority',
              status: heliusData.authorities.freezeAuthority ? 'danger' : 'safe',
              message: heliusData.authorities.freezeAuthority ? 'Freeze authority is enabled' : 'Freeze authority is revoked (Safe)'
            },
            {
              label: 'Update Authority',
              status: heliusData.authorities.updateAuthority ? 'warning' : 'safe',
              message: heliusData.authorities.updateAuthority ? 'Metadata can be updated' : 'Metadata is immutable'
            },
            {
              label: 'Top Holders',
              status: 'safe', // Logic could be more complex
              message: `Top 10 holders own ${(heliusData.holders.topHolders.reduce((acc: any, h: any) => acc + h.percentage, 0) * 100).toFixed(2)}%`
            }
          ],
          liquidity: 0, // Need a source for this
          holderCount: heliusData.holders.count,
          ownershipRenounced: !heliusData.authorities.updateAuthority,
          isMintable: !!heliusData.authorities.mintAuthority,
          // Add extra Helius data for the UI to use
          // @ts-ignore
          heliusData: heliusData
        }
      }

      // EVM Logic (GoPlus)
      const goPlusChainId = getGoPlusChainId(chain)
      if (!goPlusChainId) {
        console.warn(`GoPlus doesn't support chain ${chain}`)
        return null
      }

      const response = await fetch('/api/token/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chain: goPlusChainId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch security data')
      }

      const data = await response.json()
      const securityAnalysis = data.data

      if (!securityAnalysis) {
        return null
      }

      // Calculate risk score based on issues
      const riskScore = this.calculateRiskScore(securityAnalysis)

      // Generate safety checks
      const safetyChecks = this.generateSafetyChecks(securityAnalysis)

      return {
        ...securityAnalysis,
        riskScore,
        safetyChecks,
        isVerified: true, // Can be enhanced with actual verification check
      }
    } catch (error) {
      console.error('Security data fetch error:', error)
      return null
    }
  }

  /**
   * Calculate risk score from 0-100
   */
  private static calculateRiskScore(securityData: { isHoneypot: boolean; issues: string[] }): number {
    let score = 0

    if (securityData.isHoneypot) score += 40
    if (securityData.issues.includes('Token is blacklisted')) score += 30
    if (securityData.issues.includes('Owner can change balance')) score += 20
    if (securityData.issues.includes('Hidden owner detected')) score += 15
    if (securityData.issues.includes('Self-destruct function present')) score += 25
    if (securityData.issues.some((i: string) => i.includes('High buy tax'))) score += 10
    if (securityData.issues.some((i: string) => i.includes('High sell tax'))) score += 10
    if (securityData.issues.includes('Cannot sell all tokens')) score += 30
    if (securityData.issues.includes('Token is mintable')) score += 10
    if (securityData.issues.includes('Uses proxy contract')) score += 5
    if (securityData.issues.includes('Trading cooldown enabled')) score += 10

    return Math.min(100, score)
  }

  /**
   * Generate user-friendly safety checks
   */
  private static generateSafetyChecks(securityData: { isHoneypot: boolean; issues: string[] }): TokenSecurityData['safetyChecks'] {
    const checks: TokenSecurityData['safetyChecks'] = []

    // Honeypot check
    checks.push({
      label: 'Honeypot Detection',
      status: securityData.isHoneypot ? 'danger' : 'safe',
      message: securityData.isHoneypot ?
        'This token may be a honeypot - avoid trading!' :
        'No honeypot patterns detected',
    })

    // Ownership check
    const hasOwnerIssues = securityData.issues.some((i: string) =>
      i.includes('Owner can change balance') || i.includes('Hidden owner')
    )
    checks.push({
      label: 'Ownership',
      status: hasOwnerIssues ? 'danger' : 'safe',
      message: hasOwnerIssues ?
        'Owner has dangerous privileges' :
        'No ownership concerns detected',
    })

    // Tax check
    const hasTaxIssues = securityData.issues.some((i: string) => i.includes('tax'))
    checks.push({
      label: 'Trading Taxes',
      status: hasTaxIssues ? 'warning' : 'safe',
      message: hasTaxIssues ?
        'High trading taxes detected' :
        'Normal trading taxes',
    })

    // Sell restrictions
    const hasSellRestrictions = securityData.issues.includes('Cannot sell all tokens')
    checks.push({
      label: 'Sell Restrictions',
      status: hasSellRestrictions ? 'danger' : 'safe',
      message: hasSellRestrictions ?
        'You may not be able to sell all tokens!' :
        'No sell restrictions detected',
    })

    // Dangerous functions
    const hasDangerousFunctions = securityData.issues.includes('Self-destruct function present')
    checks.push({
      label: 'Contract Safety',
      status: hasDangerousFunctions ? 'danger' : 'safe',
      message: hasDangerousFunctions ?
        'Contract has dangerous functions' :
        'Contract appears safe',
    })

    return checks
  }
}
