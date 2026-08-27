import { app } from 'electron';
import { safeStorage } from 'electron';
import crypto from 'crypto';
import path from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import Database from 'better-sqlite3';

const isDev = !app.isPackaged;
const dbDir = isDev
  ? path.join(process.cwd(), 'db')
  : path.join(app.getPath('userData'), 'db');

if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const MASTER_KEY_FILE = path.join(dbDir, '.master_key');
const DB_NAME = 'shega_desktop.db';
const DEMO_DB_NAME = 'shega_desktop_demo.db';

export interface EncryptedDbConfig {
  key: Buffer;
  plaintext?: boolean;
}

let masterKey: Buffer | null = null;
let keyDerived = false;

export async function initializeCrypto(pin?: string): Promise<Buffer> {
  if (masterKey && keyDerived) return masterKey;

  // Try to load existing master key
  if (existsSync(MASTER_KEY_FILE)) {
    try {
      const encryptedKey = readFileSync(MASTER_KEY_FILE);
      if (safeStorage.isEncryptionAvailable()) {
        masterKey = safeStorage.decryptString(encryptedKey.toString('base64'));
        masterKey = Buffer.from(masterKey, 'hex');
      } else {
        // Fallback: derive from PIN if provided
        if (pin) {
          masterKey = await deriveKeyFromPin(pin);
        }
      }
      if (masterKey) {
        keyDerived = true;
        return masterKey;
      }
    } catch (e) {
      console.warn('[Crypto] Failed to decrypt master key:', e);
    }
  }

  // Generate new master key
  masterKey = crypto.randomBytes(32);
  keyDerived = true;

  // Store encrypted master key
  await storeMasterKey();

  return masterKey;
}

async function deriveKeyFromPin(pin: string): Promise<Buffer> {
  const salt = crypto.randomBytes(16);
  // Use scrypt with high cost parameters
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(pin, salt, 32, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  return key;
}

async function storeMasterKey(): Promise<void> {
  if (!masterKey) throw new Error('No master key to store');

  try {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(masterKey.toString('hex'));
      writeFileSync(MASTER_KEY_FILE, encrypted);
    } else {
      // Store with weak encryption (fallback only)
      const encrypted = crypto.createCipheriv('aes-256-gcm', crypto.randomBytes(32), crypto.randomBytes(12));
      // This is a fallback - not recommended for production
      writeFileSync(MASTER_KEY_FILE, 'fallback');
    }
  } catch (e) {
    console.error('[Crypto] Failed to store master key:', e);
  }
}

export function getMasterKey(): Buffer | null {
  return masterKey;
}

export function isKeyDerived(): boolean {
  return keyDerived;
}

export function clearMasterKey(): void {
  masterKey = null;
  keyDerived = false;
  if (existsSync(MASTER_KEY_FILE)) {
    try { unlinkSync(MASTER_KEY_FILE); } catch {}
  }
}

// ============================================
// Encrypted Database Wrapper
// ============================================

interface EncryptedDatabase extends Database {
  // All Database methods are available via proxy
}

function createEncryptedDb(dbPath: string, key: Buffer): Database {
  // For now, use standard better-sqlite3 with application-level encryption
  // for sensitive fields. Full SQLCipher integration requires native compilation.
  const db = new Database(dbPath);
  
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');

  return db;
}

export function createEncryptedDatabase(config: { key: Buffer; path: string }): Database {
  return createEncryptedDb(config.path, config.key);
}

// ============================================
// Application-Level Field Encryption
// ============================================

const FIELD_KEY_SIZE = 32;
const IV_SIZE = 12;
const AUTH_TAG_SIZE = 16;

export function encryptField(plaintext: string, key: Buffer = masterKey!): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function decryptField(encrypted: string, iv: string, tag: string, key: Buffer = masterKey!): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey!, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  const decrypted = Buffer.concat([decipher.update(encrypted, 'base64'), decipher.final()]);
  return decrypted.toString('utf8');
}

// Higher-level helpers for common sensitive fields
export const sensitiveFields = {
  pin: {
    encrypt: (pin: string) => encryptField(pin),
    decrypt: (data: { encrypted: string; iv: string; tag: string }) => decryptField(data.encrypted, data.iv, data.tag),
  },
  pinHash: {
    encrypt: (hash: string) => encryptField(hash),
    decrypt: (data: { encrypted: string; iv: string; tag: string }) => decryptField(data.encrypted, data.iv, data.tag),
  },
  recoveryKey: {
    encrypt: (key: string) => encryptField(key),
    decrypt: (data: { encrypted: string; iv: string; tag: string }) => decryptField(data.encrypted, data.iv, data.tag),
  },
  apiKey: {
    encrypt: (key: string) => encryptField(key),
    decrypt: (data: { encrypted: string; iv: string; tag: string }) => decryptField(data.encrypted, data.iv, data.tag),
  },
  token: {
    encrypt: (token: string) => encryptField(token),
    decrypt: (data: { encrypted: string; iv: string; tag: string }) => decryptField(data.encrypted, data.iv, data.tag),
  },
};

// PIN hashing (separate from encryption)
export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(pin, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  return `${salt}:${key.toString('hex')}`;
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(pin, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), derived);
}

export async function changePin(oldPin: string, newPin: string): Promise<{ hash: string; encrypted: { encrypted: string; iv: string; tag: string } }> {
  const valid = await verifyPin(oldPin, (await getStoredPinHash()) || '');
  if (!valid) throw new Error('Invalid current PIN');
  
  const hash = await hashPin(newPin);
  const encrypted = encryptField(newPin);
  return { hash, encrypted };
}

// Helper to get stored PIN hash (to be implemented based on your storage)
async function getStoredPinHash(): Promise<string | null> {
  // This would read from your database
  return null;
}

export default {
  initializeCrypto,
  getMasterKey,
  isKeyDerived,
  clearMasterKey,
  createEncryptedDatabase,
  encryptField,
  decryptField,
  sensitiveFields,
  hashPin,
  verifyPin,
  changePin,
};