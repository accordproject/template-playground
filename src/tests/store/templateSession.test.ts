import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAppStore from '../../store/store';
import { compress } from '../../utils/compression/compression';
import { SAMPLES } from '../../samples';

const sample = SAMPLES.find((item) => !item.LOGIC)!;

describe('template editing sessions', () => {
  beforeEach(() => {
    useAppStore.setState({ templateSessionId: 0, rebuild: vi.fn().mockResolvedValue(undefined) });
  });

  it('starts a new session for each sample load, including the same sample again', async () => {
    await useAppStore.getState().loadSample(sample.NAME);
    expect(useAppStore.getState().templateSessionId).toBe(1);
    await useAppStore.getState().loadSample(sample.NAME);
    expect(useAppStore.getState().templateSessionId).toBe(2);
  });

  it('starts a new session when a shared template is loaded', async () => {
    const link = compress({ templateMarkdown: sample.TEMPLATE, modelCto: sample.MODEL,
      data: JSON.stringify(sample.DATA), agreementHtml: '' });
    await useAppStore.getState().loadFromLink(link);
    expect(useAppStore.getState().templateSessionId).toBe(1);
  });

  it('keeps the session for normal edits and rejected loads', async () => {
    useAppStore.getState().setEditorValue('Edited text');
    await useAppStore.getState().loadSample('missing sample');
    await useAppStore.getState().loadFromLink(compress({ templateMarkdown: 'Missing required fields' }));
    expect(useAppStore.getState().templateSessionId).toBe(0);
  });
});
