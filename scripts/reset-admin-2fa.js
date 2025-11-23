/**
 * Reset Admin 2FA Script
 * Use this to disable 2FA for an admin account if locked out
 * 
 * Usage: node scripts/reset-admin-2fa.js <admin-email>
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function resetAdmin2FA(email) {
  try {
    console.log(`\n🔍 Looking for admin user: ${email}`);
    
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid;
    
    console.log(`✅ Found user: ${userId}`);
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.role !== 'admin') {
      console.error('❌ Error: User is not an admin');
      process.exit(1);
    }
    
    console.log(`✅ Confirmed admin role`);
    
    // Delete 2FA secret from Firestore
    const totpDoc = db.collection('totp_secrets').doc(userId);
    const totpExists = (await totpDoc.get()).exists;
    
    if (totpExists) {
      await totpDoc.delete();
      console.log(`✅ Deleted 2FA secret from Firestore`);
    } else {
      console.log(`ℹ️  No 2FA secret found in Firestore`);
    }
    
    // Update user document to mark 2FA as disabled
    await db.collection('users').doc(userId).update({
      '2faEnabled': false,
      'totpEnabled': false,
      'updatedAt': new Date().toISOString()
    });
    
    console.log(`✅ Updated user document - 2FA disabled`);
    
    console.log(`\n✅ SUCCESS! 2FA has been reset for ${email}`);
    console.log(`You can now log in without 2FA and set it up again if needed.\n`);
    
  } catch (error) {
    console.error('\n❌ Error resetting 2FA:', error.message);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('\n❌ Error: Please provide admin email');
  console.log('Usage: node scripts/reset-admin-2fa.js <admin-email>\n');
  process.exit(1);
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Run the reset
resetAdmin2FA(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
