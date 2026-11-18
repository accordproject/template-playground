import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import JSONEditor from '../../editors/JSONEditor';
import { registerAutocompletion } from '../../ai-assistant/autocompletion';

vi.mock('../../ai-assistant/autocompletion', () => ({ registerAutocompletion: vi.fn() }));
// Monaco stands in as a component that runs beforeMount, as the real one does on each mount.
vi.mock('@monaco-editor/react', () => ({
  Editor: ({ beforeMount }: { beforeMount?: (m: unknown) => void }) => {
    beforeMount?.({});
    return <div data-testid="monaco" />;
  },
}));

describe('JSONEditor', () => {
  beforeEach(() => {
    vi.mocked(registerAutocompletion).mockClear();
  });

  it('registers inline completions for an editable editor', async () => {
    const { findByTestId } = render(<JSONEditor id="request" value="{}" />);
    await findByTestId('monaco');
    expect(registerAutocompletion).toHaveBeenCalledWith('json', {});
  });

  it('registers none for read-only panes, however often they remount', async () => {
    for (let run = 0; run < 3; run++) {
      const { findByTestId, unmount } = render(<JSONEditor id={`simulate-response-${run}`} value="{}" readOnly />);
      await findByTestId('monaco');
      unmount();
    }
    await waitFor(() => expect(registerAutocompletion).not.toHaveBeenCalled());
  });
});
