import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    saveEncryptedKey,
    loadEncryptedKey,
    getLegacyPlaintextKey,
    clearStoredKey,
    ENCRYPTED_KEY_STORAGE_KEY,
    LEGACY_KEY_STORAGE_KEY,
} from '../../utils/secureKeyStorage';
import { EncryptedKeyData } from '../../types/components/AIAssistant.types';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('secureKeyStorage', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    describe('saveEncryptedKey', () => {
        it('should save encrypted data to localStorage and remove legacy key', () => {
            // Pre-set a legacy key
            localStorageMock.setItem(LEGACY_KEY_STORAGE_KEY, 'plaintext-key');

            const data: EncryptedKeyData = {
                credentialId: 'test-cred-id',
                ciphertext: 'encrypted-data',
                iv: 'test-iv',
                salt: 'test-salt',
            };

            saveEncryptedKey(data);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                ENCRYPTED_KEY_STORAGE_KEY,
                JSON.stringify(data)
            );
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(LEGACY_KEY_STORAGE_KEY);
        });
    });

    describe('loadEncryptedKey', () => {
        it('should return null when no encrypted data exists', () => {
            expect(loadEncryptedKey()).toBeNull();
        });

        it('should return parsed encrypted data when valid data exists', () => {
            const data: EncryptedKeyData = {
                credentialId: 'test-cred-id',
                ciphertext: 'encrypted-data',
                iv: 'test-iv',
                salt: 'test-salt',
            };
            localStorageMock.setItem(ENCRYPTED_KEY_STORAGE_KEY, JSON.stringify(data));

            const result = loadEncryptedKey();
            expect(result).toEqual(data);
        });

        it('should return null for invalid JSON', () => {
            localStorageMock.setItem(ENCRYPTED_KEY_STORAGE_KEY, 'not-json');
            expect(loadEncryptedKey()).toBeNull();
        });

        it('should return null for incomplete data (missing fields)', () => {
            localStorageMock.setItem(ENCRYPTED_KEY_STORAGE_KEY, JSON.stringify({
                credentialId: 'test-cred-id',
                // missing ciphertext, iv, salt
            }));
            expect(loadEncryptedKey()).toBeNull();
        });
    });

    describe('getLegacyPlaintextKey', () => {
        it('should return null when no legacy key exists', () => {
            expect(getLegacyPlaintextKey()).toBeNull();
        });

        it('should return the plaintext key when it exists', () => {
            localStorageMock.setItem(LEGACY_KEY_STORAGE_KEY, 'my-api-key');
            expect(getLegacyPlaintextKey()).toBe('my-api-key');
        });
    });

    describe('clearStoredKey', () => {
        it('should remove both encrypted and legacy keys', () => {
            localStorageMock.setItem(ENCRYPTED_KEY_STORAGE_KEY, 'encrypted');
            localStorageMock.setItem(LEGACY_KEY_STORAGE_KEY, 'plaintext');

            clearStoredKey();

            expect(localStorageMock.removeItem).toHaveBeenCalledWith(ENCRYPTED_KEY_STORAGE_KEY);
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(LEGACY_KEY_STORAGE_KEY);
        });
    });
});
