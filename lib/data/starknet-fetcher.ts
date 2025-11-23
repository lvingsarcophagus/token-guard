/**
 * Starknet Token Data Fetcher
 * Fetches token data from Starknet using Mobula API + Starknet RPC
 */

import { Provider, Contract, constants, RpcProvider } from 'starknet'

// ERC-20 ABI for Starknet (Cairo)
const ERC20_ABI = [
  {
    name: 'name',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'felt' }],
    stateMutability: 'view'
  },
  {
    name: 'symbol',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'felt' }],
    stateMutability: 'view'
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'felt' }],
    stateMutability: 'view'
  },
  {
    name: 'total_supply',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'Uint256' }],
    stateMutability: 'view'
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'felt' }],
    outputs: [{ type: 'Uint256' }],
    stateMutability: 'view'
  }
]

// Initialize Starknet provider
const getProvider = () => {
  const rpcUrl = process.env.STARKNET_RPC_URL || 'https://starknet-mainnet.public.blastapi.io'
  return new RpcProvider({ nodeUrl: rpcUrl })
}

/**
 * Fetch token data from Starknet using Mobula API + RPC
 */
export async function fetchStarknetTokenData(tokenAddress: string) {
  console.log('🌐 [Starknet Fetcher] Fetching data for:', tokenAddress)
  
  try {
    // Parallel API calls for speed
    const [mobulaData, onChainData] = await Promise.allSettled([
      fetchMobulaData(tokenAddress),
      fetchOnChainData(tokenAddress)
    ])
    
    const mobula = mobulaData.status === 'fulfilled' ? mobulaData.value : null
    const onChain = onChainData.status === 'fulfilled' ? onChainData.value : null
    
    // Combine data
    const completeData = {
      // From Mobula (market data)
      price: mobula?.price || 0,
      marketCap: mobula?.market_cap || 0,
      fdv: mobula?.market_cap_diluted || mobula?.market_cap || 0,
      liquidityUSD: mobula?.liquidity || 0,
      volume24h: mobula?.volume || 0,
      priceChange24h: mobula?.price_change_24h || 0,
      
      // From Starknet RPC (on-chain data)
      name: onChain?.name || 'Unknown',
      symbol: onChain?.symbol || 'UNKNOWN',
      decimals: onChain?.decimals || 18,
      totalSupply: onChain?.totalSupply || '0',
      circulatingSupply: mobula?.circulating_supply || mobula?.total_supply || 0,
      
      // Calculated metrics
      fdvMcRatio: mobula?.market_cap_diluted && mobula?.market_cap
        ? mobula.market_cap_diluted / mobula.market_cap
        : 1,
      liquidityRatio: mobula?.liquidity && mobula?.market_cap
        ? mobula.liquidity / mobula.market_cap
        : 0,
      
      // Metadata
      chain: 'starknet',
      chainType: 'STARKNET',
      tokenAddress,
      explorer: `https://voyager.online/contract/${tokenAddress}`,
      dataSources: ['mobula', 'starknet-rpc'].filter(s => 
        (s === 'mobula' && mobula) || (s === 'starknet-rpc' && onChain)
      ),
      dataQuality: (mobula && onChain) ? 'GOOD' : mobula ? 'PARTIAL' : 'LIMITED',
      confidence: (mobula && onChain) ? 85 : mobula ? 70 : 50,
      
      // Starknet-specific (no holder data available easily)
      holderCount: 0,
      top10HoldersPct: 0,
      
      // Timestamps
      ageDays: 0, // Not easily available
      txCount24h: 0, // Not easily available
      fetchedAt: Date.now()
    }
    
    console.log('✅ [Starknet Fetcher] Data fetched successfully:', {
      token: completeData.symbol,
      marketCap: completeData.marketCap,
      liquidity: completeData.liquidityUSD,
      quality: completeData.dataQuality
    })
    
    return completeData
    
  } catch (error: any) {
    console.error('❌ [Starknet Fetcher] Error:', error)
    throw new Error(`Failed to fetch Starknet token data: ${error.message}`)
  }
}

