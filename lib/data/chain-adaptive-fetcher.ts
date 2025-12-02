import { checkEVMSecurity, checkSolanaSecurity, checkCardanoSecurity } from '../security/adapters'
import { fetchCoinMarketCapData } from '../api/coinmarketcap'
import { getMoralisTransactionPatterns, getMoralisTokenMetadata } from '../api/moralis'

export type ChainType = 'EVM' | 'SOLANA' | 'CARDANO' | 'OTHER'

export interface CompleteTokenData {
  marketCap: number
  fdv: number
  liquidityUSD: number
  volume24h: number
  price: number
  totalSupply: number
  circulatingSupply: number
  maxSupply: number | null
  burnedSupply: number
  burnedPercentage: number
  holderCount: number
  top10HoldersPct: number
  txCount24h: number
  ageDays: number
  txCount24h_is_estimated?: boolean
  ageDays_is_estimated?: boolean
  securityScore: number
  criticalFlags: string[]
  warnings: string[]
  chainType: ChainType
  chainId: number
  dataQuality: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR'
}

export function detectChainType(chainId: number | string): ChainType {
  const id = typeof chainId === 'string' ? parseInt(chainId) : chainId
  if (id === 501 || id === 900 || id === 1399811149) return 'SOLANA'
  if (id === 1815) return 'CARDANO'
  const evmChains = [1, 56, 137, 43114, 250, 42161, 10, 8453, 324, 59144, 42220]
  if (evmChains.includes(id)) return 'EVM'
  return 'OTHER'
}

export async function fetchCompleteTokenData(
  tokenAddress: string,
  chainId: number | string
): Promise<CompleteTokenData> {
  const chainType = detectChainType(chainId)
  const chainIdNum = typeof chainId === 'string' ? parseInt(chainId) : chainId
  
  const [mobulaResult, moralisTxResult, moralisMetaResult] = await Promise.allSettled([
    fetchMobulaMarketData(tokenAddress),
    (chainType === 'EVM' || chainType === 'SOLANA')
      ? getMoralisTransactionPatterns(tokenAddress, chainIdNum.toString()).catch(() => null)
      : Promise.resolve(null),
    (chainType === 'EVM' || chainType === 'SOLANA')
      ? getMoralisTokenMetadata(tokenAddress, chainIdNum.toString()).catch(() => null)
      : Promise.resolve(null)
  ])
  
  let marketData = mobulaResult.status === 'fulfilled' && mobulaResult.value ? mobulaResult.value : getDefaultMarketData()
  const moralisTx = moralisTxResult.status === 'fulfilled' ? moralisTxResult.value : null
  const moralisMeta = moralisMetaResult.status === 'fulfilled' ? moralisMetaResult.value as any : null
  
  if (marketData.marketCap === 0 && marketData.liquidityUSD === 0 && marketData.totalSupply === 0) {
    const cmcData = await fetchCoinMarketCapData(tokenAddress, chainIdNum)
    if (cmcData) {
      marketData = { ...cmcData, burnedSupply: cmcData.totalSupply - cmcData.circulatingSupply,
        burnedPercentage: cmcData.totalSupply > 0 ? ((cmcData.totalSupply - cmcData.circulatingSupply) / cmcData.totalSupply) * 100 : 0,
        txCount24h: 0, ageDays: 0 }
    }
  }
  
  if (marketData.txCount24h === 0 && moralisTx) {
    const txFromMoralis = ((moralisTx as any).buyTransactions24h || 0) + ((moralisTx as any).sellTransactions24h || 0)
    if (txFromMoralis > 0) marketData.txCount24h = txFromMoralis
  }
  
  if (marketData.ageDays === 0 && moralisMeta?.created_at) {
    const ageFromMoralis = Math.floor((Date.now() - new Date(moralisMeta.created_at).getTime()) / 86400000)
    if (ageFromMoralis > 0) marketData.ageDays = ageFromMoralis
  }
  
  if (marketData.ageDays === 0) {
    marketData.ageDays = estimateAgeFromMarketData(marketData.marketCap, marketData.volume24h)
  }
  
  let chainData
  switch (chainType) {
    case 'EVM': chainData = await fetchEVMChainData(tokenAddress, chainIdNum); break
    case 'SOLANA': chainData = await fetchSolanaChainData(tokenAddress, marketData); break
    case 'CARDANO': chainData = await fetchCardanoChainData(tokenAddress); break
    default: chainData = getDefaultChainData()
  }
  
  return { ...marketData, ...chainData, chainType, chainId: chainIdNum, dataQuality: assessDataQuality(marketData, chainData) }
}

async function fetchMobulaMarketData(tokenAddress: string) {
  try {
    const response = await fetch(`https://api.mobula.io/api/1/market/data?asset=${encodeURIComponent(tokenAddress)}`, {
      headers: { 'Authorization': process.env.MOBULA_API_KEY || '', 'Accept': 'application/json' }
    })
    if (!response.ok) return getDefaultMarketData()
    const data = (await response.json()).data
    if (!data) return getDefaultMarketData()
    const totalSupply = data.total_supply || 0
    const circulatingSupply = data.circulating_supply || totalSupply
    return {
      marketCap: data.market_cap || 0, fdv: data.market_cap_diluted || data.market_cap || 0,
      liquidityUSD: data.liquidity || 0, volume24h: data.volume || 0, price: data.price || 0,
      totalSupply, circulatingSupply, maxSupply: data.max_supply || null,
      burnedSupply: totalSupply - circulatingSupply,
      burnedPercentage: totalSupply > 0 ? ((totalSupply - circulatingSupply) / totalSupply) * 100 : 0,
      txCount24h: data.transactions_24h || data.tx_count_24h || 0,
      ageDays: data.creation_date ? Math.floor((Date.now() - new Date(data.creation_date * 1000).getTime()) / 86400000) : 0
    }
  } catch { return getDefaultMarketData() }
}

