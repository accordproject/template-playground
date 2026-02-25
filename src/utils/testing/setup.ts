import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

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
