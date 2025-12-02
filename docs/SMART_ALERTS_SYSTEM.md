# Smart Alerts System - Complete Documentation

**Feature**: Premium Smart Alerts  
**Status**: Implemented  
**Last Updated**: December 2025

---

## Overview

The Smart Alerts system provides real-time monitoring of watchlist tokens for Premium users. It automatically scans tokens every hour and sends notifications when significant risk changes are detected.

---

## Architecture

```
Cron Job (Hourly)
    ↓
GET /api/cron/check-alerts
    ↓
Check if Smart Alerts enabled (Firestore)
    ↓
Get all Premium users
    ↓
For each user's watchlist (alertEnabled = true)
    ↓
Scan token via /api/analyze-token
    ↓
Compare with previous scan data
    ↓
Check alert conditions
    ↓
Create notification if triggered
    ↓
Update watchlist with latest data
```

---

## Alert Conditions

Premium users receive automatic alerts when:

### 1. Risk Score Increases Significantly
- **Threshold**: >15 points increase
- **Example**: Score goes from 35 to 55 (+20 points)
- **Alert**: "Risk score increased from 35 to 55 (+20 points)"

### 2. New Critical Flags Detected
- **Flags**: Honeypot, mint authority, freeze authority, ownership not renounced
- **Example**: Mint authority suddenly appears
- **Alert**: "New critical flags: Mint authority exists - supply can be inflated"

### 3. Liquidity Drops Below Threshold
- **Threshold**: >30% decrease
- **Example**: Liquidity drops from $100,000 to $60,000
- **Alert**: "Liquidity dropped 40.0% (from $100000 to $60000)"

### 4. Holder Concentration Changes
- **Threshold**: Top 10 holders increase >10%
- **Example**: Top 10 holders go from 45% to 58%
- **Alert**: "Top 10 holder concentration increased by 13.0%"

---

## Implementation

### Files Created

1. **`app/api/cron/check-alerts/route.ts`**
   - Cron endpoint that runs hourly
   - Scans all Premium users' watchlist tokens
   - Compares current data with previous scan
   - Triggers alerts based on conditions
   - Updates watchlist with latest data

2. **`app/api/admin/smart-alerts/route.ts`**
   - Admin API to enable/disable Smart Alerts
   - GET: Fetch current settings
   - POST: Update settings (enable/disable, scan interval)

3. **`components/admin-smart-alerts-panel.tsx`**
   - Admin UI panel for Smart Alerts control
   - Toggle enable/disable
   - View stats (total scans, alerts sent)
   - Display alert conditions
   - Resource usage warning

4. **`scripts/init-smart-alerts.js`**
   - Initialization script for Firestore settings
   - Sets up default configuration (disabled)

---

## Database Schema

### Collection: `admin_settings/smart_alerts`

```typescript
{
  enabled: boolean              // System on/off
  scanIntervalHours: number     // How often to scan (default: 1)
  totalScans: number            // Total scans performed
  totalAlerts: number           // Total alerts sent
  lastRun: Timestamp | null     // Last execution time
  createdAt: Timestamp
  updatedAt: Timestamp
  updatedBy: string             // Admin user ID
}
```

### Collection: `watchlist/{userId}/tokens/{tokenId}`

```typescript
{
  address: string
  symbol: string
  name: string
  chain: string
  chainId: string
  alertEnabled: boolean         // User wants alerts for this token
  
  // Tracking fields for comparison
  lastRiskScore: number
  lastLiquidity: number
  lastHolderConcentration: number
  lastCriticalFlags: string[]
  lastChecked: Timestamp
  
  addedAt: Timestamp
}
```

### Collection: `alerts/{userId}/notifications/{alertId}`

```typescript
{
  tokenAddress: string
  tokenSymbol: string
  tokenName: string
  type: 'RISK_CHANGE'
  alerts: string[]              // Array of alert messages
  oldRiskScore: number
  newRiskScore: number
  message: string               // Combined alert message
  read: boolean
  createdAt: Timestamp
}
```

---

## Setup Instructions

### 1. Initialize Settings