async function fetchEVMChainData(tokenAddress: string, chainId: number) {
  try {
    const data = (await (await fetch(`https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${tokenAddress}`,
      { headers: { 'Accept': 'application/json' } })).json()).result?.[tokenAddress.toLowerCase()]
    if (!data) return getDefaultChainData()
    const holderCount = parseInt(data.holder_count || '0')
    let top10HoldersPct = 0.5
    if (data.holders?.length >= 10) {
      top10HoldersPct = data.holders.slice(0, 10).reduce((s: number, h: any) => s + parseFloat(h.percent || '0'), 0) / 100
    }
    const sec = await checkEVMSecurity(tokenAddress, chainId)
    return { holderCount, top10HoldersPct, securityScore: sec.score,
      criticalFlags: sec.checks.filter(c => c.severity === 'CRITICAL').map(c => c.message),
      warnings: sec.checks.filter(c => c.severity === 'WARNING').map(c => c.message) }
  } catch { return getDefaultChainData() }
}

async function fetchSolanaChainData(mintAddress: string, _marketData: any) {
  try {
    const apiKey = process.env.HELIUS_API_KEY
    if (!apiKey) return getDefaultChainData()
    
    const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`
    let allAccounts: any[] = []
    let page = 1
    const maxPages = 20
    
    while (page <= maxPages) {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 'holders', method: 'getTokenAccounts',
          params: { page, limit: 1000, displayOptions: {}, mint: mintAddress }
        })
      })
      const data = await response.json()
      if (data.error || !data.result?.token_accounts || data.result.token_accounts.length === 0) break
      allAccounts.push(...data.result.token_accounts)
      if (data.result.token_accounts.length < 1000) break
      page++
    }
    
    if (allAccounts.length === 0) return getDefaultChainData()
    
    // Group by owner to get unique holders
    const holderMap = new Map()
    allAccounts.forEach((acc: any) => {
      const owner = acc.owner
      const amount = parseFloat(acc.amount || '0')
      holderMap.set(owner, (holderMap.get(owner) || 0) + amount)
    })
    
    const holders = Array.from(holderMap.entries()).map(([address, balance]) => ({ address, balance }))
      .sort((a: any, b: any) => b.balance - a.balance)
    
    const holderCount = holders.length
    const totalSupply = holders.reduce((s: number, h: any) => s + h.balance, 0)
    const top10Balance = holders.slice(0, 10).reduce((s: number, h: any) => s + h.balance, 0)
    const top10HoldersPct = totalSupply > 0 ? top10Balance / totalSupply : 0.5
    
    const sec = await checkSolanaSecurity(mintAddress)
    return { holderCount, top10HoldersPct, securityScore: sec.score,
      criticalFlags: sec.checks.filter(c => c.severity === 'CRITICAL').map(c => c.message),
      warnings: sec.checks.filter(c => c.severity === 'WARNING').map(c => c.message) }
  } catch { return getDefaultChainData() }
}

async function fetchCardanoChainData(assetId: string) {
  try {
    if (!process.env.BLOCKFROST_PROJECT_ID) return getDefaultChainData()
    const sec = await checkCardanoSecurity(assetId)
    return { holderCount: 0, top10HoldersPct: 0.5, securityScore: sec.score,
      criticalFlags: sec.checks.filter(c => c.severity === 'CRITICAL').map(c => c.message),
      warnings: sec.checks.filter(c => c.severity === 'WARNING').map(c => c.message) }
  } catch { return getDefaultChainData() }
}

function getDefaultMarketData() {
  return { marketCap: 0, fdv: 0, liquidityUSD: 0, volume24h: 0, price: 0, totalSupply: 0,
    circulatingSupply: 0, maxSupply: null, burnedSupply: 0, burnedPercentage: 0, txCount24h: 0, ageDays: 0 }
}

function getDefaultChainData() {
  return { holderCount: 0, top10HoldersPct: 0.65, securityScore: 60,
    criticalFlags: ['⚠️ Insufficient data'], warnings: ['Data quality is limited'] }
}

function estimateAgeFromMarketData(marketCap: number, volume24h: number): number {
  if (!marketCap || !volume24h) return 0
  const ratio = volume24h / marketCap
  if (ratio > 0.5) return 2
  if (ratio > 0.1) return 10
  if (ratio > 0.01) return 45
  return 180
}

function assessDataQuality(marketData: any, chainData: any): 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' {
  let score = 0
  if (marketData.marketCap > 0) score += 30
  if (marketData.liquidityUSD > 0) score += 20
  if (marketData.volume24h > 0) score += 10
  if (marketData.totalSupply > 0) score += 15
  if (chainData.holderCount > 0) score += 15
  if (chainData.top10HoldersPct !== 0.5 && chainData.top10HoldersPct !== 0.65) score += 10
  if (score >= 85) return 'EXCELLENT'
  if (score >= 60) return 'GOOD'
  if (score >= 40) return 'MODERATE'
  return 'POOR'
}
