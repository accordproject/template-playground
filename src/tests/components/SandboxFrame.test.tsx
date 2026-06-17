import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import useAppStore from '../../store/store';
import SandboxFrame from '../../components/SandboxFrame';

describe('SandboxFrame', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      sandboxIframe: null,
      isSandboxReady: false,
    });
  });

  it('should render a hidden iframe with correct sandbox attributes', () => {
    const { container } = render(<SandboxFrame />);
    const iframe = container.querySelector('iframe');

    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts');
    expect(iframe).toHaveAttribute('src', '/logic-handler.html');
    expect(iframe).toHaveAttribute('title', 'Logic Sandbox');
    expect(iframe).toHaveClass('sandbox-frame-hidden');
  });

  it('should handle sandbox-ready message from iframe', () => {
    render(<SandboxFrame />);

    // Simulate the sandbox-ready message from a null-origin iframe
    const readyEvent = new MessageEvent('message', {
      data: { type: 'sandbox-ready' },
      origin: 'null',
    });
    window.dispatchEvent(readyEvent);

    expect(useAppStore.getState().isSandboxReady).toBe(true);
  });

  it('should ignore messages from non-null origins', () => {
    render(<SandboxFrame />);

    const maliciousEvent = new MessageEvent('message', {
      data: { type: 'sandbox-ready' },
      origin: 'https://malicious.com',
    });
    window.dispatchEvent(maliciousEvent);

    expect(useAppStore.getState().isSandboxReady).toBe(false);
  });

  it('should ignore messages with unrecognized types', () => {
    render(<SandboxFrame />);

    const unknownEvent = new MessageEvent('message', {
      data: { type: 'unknown-type' },
      origin: 'null',
    });
    window.dispatchEvent(unknownEvent);

    expect(useAppStore.getState().isSandboxReady).toBe(false);
  });

  it('should route execution-result messages to resolvers', () => {
    render(<SandboxFrame />);

    // Set up a mock resolver
    const mockResolver = vi.fn();
    window.__sandboxResolvers = new Map();
    window.__sandboxResolvers.set(42, mockResolver);

    const resultEvent = new MessageEvent('message', {
      data: {
        type: 'execution-result',
        executionId: 42,
        success: true,
        result: { count: 5 },
      },
      origin: 'null',
    });
    window.dispatchEvent(resultEvent);

    expect(mockResolver).toHaveBeenCalledWith({
      type: 'execution-result',
      executionId: 42,
      success: true,
      result: { count: 5 },
    });
    // Resolver should be cleaned up after use
    expect(window.__sandboxResolvers.has(42)).toBe(false);
  });
});
