import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {
      // Mock implementation for tests
    },
    removeListener: () => {
      // Mock implementation for tests
    },
    addEventListener: () => {
      // Mock implementation for tests
    },
    removeEventListener: () => {
      // Mock implementation for tests
    },
    dispatchEvent: () => {
      return false;
    },
  }),
});
