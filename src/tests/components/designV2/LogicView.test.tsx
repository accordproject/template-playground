import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LogicView } from '../../../components/designV2/LogicView';
import { logicStatus } from '../../../components/designV2/logicStatus';
import Footer from '../../../components/designV2/Footer';
import { FOOTER, HELP_RAIL, LOGIC } from '../../../components/designV2/constants';
import { DEFAULT_LOGIC_BOILERPLATE, describeLogicModel, scaffoldFromModel } from '../../../editors/logicSource';
import useAppStore from '../../../store/store';
import useDesignV2Store from '../../../store/designV2Store';
import { STEP_ID } from '../../../types/designV2.types';
import * as counter from '../../../samples/counterLogic';
import * as employment from '../../../samples/employmentOffer';

/*
 * Monaco is replaced by a plain div: the view under test is the chrome around
 * the editor (progress header, job rows, help rail, footer button) and its
 * wiring to the app store, not the editor itself.
 */
vi.mock('@monaco-editor/react', () => ({
  useMonaco: () => null,
  Editor: ({ language }: { language: string }) => <div data-testid={`monaco-${language}`} />,
}));

const base = {
  modelCto: counter.MODEL,
  editorLogicTs: counter.LOGIC ?? '',
  logicTs: counter.LOGIC ?? '',
  isCompiling: false,
  compilationErrors: [],
  compiledLogicJs: null,
};

describe('logicStatus', () => {
  it('follows the legacy badge precedence', () => {
    expect(logicStatus({ ...base, editorLogicTs: base.logicTs + '\n// x' })).toBe('dirty');
    expect(logicStatus({ ...base, isCompiling: true })).toBe('compiling');
    expect(logicStatus({ ...base, compilationErrors: [{ message: 'x' }] })).toBe('failed');
    expect(logicStatus({ ...base, compiledLogicJs: 'js' })).toBe('compiled');
    expect(logicStatus(base)).toBe('notCompiled');
    expect(logicStatus({ ...base, editorLogicTs: '', logicTs: '' })).toBe('empty');
  });
});

describe('LogicView', () => {
  const setLogicTs = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    useDesignV2Store.setState({ helpRailOpen: true, view: STEP_ID.logic });
    useAppStore.setState({ ...base, error: undefined, setLogicTs });
  });

  const pane = () => within(screen.getByRole('region', { name: LOGIC.paneLabel }));
  const rail = () => within(screen.getByRole('complementary'));

  it('shows logic.ts in the TypeScript editor under the progress header and the two job rows', async () => {
    render(<LogicView />);
    expect(pane().getByText(LOGIC.file)).toBeInTheDocument();
    expect(pane().getByText(LOGIC.badge)).toBeInTheDocument();
    expect(pane().getByText(LOGIC.rows.types.label)).toBeInTheDocument();
    expect(pane().getByText(LOGIC.rows.pair.label)).toBeInTheDocument();
    expect(await pane().findByTestId('monaco-typescript')).toBeInTheDocument();
  });

  it('counts the types row as done when model.cto declares request/response, and init/trigger once compiled', () => {
    const { unmount } = render(<LogicView />);
    expect(pane().getByText(LOGIC.doneCount(1, 2))).toBeInTheDocument();
    expect(pane().getByText(LOGIC.typesFound('CounterRequest', 'CounterResponse'))).toBeInTheDocument();
    expect(rail().getByText(HELP_RAIL.count(1, 2))).toBeInTheDocument();
    expect(rail().getByText(LOGIC.status.notCompiled)).toBeInTheDocument();
    unmount();

    useAppStore.setState({ compiledLogicJs: 'js' });
    const second = render(<LogicView />);
    expect(pane().getByText(LOGIC.doneCount(2, 2))).toBeInTheDocument();
    // Compiled: the init/trigger chip shows the state.
    expect(pane().getByText(LOGIC.status.compiled)).toBeInTheDocument();
    expect(rail().getByText(HELP_RAIL.count(2, 2))).toBeInTheDocument();
    expect(rail().getByText(LOGIC.rows.pair.label).closest('li')).toHaveClass('nd-check-done');
    second.unmount();

    useAppStore.setState({ compiledLogicJs: null, compilationErrors: [{ message: "Cannot find name 'foo'." }] });
    render(<LogicView />);
    expect(pane().getByText(LOGIC.rows.pair.label).closest('li')).toHaveAttribute('title', "Cannot find name 'foo'.");
    expect(pane().getByText(LOGIC.status.failed)).toBeInTheDocument();
    expect(rail().getByText(LOGIC.rows.pair.label).closest('li')).toHaveClass('nd-check-error');
    expect(rail().getByText(LOGIC.status.failed)).toBeInTheDocument();
  });

  it('leaves the types row open when model.cto has no request/response transactions', () => {
    useAppStore.setState({ modelCto: employment.MODEL });
    render(<LogicView />);
    expect(pane().getByText(LOGIC.doneCount(0, 2))).toBeInTheDocument();
    expect(pane().getByText(LOGIC.typesMissing)).toBeInTheDocument();
    expect(rail().getByText(LOGIC.rows.types.label).closest('li')).not.toHaveClass('nd-check-done');
  });

  it('the types row points back at the Model & Data step', () => {
    render(<LogicView />);
    fireEvent.click(pane().getByRole('button', { name: LOGIC.rows.types.action }));
    expect(useDesignV2Store.getState().view).toBe(STEP_ID.modelData);
  });

  it('"Scaffold" fills an empty editor with a skeleton from the model and is disabled otherwise', () => {
    const { unmount } = render(<LogicView />);
    expect(screen.getByRole('button', { name: LOGIC.scaffold })).toBeDisabled();
    unmount();

    useAppStore.setState({ editorLogicTs: '', logicTs: '' });
    render(<LogicView />);
    fireEvent.click(screen.getByRole('button', { name: LOGIC.scaffold }));
    expect(useAppStore.getState().editorLogicTs).toBe(scaffoldFromModel(describeLogicModel(counter.MODEL)));
    expect(useAppStore.getState().editorLogicTs).toContain("$class: 'org.acme.counter@1.0.0.CounterResponse'");
  });

  it('"Scaffold" falls back to the generic skeleton when the model has no request/response', () => {
    useAppStore.setState({ modelCto: employment.MODEL, editorLogicTs: '', logicTs: '' });
    render(<LogicView />);
    fireEvent.click(screen.getByRole('button', { name: LOGIC.scaffold }));
    expect(useAppStore.getState().editorLogicTs).toBe(DEFAULT_LOGIC_BOILERPLATE);
  });

  it('fills the help rail from LOGIC.help', () => {
    render(<LogicView />);
    expect(rail().getByText(LOGIC.help.why.note)).toBeInTheDocument();
    fireEvent.click(rail().getByRole('tab', { name: HELP_RAIL.tabHow }));
    for (const step of LOGIC.help.how) expect(rail().getByText(step)).toBeInTheDocument();
  });
});

