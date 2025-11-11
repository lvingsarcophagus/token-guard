# 🧪 Testing Guide: Pro Dashboard & Algorithm Efficiency

## Quick Start Testing

### 1. Pro Dashboard Testing

**URL:** http://localhost:3000/pro

#### Step-by-Step Test Plan

##### Access Check (Free vs Premium)
1. ✅ **Login as Free User**
   - Navigate to `/pro`
   - Should redirect to `/pricing`
   - Verify "Premium subscription required" message

2. ✅ **Upgrade to Premium** (or use Admin account)
   - Your account: `rPYvv7mTeoUPJ4GEY9fPbKQoQSs2` (ADMIN)
   - Should have full access to Pro dashboard

##### Overview Tab Testing
- [ ] Verify 4 stat cards display correctly:
  - Portfolio Value (with 24h P/L)
  - Watchlist Tokens count
  - Active Alerts count
  - High Risk Tokens count
- [ ] Check Quick Actions cards (3 cards)
- [ ] Verify Recent Alerts section
- [ ] Test "View All" button navigation

##### Watchlist Tab Testing
- [ ] Enter a token address (e.g., `0xdac17f958d2ee523a2206206994597c13d831ec7` - USDT)
- [ ] Click "Add Token" button
- [ ] Verify token appears in watchlist table
- [ ] Check all columns display:
  - Token name/symbol
  - Risk score (color-coded)
  - 24h price change
  - Market cap
  - Alerts count
  - Action buttons
- [ ] Test "Remove" button
- [ ] Verify empty state when no tokens

##### Alerts Tab Testing
- [ ] Check all alerts display with correct severity colors:
  - 🔴 Critical (red)
  - 🟠 High (orange)
  - 🟡 Medium (yellow)
  - 🔵 Low (blue)
- [ ] Verify alert details:
  - Token name
  - Message
  - Timestamp
  - Type badge
- [ ] Check empty state

##### **Analytics Tab Testing** ⭐ NEW
- [ ] **Portfolio Chart**
  - Verify dual-axis area chart renders
  - Hover over data points → tooltips appear
  - Check blue gradient (portfolio value)
  - Check yellow gradient (risk score)
  - Verify 7-day timeline (Nov 1-7)
  
- [ ] **Risk Distribution Pie Chart**
  - Verify 4 colored segments render
  - Check percentages add to 100%
  - Hover → tooltip shows token count
  - Verify legend displays
  
- [ ] **Token Performance Bar Chart**
  - Verify 6 bars render
  - Green bars for positive performance
  - Red bars for negative performance
  - Hover → tooltip shows exact %
  
- [ ] **Timeframe Selector**
  - Click "24h" button
  - Click "7d" button (active by default)
  - Click "30d" button
  - Verify active state highlighting
  
- [ ] **AI Summary Card**
  - Check 3 insight cards display
  - Verify color coding (blue/yellow/green)
  - Read recommendations

##### **AI Insights Tab Testing** ⭐ NEW
- [ ] **AI Chat Interface**
  - Verify welcome message displays
  - Check 4 quick action buttons present
  
- [ ] **Quick Actions**
  - Click "Portfolio Status" → AI responds with portfolio analysis
  - Click "Risk Analysis" → AI responds with risk assessment
  - Click "Alert Summary" → AI responds with alerts
  - Click "Market Insights" → AI responds with market trends
  
- [ ] **Chat Functionality**
  - Type: "How is my portfolio performing?"
  - Press Enter or click Send button
  - Verify loading animation (3 bouncing dots)
  - Check AI response appears
  - Verify message formatting (user=blue, AI=purple)
  - Test auto-scroll to bottom
  
- [ ] **Custom Questions**
  - "Which tokens are risky?"
  - "Show my profit/loss"
  - "What should I do next?"
  - "Tell me about alerts"
  
- [ ] **Quick Insights Panel**
  - Market Sentiment card (bullish/bearish %)
  - Smart Alerts card with "View Alerts" button
  - Risk Forecast card with "Review Tokens" button
  - Opportunities card
  - Test navigation buttons

##### Performance Testing
- [ ] Tab switching speed (< 100ms)
- [ ] Chart rendering time (< 500ms)
- [ ] AI response time (< 2 seconds)
- [ ] Smooth scrolling
- [ ] Responsive on mobile/tablet

