import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import useAppStore from '../../store/store';
import LogicEditor from '../../editors/LogicEditor';
import { registerEditor, unregisterEditor } from '../../utils/editorNavigation';

const mockSetModelMarkers = vi.fn();
const mockGetModels = vi.fn().mockReturnValue([{ uri: { path: '/logic.ts' } }]);
const mockMonaco = {
  editor: {
    getModels: mockGetModels,
    setModelMarkers: mockSetModelMarkers,
  },
  MarkerSeverity: { Error: 8 },
  languages: {
    typescript: {
      ScriptTarget: { ES2020: 7 },
      ModuleKind: { ESNext: 99 },
      typescriptDefaults: {
        setCompilerOptions: vi.fn(),
        setDiagnosticsOptions: vi.fn(),
        addExtraLib: vi.fn(),
      }
    }
  }
};

vi.mock('@monaco-editor/react', () => ({
  useMonaco: () => mockMonaco,
  Editor: ({ onMount }: any) => {
    // Need to call onMount inside a useEffect or similar, but for unit testing a simple component it's okay to call directly if wrapped in act, or just delay it slightly.
    // Actually, calling it during render might cause React warnings, but vitest doesn't care much. Let's do it safely.
    setTimeout(() => {
      if (onMount) onMount({ id: 'mock-editor' });
    }, 0);
    return <div data-testid="monaco-editor" />;
  },
}));

vi.mock('../../hooks/useThemeName', () => ({
  default: () => 'vs',
}));

vi.mock('../../utils/editorNavigation', () => ({
  registerEditor: vi.fn(),
  unregisterEditor: vi.fn(),
}));

describe('LogicEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      editorLogicTs: '',
      logicTs: '',
      compiledLogicJs: null,
      compilationErrors: [],
      isCompiling: false,
      showLineNumbers: true,
      backgroundColor: '#ffffff',
      textColor: '#000000',
    });
  });

  it('renders the Apply & Compile button', async () => {
    await act(async () => {
      render(<LogicEditor />);
    });
    expect(screen.getByRole('button', { name: /apply & compile/i })).toBeInTheDocument();
  });

  it('shows "Unsaved changes" badge when editor content differs from committed logic', async () => {
    useAppStore.setState({ editorLogicTs: 'const x = 1;', logicTs: '' });
    await act(async () => {
      render(<LogicEditor />);
    });
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('shows "Compilation Failed" badge when there are compilation errors and editor is clean', async () => {
    useAppStore.setState({
      editorLogicTs: 'const x = 1;',
      logicTs: 'const x = 1;',
      compilationErrors: [{ message: 'Cannot find name "foo".' }],
    });
    await act(async () => {
      render(<LogicEditor />);
    });
    const matches = screen.getAllByText('Compilation Failed');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Compiled" badge when logic compiles successfully', async () => {
    useAppStore.setState({
      editorLogicTs: 'const x = 1;',
      logicTs: 'const x = 1;',
      compiledLogicJs: 'data:text/javascript;base64,abc',
      compilationErrors: [],
    });
    await act(async () => {
      render(<LogicEditor />);
    });
    expect(screen.getByText('Compiled')).toBeInTheDocument();
  });

  it('shows "Compiling..." badge when isCompiling is true', async () => {
    useAppStore.setState({
      editorLogicTs: 'const x = 1;',
      logicTs: 'const x = 1;',
      isCompiling: true,
    });
    await act(async () => {
      render(<LogicEditor />);
    });
    expect(screen.getByText('Compiling...')).toBeInTheDocument();
  });

  it('registers editor on mount and unregisters on unmount', async () => {
    let unmount: any;
    await act(async () => {
      const rtl = render(<LogicEditor />);
      unmount = rtl.unmount;
    });

    // Wait for setTimeout in mock Editor
    await new Promise((r) => setTimeout(r, 10));

    expect(registerEditor).toHaveBeenCalledWith('logic', { id: 'mock-editor' });

    await act(async () => {
      unmount();
    });

    expect(unregisterEditor).toHaveBeenCalledWith('logic');
  });

  it('syncs compilation errors with Monaco markers', async () => {
    useAppStore.setState({
      compilationErrors: [
        { message: 'Test error', line: 5, column: 10, length: 4 }
      ]
    });

    await act(async () => {
      render(<LogicEditor />);
    });

    expect(mockSetModelMarkers).toHaveBeenCalledWith(
      { uri: { path: '/logic.ts' } },
      'logic',
      [{
        severity: 8,
        startLineNumber: 5,
        startColumn: 10,
        endLineNumber: 5,
        endColumn: 14,
        message: 'Test error',
      }]
    );
  });

  it('clears markers when compilationErrors is empty', async () => {
    useAppStore.setState({ compilationErrors: [] });

    await act(async () => {
      render(<LogicEditor />);
    });

    expect(mockSetModelMarkers).toHaveBeenCalledWith(
      { uri: { path: '/logic.ts' } },
      'logic',
      []
    );
  });

  it('clears markers when editor content is dirty (unsaved changes)', async () => {
    useAppStore.setState({
      editorLogicTs: 'const x = 2;',
      logicTs: 'const x = 1;',
      compilationErrors: [
        { message: 'Test error', line: 5, column: 10, length: 4 }
      ]
    });

    await act(async () => {
      render(<LogicEditor />);
    });

    expect(mockSetModelMarkers).toHaveBeenCalledWith(
      { uri: { path: '/logic.ts' } },
      'logic',
      []
    );
  });
});