describe('Footer on the Logic step', () => {
  const setLogicTs = vi.fn().mockResolvedValue(undefined);
  const noop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ ...base, error: undefined, setLogicTs });
  });

  it('"Apply & Compile" commits the editor content through the store', () => {
    useAppStore.setState({ editorLogicTs: 'class X {}' });
    render(<Footer view={STEP_ID.logic} onBack={noop} onNext={noop} />);
    fireEvent.click(screen.getByRole('button', { name: FOOTER.applyAndCompileDirty }));
    expect(setLogicTs).toHaveBeenCalledWith('class X {}');
  });

  it('falls back to a skeleton from the model when there is nothing to compile', () => {
    useAppStore.setState({ editorLogicTs: '', logicTs: '' });
    render(<Footer view={STEP_ID.logic} onBack={noop} onNext={noop} />);
    fireEvent.click(screen.getByRole('button', { name: FOOTER.applyAndCompile }));
    expect(setLogicTs).toHaveBeenCalledWith(scaffoldFromModel(describeLogicModel(counter.MODEL)));
  });

  it('falls back to the generic boilerplate when the model has no request/response', () => {
    useAppStore.setState({ modelCto: '', editorLogicTs: '', logicTs: '' });
    render(<Footer view={STEP_ID.logic} onBack={noop} onNext={noop} />);
    fireEvent.click(screen.getByRole('button', { name: FOOTER.applyAndCompile }));
    expect(setLogicTs).toHaveBeenCalledWith(DEFAULT_LOGIC_BOILERPLATE);
  });

  it('shows the first compilation error in the problems pill', () => {
    useAppStore.setState({ compilationErrors: [{ message: "Cannot find name 'foo'." }] });
    render(<Footer view={STEP_ID.logic} onBack={noop} onNext={noop} />);
    expect(screen.getByText(FOOTER.problem)).toBeInTheDocument();
    expect(screen.getByText("Cannot find name 'foo'.")).toBeInTheDocument();
  });

  it('does not show the Apply & Compile button on other steps', () => {
    render(<Footer view={STEP_ID.text} onBack={noop} onNext={noop} />);
    expect(screen.queryByRole('button', { name: /Apply & Compile/ })).not.toBeInTheDocument();
  });
});
