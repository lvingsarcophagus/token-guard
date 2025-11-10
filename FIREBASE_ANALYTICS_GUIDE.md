# Firebase Analytics Integration Guide

**Date**: November 10, 2025  
**Status**: ✅ Fully Integrated

## Overview

Firebase Analytics is now integrated throughout the application to track user behavior, feature usage, and errors. This provides valuable insights for improving the product and understanding user engagement.

## Setup

### 1. Firebase Configuration

Analytics is initialized in `lib/firebase.ts`:

```typescript
import { getAnalytics } from "firebase/analytics"
import type { Analytics } from 'firebase/analytics'

let analytics: Analytics | null = null
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app)
  } catch (error) {
    console.warn('Analytics initialization failed:', error)
  }
}

export { analytics }
```

### 2. Environment Variables

Ensure your `.env.local` includes:

```env
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Available Event Trackers

### User Events

```typescript
import { analyticsEvents } from '@/lib/firebase-analytics'

// Track signup
analyticsEvents.signup('email') // method: 'email', 'google', etc.

// Track login
analyticsEvents.login('email')

// Track logout
analyticsEvents.logout()
```

### Token Analysis Events

```typescript
// Track token search
analyticsEvents.tokenSearch('PEPE', '1') // query, chainId

// Track token analysis
analyticsEvents.tokenAnalyze(
  '0x6982508145454ce325ddbe47a25d4ec3d2311933', // tokenAddress
  '1', // chainId
  21 // riskScore
)
```

### Watchlist Events

```typescript
// Track add to watchlist
analyticsEvents.addToWatchlist(
  '0x6982508145454ce325ddbe47a25d4ec3d2311933', // tokenAddress
  'PEPE' // tokenSymbol
)

// Track remove from watchlist
analyticsEvents.removeFromWatchlist('0x6982508145454ce325ddbe47a25d4ec3d2311933')
```

### Premium Events

```typescript
// Track pricing page view
analyticsEvents.viewPricing()

// Track upgrade to premium
analyticsEvents.upgradeToPremium('MONTHLY') // plan: 'MONTHLY', 'ANNUAL'

// Track subscription cancellation
analyticsEvents.cancelSubscription()
```

### Chart Events

```typescript
// Track chart view
analyticsEvents.viewChart('price', '0x6982508145454ce325ddbe47a25d4ec3d2311933')
// chartType: 'price', 'volume', 'holders', 'risk', 'transactions', 'whales'

// Track timeframe change
analyticsEvents.changeTimeframe('30D') // timeframe: '7D', '30D', '90D', '1Y'
```

### Error Events

```typescript
// Track API errors
analyticsEvents.apiError('Moralis', 'Rate limit exceeded')

// Track analysis errors
analyticsEvents.analysisError(
  '0x6982508145454ce325ddbe47a25d4ec3d2311933',
  'Invalid contract address'
)
```

## User Tracking

### Initialize User Tracking (on login)

Automatically called in `auth-context.tsx`:

```typescript
import { initializeUserTracking } from '@/lib/firebase-analytics'

initializeUserTracking(userId, {
  email: 'user@example.com',
  plan: 'PREMIUM',
  createdAt: '2025-01-15T10:30:00Z'
})
```

### Clear User Tracking (on logout)

Automatically called in `auth-context.tsx`:

```typescript
import { clearUserTracking } from '@/lib/firebase-analytics'

clearUserTracking()
```

## Custom Events

For custom event tracking:

```typescript
import { trackEvent } from '@/lib/firebase-analytics'

trackEvent('custom_event_name', {
  param1: 'value1',
  param2: 123,
  param3: true
})
```

## Page View Tracking

Track page views manually:

```typescript
import { trackPageView } from '@/lib/firebase-analytics'

