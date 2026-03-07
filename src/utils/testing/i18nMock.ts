import { vi } from "vitest";

/**
 * Shared mock for react-i18next's `useTranslation` hook.
 *
 * Usage in test files:
 *   import { reactI18nextMock, mockChangeLanguage } from "../../utils/testing/i18nMock";
 *   vi.mock("react-i18next", () => reactI18nextMock);
 *
 * - `t(key)` returns the key as-is by default.
 * - `i18n.language` reads from localStorage("i18nextLng"), falling back to "en".
 * - `mockChangeLanguage` is a `vi.fn()` you can assert on in tests.
 *
 * To provide a custom translation map, override per-test instead of using this shared mock.
 */

export const mockChangeLanguage = vi.fn();

export const reactI18nextMock = {
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            get language() {
                return localStorage.getItem("i18nextLng") || "en";
            },
            changeLanguage: mockChangeLanguage,
        },
    }),
};
