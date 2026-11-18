import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import useAppStore from '../../store/store';
import { ExecutionEngine, LLMMode } from '../../ai-assistant/llmProviders';
import type { TriggerResponse } from '../../ai-assistant/llmProviders';

/**
 * Engine selection for init/trigger, mirroring the branch the
 * template-engine's TemplateArchiveProcessor takes: the template's compiled
 * logic runs unless the LLM is forced, and the LLM only steps in when it is
 * forced or there is nothing compiled to run.
 */
describe('useAppStore - execution engine selection', () => {
  const sandboxOutput = { result: { r: 1 }, state: { s: 1 }, events: [] };
  const llmOutput = { result: { r: 2 }, state: { s: 2 }, events: [] };

  let executeInSandbox: Mock<unknown[], Promise<unknown>>;
  let executeWithLLM: Mock<unknown[], Promise<TriggerResponse>>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    executeInSandbox = vi.fn<unknown[], Promise<unknown>>().mockResolvedValue(sandboxOutput);
    executeWithLLM = vi.fn<unknown[], Promise<TriggerResponse>>().mockResolvedValue(llmOutput);

    useAppStore.setState({
      data: '{"$class":"org.acme.Contract"}',
      requestJson: '{"$class":"org.acme.Request"}',
      executionState: '{"$class":"org.acme.State"}',
      executionResponse: '',
      executionEvents: '',
      compilationErrors: [],
      isProblemPanelVisible: false,
      isTemplateStateful: true,
      // Trigger is gated on init having run, so the shared fixture stands in
      // for a contract that has already been initialized.
      isContractInitialized: true,
      executingOperation: null,
      compiledLogicJs: 'return class {};',
      llmExecutionMode: LLMMode.Disabled,
      lastExecutionEngine: null,
      executeInSandbox,
      executeWithLLM,
    });
  });

  it('runs the compiled logic in the sandbox when the LLM is disabled', async () => {
    await useAppStore.getState().triggerContract();

    expect(executeInSandbox).toHaveBeenCalledTimes(1);
    expect(executeWithLLM).not.toHaveBeenCalled();
    expect(useAppStore.getState().lastExecutionEngine).toBe(ExecutionEngine.TypeScript);
  });

  it('reports an error when there is no logic and the LLM is disabled', async () => {
    useAppStore.setState({ compiledLogicJs: null });

    await useAppStore.getState().triggerContract();

    expect(executeInSandbox).not.toHaveBeenCalled();
    expect(executeWithLLM).not.toHaveBeenCalled();
    expect(useAppStore.getState().compilationErrors[0].message).toContain(
      'No executable logic found and LLM fallback is disabled',
    );
    expect(useAppStore.getState().isProblemPanelVisible).toBe(true);
  });

  it('falls back to the LLM when there is no compiled logic', async () => {
    useAppStore.setState({ compiledLogicJs: null, llmExecutionMode: LLMMode.Fallback });

    await useAppStore.getState().triggerContract();

    expect(executeInSandbox).not.toHaveBeenCalled();
    expect(executeWithLLM).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().lastExecutionEngine).toBe(ExecutionEngine.LLM);
    expect(useAppStore.getState().executionResponse).toContain('"r": 2');
  });

  it('keeps using the compiled logic in fallback mode when there is some', async () => {
    useAppStore.setState({ llmExecutionMode: LLMMode.Fallback });

    await useAppStore.getState().triggerContract();

    expect(executeInSandbox).toHaveBeenCalledTimes(1);
    expect(executeWithLLM).not.toHaveBeenCalled();
  });

  it('uses the LLM in force mode even when logic is compiled', async () => {
    useAppStore.setState({ llmExecutionMode: LLMMode.Force });

    await useAppStore.getState().initContract();

    expect(executeInSandbox).not.toHaveBeenCalled();
    expect(executeWithLLM).toHaveBeenCalledTimes(1);
    expect(executeWithLLM.mock.calls[0][0]).toBe('init');
    expect(useAppStore.getState().lastExecutionEngine).toBe(ExecutionEngine.LLM);
  });

  it('requires an initialized state before triggering a stateful template', async () => {
    useAppStore.setState({ executionState: '', isContractInitialized: false });

    await useAppStore.getState().triggerContract();

    expect(executeInSandbox).not.toHaveBeenCalled();
    expect(useAppStore.getState().compilationErrors[0].message).toContain(
      'Contract must be initialized before triggering',
    );
  });

  /*
   * A contract may legitimately initialize to an empty state. Gating trigger on
   * the state's contents rather than on init having run would strand it.
   */
  it('triggers once init has run even when it produced no state', async () => {
    useAppStore.setState({ executionState: '', isContractInitialized: true });

    await useAppStore.getState().triggerContract();

    expect(executeInSandbox).toHaveBeenCalledTimes(1);
  });

  it('triggers a stateless template without an initialized state', async () => {
    useAppStore.setState({
      executionState: '',
      isContractInitialized: false,
      isTemplateStateful: false,
    });

    await useAppStore.getState().triggerContract();

    expect(executeInSandbox).toHaveBeenCalledTimes(1);
    // The empty placeholder state stands in for a template that carries none.
    const triggerArgs = executeInSandbox.mock.calls[0][2] as unknown[];
    expect(triggerArgs[2]).toEqual({});
  });

  describe('chain step selection between Classic and Design V2', () => {
    const step0 = {
      label: 'Init',
      request: null,
      priorState: null,
      result: null,
      state: { count: 0 },
      events: [],
      edited: false,
    };
    const step1 = {
      label: 'Trigger 1',
      request: { op: 'inc' },
      priorState: { count: 0 },
      result: { status: 'ok' },
      state: { count: 1 },
      events: [],
      edited: false,
    };

    it('requires the latest step to be selected when in classic mode', async () => {
      useAppStore.setState({
        isDesignV2Enabled: false,
        isTemplateStateful: true,
        executionChain: [step0, step1],
        selectedChainIndex: 0,
        executionState: JSON.stringify(step0.state),
      });

      await useAppStore.getState().triggerContract();

      expect(executeInSandbox).not.toHaveBeenCalled();
      expect(useAppStore.getState().compilationErrors[0].message).toContain(
        'Select the latest step in the chain before sending a new request.',
      );
    });

    it('automatically selects the latest step when triggering in Design V2', async () => {
      useAppStore.setState({
        isDesignV2Enabled: true,
        isTemplateStateful: true,
        executionChain: [step0, step1],
        selectedChainIndex: 0,
        executionState: JSON.stringify(step0.state),
      });

      await useAppStore.getState().triggerContract();

      // Trigger succeeded and targeted step 1's state ({ count: 1 })
      expect(executeInSandbox).toHaveBeenCalledTimes(1);
      const triggerArgs = executeInSandbox.mock.calls[0][2] as unknown[];
      expect(triggerArgs[2]).toEqual({ count: 1 });
      // A successful trigger extends the chain, selecting the newly appended step (index 2)
      expect(useAppStore.getState().selectedChainIndex).toBe(2);
      expect(useAppStore.getState().executionChain).toHaveLength(3);
    });

    it('automatically selects the latest step when triggering via forced LLM in Design V2', async () => {
      useAppStore.setState({
        isDesignV2Enabled: true,
        isTemplateStateful: true,
        llmExecutionMode: LLMMode.Force,
        executionChain: [step0, step1],
        selectedChainIndex: 0,
        executionState: JSON.stringify(step0.state),
      });

      await useAppStore.getState().triggerContract();

      expect(executeWithLLM).toHaveBeenCalledTimes(1);
      const llmArgs = executeWithLLM.mock.calls[0][1] as { priorState: unknown };
      expect(llmArgs.priorState).toEqual({ count: 1 });
      expect(useAppStore.getState().selectedChainIndex).toBe(2);
    });

    it('preserves prior state when trigger response omits replacement state in Design V2', async () => {
      executeInSandbox.mockResolvedValueOnce({ result: { ok: true }, state: undefined, events: [] });

      useAppStore.setState({
        isDesignV2Enabled: true,
        isTemplateStateful: true,
        executionChain: [step0, step1],
        selectedChainIndex: 0,
        executionState: JSON.stringify(step0.state),
      });

      await useAppStore.getState().triggerContract();

      const state = useAppStore.getState();
      expect(executeInSandbox).toHaveBeenCalledTimes(1);
      // executionState falls back to step 1's state
      expect(JSON.parse(state.executionState)).toEqual({ count: 1 });
      // The newly created step in executionChain preserves step 1's state
      const latestStep = state.executionChain[state.executionChain.length - 1];
      expect(latestStep.state).toEqual({ count: 1 });
      // executionHistory stateAfter preserves step 1's state
      const latestRun = state.executionHistory[state.executionHistory.length - 1];
      expect(latestRun.stateAfter).toEqual({ count: 1 });
    });

    it('syncs to the latest chain step when enabling Design V2', () => {
      useAppStore.setState({
        isDesignV2Enabled: false,
        executionChain: [step0, step1],
        selectedChainIndex: 0,
        executionState: JSON.stringify(step0.state),
      });

      useAppStore.getState().setDesignV2Enabled(true);

      const state = useAppStore.getState();
      expect(state.isDesignV2Enabled).toBe(true);
      expect(state.selectedChainIndex).toBe(1);
      expect(JSON.parse(state.executionState)).toEqual({ count: 1 });
    });
  });

  /*
   * Artifacts belong to the engine that produced them, so switching engines
   * starts over rather than presenting the previous engine's run as this one's.
   */
  describe('switching execution mode', () => {
    it('discards the artifacts and the initialized flag', () => {
      useAppStore.setState({
        executionResponse: '{"r":1}',
        executionEvents: '[{"e":1}]',
        lastExecutionEngine: ExecutionEngine.TypeScript,
      });

      useAppStore.getState().setLLMExecutionMode(LLMMode.Force);

      const state = useAppStore.getState();
      expect(state.llmExecutionMode).toBe('force');
      expect(state.executionResponse).toBe('');
      expect(state.executionState).toBe('');
      expect(state.executionEvents).toBe('');
      expect(state.isContractInitialized).toBe(false);
      expect(state.lastExecutionEngine).toBeNull();
    });

    it('re-locks trigger until the new engine has been initialized', async () => {
      useAppStore.getState().setLLMExecutionMode(LLMMode.Force);

      await useAppStore.getState().triggerContract();

      expect(executeInSandbox).not.toHaveBeenCalled();
      expect(executeWithLLM).not.toHaveBeenCalled();
      expect(useAppStore.getState().compilationErrors[0].message).toContain(
        'Contract must be initialized before triggering',
      );
    });

    it('leaves the artifacts alone when the mode does not actually change', () => {
      useAppStore.setState({ executionResponse: '{"r":1}' });

      useAppStore.getState().setLLMExecutionMode(LLMMode.Disabled);

      expect(useAppStore.getState().executionResponse).toBe('{"r":1}');
      expect(useAppStore.getState().isContractInitialized).toBe(true);
    });
  });

  /*
   * Both buttons share `isExecuting` to keep the sandbox single-flight, so the
   * spinner has to key off which action is actually running.
   */
  describe('executingOperation', () => {
    it('names only the running action, and clears when it settles', async () => {
      const seen: (string | null)[] = [];
      executeInSandbox.mockImplementation(() => {
        seen.push(useAppStore.getState().executingOperation);
        return Promise.resolve(sandboxOutput);
      });

      await useAppStore.getState().initContract();
      await useAppStore.getState().triggerContract();

      expect(seen).toEqual(['init', 'trigger']);
      expect(useAppStore.getState().executingOperation).toBeNull();
    });

    it('clears after a failed run', async () => {
      executeInSandbox.mockRejectedValue(new Error('boom'));

      await useAppStore.getState().triggerContract();

      expect(useAppStore.getState().executingOperation).toBeNull();
    });
  });

  /*
   * Init opens a new run of the contract; a response from the previous one is
   * not part of it.
   */
  it('clears a stale response when init runs', async () => {
    useAppStore.setState({ executionResponse: '{"stale":true}' });

    await useAppStore.getState().initContract();

    expect(useAppStore.getState().executionResponse).toBe('');
    expect(useAppStore.getState().isContractInitialized).toBe(true);
  });
});