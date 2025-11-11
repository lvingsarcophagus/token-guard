# 🎯 TokenGuard Dashboard System

## Overview

TokenGuard now features a **complete dual-dashboard system** with **Firestore database integration**, providing distinct experiences for Free and Premium users.

## 📊 Dashboard Features

### **Free Dashboard** (`/free-dashboard`)

**Features:**
- ✅ Daily usage tracking (10 scans/day limit)
- ✅ Usage percentage indicator with color coding
- ✅ Weekly usage trends (Area Chart)
- ✅ Recent analysis history (Bar Chart)
- ✅ 4 key metrics cards
- ✅ Watchlist preview (max 5 tokens)
- ✅ Premium upgrade CTA
- ✅ Low limit warnings

**Charts:**
1. **Weekly Usage** - Area chart showing daily scan count over 7 days
2. **Recent Analysis** - Bar chart of last 5 token risk scores

**Metrics:**
- Daily Limit Progress (X/10 with progress bar)
- Total Analyzed (lifetime count)
- Watchlist Size (0/5 max)
- Average Risk Score

---

### **Premium Dashboard** (`/premium`)

**Features:**
- ✅ Unlimited scans
- ✅ Real-time risk alerts
- ✅ Portfolio performance tracking
- ✅ Advanced analytics (4 charts)
- ✅ Watchlist monitoring (unlimited)
- ✅ Alert notifications
- ✅ Risk distribution breakdown

**Charts:**
1. **Portfolio Performance** - Dual-axis area chart (Value + Risk Score over 7 days)
2. **Risk Distribution** - Donut chart showing token breakdown by risk level
3. **Recent Analysis** - Bar chart of last 7 scans
4. **Watchlist Preview** - List view with live price/risk data

**Metrics:**
- Portfolio Value (with 24h P&L)
- Watchlist Tokens (with avg risk)
- Total Analyzed (unlimited)
- Active Alerts (real-time)

**Alert System:**
- Severity levels: critical, high, medium, low
- Types: risk_increase, honeypot_detected, liquidity_drop, whale_movement, contract_change
- Color-coded banners
- Dismissible notifications

---

### **Dashboard Router** (`/dashboard`)

Automatically redirects users to the correct dashboard:
- Not logged in → `/login`
- FREE plan → `/free-dashboard`
- PREMIUM plan → `/premium`

---

## 🗄️ Firestore Database Schema

### Collections Structure

```
users/{userId}
├── plan: 'FREE' | 'PREMIUM'
├── subscription: { status, startDate, endDate, autoRenew }
├── usage: { tokensAnalyzed, lastResetDate, dailyLimit }
└── preferences: { notifications, emailAlerts, theme }

watchlist/{userId}/tokens/{tokenAddress}
├── latestAnalysis: { riskScore, riskLevel, analyzedAt, breakdown }
├── marketData: { price, priceChange24h, marketCap, volume24h }
├── alertsEnabled: boolean
└── alertThreshold: number

alerts/{userId}/notifications/{alertId}
├── type: 'risk_increase' | 'honeypot_detected' | ...
├── severity: 'critical' | 'high' | 'medium' | 'low'
├── message: string
└── details: { oldValue, newValue, threshold }

analysis_history/{userId}/scans/{scanId}
├── results: { overall_risk_score, risk_level, breakdown }
├── marketSnapshot: { price, marketCap, volume24h }
└── plan: 'FREE' | 'PREMIUM'

portfolio/{userId}
├── summary: { totalValue, totalTokens, avgRiskScore, profitLoss24h }
└── history: [{ date, totalValue, riskScore }]

settings/{userId}
├── alerts: { enabled, emailNotifications, frequency }
├── display: { chartType, defaultTimeframe }
└── api: { enabled, key, rateLimit }
```

### Required Firestore Indexes

```javascript
// watchlist/{userId}/tokens
Fields: lastUpdatedAt (desc), addedAt (desc)

// alerts/{userId}/notifications
Fields: read (asc), severity (desc), createdAt (desc)

// analysis_history/{userId}/scans
Fields: analyzedAt (desc)

// users
Fields: plan (asc), createdAt (desc)
```