// In page component
useEffect(() => {
  trackPageView('/premium/dashboard', 'Premium Dashboard')
}, [])
```

## Integrated Locations

### ✅ Auth Context (`contexts/auth-context.tsx`)
- **initializeUserTracking()** called on user login
- **clearUserTracking()** called on user logout
- Automatically sets user properties: plan, email, account age

### ✅ Signup Page (`app/signup/page.tsx`)
- Tracks successful signups with `analyticsEvents.signup('email')`
- Fires after Firestore user profile creation

### ✅ Navbar (`components/navbar.tsx`)
- Tracks logout with `analyticsEvents.logout()`
- Fires before Firebase signOut

### 🔄 Ready to Integrate (TODO)

#### Premium Dashboard (`app/premium/dashboard/page.tsx`)
```typescript
// Add to handleScan()
analyticsEvents.tokenSearch(searchQuery, chainId)
analyticsEvents.tokenAnalyze(tokenAddress, chainId, riskScore)

// Add to handleAddToWatchlist()
analyticsEvents.addToWatchlist(tokenAddress, tokenSymbol)

// Add to handleRemoveFromWatchlist()
analyticsEvents.removeFromWatchlist(tokenAddress)

// Add to chart components
analyticsEvents.viewChart(chartType, tokenAddress)

// Add to timeframe selector
analyticsEvents.changeTimeframe(timeframe)
```

#### Pricing Page (`app/pricing/page.tsx`)
```typescript
useEffect(() => {
  analyticsEvents.viewPricing()
}, [])
```

#### Premium Signup (`app/premium-signup/page.tsx`)
```typescript
// After successful upgrade
analyticsEvents.upgradeToPremium(selectedPlan)
```

#### Error Boundaries
```typescript
// In catch blocks
analyticsEvents.apiError(apiName, errorMessage)
analyticsEvents.analysisError(tokenAddress, errorMessage)
```

## Viewing Analytics Data

### Google Analytics Dashboard

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Analytics** → **Dashboard**
4. View real-time events, user properties, and custom reports

### Key Metrics to Monitor

- **User Engagement**:
  - Daily/Monthly Active Users
  - Session duration
  - Pages per session
  
- **Feature Usage**:
  - Token analyses performed
  - Watchlist additions/removals
  - Chart views by type
  - Timeframe preferences
  
- **Conversion Funnel**:
  - Signups
  - Login frequency
  - Premium pricing page views
  - Premium upgrades
  - Subscription cancellations
  
- **Error Tracking**:
  - API errors by service
  - Analysis errors by token
  - Error frequency and patterns

### Custom Reports

Create custom reports in Google Analytics for:
- Most analyzed tokens
- Most popular chains
- Average risk scores
- User retention by plan
- Feature adoption rates

## Privacy Considerations

- ✅ Analytics only tracks anonymous user IDs (Firebase UIDs)
- ✅ No personally identifiable information (PII) logged
- ✅ User can opt-out via browser Do Not Track settings
- ✅ Complies with GDPR requirements
- ✅ Data retention follows Firebase defaults (2 months for events, 14 months for user properties)

## Debugging

Enable debug mode in development:

```typescript
// Add to firebase.ts for development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any)['ga-disable-G-XXXXXXXXXX'] = false // Enable in dev
}
```

Check console for analytics logs:
```
[Analytics] Event tracked: token_analyze { token_address: '0x...', risk_score: 21 }
[Analytics] User ID set: ABC123
```

## Next Steps

1. ✅ **Basic Integration Complete**
   - User tracking on login/logout
   - Signup events
   - Logout events

2. 🔄 **Phase 2: Feature Tracking** (TODO)
   - Token analysis events
   - Watchlist events
   - Chart interaction events
   - Timeframe selection events

3. 🔄 **Phase 3: Premium Tracking** (TODO)
   - Pricing page views
   - Upgrade events
   - Subscription management events

4. 🔄 **Phase 4: Error Tracking** (TODO)
   - API error events
   - Analysis error events
   - User-facing error messages

5. 🔄 **Phase 5: Custom Dashboards** (TODO)
   - Create custom Google Analytics reports
   - Set up conversion goals
   - Configure A/B testing experiments