```bash
node scripts/init-smart-alerts.js
```

This creates the `admin_settings/smart_alerts` document with default values (disabled).

### 2. Configure Cron Job

**Platform**: Vercel, Netlify, or any cron service

**Endpoint**: `GET /api/cron/check-alerts`

**Schedule**: `0 * * * *` (every hour at minute 0)

**Headers**:
```
Authorization: Bearer <CRON_SECRET>
```

**Vercel Cron Configuration** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/check-alerts",
      "schedule": "0 * * * *"
    }
  ]
}
```

### 3. Enable Smart Alerts

1. Go to Admin Dashboard (`/admin/dashboard`)
2. Click the Smart Alerts tab (⚡ icon)
3. Click "ENABLE" button
4. System will start scanning on next cron execution

---

## Admin Panel Features

### Status Display
- **System Active/Disabled**: Current state
- **Scan Interval**: How often scans run (default: 1 hour)
- **Total Scans**: Lifetime scan count
- **Alerts Sent**: Lifetime alert count
- **Last Run**: Timestamp of last execution

### Controls
- **Enable/Disable Toggle**: Turn system on/off
- **Refresh Button**: Reload current settings
- **Alert Conditions Display**: Shows all 4 alert types

### Resource Warning
Displays warning about API usage:
- Consumes Mobula, Moralis, GoPlus, Helius API credits
- Scans all Premium users' watchlist tokens hourly
- Monitor usage in Analytics panel

---

## User Experience

### For Premium Users

1. **Add Token to Watchlist**
   - Navigate to token analysis page
   - Click "Add to Watchlist"
   - Enable "Alert me of changes"

2. **Receive Alerts**
   - Alerts appear in notification bell (navbar)
   - Red badge shows unread count
   - Click to view alert details

3. **Alert Details**
   - Token symbol and name
   - Alert type (risk increase, critical flag, etc.)
   - Specific changes detected
   - Timestamp

### For Free Users
- Watchlist available but no automatic alerts
- Must manually check tokens
- Upgrade prompt shown when enabling alerts

---

## Performance Considerations

### API Usage
- **Per Token Scan**: 3-5 API calls
  - Mobula: Market data
  - Moralis/Helius: Blockchain data
  - GoPlus: Security analysis (EVM only)
  
- **Hourly Cost Estimate**:
  - 100 Premium users × 5 tokens each = 500 scans
  - 500 scans × 4 API calls = 2,000 API requests/hour
  - 2,000 × 24 hours = 48,000 requests/day

### Optimization Strategies
1. **Batch Requests**: Group API calls where possible
2. **Cache Results**: Store token data for 5 minutes
3. **Rate Limiting**: Stagger scans across the hour
4. **Selective Scanning**: Only scan tokens with alertEnabled=true
5. **Smart Scheduling**: Scan high-risk tokens more frequently

### Scaling Considerations
- Use Redis for caching
- Implement queue system (Bull, BullMQ)
- Distribute scans across multiple workers
- Add circuit breakers for API failures

---

## Monitoring & Debugging

### Logs to Monitor
```
[Smart Alerts] Starting hourly check...
[Smart Alerts] System disabled by admin
[Smart Alerts] Alert triggered for POPCAT (user: user@example.com)
[Smart Alerts] Completed: 150 tokens checked, 12 alerts triggered
```

### Key Metrics
- Scan completion time
- Alert trigger rate
- API error rate
- User engagement (alerts read vs unread)

### Debug Checklist
- [ ] Cron job configured correctly
- [ ] CRON_SECRET matches in environment
- [ ] Smart Alerts enabled in admin panel
- [ ] Premium users have tokens in watchlist
- [ ] Tokens have alertEnabled=true
- [ ] API keys valid and not rate-limited

---

## Testing

### Manual Test
1. Enable Smart Alerts in admin panel
2. Add a token to watchlist as Premium user
3. Enable alerts for that token
4. Manually trigger cron: `curl -H "Authorization: Bearer <CRON_SECRET>" https://your-domain.com/api/cron/check-alerts`
5. Check response for scan results
6. Verify notification created in Firestore