---

## 🔧 Services Layer

### `firestore-service.ts`

**User Operations:**
- `getUserProfile(userId)` - Get user profile
- `createUserProfile(userId, email, displayName)` - Initialize new user
- `updateUserPlan(userId, plan)` - Upgrade/downgrade plan
- `incrementTokenAnalyzed(userId)` - Track usage

**Watchlist Operations:**
- `getWatchlist(userId)` - Fetch all watched tokens
- `addToWatchlist(userId, token)` - Add token
- `removeFromWatchlist(userId, tokenAddress)` - Remove token
- `updateWatchlistToken(userId, tokenAddress, updates)` - Update token data

**Alerts Operations:**
- `getAlerts(userId, onlyUnread)` - Fetch alerts
- `createAlert(userId, alert)` - Create new alert
- `markAlertAsRead(userId, alertId)` - Mark as read
- `dismissAlert(userId, alertId)` - Dismiss alert

**Analytics Operations:**
- `saveAnalysisHistory(userId, analysis)` - Save scan results
- `getAnalysisHistory(userId, limit)` - Fetch scan history
- `getDashboardStats(userId, plan)` - Get all dashboard metrics

**Portfolio Operations:**
- `getPortfolio(userId)` - Get portfolio data
- `updatePortfolio(userId, portfolio)` - Update portfolio

---

## 🎨 UI Components

### Chart Library: **Recharts**

**Area Chart** - Portfolio performance, usage trends
```tsx
<AreaChart data={portfolioChartData}>
  <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#gradient)" />
</AreaChart>
```

**Bar Chart** - Recent analysis, risk scores
```tsx
<BarChart data={recentActivityData}>
  <Bar dataKey="score" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
</BarChart>
```

**Pie Chart** - Risk distribution
```tsx
<PieChart>
  <Pie data={riskData} innerRadius={60} outerRadius={90} dataKey="value">
    <Cell fill={entry.color} />
  </Pie>
</PieChart>
```

### Color Scheme

```javascript
const COLORS = {
  LOW: '#22c55e',      // Green
  MEDIUM: '#eab308',   // Yellow
  HIGH: '#f97316',     // Orange
  CRITICAL: '#ef4444'  // Red
}
```

---

## 🔐 Authentication Context

Updated `auth-context.tsx` to include:

```typescript
interface AuthContextType {
  user: User | null
  userData: UserData | null          // Legacy (backward compat)
  userProfile: UserDocument | null   // New schema
  loading: boolean
  updateProfile: (data) => Promise<void>
  refreshProfile: () => Promise<void>
}
```

**Auto-creates** user profile on first login:
1. Checks if `UserDocument` exists
2. If not, calls `createUserProfile()`
3. Sets default plan to `FREE`
4. Initializes usage limits (10/day)

---

## 📱 Responsive Design

**Breakpoints:**
- Mobile: Single column, stacked cards
- Tablet: 2 columns (md:grid-cols-2)
- Desktop: 4 columns for metrics (lg:grid-cols-4)

**Charts:**
- Responsive height: 200-250px
- Auto-width via `ResponsiveContainer`
- Adaptive font sizes (12px for axes)

---

## 🚀 Usage Examples

### Check User Plan
```typescript
const { userProfile } = useAuth()
if (userProfile?.plan === 'PREMIUM') {
  // Show premium features
}
```

### Load Dashboard Data
```typescript
const stats = await getDashboardStats(user.uid, 'PREMIUM')
console.log(stats.tokensAnalyzed)  // Total scans
console.log(stats.activeAlerts)    // Unread alerts
console.log(stats.avgRiskScore)    // Avg watchlist risk
```

### Add Token to Watchlist
```typescript
await addToWatchlist(userId, {
  address: '0x...',
  name: 'Token Name',
  symbol: 'TKN',
  chainId: '1',
  latestAnalysis: { riskScore: 35, ... },
  marketData: { price: 1.23, ... },
  alertsEnabled: true,
  alertThreshold: 10,
  addedAt: new Date()
})
```

