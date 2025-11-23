/**
 * Set Admin Role Script (Client SDK)
 * Use this to grant admin role to your account
 * 
 * Usage: node scripts/set-admin-role-client.js
 */

// This script uses the Firebase client SDK which is already configured
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function setAdminRole() {
  try {
    console.log('\n🔧 Setting admin role...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Your user ID from the screenshot
    const userId = 'rPYvv7mTeoUPJ4GEY9fPbkQoQSs2';
    
    console.log(`📝 Updating user: ${userId}`);
    
    // Update the user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'admin'
    });
    
    console.log('✅ SUCCESS! Admin role has been set!');
    console.log('\nNext steps:');
    console.log('1. Log out of your account');
    console.log('2. Log back in');
    console.log('3. Go to /admin/dashboard');
    console.log('4. Click the Logs tab\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n⚠️  Permission denied. Please use the Firebase Console method instead:');
      console.log('1. Go to Firebase Console > Firestore Database');
      console.log('2. Find users collection > your user document');
      console.log('3. Click "+ Add field"');
      console.log('4. Field: role, Type: string, Value: admin\n');
    }
    
    process.exit(1);
  }
}

// Run the script
setAdminRole()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
