/**
 * keyVault.ts — Encrypted storage for sensitive values (API keys).
 *
 * Uses the Web Crypto API (AES-GCM) to encrypt keys before writing them
 * to localStorage, and decrypts on read.  This prevents casual extraction
 * of API keys via DevTools → Application → Local Storage or by calling
 * `localStorage.getItem()` in the console.
 *
 * Backward-compatible: if a legacy plaintext `aiApiKey` entry exists it is
 * transparently migrated to the encrypted format on first read.
 */

const ENCRYPTED_STORAGE_KEY = "aiApiKey_enc";
const LEGACY_STORAGE_KEY = "aiApiKey";

// Fixed salt — acceptable here because the goal is obfuscation, not
// protection against an attacker who already has arbitrary JS execution.
const SALT = new Uint8Array([
  0x74, 0x70, 0x6c, 0x61, 0x79, 0x67, 0x72, 0x6f, 0x75, 0x6e, 0x64, 0x5f, 0x73,
  0x61, 0x6c, 0x74,
]);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function deriveKey(): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(window.location.origin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: SALT,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encrypt(plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );

  return JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(ciphertext)),
  });
}

async function decrypt(payload: string): Promise<string> {
  const { iv, data } = JSON.parse(payload) as { iv: number[]; data: number[] };
  const key = await deriveKey();
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data),
  );

  return new TextDecoder().decode(plainBuffer);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encrypt an API key and store it in localStorage.
 * Also removes any legacy plaintext entry.
 */
export async function storeApiKey(apiKey: string): Promise<void> {
  const encrypted = await encrypt(apiKey);
  localStorage.setItem(ENCRYPTED_STORAGE_KEY, encrypted);
  // Clean up legacy plaintext key if it exists
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

/**
 * Retrieve and decrypt the API key from localStorage.
 *
 * Falls back to reading a legacy plaintext `aiApiKey` entry and
 * automatically migrates it to the encrypted format.
 *
 * Returns `null` if no key is stored.
 */
export async function retrieveApiKey(): Promise<string | null> {
  // 1. Try the encrypted entry first
  const encryptedPayload = localStorage.getItem(ENCRYPTED_STORAGE_KEY);
  if (encryptedPayload) {
    try {
      return await decrypt(encryptedPayload);
    } catch {
      // Corrupted — remove and fall through
      localStorage.removeItem(ENCRYPTED_STORAGE_KEY);
    }
  }

  // 2. Fall back to legacy plaintext entry and migrate
  const legacyKey = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacyKey) {
    // Migrate: encrypt and store, then remove plaintext
    await storeApiKey(legacyKey);
    return legacyKey;
  }

  return null;
}

/**
 * Remove all API key entries (encrypted + legacy plaintext).
 */
export function removeApiKey(): void {
  localStorage.removeItem(ENCRYPTED_STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}
