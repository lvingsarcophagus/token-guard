# API Testing Guide

## Quick Test

Visit `/test` page in your app to test all APIs interactively.

Or use the API endpoint:

```bash
# Test all APIs
curl http://localhost:3000/api/test

# Test Solana specifically
curl http://localhost:3000/api/test?solana=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

## What Gets Tested

### All APIs Test
1. **Mobula API** - Ethereum token
2. **Mobula API** - Solana token  
3. **GoPlus API** - Ethereum security scan
4. **CoinMarketCap API** - Token lookup
5. **CoinGecko API** - Price data

### Solana Test
1. **Mobula API** - Solana address lookup
2. **CoinGecko API** - SOL price data
3. **GoPlus API** - Should fail (not supported)

## Expected Results

### For Ethereum Tokens (0x...)
- ✅ Mobula: Should return price data
- ✅ GoPlus: Should return security analysis
- ✅ CoinGecko: Should return backup price
- ✅ CoinMarketCap: Should return price data

### For Solana Tokens
- ✅ Mobula: Should return price data
- ❌ GoPlus: Will show "not supported" message
- ✅ CoinGecko: Should return SOL price data
- ⚠️ CoinMarketCap: May not have all Solana tokens

## Common Issues

### API Key Not Set
- Check `.env.local` file
- Verify environment variables are loaded
- Restart dev server after adding keys

### Network Errors
- Check internet connection
- Verify firewall isn't blocking requests
- Check if API service is down

### Rate Limits
- Some APIs have rate limits
- Wait a few seconds between tests
- Use cached data when possible







