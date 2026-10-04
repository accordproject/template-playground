import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// ---------------------------------------------------------------------------
// localStorage / sessionStorage polyfill
// Node.js ≥ 22 exposes an experimental `localStorage` that is `undefined`
// unless --localstorage-file is supplied. jsdom provides its own, but the
// module-level store initialisation in store.ts runs before jsdom attaches
// its storage to `window`. We therefore install a simple in-memory shim as
// early as possible — before any other import can pull in store.ts.
// ---------------------------------------------------------------------------
const makeStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  } as Storage;
};

const defineStorageProp = (prop: 'localStorage' | 'sessionStorage') => {
  const storage = makeStorage();
  try {
    Object.defineProperty(globalThis, prop, { value: storage, writable: true });
  } catch {
    // Already defined and non-configurable — overwrite the value directly.
    (globalThis as Record<string, unknown>)[prop] = storage;
  }
};

defineStorageProp('localStorage');
defineStorageProp('sessionStorage');

afterEach(() => {
  cleanup();
  // Reset storage between tests so state doesn't bleed across test cases
  localStorage.clear();
  sessionStorage.clear();
});

// Mock monaco-editor for tests
vi.mock("monaco-editor", () => ({
  editor: {
    create: vi.fn(),
    defineTheme: vi.fn(),
  },
  Range: vi.fn(),
  languages: {
    register: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
  },
}));

// Mock getComputedStyle for Ant Design components that use scroll locking
// jsdom doesn't fully support getComputedStyle with pseudo-elements
// rc-util's getScrollBarSize calls .match() on style properties
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = (elt: Element, pseudoElt?: string | null) => {
  if (pseudoElt) {
    // Return a mock CSSStyleDeclaration with string properties for .match() calls
    return {
      width: '0px',
      height: '0px',
      getPropertyValue: () => '',
    } as unknown as CSSStyleDeclaration;
  }
  return originalGetComputedStyle(elt);
};

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

// Mock HTMLCanvasElement.getContext for lottie-web library
// jsdom doesn't implement canvas 2D context
// @ts-expect-error: Mock implementation has simplified types
HTMLCanvasElement.prototype.getContext = ((originalGetContext) => {
  return function (
    this: HTMLCanvasElement,
    contextId: string,
    options?: unknown
  ) {
    if (contextId === '2d') {
      return {
        fillStyle: '',
        fillRect: () => {},
        clearRect: () => {},
        getImageData: () => ({ data: [] }),
        putImageData: () => {},
        createImageData: () => ({ data: [] }),
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        fill: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        arc: () => {},
        measureText: () => ({ width: 0 }),
        transform: () => {},
        rect: () => {},
        clip: () => {},
        canvas: this,
      } as unknown as CanvasRenderingContext2D;
    }
    return originalGetContext.call(this, contextId as any, options);
  };
})(HTMLCanvasElement.prototype.getContext);
