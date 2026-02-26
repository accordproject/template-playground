import { describe, it, expect, beforeEach, vi } from 'vitest';

// jsdom doesn't have crypto.subtle — we need to mock it.
// We create a simple encrypt/decrypt mock that mirrors the real API shape.
const mockEncrypt = vi.fn(async (_algo: unknown, _key: unknown, data: BufferSource) => {
  // "Encrypt" by prepending a marker byte (0xFF) — enough to test the flow
  const input = new Uint8Array(data as ArrayBuffer);
  const output = new Uint8Array(input.length + 1);
  output[0] = 0xff; // marker
  output.set(input, 1);
  return output.buffer;
});

const mockDecrypt = vi.fn(async (_algo: unknown, _key: unknown, data: BufferSource) => {
  const input = new Uint8Array(data as ArrayBuffer);
  // Strip the marker byte
  return input.slice(1).buffer;
});

const mockDeriveKey = vi.fn(async () => ({ type: 'secret' }));
const mockImportKey = vi.fn(async () => ({ type: 'raw' }));

// Install the mock BEFORE importing keyVault
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: {
      encrypt: mockEncrypt,
      decrypt: mockDecrypt,
      deriveKey: mockDeriveKey,
      importKey: mockImportKey,
    },
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = i;
      return arr;
    },
  },
  writable: true,
});

// Now import the module under test
import { storeApiKey, retrieveApiKey, removeApiKey } from '../../../utils/keyVault';

describe('keyVault', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('storeApiKey encrypts and stores under aiApiKey_enc', async () => {
    await storeApiKey('sk-test-key-123');

    expect(localStorage.getItem('aiApiKey_enc')).not.toBeNull();
    expect(localStorage.getItem('aiApiKey')).toBeNull(); // legacy key removed
    // The stored value should be JSON with iv and data
    const stored = JSON.parse(localStorage.getItem('aiApiKey_enc')!);
    expect(stored).toHaveProperty('iv');
    expect(stored).toHaveProperty('data');
  });

  it('retrieveApiKey decrypts the stored key', async () => {
    await storeApiKey('sk-test-key-123');
    const result = await retrieveApiKey();
    expect(result).toBe('sk-test-key-123');
  });

  it('retrieveApiKey returns null when nothing is stored', async () => {
    const result = await retrieveApiKey();
    expect(result).toBeNull();
  });

  it('retrieveApiKey migrates a legacy plaintext key', async () => {
    // Simulate a legacy plaintext key
    localStorage.setItem('aiApiKey', 'sk-legacy-key');

    const result = await retrieveApiKey();

    // Should return the legacy key
    expect(result).toBe('sk-legacy-key');
    // Should have migrated to encrypted
    expect(localStorage.getItem('aiApiKey_enc')).not.toBeNull();
    // Legacy plaintext should be removed
    expect(localStorage.getItem('aiApiKey')).toBeNull();
  });

  it('removeApiKey clears both encrypted and legacy keys', async () => {
    await storeApiKey('sk-test-key-123');
    localStorage.setItem('aiApiKey', 'sk-legacy'); // also set legacy

    removeApiKey();

    expect(localStorage.getItem('aiApiKey_enc')).toBeNull();
    expect(localStorage.getItem('aiApiKey')).toBeNull();
  });

  it('storeApiKey then retrieveApiKey roundtrip works for various key formats', async () => {
    const testKeys = [
      'sk-proj-abc123XYZ',
      'key-with-special/chars=+',
      '', // empty string edge case
      'a'.repeat(1000), // long key
    ];

    for (const key of testKeys) {
      await storeApiKey(key);
      const result = await retrieveApiKey();
      expect(result).toBe(key);
    }
  });
});
