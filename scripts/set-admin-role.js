/**
 * Set Admin Role Script
 * Use this to grant admin role to a user account
 * 
 * Usage: node scripts/set-admin-role.js <user-email>
 */

const admin = require('firebase-admin');

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

async function setAdminRole(email) {
  try {
    console.log(`\n🔍 Looking for user: ${email}`);
    
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid;
    
    console.log(`✅ Found user: ${userId}`);
    
    // Update user document with admin role
    await db.collection('users').doc(userId).set({
      role: 'admin',
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log(`✅ Updated user document with admin role`);
    
    // Verify the update
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    console.log(`\n📋 User Data:`);
    console.log(`   Email: ${userData?.email || email}`);
    console.log(`   Role: ${userData?.role}`);
    console.log(`   Tier: ${userData?.tier || userData?.plan}`);
    
    if (userData?.role === 'admin') {
      console.log(`\n✅ SUCCESS! ${email} is now an admin!`);
      console.log(`You can now access the admin dashboard at /admin/dashboard\n`);
    } else {
      console.log(`\n⚠️  Warning: Role update may not have worked. Please check Firestore manually.\n`);
    }
    
  } catch (error) {
    console.error('\n❌ Error setting admin role:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('\nUser not found. Please check the email address.\n');
    }
    
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('\n❌ Error: Please provide user email');
  console.log('Usage: node scripts/set-admin-role.js <user-email>\n');
  console.log('Example: node scripts/set-admin-role.js admin@example.com\n');
  process.exit(1);
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Verify environment variables
if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error('\n❌ Error: Missing Firebase Admin credentials in .env.local');
  console.log('Required variables:');
  console.log('  - FIREBASE_ADMIN_PROJECT_ID');
  console.log('  - FIREBASE_ADMIN_CLIENT_EMAIL');
  console.log('  - FIREBASE_ADMIN_PRIVATE_KEY\n');
  process.exit(1);
}

// Run the script
setAdminRole(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
