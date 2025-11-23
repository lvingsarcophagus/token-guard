/**
 * Create Admin User Script
 * Creates a new admin user or upgrades an existing user to admin
 * 
 * Usage: node scripts/create-admin.js <email>
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.PRIVATE_KEY)?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function createOrUpgradeAdmin(email) {
  try {
    console.log(`\n🔍 Checking for user: ${email}`);
    
    let userId;
    let userExists = false;
    
    // Try to find existing user
    try {
      const userRecord = await auth.getUserByEmail(email);
      userId = userRecord.uid;
      userExists = true;
      console.log(`✅ Found existing user: ${userId}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`⚠️  User not found. Please provide the email of an existing user.`);
        console.log(`\nTo create a new user:`);
        console.log(`1. Go to your app and sign up with: ${email}`);
        console.log(`2. Then run this script again\n`);
        process.exit(1);
      } else {
        throw error;
      }
    }
    
    // Update user document with admin role and premium plan
    console.log(`\n📝 Setting admin role and premium plan...`);
    
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    const updateData = {
      role: 'admin',
      plan: 'PREMIUM',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (userDoc.exists) {
      await userRef.update(updateData);
      console.log(`✅ Updated existing user document`);
    } else {
      // Create new user document if it doesn't exist
      await userRef.set({
        uid: userId,
        email: email,
        role: 'admin',
        plan: 'PREMIUM',
        subscription: {
          status: 'active',
          startDate: admin.firestore.FieldValue.serverTimestamp(),
          endDate: null,
          autoRenew: false
        },
        usage: {
          tokensAnalyzed: 0,
          lastResetDate: admin.firestore.FieldValue.serverTimestamp(),
          dailyLimit: -1
        },
        preferences: {
          notifications: true,
          emailAlerts: false,
          theme: 'system'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Created new user document`);
    }
    
    // Verify the update
    const updatedDoc = await userRef.get();
    const userData = updatedDoc.data();
    
    console.log(`\n📋 User Details:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${userData?.email || email}`);
    console.log(`   Role: ${userData?.role}`);
    console.log(`   Plan: ${userData?.plan}`);
    
    if (userData?.role === 'admin') {
      console.log(`\n✅ SUCCESS! ${email} is now an admin with premium access!`);
      console.log(`\nNext steps:`);
      console.log(`1. Log out if currently logged in`);
      console.log(`2. Log back in with: ${email}`);
      console.log(`3. Navigate to: /admin/dashboard`);
      console.log(`4. You should see the admin panel with Users, Analytics, Settings, and Logs tabs\n`);
    } else {
      console.log(`\n⚠️  Warning: Role update may not have worked. Please check Firestore manually.\n`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('\n❌ Error: Please provide user email');
  console.log('Usage: node scripts/create-admin.js <user-email>\n');
  console.log('Example: node scripts/create-admin.js admin@example.com\n');
  process.exit(1);
}

// Verify environment variables
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('\n❌ Error: Missing Firebase Admin credentials in .env.local');
  console.log('Required variables (either format):');
  console.log('  - FIREBASE_ADMIN_PROJECT_ID or PROJECT_ID');
  console.log('  - FIREBASE_ADMIN_CLIENT_EMAIL or CLIENT_EMAIL');
  console.log('  - FIREBASE_ADMIN_PRIVATE_KEY or PRIVATE_KEY\n');
  process.exit(1);
}

// Run the script
createOrUpgradeAdmin(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
