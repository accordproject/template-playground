import { EncryptedKeyData } from '../types/components/AIAssistant.types';

// Constants
const ENCRYPTED_KEY_STORAGE_KEY = 'aiApiKeyEncrypted';
const LEGACY_KEY_STORAGE_KEY = 'aiApiKey';
const RP_NAME = 'Template Playground';
const RP_ID_FALLBACK = 'localhost';
const HKDF_INFO = new TextEncoder().encode('template-playground-api-key-encryption');

// ─── Base64URL Encoding Helpers ─────────────────────────────────────────────

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// ─── WebAuthn PRF Support Detection ─────────────────────────────────────────

/**
 * Checks if the browser supports WebAuthn with the PRF extension.
 * Returns true if both WebAuthn and the PRF extension are available.
 */
export async function isWebAuthnPRFSupported(): Promise<boolean> {
    try {
        if (!window.PublicKeyCredential) {
            return false;
        }

        // Check if the browser supports the PRF extension via
        // PublicKeyCredential.getClientCapabilities (newer API) or feature detection
        const pkc = PublicKeyCredential as unknown as {
            getClientCapabilities?: () => Promise<Record<string, boolean>>;
        };
        if (typeof pkc.getClientCapabilities === 'function') {
            const capabilities = await pkc.getClientCapabilities();
            return capabilities['extension:prf'] === true;
        }

        // Fallback: attempt a basic feature check — if PublicKeyCredential exists
        // and we're in a secure context, PRF *may* be available.
        // We optimistically return true and handle errors at usage time.
        return window.isSecureContext && !!window.PublicKeyCredential;
    } catch {
        return false;
    }
}

// ─── WebAuthn Credential Registration ───────────────────────────────────────

/**
 * Creates a new WebAuthn credential with the PRF extension enabled.
 * Returns the credential ID as a base64url-encoded string.
 */
export async function registerCredential(): Promise<string> {
    const rpId = window.location.hostname || RP_ID_FALLBACK;

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    const createOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
            name: RP_NAME,
            id: rpId,
        },
        user: {
            id: userId,
            name: 'template-playground-user',
            displayName: 'Template Playground User',
        },
        pubKeyCredParams: [
            { alg: -7, type: 'public-key' },   // ES256
            { alg: -257, type: 'public-key' },  // RS256
        ],
        authenticatorSelection: {
            authenticatorAttachment: 'platform',
            residentKey: 'preferred',
            userVerification: 'required',
        },
        extensions: {
            prf: {},
        } as AuthenticationExtensionsClientInputs,
        timeout: 60000,
    };

    const credential = await navigator.credentials.create({
        publicKey: createOptions,
    }) as PublicKeyCredential | null;

    if (!credential) {
        throw new Error('WebAuthn credential creation was cancelled or failed.');
    }

    // Verify PRF is supported by the authenticator
    const prfResult = (credential.getClientExtensionResults() as Record<string, unknown>)?.prf as { enabled?: boolean } | undefined;
    if (!prfResult?.enabled) {
        throw new Error(
            'Your authenticator does not support the PRF extension. ' +
            'API key will be stored in memory only for this session.'
        );
    }

    return arrayBufferToBase64Url(credential.rawId);
}

// ─── Key Derivation via PRF + HKDF ─────────────────────────────────────────

/**
 * Authenticates with the given credential and derives an AES-GCM encryption key
 * using the PRF extension output and HKDF.
 */
export async function deriveEncryptionKey(
    credentialId: string,
    salt: Uint8Array
): Promise<CryptoKey> {
    const rpId = window.location.hostname || RP_ID_FALLBACK;

    // PRF input salt — must be the same value each time to get the same output
    const prfSalt = new TextEncoder().encode('template-playground-prf-v1');

    const getOptions: PublicKeyCredentialRequestOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId,
        allowCredentials: [
            {
                id: base64UrlToArrayBuffer(credentialId),
                type: 'public-key',
            },
        ],
        userVerification: 'required',
        extensions: {
            prf: {
                eval: {
                    first: prfSalt,
                },
            },
        } as AuthenticationExtensionsClientInputs,
        timeout: 60000,
    };

    const assertion = await navigator.credentials.get({
        publicKey: getOptions,
    }) as PublicKeyCredential | null;

    if (!assertion) {
        throw new Error('WebAuthn authentication was cancelled or failed.');
    }

    // Extract the PRF output
    const extensionResults = assertion.getClientExtensionResults() as Record<string, unknown>;
    const prfResults = (extensionResults?.prf as { results?: { first?: ArrayBuffer } } | undefined)?.results;
    if (!prfResults?.first) {
        throw new Error('PRF extension did not return results. Authentication failed.');
    }

    const ikm = prfResults.first as ArrayBuffer;

    // Import the PRF output as raw key material for HKDF
    const hkdfKey = await crypto.subtle.importKey(
        'raw',
        ikm,
        'HKDF',
        false,
        ['deriveKey']
    );

    // Derive an AES-GCM key using HKDF
    const aesKey = await crypto.subtle.deriveKey(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: salt.buffer as ArrayBuffer,
            info: HKDF_INFO,
        },
        hkdfKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );

    return aesKey;
}

