/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    MORALIS_API_KEY: process.env.MORALIS_API_KEY,
    BLOCKFROST_PROJECT_ID: process.env.BLOCKFROST_PROJECT_ID,
    GOPLUS_API_KEY: process.env.GOPLUS_API_KEY,
    MOBULA_API_KEY: process.env.MOBULA_API_KEY,
    COINMARKETCAP_API_KEY: process.env.COINMARKETCAP_API_KEY,
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
  },
}

module.exports = nextConfig