import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Template } from '@accordproject/cicero-core';
import useAppStore from '../../store/store';
import * as providers from '../../ai-assistant/llmProviders';
import type { InitResponse, TriggerResponse } from '../../ai-assistant/llmProviders';
import type { AIConfig } from '../../types/components/AIAssistant.types';
import { sandboxResolvers } from '../../store/sandboxResolvers';

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const initialState = useAppStore.getState();
const busyMessage = 'An execution is already in progress. Please wait for it to complete.';
const payload = { data: { value: 1 }, request: { increment: 2 }, priorState: { count: 3 } };
const output = { result: { value: 5 }, state: { count: 5 }, events: [] };
const aiConfig: AIConfig = {
  provider: 'openai', model: 'gpt-4o', apiKey: 'test-key',
  includeTemplateMarkContent: false, includeConcertoModelContent: false, includeDataContent: false,
};

describe('executeWithLLM execution lock', () => {
  const template = {} as Template;
  const init = vi.fn<[unknown], Promise<InitResponse>>();
  const trigger = vi.fn<[unknown, unknown, unknown], Promise<TriggerResponse>>();
  const buildTemplate = vi.fn<[], Promise<void>>();

  beforeEach(() => {
    init.mockReset().mockResolvedValue(output);
    trigger.mockReset().mockResolvedValue(output);
    buildTemplate.mockReset().mockImplementation(() => {
      useAppStore.setState({ templateObject: template });
      return Promise.resolve();
    });
    vi.spyOn(providers, 'getLLMExecutor').mockReturnValue({ init, trigger } as unknown as providers.LLMExecutor);
    useAppStore.setState({
      aiConfig,
      llmExecutionMode: providers.LLMMode.Force,
      isExecuting: false,
      templateObject: null,
      buildTemplateFromMemory: buildTemplate,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useAppStore.setState(initialState, true);
  });

  it.each(['init', 'trigger'] as const)(
    'locks immediately and rejects competing calls throughout %s preparation and execution',
    async (operation) => {
      const preparation = deferred<void>();
      const preparing = deferred<void>();
      const execution = deferred<typeof output>();
      const executing = deferred<void>();
      buildTemplate.mockImplementation(async () => {
        preparing.resolve();
        await preparation.promise;
        useAppStore.setState({ templateObject: template });
      });
      const method = operation === 'init' ? init : trigger;
      method.mockImplementation(() => {
        executing.resolve();
        return execution.promise;
      });

      const run = useAppStore.getState().executeWithLLM(operation, payload);
      try {
        expect(useAppStore.getState().isExecuting).toBe(true);
        await preparing.promise;
        expect(useAppStore.getState().isExecuting).toBe(true);
        const competingOperation = operation === 'init' ? 'trigger' : 'init';
        await expect(useAppStore.getState().executeWithLLM(competingOperation, payload))
          .rejects.toThrow(busyMessage);
        expect(useAppStore.getState().isExecuting).toBe(true);
        expect(buildTemplate).toHaveBeenCalledTimes(1);
        expect(providers.getLLMExecutor).not.toHaveBeenCalled();

        preparation.resolve();
        await executing.promise;
        expect(useAppStore.getState().isExecuting).toBe(true);
        await expect(useAppStore.getState().executeWithLLM(competingOperation, payload))
          .rejects.toThrow(busyMessage);
        expect(useAppStore.getState().isExecuting).toBe(true);
        expect(providers.getLLMExecutor).toHaveBeenCalledTimes(1);
        expect(method).toHaveBeenCalledTimes(1);
        if (operation === 'init') {
          expect(init).toHaveBeenCalledWith(payload.data);
          expect(trigger).not.toHaveBeenCalled();
        } else {
          expect(trigger).toHaveBeenCalledWith(payload.data, payload.request, payload.priorState);
          expect(init).not.toHaveBeenCalled();
        }
        execution.resolve(output);
        await expect(run).resolves.toBe(output);
        expect(useAppStore.getState().isExecuting).toBe(false);
      } finally {
        preparation.resolve();
        execution.resolve(output);
        await run;
      }
    },
  );

  it('releases the lock after rejected preparation and allows a retry', async () => {
    const preparation = deferred<void>();
    const preparing = deferred<void>();
    buildTemplate.mockImplementationOnce(() => {
      preparing.resolve();
      return preparation.promise;
    });
    const run = useAppStore.getState().executeWithLLM('init', payload);
    const rejection = expect(run).rejects.toThrow('Preparation failed');
    await preparing.promise;
    const busyDuringPreparation = useAppStore.getState().isExecuting;
    preparation.reject(new Error('Preparation failed'));
    await rejection;
    expect(busyDuringPreparation).toBe(true);
    expect(useAppStore.getState().isExecuting).toBe(false);
    expect(providers.getLLMExecutor).not.toHaveBeenCalled();

    await expect(useAppStore.getState().executeWithLLM('init', payload)).resolves.toBe(output);
    expect(useAppStore.getState().isExecuting).toBe(false);
  });

  it('releases the lock when preparation produces no template', async () => {
    buildTemplate.mockResolvedValueOnce();
    await expect(useAppStore.getState().executeWithLLM('init', payload))
      .rejects.toThrow('Could not build a template from the current model and grammar.');
    expect(useAppStore.getState().isExecuting).toBe(false);
    expect(providers.getLLMExecutor).not.toHaveBeenCalled();
  });

  it('releases the lock if provider loading fails and allows a retry', async () => {
    const failure = new Error('Provider loading failed');
    vi.doMock('../../ai-assistant/llmProviders', () => {
      throw failure;
    });
    try {
      const run = useAppStore.getState().executeWithLLM('init', payload);
      expect(useAppStore.getState().isExecuting).toBe(true);
      await expect(run).rejects.toMatchObject({ cause: failure });
      expect(useAppStore.getState().isExecuting).toBe(false);
      expect(buildTemplate).not.toHaveBeenCalled();
      expect(providers.getLLMExecutor).not.toHaveBeenCalled();
    } finally {
      vi.doUnmock('../../ai-assistant/llmProviders');
    }
    await expect(useAppStore.getState().executeWithLLM('init', payload)).resolves.toBe(output);
    expect(useAppStore.getState().isExecuting).toBe(false);
  });

  it.each([
    [null, 'AI is not configured. Open Settings → AI Configuration to set it up.'],
    [{ ...aiConfig, apiKey: '' },
      'AI execution requires a provider, model and API key. Open Settings → AI Configuration to set them up.'],
  ] as const)('releases the lock after configuration validation fails (%j)', async (config, message) => {
    useAppStore.setState({ aiConfig: config });
    const run = useAppStore.getState().executeWithLLM('init', payload);
    expect(useAppStore.getState().isExecuting).toBe(true);
    await expect(run).rejects.toThrow(message);
    expect(useAppStore.getState().isExecuting).toBe(false);
    expect(buildTemplate).not.toHaveBeenCalled();
    expect(providers.getLLMExecutor).not.toHaveBeenCalled();
    useAppStore.setState({ aiConfig });
    await expect(useAppStore.getState().executeWithLLM('init', payload)).resolves.toBe(output);
    expect(useAppStore.getState().isExecuting).toBe(false);
  });

  it('releases the lock if executor construction throws', async () => {
    vi.mocked(providers.getLLMExecutor).mockImplementationOnce(() => {
      expect(useAppStore.getState().isExecuting).toBe(true);
      throw new Error('Executor construction failed');
    });
    await expect(useAppStore.getState().executeWithLLM('init', payload))
      .rejects.toThrow('Executor construction failed');
    expect(useAppStore.getState().isExecuting).toBe(false);
  });

  it.each(['init', 'trigger'] as const)('releases the lock after %s fails and allows a retry', async (operation) => {
    const execution = deferred<typeof output>();
    const executing = deferred<void>();
    const method = operation === 'init' ? init : trigger;
    method.mockImplementationOnce(() => {
      executing.resolve();
      return execution.promise;
    });
    const run = useAppStore.getState().executeWithLLM(operation, payload);
    const rejection = expect(run).rejects.toThrow('Execution failed');
    await executing.promise;
    const busyDuringExecution = useAppStore.getState().isExecuting;
    execution.reject(new Error('Execution failed'));
    await rejection;
    expect(busyDuringExecution).toBe(true);
    expect(useAppStore.getState().isExecuting).toBe(false);

    await expect(useAppStore.getState().executeWithLLM(operation, payload)).resolves.toBe(output);
    expect(useAppStore.getState().isExecuting).toBe(false);
  });

  it('rejects sandbox execution during LLM preparation without releasing the lock', async () => {
    const preparation = deferred<void>();
    const preparing = deferred<void>();
    buildTemplate.mockImplementationOnce(async () => {
      preparing.resolve();
      await preparation.promise;
      useAppStore.setState({ templateObject: template });
    });
    const iframe = document.createElement('iframe');
    const postMessage = vi.fn();
    Object.defineProperty(iframe, 'contentWindow', { value: { postMessage } });
    useAppStore.setState({ sandboxIframe: iframe, isSandboxReady: true });
    const run = useAppStore.getState().executeWithLLM('init', payload);
    await preparing.promise;
    try {
      await expect(useAppStore.getState().executeInSandbox('code', 'init', []))
        .rejects.toThrow(busyMessage);
      expect(postMessage).not.toHaveBeenCalled();
      expect(useAppStore.getState().isExecuting).toBe(true);
    } finally {
      preparation.resolve();
      await run;
    }
  });

  it('rejects LLM execution while the sandbox owns the lock', async () => {
    const iframe = document.createElement('iframe');
    Object.defineProperty(iframe, 'contentWindow', { value: { postMessage: vi.fn() } });
    useAppStore.setState({ sandboxIframe: iframe, isSandboxReady: true });
    const run = useAppStore.getState().executeInSandbox('code', 'init', []);
    const resolver = sandboxResolvers.get(useAppStore.getState().executionId)!;
    try {
      await expect(useAppStore.getState().executeWithLLM('init', payload)).rejects.toThrow(busyMessage);
      expect(useAppStore.getState().isExecuting).toBe(true);
      expect(buildTemplate).not.toHaveBeenCalled();
    } finally {
      resolver({ type: 'execution-result', success: true, result: output });
      sandboxResolvers.delete(useAppStore.getState().executionId);
      await run;
    }
    expect(useAppStore.getState().isExecuting).toBe(false);
  });
});
