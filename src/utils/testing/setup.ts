import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Mock Storage for environments (such as Node 22+) where experimental webstorage
// defines incomplete global localStorage/sessionStorage objects in JSDOM.
if (typeof Storage !== 'undefined') {
  const stores = new WeakMap<object, Map<string, string>>();
  const getStore = (instance: object): Map<string, string> => {
    let s = stores.get(instance);
    if (!s) {
      s = new Map<string, string>();
      stores.set(instance, s);
    }
    return s;
  };

  // Ensure standard Storage methods exist on Storage.prototype so prototype spies work
  Storage.prototype.getItem = function (key: string): string | null {
    return getStore(this).get(String(key)) ?? null;
  };

  Storage.prototype.setItem = function (key: string, value: string): void {
    getStore(this).set(String(key), String(value));
  };

  Storage.prototype.removeItem = function (key: string): void {
    getStore(this).delete(String(key));
  };

  Storage.prototype.clear = function (): void {
    getStore(this).clear();
  };

  Storage.prototype.key = function (index: number): string | null {
    return Array.from(getStore(this).keys())[index] ?? null;
  };

  const createStorageInstance = (): Storage => {
    const instance = Object.create(Storage.prototype) as Storage;
    Object.defineProperty(instance, 'length', {
      get(): number {
        return getStore(instance).size;
      },
      configurable: true,
      enumerable: true,
    });
    return instance;
  };

  const localStorageMock = createStorageInstance();
  const sessionStorageMock = createStorageInstance();

  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
      configurable: true,
    });
  }

  if (typeof globalThis !== 'undefined') {
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
      configurable: true,
    });
  }
}

afterEach(() => {
  cleanup();
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