---

## 2. Algorithm Efficiency Testing

### Test Tokens (Use These for Comparison)

#### Low Risk Tokens (Expected: 15-30)
```
USDT: 0xdac17f958d2ee523a2206206994597c13d831ec7
USDC: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
WETH: 0xc02aaa39b223fe8d0a13e2bb3a2e9eb0ce3606eb
```

#### Medium Risk Tokens (Expected: 30-55)
```
SHIB: 0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce
PEPE: 0x6982508145454ce325ddbe47a25d4ec3d2311933
```

#### High Risk Tokens (Expected: 55-75)
```
Test newer meme coins or low-liquidity tokens
```

#### Scam/Rug Tokens (Expected: 75-95)
```
Any honeypot tokens or known scams
```

### Testing Process

#### A. Open Browser Console
```
F12 → Console Tab
```

#### B. Analyze Token
1. Go to `/dashboard`
2. Enter token address
3. Click "Analyze Token"
4. **Watch Console Logs:**

```
[Risk Calc] Token Data: {
  marketCap: 1000000000,
  fdv: 1200000000,
  liquidityUSD: 50000000,
  holderCount: 45000,
  ...
}

[Risk Calc] Individual Scores: {
  supplyDilution: 35,
  holderConcentration: 42,
  liquidityDepth: 28,
  contractRisk: 15,
  adoption: 25,
  ...
}

[Risk Calc] Overall Score (raw): 31.5
```

#### C. Efficiency Metrics to Check

##### 1. **Score Variance**
✅ Good Algorithm:
- Low risk tokens: 15-30
- Medium risk: 30-55
- High risk: 55-75
- Scam: 75-95

❌ Bad Algorithm:
- All scores between 29-31
- No differentiation

##### 2. **Factor Contribution**
Check `Individual Scores` in console:
- Each factor should vary independently
- No factor always at same value
- Missing data handled gracefully (not always 0)

##### 3. **Data Quality**
- `marketCap` present and reasonable
- `liquidityUSD` present for DEX tokens
- `holderCount` varies by token
- `age` calculated correctly

##### 4. **Response Time**
- Token data fetch: < 3 seconds
- Risk calculation: < 100ms
- Total analysis: < 5 seconds

### Expected Results by Token Type

#### Established Tokens (USDT, USDC, WETH)
```javascript
Expected Breakdown:
- Supply Dilution: 15-25 (low FDV inflation)
- Holder Concentration: 20-35 (well distributed)
- Liquidity Depth: 10-20 (deep liquidity)
- Contract Risk: 5-15 (verified, audited)
- Adoption: 10-20 (high usage)
- Overall: 15-30 ✅
```

#### Meme Coins (SHIB, PEPE)
```javascript
Expected Breakdown:
- Supply Dilution: 25-45 (some inflation)
- Holder Concentration: 35-55 (whales present)
- Liquidity Depth: 25-40 (moderate liquidity)
- Contract Risk: 20-35 (unaudited/basic)
- Adoption: 30-50 (medium usage)
- Overall: 35-55 ✅
```

#### New/Unknown Tokens
```javascript
Expected Breakdown:
- Supply Dilution: 45-70 (high inflation risk)
- Holder Concentration: 60-80 (few holders)
- Liquidity Depth: 50-85 (low liquidity)
- Contract Risk: 40-70 (unverified)
- Adoption: 55-75 (low usage)
- Overall: 55-75 ⚠️
```

#### Scam/Honeypot Tokens
```javascript
Expected Breakdown:
- Supply Dilution: 75-95 (unlimited mint)
- Holder Concentration: 85-95 (1-2 holders)
- Liquidity Depth: 85-95 (no/removed liquidity)
- Contract Risk: 80-95 (malicious functions)
- Adoption: 80-95 (dead/zero volume)
- Overall: 80-95 🚨
```

---

## 3. Comparison Test Results

### Create Test Spreadsheet

| Token | Address | Expected Risk | Actual Risk | Variance | Pass/Fail |
|-------|---------|---------------|-------------|----------|-----------|
| USDT | 0xdac... | 15-30 | ? | ? | ? |
| USDC | 0xa0b... | 15-30 | ? | ? | ? |
| SHIB | 0x95a... | 35-55 | ? | ? | ? |
| PEPE | 0x698... | 35-55 | ? | ? | ? |

