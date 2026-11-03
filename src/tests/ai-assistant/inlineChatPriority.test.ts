import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as monaco from 'monaco-editor';
import useAppStore from '../../store/store';
import * as providers from '../../ai-assistant/llmProviders';
import { registerAutocompletion } from '../../ai-assistant/autocompletion';
import { sendMessage, stopMessage } from '../../ai-assistant/chatRelay';
import { clearActivity } from '../../ai-assistant/activityTracker';
import type { AIConfig } from '../../types/components/AIAssistant.types';

type StreamArgs = Parameters<providers.LLMProvider['streamChat']>;
type Language = Parameters<typeof registerAutocompletion>[0];
interface ControlledStream {
  chunk: StreamArgs[1];
  error: StreamArgs[2];
  complete: StreamArgs[3];
  resolve: () => void;
  reject: (error: Error) => void;
}

const initialState = useAppStore.getState();
const config: AIConfig = {
  provider: 'openai', model: 'test-model', apiKey: 'test-key',
  includeTemplateMarkContent: false, includeConcertoModelContent: false, includeDataContent: false,
  enableInlineSuggestions: true,
};
const contents = { editorTemplateMark: 'text', editorModelCto: 'model', editorAgreementData: '{}' };
const model = {
  getLineContent: () => 'Agreement text ',
  getLineCount: () => 1,
} as unknown as monaco.editor.ITextModel;
const position = { lineNumber: 1, column: 16 } as monaco.Position;
const context = {} as monaco.languages.InlineCompletionContext;
const token = { isCancellationRequested: false } as monaco.CancellationToken;

