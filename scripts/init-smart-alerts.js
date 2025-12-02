/**
 * Initialize Smart Alerts settings in Firestore
 * Run with: node scripts/init-smart-alerts.js
 */

require('dotenv').config({ path: '.env.local' })
const admin = require('firebase-admin')

// Initialize Firebase Admin
const serviceAccount = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.PROJECT_ID
})

const db = admin.firestore()

async function initSmartAlerts() {
  try {
    console.log('🔧 Initializing Smart Alerts settings...')

    await db.collection('admin_settings').doc('smart_alerts').set({
      enabled: false,  // Disabled by default
      scanIntervalHours: 1,
      totalScans: 0,
      totalAlerts: 0,
      lastRun: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true })

    console.log('✅ Smart Alerts settings initialized!')
    console.log('\n📝 Settings:')
    console.log('   - Enabled: false (disabled by default)')
    console.log('   - Scan Interval: 1 hour')
    console.log('   - Total Scans: 0')
    console.log('   - Total Alerts: 0')
    console.log('\n💡 To enable Smart Alerts:')
    console.log('   1. Go to Admin Dashboard')
    console.log('   2. Navigate to Smart Alerts panel')
    console.log('   3. Click "ENABLE" button')
    console.log('\n⚠️  Note: Smart Alerts requires a cron job to run hourly')
    console.log('   Set up cron at: https://console.vercel.com/cron-jobs')
    console.log('   Endpoint: GET /api/cron/check-alerts')
    console.log('   Schedule: 0 * * * * (every hour)')
    console.log('   Authorization: Bearer ' + process.env.CRON_SECRET)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error initializing Smart Alerts:', error)
    process.exit(1)
  }
}

initSmartAlerts()
