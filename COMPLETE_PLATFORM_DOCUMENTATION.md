# Tokenomics Lab - Complete Platform Documentation

**Version:** 1.0.0  
**Last Updated:** November 23, 2025  
**Platform:** Multi-chain Token Risk Analysis Platform

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Authentication System](#authentication-system)
6. [Risk Analysis Engine](#risk-analysis-engine)
7. [API Integrations](#api-integrations)
8. [Database Schema](#database-schema)
9. [Frontend Components](#frontend-components)
10. [Backend Services](#backend-services)
11. [Admin Panel](#admin-panel)
12. [Security Features](#security-features)
13. [Deployment Guide](#deployment-guide)
14. [Troubleshooting](#troubleshooting)

---

## Platform Overview

### What is Tokenomics Lab?

Tokenomics Lab is a comprehensive multi-chain cryptocurrency token risk analysis platform that provides AI-powered security assessments for tokens across multiple blockchain networks including Ethereum, BSC, Solana, Polygon, Arbitrum, Optimism, and Base.

### Core Features

- **Multi-chain Token Analysis** - Analyze tokens across 7+ blockchain networks
- **10-Factor Risk Scoring** - Comprehensive algorithm covering contract security, liquidity, holder concentration
- **AI-Powered Classification** - Groq AI (Llama 3.3 70B) for meme token detection and risk explanations
- **Real-time Data Integration** - Mobula, Moralis, GoPlus, Helius, CoinMarketCap APIs
- **User Tier System** - FREE (20 scans/day), PREMIUM (unlimited), ADMIN (platform management)
- **Watchlist & Alerts** - Track tokens and get notified of risk changes (Premium)
- **Historical Analytics** - Price, volume, holder trends over time (Premium)
- **Admin Dashboard** - Complete platform management and monitoring

### Risk Score Ranges

- **0-30**: LOW (Green) - Safe to invest
- **31-60**: MEDIUM (Yellow) - Moderate risk
- **61-80**: HIGH (Orange) - High risk, caution advised
- **81-100**: CRITICAL (Red) - Extremely risky, avoid

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Next.js 16)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Landing    │  │  Dashboard   │  │ Admin Panel  │      │
│  │     Page     │  │   (Unified)  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API ROUTES (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/analyze │  │  /api/user   │  │  /api/admin  │      │
│  │   -token     │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Risk Engine  │  │  AI Services │  │   Firestore  │      │
│  │              │  │  (Groq/Gem)  │  │   Services   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Mobula  │ │ Moralis  │ │  GoPlus  │ │  Helius  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │   CMC    │ │ CoinGecko│ │ Firebase │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Input** → Token address entered in scanner
2. **Chain Detection** → Automatic blockchain detection
3. **Data Fetching** → Parallel API calls to multiple providers
4. **Risk Calculation** → 10-factor algorithm with chain-adaptive weights
5. **AI Analysis** → Meme detection and risk explanation
6. **Response** → Comprehensive risk report with visualizations
7. **Storage** → Save to Firestore (history, watchlist)

---

## Technology Stack

### Frontend
- **Next.js 16.0.0** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5.9.3** - Type safety
- **Tailwind CSS 4.1.17** - Styling
- **Radix UI** - Accessible components
- **Framer Motion 12.23.24** - Animations
- **Recharts 2.15.4** - Data visualization

### Backend
- **Next.js API Routes** - Server-side endpoints
- **Firebase 12.5.0** - Authentication & Firestore
- **Firebase Admin 12.7.0** - Server-side operations

### AI & APIs
- **Groq SDK 0.34.0** - Primary AI (Llama 3.3 70B)
- **Google Generative AI 0.24.1** - Fallback AI (Gemini)
- **Mobula API** - Market data
- **Moralis API** - Blockchain transactions
- **GoPlus API** - Contract security (EVM)
- **Helius API** - Solana data
- **CoinMarketCap API** - Token search

### Package Manager
- **pnpm 10.10.0** - Fast, disk-efficient

---

## User Roles & Permissions

### FREE Tier
- **Daily Limit**: 20 token scans
- **Features**:
  - Basic risk analysis
  - 10-factor scoring
  - Chain detection
  - 5 watchlist tokens
  - Basic token search
- **Restrictions**:
  - No AI insights
  - No historical data
  - No real-time alerts
  - Limited watchlist

### PREMIUM Tier
- **Daily Limit**: Unlimited scans
- **Features**:
  - All FREE features
  - AI-powered insights
  - Unlimited watchlist
  - Real-time alerts
  - Historical analytics
  - Advanced charts
  - Priority support
  - Export data
- **Price**: $29/month (configurable)

### ADMIN Role
- **Access**: All PREMIUM features
- **Additional**:
  - User management
  - Platform analytics
  - System settings
  - Activity logs
  - Cache management
  - 2FA configuration
  - Database access

---

## Authentication System

### Supported Methods

1. **Email/Password**
   - Traditional authentication
   - Password reset via email
   - Email verification

2. **Google OAuth**
   - One-click sign-in
   - Auto-profile creation
   - Profile picture sync

### Authentication Flow

```typescript
// Login Flow
User → Login Page → Firebase Auth → Firestore Profile → Dashboard

// OAuth Flow
User → Google Sign-in → Firebase Auth → Profile Creation → Dashboard

// Admin Flow
User → Login → Role Check → Admin Dashboard (if admin)
```

### Session Management

- **Token-based**: Firebase ID tokens
- **Refresh**: Automatic token refresh
- **Expiry**: 1 hour (auto-renewed)
- **Storage**: Session storage (cleared on logout)

### Two-Factor Authentication (2FA)

- **Method**: TOTP (Time-based One-Time Password)
- **Apps**: Google Authenticator, Authy, etc.
- **Setup**: QR code + manual key
- **Backup**: Recovery codes (future feature)
- **Admin**: Separate 2FA for admin accounts

---

## Risk Analysis Engine

### 10-Factor Algorithm

#### 1. Contract Security (Weight: 20%)
- **Checks**:
  - Honeypot detection
  - Malicious code patterns
  - Proxy contracts
  - Ownership renounced
- **Data Source**: GoPlus API
- **Scoring**: Binary (pass/fail) with severity levels

#### 2. Liquidity Analysis (Weight: 15%)
- **Metrics**:
  - Total liquidity (USD)
  - Liquidity locked percentage
  - Lock duration
  - DEX distribution
- **Thresholds**:
  - Low: < $10,000
  - Medium: $10,000 - $100,000
  - High: > $100,000

#### 3. Holder Concentration (Weight: 15%)
- **Metrics**:
  - Top 10 holders percentage
  - Gini coefficient
  - Whale concentration
- **Risk Levels**:
  - Low: < 30% top 10
  - Medium: 30-50%
  - High: > 50%

#### 4. Trading Volume (Weight: 10%)
- **Metrics**:
  - 24h volume
  - Volume/Market cap ratio
  - Volume trend
- **Analysis**: Wash trading detection

#### 5. Price Volatility (Weight: 10%)
- **Metrics**:
  - 24h price change
  - 7d volatility
  - ATH distance
- **Calculation**: Standard deviation

#### 6. Market Cap (Weight: 10%)
- **Ranges**:
  - Micro: < $100K
  - Small: $100K - $1M
  - Medium: $1M - $10M
  - Large: > $10M

#### 7. Token Age (Weight: 5%)
- **Scoring**:
  - < 7 days: High risk
  - 7-30 days: Medium risk
  - > 30 days: Lower risk

#### 8. Transaction Count (Weight: 5%)
- **Metrics**:
  - Total transactions
  - Unique traders
  - Transaction frequency
- **Dead Token Detection**: < 10 transactions

#### 9. Social Presence (Weight: 5%)
- **Checks**:
  - Twitter/X verification
  - Telegram community
  - Website availability
  - GitHub activity

#### 10. Audit Status (Weight: 5%)
- **Verification**:
  - Contract verified
  - Audit reports
  - Security badges
  - Bug bounty programs

### Chain-Adaptive Weighting

Different blockchains have different risk profiles:

```typescript
// Ethereum - Focus on security
{
  contractSecurity: 25%,
  liquidity: 20%,
  holderConcentration: 15%,
  // ... other factors
}

// Solana - Focus on transaction activity
{
  transactionCount: 20%,
  tradingVolume: 15%,
  contractSecurity: 15%,
  // ... other factors
}

// BSC - Balanced approach
{
  contractSecurity: 20%,
  liquidity: 15%,
  holderConcentration: 15%,
  // ... other factors
}
```

### Special Cases

#### Stablecoins
- **Auto-detection**: USDT, USDC, DAI, BUSD, etc.
- **Risk Score**: Automatically set to LOW (0-30)
- **Reasoning**: Backed by reserves, audited

#### Meme Tokens
- **Detection**: AI-powered classification
- **Penalty**: +15 baseline risk
- **Reasoning**: High volatility, speculative

#### Official Tokens
- **Verification**: CoinGecko listing + $50M+ market cap
- **Benefit**: -10 risk reduction
- **Examples**: UNI, AAVE, LINK

#### Dead Tokens
- **Detection**: No liquidity OR no transactions
- **Risk Score**: CRITICAL (90+)
- **Flag**: "Dead Token" warning

---

## API Integrations

### Mobula API
- **Purpose**: Market data (price, volume, liquidity)
- **Endpoints**:
  - `/market/data` - Token metrics
  - `/market/history` - Historical prices
- **Rate Limit**: 100 requests/minute
- **Fallback**: CoinGecko API

### Moralis API
- **Purpose**: Blockchain transaction data
- **Endpoints**:
  - `/erc20/metadata` - Token info
  - `/erc20/transfers` - Transaction history
- **Chains**: All EVM chains
- **Rate Limit**: 2,500 requests/day (free tier)

### GoPlus API
- **Purpose**: Contract security analysis
- **Endpoints**:
  - `/token_security` - Security checks
  - `/address_security` - Address analysis
- **Chains**: EVM chains only
- **Features**:
  - Honeypot detection
  - Malicious code scanning
  - Ownership analysis

### Helius API
- **Purpose**: Solana-specific data
- **Endpoints**:
  - DAS API - Token metadata
  - Enhanced Transactions - Transaction details
- **Features**:
  - NFT support
  - Compressed NFTs
  - Transaction parsing

### CoinMarketCap API
- **Purpose**: Token search and discovery
- **Endpoints**:
  - `/cryptocurrency/map` - Token list
  - `/cryptocurrency/info` - Token details
- **Rate Limit**: 333 requests/day (free tier)

### CoinGecko API
- **Purpose**: Price data and verification
- **Endpoints**:
  - `/coins/list` - All tokens
  - `/simple/price` - Current prices
- **Rate Limit**: 50 requests/minute (free tier)

---

## Database Schema

### Firestore Collections

#### users/{userId}
```typescript
{
  uid: string
  email: string
  name?: string
  displayName?: string
  photoURL?: string
  company?: string
  country?: string
  role: 'user' | 'admin'
  plan: 'FREE' | 'PREMIUM'
  subscription: {
    status: 'active' | 'cancelled' | 'expired'
    startDate: Timestamp
    endDate: Timestamp | null
    autoRenew: boolean
  }
  usage: {
    tokensAnalyzed: number
    lastResetDate: Timestamp
    dailyLimit: number  // -1 for unlimited
  }
  preferences: {
    notifications: boolean
    emailAlerts: boolean
    theme: 'light' | 'dark' | 'system'
  }
  walletAddress?: string
  createdAt: Timestamp
  lastLoginAt: Timestamp
}
```

#### watchlist/{userId}/tokens/{tokenAddress}
```typescript
{
  address: string
  chain: string
  name: string
  symbol: string
  logoUrl?: string
  latestAnalysis: {
    riskScore: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    timestamp: Timestamp
  }
  alerts: {
    priceChange: boolean
    riskChange: boolean
  }
  addedAt: Timestamp
  lastUpdatedAt: Timestamp
}
```

#### alerts/{userId}/notifications/{alertId}
```typescript
{
  id: string
  type: 'price' | 'risk' | 'security' | 'system'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  tokenAddress?: string
  tokenSymbol?: string
  read: boolean
  dismissed: boolean
  createdAt: Timestamp
}
```

#### analysis_history/{userId}/scans/{scanId}
```typescript
{
  id: string
  tokenAddress: string
  chain: string
  tokenName: string
  tokenSymbol: string
  riskScore: number
  riskLevel: string
  factors: {
    contractSecurity: number
    liquidity: number
    holderConcentration: number
    // ... other factors
  }
  flags: string[]
  aiInsights?: string
  analyzedAt: Timestamp
}
```

#### portfolio/{userId}
```typescript
{
  userId: string
  tokens: Array<{
    address: string
    chain: string
    amount: number
    avgBuyPrice: number
    currentPrice: number
    profitLoss: number
  }>
  summary: {
    totalValue: number
    profitLoss24h: number
    profitLossTotal: number
  }
  lastUpdatedAt: Timestamp
}
```

#### totp_secrets/{userId}
```typescript
{
  userId: string
  secret: string  // Encrypted
  enabled: boolean
  createdAt: Timestamp
  lastUsedAt: Timestamp
}
```

#### activity_logs/{logId}
```typescript
{
  id: string
  userId: string
  userEmail: string
  action: string  // 'user_login', 'user_logout', 'token_scan', etc.
  details?: any
  ipAddress?: string
  userAgent?: string
  timestamp: Timestamp
}
```

---

## Frontend Components

### Core Components

#### Navbar (`components/navbar.tsx`)
- **Features**:
  - Floating glassmorphic design
  - Hamburger menu with fullscreen overlay
  - Role-aware navigation
  - Profile picture display
  - Admin panel link (for admins)
  - Notification bell
- **Responsive**: Mobile-first design

#### Loader (`components/loader.tsx`)
- **Variants**:
  - `default` - Standard loader
  - `small` - Compact version
  - `large` - Full-screen
- **Animation**: Rotating rings with pulsing dots
- **Props**: `text`, `variant`, `fullScreen`

#### Token Scanner (`components/token-scanner.tsx`)
- **Features**:
  - Token address input
  - Chain selector
  - Auto-detection
  - Search history
  - Quick actions
- **Validation**: Address format checking

#### Token Analysis (`components/token-analysis.tsx`)
- **Sections**:
  - Risk overview
  - Factor breakdown
  - Security insights
  - Market metrics
  - Holder distribution
  - AI explanation (Premium)
- **Charts**: Recharts integration

#### Profile Image Upload (`components/profile-image-upload.tsx`)
- **Features**:
  - Drag & drop
  - Preview
  - Base64 storage
  - Remove option
- **Limits**: 1MB max size

### UI Components (`components/ui/`)

All components follow Radix UI patterns:
- `button.tsx` - Styled buttons
- `card.tsx` - Container cards
- `input.tsx` - Form inputs
- `label.tsx` - Form labels
- `dialog.tsx` - Modal dialogs
- `dropdown-menu.tsx` - Dropdown menus
- `accordion.tsx` - Collapsible sections

---

## Backend Services

### API Routes

#### `/api/analyze-token`
- **Method**: POST
- **Auth**: Required
- **Body**:
  ```json
  {
    "address": "0x...",
    "chain": "ethereum"
  }
  ```
- **Response**: Complete risk analysis
- **Rate Limit**: Based on user tier

#### `/api/user/export-data`
- **Method**: POST
- **Auth**: Required
- **Response**: JSON file with all user data
- **GDPR**: Compliant data export

#### `/api/user/delete-account`
- **Method**: DELETE
- **Auth**: Required
- **Action**: Permanent account deletion
- **Cleanup**: All user data removed

#### `/api/admin/users`
- **Method**: GET, POST
- **Auth**: Admin only
- **Actions**:
  - List all users
  - Update user plan
  - Delete user
  - Ban user

#### `/api/admin/analytics`
- **Method**: GET
- **Auth**: Admin only
- **Response**: Platform analytics
  - User growth
  - Scan activity
  - Tier distribution
  - Chain usage

#### `/api/admin/activity-logs`
- **Method**: GET
- **Auth**: Admin only
- **Response**: User activity logs
- **Filters**: Action type, date range

### Services Layer

#### Firestore Service (`lib/services/firestore-service.ts`)
- **Functions**:
  - `getUserProfile()`
  - `createUserProfile()`
  - `updateUserPlan()`
  - `getWatchlist()`
  - `addToWatchlist()`
  - `getAlerts()`
  - `saveAnalysisHistory()`

#### Activity Logger (`lib/services/activity-logger.ts`)
- **Functions**:
  - `logAuth()` - Login/logout events
  - `logTokenScan()` - Token analysis
  - `logUserAction()` - Generic actions
- **Storage**: Firestore `activity_logs` collection

---

## Admin Panel

### Access
- **URL**: `/admin/dashboard`
- **Auth**: Admin role required
- **Redirect**: Non-admins redirected to login

### Features

#### Users Tab
- **List**: All registered users
- **Search**: By email or name
- **Actions**:
  - View details
  - Edit user (change plan)
  - Ban user
  - Delete user
- **Display**: Name, email, UID, role, tier, last login

#### Analytics Tab
- **Charts**:
  - User growth over time (line chart)
  - Scan activity (bar chart)
  - Tier distribution (pie chart)
  - Chain usage (bar chart)
- **Stats**:
  - Total users
  - Premium users
  - Conversion rate
  - Active users (24h)

#### Settings Tab
- **System**:
  - Maintenance mode
  - Maintenance message
  - Free tier limit
  - Cache expiration
- **2FA**:
  - Enable/disable TOTP
  - Require 2FA for admins
  - QR code setup

#### Logs Tab
- **Display**: Real-time activity logs
- **Filters**: By action type
- **Info**: User, action, timestamp, details
- **Color-coded**: Login (green), logout (red), scan (blue)

#### Cache Tab
- **Actions**:
  - View cached tokens
  - Clear cache
  - Set expiration
- **Stats**: Cache hit rate, size

#### System Tab
- **Monitoring**:
  - API status
  - Database health
  - Error logs
- **Actions**:
  - Restart services
  - Clear logs

---

## Security Features

### Authentication Security
- **Password**: bcrypt hashing
- **Tokens**: JWT with expiry
- **2FA**: TOTP support
- **Session**: Secure cookies

### API Security
- **Rate Limiting**: Per-user limits
- **CORS**: Configured origins
- **CSRF**: Token validation
- **Input Validation**: Zod schemas

### Data Security
- **Encryption**: At rest (Firebase)
- **HTTPS**: Enforced
- **Secrets**: Environment variables
- **PII**: Minimal collection

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Admins can read all users
    match /users/{userId} {
      allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Watchlist - user-specific
    match /watchlist/{userId}/tokens/{tokenId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Activity logs - admin only
    match /activity_logs/{logId} {
      allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if true;  // Server-side writes
    }
  }
}
```

---

## Deployment Guide

### Prerequisites
- Node.js 20.x
- pnpm 10.x
- Firebase project
- API keys (Mobula, Moralis, etc.)

### Environment Setup

1. **Clone Repository**
   ```bash
   git clone <repo-url>
   cd tokenomics-lab
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your keys
   ```

4. **Firebase Setup**
   - Create Firebase project
   - Enable Authentication (Email, Google)
   - Create Firestore database
   - Download service account key
   - Add credentials to `.env.local`

5. **API Keys**
   - Mobula: https://mobula.io
   - Moralis: https://moralis.io
   - GoPlus: https://gopluslabs.io
   - Helius: https://helius.dev
   - CoinMarketCap: https://coinmarketcap.com/api
   - Groq: https://groq.com

### Build & Deploy

#### Development
```bash
pnpm dev
# Open http://localhost:3000
```

#### Production Build
```bash
pnpm build
pnpm start
```

#### Deploy to Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Post-Deployment

1. **Create Admin User**
   ```bash
   node scripts/create-admin.js admin@example.com
   ```

2. **Test APIs**
   ```bash
   node scripts/test-api-data-sources.js
   ```

3. **Monitor Logs**
   - Check Firebase Console
   - Monitor API usage
   - Review error logs

---

## Troubleshooting

### Common Issues

#### 1. Firestore Permission Denied
**Symptom**: "Missing or insufficient permissions"
**Solution**: Check Firestore rules, ensure user is authenticated

#### 2. API Rate Limits
**Symptom**: 429 errors
**Solution**: Implement caching, upgrade API tier

#### 3. Token Not Found
**Symptom**: "Token not found on this chain"
**Solution**: Verify chain, check token address format

#### 4. Admin Panel Not Loading
**Symptom**: Redirects to login
**Solution**: 
- Run `node scripts/create-admin.js <email>`
- Log out and log back in
- Check `role` field in Firestore

#### 5. Profile Update Fails
**Symptom**: Firestore state error
**Solution**: Fixed in latest version, use `updateDoc` instead of `setDoc`

#### 6. OAuth Not Working
**Symptom**: Popup blocked or error
**Solution**: 
- Enable popups
- Check Firebase OAuth configuration
- Verify authorized domains

### Debug Mode

Enable debug logging:
```typescript
// Add to .env.local
NEXT_PUBLIC_DEBUG=true
```

Check browser console for detailed logs.

### Support

- **Documentation**: `/docs`
- **Algorithm Explanation**: `/docs/algorithm`
- **GitHub Issues**: <repo-url>/issues
- **Email**: support@tokenomicslab.com

---

## Maintenance

### Regular Tasks

#### Daily
- Monitor API usage
- Check error logs
- Review user feedback

#### Weekly
- Update token cache
- Review analytics
- Check security alerts

#### Monthly
- Update dependencies
- Review API costs
- Backup database
- Security audit

### Backup Strategy

1. **Firestore**: Automatic daily backups
2. **User Data**: Export via admin panel
3. **Code**: Git repository
4. **Environment**: Secure vault

---

## Future Enhancements

### Planned Features
- [ ] Mobile app (React Native)
- [ ] Portfolio tracking
- [ ] Price alerts
- [ ] Social trading
- [ ] API for developers
- [ ] White-label solution
- [ ] More blockchain support
- [ ] Advanced AI insights
- [ ] Community features
- [ ] Referral program

### Roadmap
- **Q1 2026**: Mobile app launch
- **Q2 2026**: API marketplace
- **Q3 2026**: Social features
- **Q4 2026**: Enterprise tier

---

## Credits

**Developed by**: Tokenomics Lab Team  
**AI Models**: Groq (Llama 3.3 70B), Google Gemini  
**APIs**: Mobula, Moralis, GoPlus, Helius, CoinMarketCap  
**Framework**: Next.js, React, Firebase  
**Design**: Tailwind CSS, Radix UI, Framer Motion

---

## License

Proprietary - All Rights Reserved

---

**End of Documentation**

For questions or support, contact: support@tokenomicslab.com
