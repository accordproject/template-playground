import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = (elt: Element, pseudoElt?: string | null) => {
  if (pseudoElt) {
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
    addListener: () => { /* mock */ },
    removeListener: () => { /* mock */ },
    addEventListener: () => { /* mock */ },
    removeEventListener: () => { /* mock */ },
    dispatchEvent: () => { return false; },
  }),
});

interface MockCanvasContext {
  fillStyle: string;
  fillRect: () => void;
  clearRect: () => void;
  getImageData: () => { data: number[] };
  putImageData: () => void;
  createImageData: () => { data: number[] };
  setTransform: () => void;
  drawImage: () => void;
  save: () => void;
  restore: () => void;
  beginPath: () => void;
  moveTo: () => void;
  lineTo: () => void;
  closePath: () => void;
  stroke: () => void;
  fill: () => void;
  translate: () => void;
  scale: () => void;
  rotate: () => void;
  arc: () => void;
  measureText: () => { width: number };
  transform: () => void;
  rect: () => void;
  clip: () => void;
  canvas: HTMLCanvasElement;
}

// capture original method so we can delegate for non-2d calls
const originalGetContext = HTMLCanvasElement.prototype.getContext as (
  this: HTMLCanvasElement,
  contextId: string,
  options?: unknown
) => RenderingContext | null;

HTMLCanvasElement.prototype.getContext = function (
  this: HTMLCanvasElement,
  contextId: string,
  options?: unknown
) {
  if (contextId === '2d') {
    const mockContext: MockCanvasContext = {
      fillStyle: '',
      fillRect: () => { /* mock */ },
      clearRect: () => { /* mock */ },
      getImageData: () => ({ data: [] }),
      putImageData: () => { /* mock */ },
      createImageData: () => ({ data: [] }),
      setTransform: () => { /* mock */ },
      drawImage: () => { /* mock */ },
      save: () => { /* mock */ },
      restore: () => { /* mock */ },
      beginPath: () => { /* mock */ },
      moveTo: () => { /* mock */ },
      lineTo: () => { /* mock */ },
      closePath: () => { /* mock */ },
      stroke: () => { /* mock */ },
      fill: () => { /* mock */ },
      translate: () => { /* mock */ },
      scale: () => { /* mock */ },
      rotate: () => { /* mock */ },
      arc: () => { /* mock */ },
      measureText: () => ({ width: 0 }),
      transform: () => { /* mock */ },
      rect: () => { /* mock */ },
      clip: () => { /* mock */ },
      canvas: this,
    };
    // cast through unknown since the mock only implements a subset of methods
    return mockContext as unknown as CanvasRenderingContext2D;
  }

  // for other context types, delegate to original
// for other context types, delegate to original
  return originalGetContext.call(this, contextId, options);
} as unknown as typeof HTMLCanvasElement.prototype.getContext;