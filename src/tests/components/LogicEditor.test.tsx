import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import useAppStore from '../../store/store';
import LogicEditor from '../../editors/LogicEditor';

vi.mock('@monaco-editor/react', () => ({
  useMonaco: () => null,
  Editor: () => <div data-testid="monaco-editor" />,
}));

vi.mock('../../hooks/useThemeName', () => ({
  default: () => 'vs',
}));

describe('LogicEditor', () => {
  beforeEach(() => {
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

  it('renders the Apply & Compile button', () => {
    render(<LogicEditor />);
    expect(screen.getByRole('button', { name: /apply & compile/i })).toBeInTheDocument();
  });

  it('shows "Unsaved changes" badge when editor content differs from committed logic', () => {
    useAppStore.setState({ editorLogicTs: 'const x = 1;', logicTs: '' });
    render(<LogicEditor />);
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('shows "Compilation Failed" badge when there are compilation errors and editor is clean', () => {
    useAppStore.setState({
      editorLogicTs: 'const x = 1;',
      logicTs: 'const x = 1;',
      compilationErrors: [{ message: 'Cannot find name "foo".' }],
    });
    render(<LogicEditor />);
    const matches = screen.getAllByText('Compilation Failed');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });



  it('shows "Compiled" badge when logic compiles successfully', () => {
    useAppStore.setState({
      editorLogicTs: 'const x = 1;',
      logicTs: 'const x = 1;',
      compiledLogicJs: 'data:text/javascript;base64,abc',
      compilationErrors: [],
    });
    render(<LogicEditor />);
    expect(screen.getByText('Compiled')).toBeInTheDocument();
  });

  it('shows "Compiling..." badge when isCompiling is true', () => {
    useAppStore.setState({
      editorLogicTs: 'const x = 1;',
      logicTs: 'const x = 1;',
      isCompiling: true,
    });
    render(<LogicEditor />);
    expect(screen.getByText('Compiling...')).toBeInTheDocument();
  });
});