/**
 * Fetch market data from Mobula API
 */
async function fetchMobulaData(tokenAddress: string) {
  const MOBULA_API = 'https://api.mobula.io/api/1/market/data'
  
  try {
    const response = await fetch(
      `${MOBULA_API}?asset=${tokenAddress}&blockchain=Starknet`,
      {
        headers: {
          'Authorization': process.env.MOBULA_API_KEY || ''
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Mobula API error: ${response.status}`)
    }
    
    const result = await response.json()
    const data = result.data || result
    
    console.log('✓ [Mobula] Market data fetched:', {
      price: data.price,
      marketCap: data.market_cap,
      liquidity: data.liquidity
    })
    
    return data
    
  } catch (error: any) {
    console.warn('[Mobula] Failed, using fallback:', error.message)
    return null
  }
}

/**
 * Fetch on-chain data from Starknet RPC
 */
async function fetchOnChainData(tokenAddress: string) {
  try {
    const provider = getProvider()
    const contract = new Contract(ERC20_ABI, tokenAddress, provider)
    
    // Parallel RPC calls
    const [name, symbol, decimals, totalSupply] = await Promise.allSettled([
      contract.call('name'),
      contract.call('symbol'),
      contract.call('decimals'),
      contract.call('total_supply')
    ])
    
    // Extract values
    const nameValue = name.status === 'fulfilled' ? name.value : 'Unknown'
    const symbolValue = symbol.status === 'fulfilled' ? symbol.value : 'UNKNOWN'
    const decimalsValue = decimals.status === 'fulfilled' ? decimals.value : 18
    const supplyValue = totalSupply.status === 'fulfilled' ? totalSupply.value : { low: 0n, high: 0n }
    
    // Convert Cairo felt to string (Starknet stores strings as felts)
    const nameStr = feltToString(nameValue)
    const symbolStr = feltToString(symbolValue)
    
    // Convert Uint256 to string
    const supplyStr = uint256ToString(supplyValue)
    
    console.log('✓ [Starknet RPC] On-chain data fetched:', {
      name: nameStr,
      symbol: symbolStr,
      decimals: decimalsValue,
      supply: supplyStr
    })
    
    return {
      name: nameStr,
      symbol: symbolStr,
      decimals: Number(decimalsValue),
      totalSupply: supplyStr
    }
    
  } catch (error: any) {
    console.warn('[Starknet RPC] Failed:', error.message)
    return null
  }
}

/**
 * Convert Cairo felt to ASCII string
 */
function feltToString(felt: any): string {
  if (!felt) return 'Unknown'
  
  try {
    // Handle array of felts
    if (Array.isArray(felt)) {
      felt = felt[0]
    }
    
    const hex = typeof felt === 'bigint' ? felt.toString(16) : String(felt)
    const str = Buffer.from(hex, 'hex').toString('utf8')
    return str.replace(/\0/g, '').trim() || 'Unknown' // Remove null bytes
  } catch {
    return 'Unknown'
  }
}

/**
 * Convert Starknet Uint256 to string
 */
function uint256ToString(uint256: any): string {
  if (!uint256) return '0'
  
  try {
    // Handle array format
    if (Array.isArray(uint256)) {
      const low = BigInt(uint256[0] || 0)
      const high = BigInt(uint256[1] || 0)
      const value = (high << 128n) + low
      return value.toString()
    }
    
    // Handle object format
    const { low, high } = uint256
    const value = (BigInt(high || 0) << 128n) + BigInt(low || 0)
    return value.toString()
  } catch {
    return '0'
  }
}

/**
 * Validate Starknet address format
 */
export function isValidStarknetAddress(address: string): boolean {
  // Starknet addresses are hex strings starting with 0x
  // Can be 63-66 characters (including 0x prefix)
  return /^0x[0-9a-fA-F]{63,64}$/.test(address)
}