### Automated Test
```javascript
// Test alert conditions
const testAlertConditions = async () => {
  const oldData = {
    riskScore: 30,
    liquidity: 100000,
    holderConcentration: 0.45,
    criticalFlags: []
  }
  
  const newData = {
    riskScore: 50,  // +20 points (should trigger)
    liquidity: 60000,  // -40% (should trigger)
    holderConcentration: 0.58,  // +13% (should trigger)
    criticalFlags: ['Mint authority exists']  // New flag (should trigger)
  }
  
  // All 4 conditions should trigger alerts
}
```

---

## Future Enhancements

### Short-Term
- [ ] Email notifications (in addition to in-app)
- [ ] Telegram bot integration
- [ ] Discord webhook support
- [ ] SMS alerts (Twilio)
- [ ] Customizable alert thresholds per user

### Medium-Term
- [ ] Alert history page
- [ ] Alert analytics dashboard
- [ ] Snooze alerts feature
- [ ] Alert priority levels
- [ ] Batch alert digest (daily summary)

### Long-Term
- [ ] Machine learning for predictive alerts
- [ ] Social sentiment alerts (Twitter, Discord)
- [ ] Whale movement alerts
- [ ] Smart contract event monitoring
- [ ] Cross-chain alert aggregation

---

## Troubleshooting

### Issue: Alerts not triggering

**Possible Causes**:
1. Smart Alerts disabled in admin panel
2. Cron job not running
3. No Premium users with alertEnabled tokens
4. API rate limits exceeded

**Solutions**:
1. Check admin panel status
2. Verify cron job logs
3. Check Firestore for watchlist data
4. Monitor API usage

### Issue: Too many alerts

**Possible Causes**:
1. Volatile market conditions
2. Thresholds too sensitive
3. Many tokens in watchlists

**Solutions**:
1. Increase alert thresholds
2. Implement alert cooldown period
3. Add "snooze" feature
4. Group similar alerts

### Issue: High API costs

**Possible Causes**:
1. Too many tokens being scanned
2. Scanning too frequently
3. No caching implemented

**Solutions**:
1. Limit tokens per user
2. Increase scan interval to 2-4 hours
3. Implement Redis caching
4. Use cheaper API alternatives

---

## Security Considerations

### Cron Endpoint Protection
- Requires `CRON_SECRET` in Authorization header
- Returns 401 if secret doesn't match
- Secret should be long and random (32+ characters)

### Data Privacy
- Alerts only visible to token owner
- No cross-user data leakage
- Firestore security rules enforce user isolation

### Rate Limiting
- Cron job has no rate limit (internal)
- API endpoints have standard rate limits
- Consider implementing per-user scan limits

---

## Cost Analysis

### API Costs (Estimated)
- **Mobula**: $0.0001 per request
- **Moralis**: $0.0002 per request
- **GoPlus**: Free (rate limited)
- **Helius**: $0.0001 per request

### Monthly Cost Example
- 100 Premium users
- 5 tokens per user average
- 4 API calls per token
- Hourly scans (24/day)

**Calculation**:
```
100 users × 5 tokens × 4 API calls × 24 hours × 30 days = 1,440,000 requests/month
1,440,000 × $0.0001 average = $144/month in API costs
```

### Revenue vs Cost
- Premium subscription: $29/month
- 100 Premium users = $2,900/month revenue
- API costs: $144/month
- **Profit margin**: 95%

---

## Conclusion

The Smart Alerts system provides significant value to Premium users by automating token monitoring and risk detection. The implementation is scalable, cost-effective, and provides a strong competitive advantage.

**Key Benefits**:
- Automated 24/7 monitoring
- Real-time risk detection
- Multiple alert conditions
- Admin control and monitoring
- Scalable architecture

**Next Steps**:
1. Initialize settings: `node scripts/init-smart-alerts.js`
2. Configure cron job on hosting platform
3. Enable in admin panel
4. Monitor performance and user engagement
5. Iterate based on feedback

---

**End of Documentation**
