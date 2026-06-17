import { describe, it, expect, beforeEach } from 'vitest';
import useAppStore from '../../store/store';

describe('useAppStore - Sandbox State', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      sandboxIframe: null,
      isSandboxReady: false,
      isExecuting: false,
      executionId: 0,
    });
  });

  describe('setSandboxRef', () => {
    it('should store the iframe reference', () => {
      const mockIframe = document.createElement('iframe');
      useAppStore.getState().setSandboxRef(mockIframe);
      expect(useAppStore.getState().sandboxIframe).toBe(mockIframe);
    });

    it('should accept null to clear the reference', () => {
      const mockIframe = document.createElement('iframe');
      useAppStore.getState().setSandboxRef(mockIframe);
      useAppStore.getState().setSandboxRef(null);
      expect(useAppStore.getState().sandboxIframe).toBeNull();
    });
  });

  describe('setSandboxReady', () => {
    it('should update the readiness flag', () => {
      expect(useAppStore.getState().isSandboxReady).toBe(false);
      useAppStore.getState().setSandboxReady(true);
      expect(useAppStore.getState().isSandboxReady).toBe(true);
    });
  });

  describe('executeInSandbox', () => {
    it('should reject when sandbox is not ready', async () => {
      await expect(
        useAppStore.getState().executeInSandbox('code', 'trigger', [])
      ).rejects.toThrow('Sandbox is not ready');
    });

    it('should reject when iframe ref is null', async () => {
      useAppStore.setState({ isSandboxReady: true, sandboxIframe: null });
      await expect(
        useAppStore.getState().executeInSandbox('code', 'trigger', [])
      ).rejects.toThrow('Sandbox is not ready');
    });

    it('should increment executionId and set isExecuting on dispatch', () => {
      // Create a mock iframe with a contentWindow that has postMessage
      const mockIframe = document.createElement('iframe');
      Object.defineProperty(mockIframe, 'contentWindow', {
        value: { postMessage: () => {} },
        writable: false,
      });

      useAppStore.setState({
        sandboxIframe: mockIframe,
        isSandboxReady: true,
        executionId: 0,
      });

      // Fire and forget — we just want to verify state transitions
      void useAppStore.getState().executeInSandbox('code', 'trigger', []);

      const state = useAppStore.getState();
      expect(state.executionId).toBe(1);
      expect(state.isExecuting).toBe(true);
    });
  });
});