### Create Alert
```typescript
await createAlert(userId, {
  tokenAddress: '0x...',
  tokenName: 'Token Name',
  tokenSymbol: 'TKN',
  type: 'risk_increase',
  severity: 'high',
  message: 'Risk score increased by 25 points',
  details: { oldValue: 30, newValue: 55 },
  read: false,
  dismissed: false,
  createdAt: new Date()
})
```

---

## 🎯 Key Differences: Free vs Premium

| Feature | Free | Premium |
|---------|------|---------|
| **Daily Scans** | 10/day | Unlimited |
| **Watchlist Size** | 5 tokens max | Unlimited |
| **Real-time Alerts** | ❌ | ✅ |
| **Portfolio Tracking** | ❌ | ✅ |
| **Advanced Charts** | 2 basic | 4 advanced |
| **Analysis History** | Last 5 | Last 50+ |
| **API Access** | ❌ | ✅ |
| **Priority Support** | ❌ | ✅ |

---

## 📊 Chart Data Structure

### Portfolio Performance
```typescript
{
  date: 'Nov 7',
  value: 52500,      // USD value
  risk: 27           // Avg risk score
}
```

### Risk Distribution
```typescript
{
  name: 'Low Risk',
  value: 5,          // Token count
  color: '#22c55e'   // Green
}
```

### Recent Activity
```typescript
{
  date: 'Nov 7',
  score: 29,         // Risk score
  token: 'USDT'      // Symbol
}
```

---

## 🔄 Data Flow

```
User Login
  ↓
Auth Context loads UserDocument from Firestore
  ↓
Dashboard Router checks plan
  ↓
Redirect to /free-dashboard or /premium
  ↓
Load dashboard stats via getDashboardStats()
  ↓
Fetch watchlist, alerts, analysis history in parallel
  ↓
Render charts and metrics
```

---

## 🛠️ Setup Instructions

### 1. Configure Firestore

```bash
# No additional setup required
# Services automatically create collections on first use
```

### 2. Create Firestore Indexes

Go to Firebase Console → Firestore → Indexes → Add Index

```
Collection: watchlist/{userId}/tokens
Fields: lastUpdatedAt (Descending), addedAt (Descending)

Collection: alerts/{userId}/notifications
Fields: read (Ascending), severity (Descending), createdAt (Descending)

Collection: analysis_history/{userId}/scans
Fields: analyzedAt (Descending)
```

### 3. Install Dependencies

```bash
pnpm add recharts date-fns
```

### 4. Test Dashboards

```bash
# Free user
Visit: http://localhost:3000/free-dashboard

# Premium user (requires plan upgrade)
Visit: http://localhost:3000/premium
```

---

## 🎨 Customization

### Change Chart Colors
Edit colors in component files:
```typescript
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899']
```

### Adjust Daily Limits
Modify in `free-dashboard/page.tsx`:
```typescript
const dailyLimit = 10  // Change to your preferred limit
```

### Add New Chart
```tsx
<ResponsiveContainer width="100%" height={250}>
  <LineChart data={myData}>
    <Line type="monotone" dataKey="value" stroke="#8884d8" />
  </LineChart>
</ResponsiveContainer>
```

---

## 📈 Future Enhancements

- [ ] Real-time WebSocket updates for alerts
- [ ] Export portfolio to CSV/PDF
- [ ] Custom alert rules builder
- [ ] Mobile app integration
- [ ] Multi-chain support (currently Ethereum only)
- [ ] Social features (share watchlists)
- [ ] AI-powered risk predictions

---

## 🐛 Known Issues

None currently!

---

## 📚 Related Files

```
lib/
  firestore-schema.ts         # Type definitions
  services/firestore-service.ts  # Database operations

app/
  dashboard/page.tsx          # Router (redirects)
  free-dashboard/page.tsx     # Free tier UI
  premium/page.tsx            # Premium tier UI

contexts/
  auth-context.tsx            # Auth + profile management
```

---

**Last Updated:** November 7, 2025  
**Version:** 2.0  
**Author:** TokenGuard Team