### Pass Criteria
✅ **Algorithm is Working** if:
- Scores vary by at least 20 points between categories
- Low risk tokens score < 35
- High risk tokens score > 60
- Each factor contributes differently
- Missing data doesn't break calculation

❌ **Algorithm Needs Fix** if:
- All scores within 5 points of each other
- Always same score (29-30)
- Crashes on missing data
- Factors always same value

---

## 4. Pro Dashboard Feature Checklist

### Charts
- [ ] Portfolio chart renders without errors
- [ ] Pie chart shows risk distribution
- [ ] Bar chart shows performance
- [ ] All tooltips work on hover
- [ ] Legends display correctly
- [ ] Responsive on resize

### AI Chat
- [ ] Welcome message displays
- [ ] Quick action buttons work
- [ ] Can type custom messages
- [ ] Send button works
- [ ] Enter key sends message
- [ ] Loading animation shows
- [ ] AI responses appear
- [ ] Messages scroll automatically
- [ ] User/AI messages styled differently
- [ ] No errors in console

### Data Integration
- [ ] Stats cards show real numbers
- [ ] Charts use portfolio data
- [ ] AI receives context (check Network tab)
- [ ] Watchlist syncs with backend
- [ ] Alerts load from API

---

## 5. Performance Benchmarks

### Loading Times
- Initial page load: < 2 seconds
- Tab switch: < 200ms
- Chart render: < 500ms
- AI response: < 3 seconds
- Watchlist update: < 1 second

### Memory Usage
- Check Chrome DevTools → Memory
- Should be < 150MB for Pro dashboard
- No memory leaks on tab switching

### Network Requests
- Watch Network tab
- API calls should succeed (200 status)
- No excessive requests
- Proper auth headers

---

## 6. Mobile Testing

### Responsive Breakpoints
- [ ] Desktop (1920px): All features visible
- [ ] Laptop (1440px): Charts resize
- [ ] Tablet (768px): Stacked layout
- [ ] Mobile (375px): Compact view

### Touch Interactions
- [ ] Buttons tap-friendly
- [ ] Charts scrollable
- [ ] Chat input accessible
- [ ] No overlapping elements

---

## Quick Test Commands

### Open Pro Dashboard
```
http://localhost:3000/pro
```

### Test API Endpoints Directly
```bash
# Get watchlist (use your auth token)
curl http://localhost:3000/api/pro/watchlist \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get alerts
curl http://localhost:3000/api/pro/alerts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get portfolio stats
curl http://localhost:3000/api/pro/portfolio-stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test AI chat
curl http://localhost:3000/api/pro/ai-chat \
  -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"How is my portfolio?","context":{}}'
```

---

## Expected Console Output (Good Algorithm)

```
✅ GOOD - Varying Scores:
[Risk Calc] Overall Score (raw): 18.45  (USDT)
[Risk Calc] Overall Score (raw): 22.30  (USDC)
[Risk Calc] Overall Score (raw): 43.67  (SHIB)
[Risk Calc] Overall Score (raw): 51.22  (PEPE)

❌ BAD - Same Scores:
[Risk Calc] Overall Score (raw): 29.50  (USDT)
[Risk Calc] Overall Score (raw): 30.10  (USDC)
[Risk Calc] Overall Score (raw): 29.80  (SHIB)
[Risk Calc] Overall Score (raw): 29.90  (PEPE)
```

---

## Report Issues

If you encounter problems:

1. **Check Browser Console** (F12)
2. **Check Network Tab** for failed requests
3. **Screenshot errors**
4. **Note which token/feature failed**
5. **Check server terminal** for backend errors

---

## Success Criteria Summary

### Pro Dashboard ✅
- [ ] All 5 tabs functional
- [ ] Charts render correctly
- [ ] AI chat works
- [ ] No console errors
- [ ] Responsive design works

### Algorithm ✅
- [ ] Scores vary 15-95 range
- [ ] Different tokens = different scores
- [ ] Factors contribute independently
- [ ] Console logs show detailed breakdown
- [ ] No crashes on missing data

**Ready to test!** Open http://localhost:3000/pro and start testing! 🚀
