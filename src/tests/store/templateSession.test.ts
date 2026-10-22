import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAppStore, { currentTemplateGeneration } from '../../store/store';
import { compress } from '../../utils/compression/compression';
import { SAMPLES } from '../../samples';

const sample = SAMPLES.find((item) => !item.LOGIC)!;

describe('template editing sessions', () => {
  beforeEach(() => {
    useAppStore.setState({ templateGeneration: 0, rebuild: vi.fn().mockResolvedValue(undefined) });
  });

  it('starts a new session for each sample load, including the same sample again', async () => {
    await useAppStore.getState().loadSample(sample.NAME);
    expect(useAppStore.getState().templateGeneration).toBe(1);
    await useAppStore.getState().loadSample(sample.NAME);
    expect(useAppStore.getState().templateGeneration).toBe(2);
  });

  it('starts a new session when a shared template is loaded', async () => {
    const link = compress({ templateMarkdown: sample.TEMPLATE, modelCto: sample.MODEL,
      data: JSON.stringify(sample.DATA), agreementHtml: '' });
    await useAppStore.getState().loadFromLink(link);
    expect(useAppStore.getState().templateGeneration).toBe(1);
  });

  it('publishes a new generation with the sources of an imported archive', async () => {
    const listener = vi.fn();
    const unsubscribe = useAppStore.subscribe((state, previous) => {
      if (state.templateGeneration !== previous.templateGeneration) {
        listener(currentTemplateGeneration(), state.editorValue);
      }
    });
    try {
      await useAppStore.getState().loadImportedTemplate({
        name: sample.NAME,
        templateMarkdown: sample.TEMPLATE,
        modelCto: sample.MODEL,
        data: JSON.stringify(sample.DATA),
      });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(1, sample.TEMPLATE);
    } finally {
      unsubscribe();
    }
  });

  it('keeps the session for normal edits and rejected loads', async () => {
    useAppStore.getState().setEditorValue('Edited text');
    await useAppStore.getState().loadSample('missing sample');
    await useAppStore.getState().loadFromLink(compress({ templateMarkdown: 'Missing required fields' }));
    expect(useAppStore.getState().templateGeneration).toBe(0);
  });
});