// ─── AES-GCM Encryption / Decryption ───────────────────────────────────────

/**
 * Encrypts an API key using AES-GCM.
 * Returns the ciphertext and IV as base64url-encoded strings.
 */
export async function encryptApiKey(
    apiKey: string,
    encryptionKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(apiKey);

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
        encryptionKey,
        encoded
    );

    return {
        ciphertext: arrayBufferToBase64Url(ciphertext),
        iv: arrayBufferToBase64Url(iv.buffer as ArrayBuffer),
    };
}

/**
 * Decrypts an API key using AES-GCM.
 */
export async function decryptApiKey(
    ciphertext: string,
    iv: string,
    encryptionKey: CryptoKey
): Promise<string> {
    const ciphertextBuffer = base64UrlToArrayBuffer(ciphertext);
    const ivBuffer = base64UrlToArrayBuffer(iv);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuffer },
        encryptionKey,
        ciphertextBuffer
    );

    return new TextDecoder().decode(decrypted);
}

// ─── Storage Helpers ────────────────────────────────────────────────────────

/**
 * Saves encrypted key data to localStorage.
 */
export function saveEncryptedKey(data: EncryptedKeyData): void {
    localStorage.setItem(ENCRYPTED_KEY_STORAGE_KEY, JSON.stringify(data));
    // Remove any legacy plaintext key
    localStorage.removeItem(LEGACY_KEY_STORAGE_KEY);
}

/**
 * Loads encrypted key data from localStorage.
 */
export function loadEncryptedKey(): EncryptedKeyData | null {
    const raw = localStorage.getItem(ENCRYPTED_KEY_STORAGE_KEY);
    if (!raw) return null;

    try {
        const data = JSON.parse(raw) as EncryptedKeyData;
        if (data.credentialId && data.ciphertext && data.iv && data.salt) {
            return data;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Checks if a legacy plaintext API key exists in localStorage.
 */
export function getLegacyPlaintextKey(): string | null {
    return localStorage.getItem(LEGACY_KEY_STORAGE_KEY);
}

/**
 * Clears all stored key data (both encrypted and legacy plaintext).
 */
export function clearStoredKey(): void {
    localStorage.removeItem(ENCRYPTED_KEY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY_STORAGE_KEY);
}

// ─── High-Level API ─────────────────────────────────────────────────────────

/**
 * Encrypts and stores an API key using WebAuthn PRF.
 * If a credential already exists, re-uses it. Otherwise, registers a new one.
 * Returns true if the key was successfully encrypted and stored.
 */
export async function encryptAndStoreApiKey(apiKey: string): Promise<boolean> {
    try {
        const existing = loadEncryptedKey();
        let credentialId: string;

        if (existing?.credentialId) {
            credentialId = existing.credentialId;
        } else {
            credentialId = await registerCredential();
        }

        const salt = crypto.getRandomValues(new Uint8Array(16));
        const encryptionKey = await deriveEncryptionKey(credentialId, salt);
        const { ciphertext, iv } = await encryptApiKey(apiKey, encryptionKey);

        saveEncryptedKey({
            credentialId,
            ciphertext,
            iv,
            salt: arrayBufferToBase64Url(salt.buffer as ArrayBuffer),
        });

        return true;
    } catch (error) {
        console.warn('Failed to encrypt API key with WebAuthn:', error);
        return false;
    }
}

/**
 * Attempts to load and decrypt the stored API key.
 * 
 * Returns:
 * - { apiKey, protectionLevel: 'webauthn' } if decrypted from WebAuthn
 * - { apiKey, protectionLevel: 'legacy-plaintext' } if found as plaintext (migration needed)
 * - null if no key is stored
 */
export async function loadAndDecryptApiKey(): Promise<{
    apiKey: string;
    protectionLevel: 'webauthn' | 'legacy-plaintext';
} | null> {
    // 1. Try encrypted storage first
    const encrypted = loadEncryptedKey();
    if (encrypted) {
        try {
            const salt = new Uint8Array(base64UrlToArrayBuffer(encrypted.salt));
            const encryptionKey = await deriveEncryptionKey(encrypted.credentialId, salt);
            const apiKey = await decryptApiKey(encrypted.ciphertext, encrypted.iv, encryptionKey);
            return { apiKey, protectionLevel: 'webauthn' };
        } catch (error) {
            console.warn('Failed to decrypt stored API key:', error);
            // Don't fall through to legacy — encrypted data exists but decryption failed
            // This likely means the user cancelled the WebAuthn prompt
            return null;
        }
    }

    // 2. Check for legacy plaintext key (migration path)
    const legacyKey = getLegacyPlaintextKey();
    if (legacyKey) {
        return { apiKey: legacyKey, protectionLevel: 'legacy-plaintext' };
    }

    return null;
}

// Re-export for testing
export { ENCRYPTED_KEY_STORAGE_KEY, LEGACY_KEY_STORAGE_KEY };
