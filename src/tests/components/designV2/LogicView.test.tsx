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
import * as latePayment from '../../../samples/latePaymentPenalty';
import * as helloworld from '../../../samples/helloworld';

/*
 * Monaco is replaced by a plain div: the view under test is the chrome around
 * the editor (progress header, job rows, help rail, footer pill) and its
 * wiring to the app store, not the editor itself.
 */
vi.mock('@monaco-editor/react', () => ({
  useMonaco: () => null,
  Editor: ({ language }: { language: string }) => <div data-testid={`monaco-${language}`} />,
}));

const base = {
  modelCto: latePayment.MODEL,
  editorLogicTs: latePayment.LOGIC,
  logicTs: latePayment.LOGIC,
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
    expect(pane().getByText(LOGIC.chips.types.label)).toBeInTheDocument();
    expect(pane().getByText(LOGIC.chips.pair.label)).toBeInTheDocument();
    expect(await pane().findByTestId('monaco-typescript')).toBeInTheDocument();
  });

  it('counts the types row as done when model.cto declares request/response, and init/trigger once compiled', () => {
    const { unmount } = render(<LogicView />);
    expect(pane().getByText(LOGIC.doneCount(1, 2))).toBeInTheDocument();
    expect(pane().getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    expect(pane().getByText(LOGIC.typesFound('LatePaymentRequest', 'LatePaymentResponse'))).toBeInTheDocument();
    expect(rail().getByText(HELP_RAIL.count(1, 2))).toBeInTheDocument();
    // The rail shows icon and label only; the state text lives in the card chips.
    expect(rail().queryByText(LOGIC.status.notCompiled)).not.toBeInTheDocument();
    unmount();

    useAppStore.setState({ compiledLogicJs: 'js' });
    const second = render(<LogicView />);
    expect(pane().getByText(LOGIC.doneCount(2, 2))).toBeInTheDocument();
    expect(pane().getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    // Compiled: the init/trigger chip shows the state.
    expect(pane().getByText(LOGIC.status.compiled)).toBeInTheDocument();
    expect(rail().getByText(HELP_RAIL.count(2, 2))).toBeInTheDocument();
    expect(rail().getByText(LOGIC.chips.pair.label).closest('li')).toHaveClass('nd-check-done');
    second.unmount();

    useAppStore.setState({ compiledLogicJs: null, compilationErrors: [{ message: "Cannot find name 'foo'." }] });
    render(<LogicView />);
    expect(pane().getByText(LOGIC.chips.pair.label).closest('li')).toHaveAttribute('title', "Cannot find name 'foo'.");
    expect(pane().getByText(LOGIC.status.failed)).toBeInTheDocument();
    expect(rail().getByText(LOGIC.chips.pair.label).closest('li')).toHaveClass('nd-check-error');
  });

  it('leaves the types row open when model.cto has no request/response transactions', () => {
    useAppStore.setState({ modelCto: helloworld.MODEL });
    render(<LogicView />);
    expect(pane().getByText(LOGIC.doneCount(0, 2))).toBeInTheDocument();
    expect(pane().getByText(LOGIC.typesMissing)).toBeInTheDocument();
    expect(rail().getByText(LOGIC.chips.types.label).closest('li')).not.toHaveClass('nd-check-done');
  });

  it('the types row points back at the Model & Data step', () => {
    render(<LogicView />);
    fireEvent.click(pane().getByRole('button', { name: LOGIC.chips.types.action }));
    expect(useDesignV2Store.getState().view).toBe(STEP_ID.modelData);
  });

  it('leaves existing logic alone', () => {
    render(<LogicView />);
    expect(useAppStore.getState().editorLogicTs).toBe(latePayment.LOGIC);
  });

  it('opens an empty editor with a skeleton built from the model', () => {
    useAppStore.setState({ editorLogicTs: '', logicTs: '' });
    render(<LogicView />);
    expect(useAppStore.getState().editorLogicTs).toBe(scaffoldFromModel(describeLogicModel(latePayment.MODEL)));
    expect(useAppStore.getState().editorLogicTs).toContain("$class: 'org.acme.latepayment@1.0.0.LatePaymentResponse'");
  });

  it('falls back to the generic skeleton when the model has no request/response', () => {
    useAppStore.setState({ modelCto: helloworld.MODEL, editorLogicTs: '', logicTs: '' });
    render(<LogicView />);
    expect(useAppStore.getState().editorLogicTs).toBe(DEFAULT_LOGIC_BOILERPLATE);
  });

  it('fills the help rail from LOGIC.help', () => {
    render(<LogicView />);
    expect(rail().getByText(LOGIC.help.why.note)).toBeInTheDocument();
    fireEvent.click(rail().getByRole('tab', { name: HELP_RAIL.tabHow }));
    for (const step of LOGIC.help.how) expect(rail().getByText(step)).toBeInTheDocument();
  });

  describe('compiles on arrival', () => {
    it('compiles logic that was never compiled, so a template that ships logic opens compiled', () => {
      render(<LogicView />);
      expect(setLogicTs).toHaveBeenCalledTimes(1);
      expect(setLogicTs).toHaveBeenCalledWith(latePayment.LOGIC);
    });

    it('leaves compiled, unchanged logic alone', () => {
      useAppStore.setState({ compiledLogicJs: 'js' });
      render(<LogicView />);
      expect(setLogicTs).not.toHaveBeenCalled();
    });

    it('does not retry a compile that failed for the same source', () => {
      useAppStore.setState({ compilationErrors: [{ message: "Cannot find name 'foo'." }] });
      render(<LogicView />);
      expect(setLogicTs).not.toHaveBeenCalled();
      expect(pane().getByText(LOGIC.status.failed)).toBeInTheDocument();
    });

    it('does not compile the skeleton it just wrote into an empty editor', () => {
      useAppStore.setState({ editorLogicTs: '', logicTs: '' });
      render(<LogicView />);
      expect(useAppStore.getState().editorLogicTs).toBe(scaffoldFromModel(describeLogicModel(latePayment.MODEL)));
      expect(setLogicTs).not.toHaveBeenCalled();
    });
  });
});

describe('Footer on the Logic step', () => {
  const noop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ ...base, error: undefined });
  });

  it('has no compile button — Simulate compiles the logic when it opens', () => {
    useAppStore.setState({ editorLogicTs: 'class X {}' });
    render(<Footer view={STEP_ID.logic} onBack={noop} onNext={noop} />);
    expect(screen.queryByRole('button', { name: /compile/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: FOOTER.next })).toBeInTheDocument();
  });

  it('shows the first compilation error in the problems pill, on Logic and on Simulate', () => {
    useAppStore.setState({ compilationErrors: [{ message: "Cannot find name 'foo'." }] });
    const { unmount } = render(<Footer view={STEP_ID.logic} onBack={noop} onNext={noop} />);
    expect(screen.getByText(FOOTER.problem)).toBeInTheDocument();
    expect(screen.getByText("Cannot find name 'foo'.")).toBeInTheDocument();
    unmount();

    render(<Footer view={STEP_ID.simulate} onBack={noop} onNext={noop} />);
    expect(screen.getByText("Cannot find name 'foo'.")).toBeInTheDocument();
  });

  it('keeps compilation errors off the other steps', () => {
    useAppStore.setState({ compilationErrors: [{ message: "Cannot find name 'foo'." }] });
    render(<Footer view={STEP_ID.text} onBack={noop} onNext={noop} />);
    expect(screen.getByText(FOOTER.noProblems)).toBeInTheDocument();
  });
});
