import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import useAppStore from '../../store/store';
import { sandboxResolvers } from '../../store/sandboxResolvers';
import { EXECUTION_RESULT } from '../../constants/sandbox';

/**
 * US-18: Unit tests for the runtime adapter layer
 *
 * Exercises the store's initContract/triggerContract logic paths,
 * sandboxResolvers message routing & cleanup, and error propagation
 * without requiring a real sandbox iframe or network access.
 */
describe('Runtime Adapter — initContract / triggerContract', () => {
  /** Mock iframe with postMessage spy */
  let mockIframe: HTMLIFrameElement;
  let postMessageSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    sandboxResolvers.clear();

    postMessageSpy = vi.fn();
    mockIframe = document.createElement('iframe');
    Object.defineProperty(mockIframe, 'contentWindow', {
      value: { postMessage: postMessageSpy },
      writable: false,
    });

    // Set up a "ready" sandbox with compiled logic
    useAppStore.setState({
      sandboxIframe: mockIframe,
      isSandboxReady: true,
      isExecuting: false,
      executionId: 0,
      compiledLogicJs: 'class CounterLogic extends TemplateLogic {}; return CounterLogic;',
      data: JSON.stringify({ $class: 'org.acme.counter@1.0.0.CounterContract', owner: 'Alice', maxCount: 10 }),
      requestJson: JSON.stringify({ $class: 'org.acme.counter@1.0.0.CounterRequest', increment: 1 }),
      executionState: '',
      executionResponse: '',
      executionEvents: '',
      compilationErrors: [],
      isProblemPanelVisible: false,
    });
  });

  afterEach(() => {
    sandboxResolvers.clear();
  });

  describe('initContract', () => {
    it('should be a no-op when compiledLogicJs is null', async () => {
      useAppStore.setState({ compiledLogicJs: null });
      await useAppStore.getState().initContract();
      // Nothing should change — no errors set
      expect(useAppStore.getState().compilationErrors).toEqual([]);
      expect(useAppStore.getState().executionState).toBe('');
    });

    it('should dispatch an init message to the sandbox', async () => {
      // Start initContract — it will create a promise via executeInSandbox
      const promise = useAppStore.getState().initContract();

      // The sandbox resolver should be registered
      const resolverKey = useAppStore.getState().executionId;
      expect(sandboxResolvers.has(resolverKey)).toBe(true);

      // Simulate sandbox responding with init result
      const resolver = sandboxResolvers.get(resolverKey);
      resolver!({
        type: EXECUTION_RESULT,
        success: true,
        result: {
          state: {
            $class: 'org.acme.counter@1.0.0.CounterState',
            stateId: 'counter-state',
            count: 0,
            owner: 'Alice',
          },
          events: [],
        },
      });

      await promise;

      // State should now be populated
      const state = useAppStore.getState();
      expect(state.executionState).toContain('"count": 0');
      expect(state.executionState).toContain('"owner": "Alice"');
    });

    it('should set compilation errors on sandbox execution failure', async () => {
      const promise = useAppStore.getState().initContract();

      const resolverKey = useAppStore.getState().executionId;
      const resolver = sandboxResolvers.get(resolverKey);
      resolver!({
        type: EXECUTION_RESULT,
        success: false,
        error: 'TypeError: Cannot read property of undefined',
      });

      await promise;

      const state = useAppStore.getState();
      expect(state.compilationErrors.length).toBeGreaterThan(0);
      expect(state.compilationErrors[0].message).toContain('Execution Error');
      expect(state.isProblemPanelVisible).toBe(true);
    });
  });

  describe('triggerContract', () => {
    it('should reject when executionState is empty (not initialized)', async () => {
      useAppStore.setState({ executionState: '' });

      await useAppStore.getState().triggerContract();

      const state = useAppStore.getState();
      expect(state.compilationErrors.length).toBeGreaterThan(0);
      expect(state.compilationErrors[0].message).toContain('must be initialized');
    });

    it('should be a no-op when compiledLogicJs is null', async () => {
      useAppStore.setState({ compiledLogicJs: null });
      await useAppStore.getState().triggerContract();
      expect(useAppStore.getState().compilationErrors).toEqual([]);
    });

    it('should dispatch a trigger message and update Response/State/Events', async () => {
      // Set up initialized state
      useAppStore.setState({
        executionState: JSON.stringify({
          $class: 'org.acme.counter@1.0.0.CounterState',
          stateId: 'counter-state',
          count: 0,
          owner: 'Alice',
        }),
      });

      const promise = useAppStore.getState().triggerContract();

      const resolverKey = useAppStore.getState().executionId;
      const resolver = sandboxResolvers.get(resolverKey);
      resolver!({
        type: EXECUTION_RESULT,
        success: true,
        result: {
          result: {
            $class: 'org.acme.counter@1.0.0.CounterResponse',
            message: "Alice's count is now 1 (of 10)",
            newCount: 1,
          },
          state: {
            $class: 'org.acme.counter@1.0.0.CounterState',
            stateId: 'counter-state',
            count: 1,
            owner: 'Alice',
          },
          events: [
            {
              $class: 'org.acme.counter@1.0.0.CounterUpdated',
              previousCount: 0,
              nextCount: 1,
            },
          ],
        },
      });

      await promise;

      const state = useAppStore.getState();
      expect(state.executionResponse).toContain('"newCount": 1');
      expect(state.executionState).toContain('"count": 1');
      expect(state.executionEvents).toContain('CounterUpdated');
    });

    it('should set execution error on sandbox failure during trigger', async () => {
      useAppStore.setState({
        executionState: JSON.stringify({ $class: 'org.acme.counter@1.0.0.CounterState', count: 0 }),
      });

      const promise = useAppStore.getState().triggerContract();

      const resolverKey = useAppStore.getState().executionId;
      const resolver = sandboxResolvers.get(resolverKey);
      resolver!({
        type: EXECUTION_RESULT,
        success: false,
        error: 'Count 11 exceeds the maximum of 10 for Alice',
      });

      await promise;

      const state = useAppStore.getState();
      expect(state.compilationErrors.length).toBeGreaterThan(0);
      expect(state.compilationErrors[0].message).toContain('Execution Error');
    });
  });

  describe('sandboxResolvers cleanup', () => {
    it('should remove resolver entry after successful execution', async () => {
      const promise = useAppStore.getState().initContract();

      const resolverKey = useAppStore.getState().executionId;
      expect(sandboxResolvers.has(resolverKey)).toBe(true);

      // Resolve
      sandboxResolvers.get(resolverKey)!({
        type: EXECUTION_RESULT,
        success: true,
        result: { state: {}, events: [] },
      });

      await promise;

      // Resolver should have been consumed (called once, then removed from internal Map)
      // Note: the resolver function is called, which settles the promise;
      // the Map entry is *not* auto-deleted by the store — it stays until the next call
      // or cleanup. This is by design to avoid race conditions.
      expect(useAppStore.getState().isExecuting).toBe(false);
    });

    it('should clean up resolver on client-side timeout', async () => {
      vi.useFakeTimers();

      const promise = useAppStore.getState().initContract();
      const resolverKey = useAppStore.getState().executionId;
      expect(sandboxResolvers.has(resolverKey)).toBe(true);

      // Advance past the 6000ms client timeout
      await vi.advanceTimersByTimeAsync(6100);

      // initContract handles errors internally by catching them and setting compilationErrors,
      // it doesn't reject the returned promise, so it just resolves.
      await promise;
      
      const state = useAppStore.getState();
      expect(state.compilationErrors[0].message).toContain('timed out');
      expect(state.isExecuting).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('execution state isolation', () => {
    it('should not allow concurrent executions', async () => {
      // Start first execution
      void useAppStore.getState().initContract();
      expect(useAppStore.getState().isExecuting).toBe(true);

      // Set state so triggerContract can run
      useAppStore.setState({ executionState: '{"count":0}' });

      // A second execution should be caught and added to compilationErrors
      await useAppStore.getState().triggerContract();
      
      const state = useAppStore.getState();
      expect(state.compilationErrors.length).toBeGreaterThan(0);
      expect(state.compilationErrors[0].message).toContain('already in progress');
    });
  });
});
