/**
 * TOTP (Time-based One-Time Password) Implementation
 * For 2FA using authenticator apps like Google Authenticator, Authy, etc.
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Generate a random secret for TOTP
export function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 characters
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
}

// Generate TOTP URI for QR code
export function generateTOTPUri(secret: string, email: string, issuer: string = 'Tokenomics Lab'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}

// Generate QR code data URL (for server-side use)
export async function generateQRCode(secret: string, email: string, issuer: string = 'Tokenomics Lab'): Promise<string> {
  // Dynamic import for server-side only
  if (typeof window === 'undefined') {
    const QRCode = require('qrcode')
    const uri = generateTOTPUri(secret, email, issuer)
    return await QRCode.toDataURL(uri)
  }
  return ''
}

// Synchronous TOTP verification (for server-side use)
export function verifyTOTPToken(secret: string, token: string): boolean {
  // Simple synchronous verification using speakeasy-like logic
  const crypto = require('crypto')
  
  const key = base32Decode(secret)
  const epoch = Math.floor(Date.now() / 1000)
  const timeStep = 30
  const window = 1
  
  for (let i = -window; i <= window; i++) {
    const time = Math.floor(epoch / timeStep) + i
    
    const timeBytes = Buffer.alloc(8)
    let t = time
    for (let j = 7; j >= 0; j--) {
      timeBytes[j] = t & 0xff
      t = Math.floor(t / 256)
    }
    
    const hmac = crypto.createHmac('sha1', Buffer.from(key)).update(timeBytes).digest()
    const offset = hmac[hmac.length - 1] & 0xf
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000
    
    if (code.toString().padStart(6, '0') === token) {
      return true
    }
  }
  
  return false
}

// Base32 decode
function base32Decode(secret: string): Uint8Array {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  
  for (const char of secret.toUpperCase()) {
    const val = base32Chars.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  
  return bytes;
}

// HMAC-SHA1 implementation
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message.buffer as ArrayBuffer);
  return new Uint8Array(signature);
}

// Generate TOTP code
export async function generateTOTP(secret: string, timeStep: number = 30): Promise<string> {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const time = Math.floor(epoch / timeStep);
  
  // Convert time to 8-byte array
  const timeBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    timeBytes[i] = time & 0xff;
    time >> 8;
  }
  
  const hmac = await hmacSha1(key, timeBytes);
  
  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
}

// Verify TOTP code
export async function verifyTOTP(secret: string, token: string, window: number = 1): Promise<boolean> {
  // Check current time and ±window time steps
  for (let i = -window; i <= window; i++) {
    const timeStep = 30;
    const epoch = Math.floor(Date.now() / 1000);
    const time = Math.floor(epoch / timeStep) + i;
    
    const key = base32Decode(secret);
    const timeBytes = new Uint8Array(8);
    let t = time;
    for (let j = 7; j >= 0; j--) {
      timeBytes[j] = t & 0xff;
      t = Math.floor(t / 256);
    }
    
    const hmac = await hmacSha1(key, timeBytes);
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000;
    
    if (code.toString().padStart(6, '0') === token) {
      return true;
    }
  }
  
  return false;
}

// Enable 2FA for user
export async function enable2FA(userId: string, secret: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    twoFactorEnabled: true,
    twoFactorSecret: secret,
    twoFactorEnabledAt: new Date()
  });
}

// Disable 2FA for user
export async function disable2FA(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorDisabledAt: new Date()
  });
}

// Check if user has 2FA enabled
export async function has2FAEnabled(userId: string): Promise<boolean> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return false;
  
  const data = userDoc.data();
  return data.twoFactorEnabled === true && !!data.twoFactorSecret;
}

// Get user's 2FA secret
export async function get2FASecret(userId: string): Promise<string | null> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return null;
  
  const data = userDoc.data();
  return data.twoFactorSecret || null;
}
