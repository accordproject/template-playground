import '@testing-library/jest-dom/vitest';
import { beforeAll, afterAll } from 'vitest';

// 1. Polyfill window.matchMedia for Ant Design (antd)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { }, // Deprecated
        removeListener: () => { }, // Deprecated
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    }),
});

// 2. Mock localStorage
const storage: Record<string, string> = {};

const localStorageMock: Storage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
        storage[key] = String(value);
    },
    removeItem: (key: string) => {
        delete storage[key];
    },
    clear: () => {
        for (const key in storage) {
            delete storage[key];
        }
    },
    length: 0,
    key: (index: number) => Object.keys(storage)[index] ?? null,
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
});

// 3. Suppress noisy "act(...)" warnings in test output
const originalError = console.error;
beforeAll(() => {
    console.error = (...args: any[]) => {
        if (typeof args[0] === 'string' && args[0].includes('was not wrapped in act')) {
            return;
        }
        originalError(...args);
    };
});

afterAll(() => {
    console.error = originalError;
});