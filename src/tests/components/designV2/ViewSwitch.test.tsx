import { StrictMode, useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewSwitch } from '../../../components/designV2/views';
import useAppStore from '../../../store/store';
import { STEP_ID } from '../../../types/designV2.types';

const lifecycle = vi.hoisted(() => ({ mount: vi.fn(), dispose: vi.fn() }));
vi.mock('../../../components/designV2/TextView', () => ({
  TextView: () => {
    useEffect(() => {
      lifecycle.mount();
      return lifecycle.dispose;
    }, []);
    return <textarea aria-label="Template text" defaultValue="Original text" />;
  },
}));
vi.mock('../../../components/designV2/ModelDataView', () => ({
  ModelDataView: () => <div>Data step</div>,
}));
vi.mock('../../../components/designV2/LogicView', () => ({ LogicView: () => null }));
vi.mock('../../../components/designV2/SimulateView', () => ({ default: () => null }));

describe('Design V2 Text editor lifetime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ templateSessionId: 0 });
  });

  it('loads Text on demand and retains the same editor across repeated step changes', () => {
    const { rerender, unmount } = render(<ViewSwitch view={STEP_ID.modelData} onStart={vi.fn()} />);
    expect(lifecycle.mount).not.toHaveBeenCalled();
    rerender(<ViewSwitch view={STEP_ID.text} onStart={vi.fn()} />);
    const editor = screen.getByRole('textbox', { name: 'Template text' });
    for (let i = 0; i < 3; i++) {
      rerender(<ViewSwitch view={STEP_ID.modelData} onStart={vi.fn()} />);
      expect(editor).not.toBeVisible();
      expect(screen.queryByRole('textbox')).toBeNull();
      rerender(<ViewSwitch view={STEP_ID.text} onStart={vi.fn()} />);
      expect(screen.getByRole('textbox')).toBe(editor);
      expect(editor).toBeVisible();
    }
    expect(lifecycle.mount).toHaveBeenCalledTimes(1);
    expect(lifecycle.dispose).not.toHaveBeenCalled();
    unmount();
    expect(lifecycle.dispose).toHaveBeenCalledTimes(1);
  });

  it.each([STEP_ID.text, STEP_ID.modelData])('disposes the old editor when a template loads on step %s', (view) => {
    const { rerender } = render(<ViewSwitch view={STEP_ID.text} onStart={vi.fn()} />);
    const oldEditor = screen.getByRole('textbox');
    rerender(<ViewSwitch view={view} onStart={vi.fn()} />);
    act(() => useAppStore.setState({ templateSessionId: 1 }));
    expect(oldEditor).not.toBeInTheDocument();
    expect(lifecycle.dispose).toHaveBeenCalledTimes(1);
    rerender(<ViewSwitch view={STEP_ID.text} onStart={vi.fn()} />);
    expect(screen.getByRole('textbox')).not.toBe(oldEditor);
  });

  it('retains the editor under StrictMode too', () => {
    const { rerender } = render(<StrictMode><ViewSwitch view={STEP_ID.text} onStart={vi.fn()} /></StrictMode>);
    const editor = screen.getByRole('textbox');
    const disposals = lifecycle.dispose.mock.calls.length;
    rerender(<StrictMode><ViewSwitch view={STEP_ID.modelData} onStart={vi.fn()} /></StrictMode>);
    rerender(<StrictMode><ViewSwitch view={STEP_ID.text} onStart={vi.fn()} /></StrictMode>);
    expect(screen.getByRole('textbox')).toBe(editor);
    expect(lifecycle.dispose).toHaveBeenCalledTimes(disposals);
  });
});