describe('inline suggestions and foreground chat priority', () => {
  const streams: ControlledStream[] = [];
  const runs: Promise<unknown>[] = [];
  const streamChat = vi.fn<StreamArgs, Promise<void>>();
  const registerProvider = vi.fn<
    Parameters<typeof monaco.languages.registerInlineCompletionsProvider>,
    monaco.IDisposable
  >();
  // The real autocomplete module retains its throttle across registrations.
  let testTime = Date.now();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(testTime += 10_000);
    localStorage.clear();
    streams.length = 0;
    runs.length = 0;
    for (const language of ['markdown', 'concerto', 'json'] as const) clearActivity(language);
    streamChat.mockReset().mockImplementation((_messages, chunk, error, complete) =>
      new Promise<void>((resolve, reject) => streams.push({ chunk, error, complete, resolve, reject })),
    );
    registerProvider.mockReset().mockReturnValue({ dispose: vi.fn() });
    vi.spyOn(providers, 'getLLMProvider').mockImplementation((aiConfig) =>
      new class extends providers.LLMProvider {
        streamChat = streamChat;
      }(aiConfig),
    );
    useAppStore.setState({
      aiConfig: config,
      chatState: { messages: [], isLoading: false, error: null },
      chatAbortController: null,
      editorValue: contents.editorTemplateMark,
      editorModelCto: contents.editorModelCto,
      editorAgreementData: contents.editorAgreementData,
    });
  });

  afterEach(async () => {
    await vi.runOnlyPendingTimersAsync();
    stopMessage();
    for (const stream of streams) stream.resolve();
    await Promise.all(runs);
    vi.restoreAllMocks();
    vi.useRealTimers();
    useAppStore.setState(initialState, true);
    localStorage.clear();
  });

  function chat() {
    const run = sendMessage('Explain this agreement', null, contents);
    runs.push(run);
    return run;
  }

  function suggest(language: Language = 'markdown') {
    registerAutocompletion(language, {
      ...monaco,
      languages: { ...monaco.languages, registerInlineCompletionsProvider: registerProvider },
    });
    const provider = registerProvider.mock.calls.at(-1)![1];
    const run = Promise.resolve(provider.provideInlineCompletions(model, position, context, token));
    runs.push(run);
    return run;
  }

  function finish(stream: ControlledStream, text: string) {
    stream.chunk(text);
    stream.complete();
    stream.resolve();
  }

  it('preserves active chat, its streaming answer and its controller when a suggestion is attempted', async () => {
    const foreground = chat();
    const controller = useAppStore.getState().chatAbortController!;
    streams[0].chunk('First part');
    const suggestion = suggest();
    await vi.advanceTimersByTimeAsync(1000);

    expect(streamChat).toHaveBeenCalledTimes(1);
    expect(await suggestion).toEqual({ items: [] });
    expect(controller.signal.aborted).toBe(false);
    expect(useAppStore.getState().chatAbortController).toBe(controller);
    expect(useAppStore.getState().chatState.isLoading).toBe(true);

    finish(streams[0], ' and the rest');
    await foreground;
    const { chatState, chatAbortController } = useAppStore.getState();
    expect(chatState.messages.at(-1)?.content).toBe('First part and the rest');
    expect(chatState.isLoading).toBe(false);
    expect(chatAbortController).toBeNull();
  });

  it('checks current chat state after the debounce when chat starts while a suggestion is waiting', async () => {
    const suggestion = suggest();
    await vi.advanceTimersByTimeAsync(500);
    expect(streamChat).not.toHaveBeenCalled();
    const foreground = chat();
    const controller = useAppStore.getState().chatAbortController!;
    await vi.advanceTimersByTimeAsync(500);

    expect(streamChat).toHaveBeenCalledTimes(1);
    expect(await suggestion).toEqual({ items: [] });
    expect(controller.signal.aborted).toBe(false);
    expect(useAppStore.getState().chatState.isLoading).toBe(true);
    finish(streams[0], 'Foreground answer');
    await foreground;
    expect(useAppStore.getState().chatState.messages.at(-1)?.content).toBe('Foreground answer');
    expect(useAppStore.getState().chatState.isLoading).toBe(false);
    expect(useAppStore.getState().chatAbortController).toBeNull();
  });

  it('protects chat even when an automatic request reaches the relay directly', async () => {
    const foreground = chat();
    const controller = useAppStore.getState().chatAbortController!;
    const onChunk = vi.fn();
    const suggestion = sendMessage('Completion', 'inlineSuggestion', contents, false, 'markdown', onChunk);
    runs.push(suggestion);
    expect(streamChat).toHaveBeenCalledTimes(1);
    await suggestion;
    expect(onChunk).not.toHaveBeenCalled();
    expect(controller.signal.aborted).toBe(false);
    expect(useAppStore.getState().chatAbortController).toBe(controller);
    finish(streams[0], 'Foreground answer');
    await foreground;
  });

  it('lets explicit chat supersede a pending suggestion and ignores its late callbacks', async () => {
    const suggestion = suggest();
    await vi.advanceTimersByTimeAsync(1000);
    const oldController = useAppStore.getState().chatAbortController!;
    const foreground = chat();
    const controller = useAppStore.getState().chatAbortController!;
    expect(oldController.signal.aborted).toBe(true);
    expect(await suggestion).toEqual({ items: [] });
    streams[1].chunk('Foreground');
    streams[0].chunk('Late suggestion');
    streams[0].error(new Error('Late suggestion failure'));
    streams[0].complete();
    streams[0].resolve();

    expect(useAppStore.getState().chatAbortController).toBe(controller);
    expect(controller.signal.aborted).toBe(false);
    expect(useAppStore.getState().chatState.isLoading).toBe(true);
    expect(useAppStore.getState().chatState.messages.at(-1)?.content).toBe('Foreground');
    finish(streams[1], ' answer');
    await foreground;
    expect(useAppStore.getState().chatState.messages.at(-1)?.content).toBe('Foreground answer');
    expect(useAppStore.getState().chatState.isLoading).toBe(false);
    expect(useAppStore.getState().chatAbortController).toBeNull();
  });

  it.each(['markdown', 'concerto', 'json'] as const)('still supplies idle %s suggestions after the debounce', async (language) => {
    const suggestion = suggest(language);
    await vi.advanceTimersByTimeAsync(999);
    expect(streamChat).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(streamChat).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().chatState.messages).toEqual([]);
    expect(useAppStore.getState().chatState.isLoading).toBe(false);
    finish(streams[0], 'suggested text');
    expect(await suggestion).toMatchObject({ items: [{ insertText: 'suggested text' }] });
    expect(useAppStore.getState().chatAbortController).toBeNull();
  });

  it('allows suggestions again after the foreground chat completes', async () => {
    const foreground = chat();
    const suppressed = suggest();
    await vi.advanceTimersByTimeAsync(1000);
    expect(streamChat).toHaveBeenCalledTimes(1);
    expect(await suppressed).toEqual({ items: [] });
    finish(streams[0], 'Answer');
    await foreground;
    // Keep the existing two-second autocomplete throttle intact.
    await vi.advanceTimersByTimeAsync(1000);
    const suggestion = suggest();
    await vi.advanceTimersByTimeAsync(1000);
    expect(streamChat).toHaveBeenCalledTimes(2);
    finish(streams[1], 'suggested text');
    expect(await suggestion).toMatchObject({ items: [{ insertText: 'suggested text' }] });
  });

  it('keeps disabled suggestions disabled', async () => {
    useAppStore.setState({ aiConfig: { ...config, enableInlineSuggestions: false } });
    expect(await suggest()).toEqual({ items: [] });
    await vi.advanceTimersByTimeAsync(1000);
    expect(streamChat).not.toHaveBeenCalled();
    expect(useAppStore.getState().chatAbortController).toBeNull();
  });

  it.each(['callback', 'rejection'] as const)('preserves foreground error handling (%s)', async (kind) => {
    const foreground = chat();
    const suggestion = suggest();
    await vi.advanceTimersByTimeAsync(1000);
    expect(streamChat).toHaveBeenCalledTimes(1);
    expect(await suggestion).toEqual({ items: [] });
    const error = new Error('Provider unavailable');
    if (kind === 'callback') {
      streams[0].error(error);
      streams[0].resolve();
    } else streams[0].reject(error);
    await foreground;
    expect(useAppStore.getState().chatState.messages.at(-1)?.content).toBe('[ERROR] Provider unavailable');
    expect(useAppStore.getState().chatState.isLoading).toBe(false);
  });

  it('preserves Stop behavior and ignores later foreground chunks', async () => {
    const foreground = chat();
    const controller = useAppStore.getState().chatAbortController!;
    streams[0].chunk('Partial answer');
    const suggestion = suggest();
    await vi.advanceTimersByTimeAsync(1000);
    expect(streamChat).toHaveBeenCalledTimes(1);
    expect(await suggestion).toEqual({ items: [] });
    stopMessage();
    await foreground;
    streams[0].chunk('Late answer');
    streams[0].complete();
    streams[0].resolve();
    expect(controller.signal.aborted).toBe(true);
    expect(useAppStore.getState().chatState.messages.at(-1)?.content).toBe('Partial answer [Stopped]');
    expect(useAppStore.getState().chatState.isLoading).toBe(false);
    expect(useAppStore.getState().chatAbortController).toBeNull();
  });
});
