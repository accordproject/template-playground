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

function createStorageMock() {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
}

const localStorageMock = createStorageMock();
const sessionStorageMock = createStorageMock();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('secureKeyStorage', () => {
    beforeEach(() => {
        localStorageMock.clear();
        sessionStorageMock.clear();
        vi.clearAllMocks();
    });

    describe('saveEncryptedKey', () => {
        it('should save encrypted data to sessionStorage and remove persistent key data', () => {
            localStorageMock.setItem(LEGACY_KEY_STORAGE_KEY, 'plaintext-key');
            localStorageMock.setItem(ENCRYPTED_KEY_STORAGE_KEY, 'old-encrypted-data');

            const data: EncryptedKeyData = {
                credentialId: 'test-cred-id',
                ciphertext: 'encrypted-data',
                iv: 'test-iv',
                salt: 'test-salt',
            };

            saveEncryptedKey(data);

            expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
                ENCRYPTED_KEY_STORAGE_KEY,
                JSON.stringify(data)
            );
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(ENCRYPTED_KEY_STORAGE_KEY);
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
            expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
                ENCRYPTED_KEY_STORAGE_KEY,
                JSON.stringify(data)
            );
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(ENCRYPTED_KEY_STORAGE_KEY);
        });

        it('should prefer sessionStorage when both storage locations contain encrypted data', () => {
            const sessionData: EncryptedKeyData = {
                credentialId: 'session-cred-id',
                ciphertext: 'session-encrypted-data',
                iv: 'session-iv',
                salt: 'session-salt',
            };
            const persistentData: EncryptedKeyData = {
                credentialId: 'persistent-cred-id',
                ciphertext: 'persistent-encrypted-data',
                iv: 'persistent-iv',
                salt: 'persistent-salt',
            };
            sessionStorageMock.setItem(ENCRYPTED_KEY_STORAGE_KEY, JSON.stringify(sessionData));
            localStorageMock.setItem(ENCRYPTED_KEY_STORAGE_KEY, JSON.stringify(persistentData));

            const result = loadEncryptedKey();
            expect(result).toEqual(sessionData);
            expect(localStorageMock.removeItem).not.toHaveBeenCalledWith(ENCRYPTED_KEY_STORAGE_KEY);
        });

        it('should return null for invalid JSON', () => {
            sessionStorageMock.setItem(ENCRYPTED_KEY_STORAGE_KEY, 'not-json');
            expect(loadEncryptedKey()).toBeNull();
        });

        it('should return null for incomplete data (missing fields)', () => {
            sessionStorageMock.setItem(ENCRYPTED_KEY_STORAGE_KEY, JSON.stringify({
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
            sessionStorageMock.setItem(ENCRYPTED_KEY_STORAGE_KEY, 'session-encrypted');
            localStorageMock.setItem(ENCRYPTED_KEY_STORAGE_KEY, 'persistent-encrypted');
            localStorageMock.setItem(LEGACY_KEY_STORAGE_KEY, 'plaintext');

            clearStoredKey();

            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(ENCRYPTED_KEY_STORAGE_KEY);
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(ENCRYPTED_KEY_STORAGE_KEY);
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(LEGACY_KEY_STORAGE_KEY);
        });
    });
});
