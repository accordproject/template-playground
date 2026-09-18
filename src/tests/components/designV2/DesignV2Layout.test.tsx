import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import DesignV2Layout from '../../../components/designV2/DesignV2Layout';
import { DEFAULT_TEMPLATE } from '../../../components/designV2/usePickTemplate';
import { FOOTER, START_SAMPLES, WELCOME, sampleNameFor } from '../../../components/designV2/constants';
import useAppStore from '../../../store/store';
import useDesignV2Store from '../../../store/designV2Store';
import { FIRST_STEP, STEP_ID } from '../../../types/designV2.types';
import * as latePayment from '../../../samples/latePaymentPenalty';

/*
 * Covers entering the flow: "Start building" must land on the first gallery
 * card, so the editor steps never open on the app store's startup sample.
 * Also the gate in front of Simulate: moving there compiles the logic, and
 * a compile error keeps the user where they are.
 */
vi.mock('@monaco-editor/react', () => ({
  useMonaco: () => null,
  Editor: ({ language }: { language: string }) => <div data-testid={`monaco-${language}`} />,
}));

const renderLayout = () =>
  render(
    <MemoryRouter>
      <DesignV2Layout />
    </MemoryRouter>
  );

describe('DesignV2Layout — Start building', () => {
  const loadSample = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ loadSample });
    useDesignV2Store.setState({ view: 'welcome', selectedTemplate: null });
  });

  it('picks and loads the first gallery card when nothing was picked', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: `${WELCOME.start} →` }));

    expect(useDesignV2Store.getState().view).toBe(FIRST_STEP);
    expect(useDesignV2Store.getState().selectedTemplate).toBe(DEFAULT_TEMPLATE);
    expect(DEFAULT_TEMPLATE).toBe(START_SAMPLES[0].name);
    expect(loadSample).toHaveBeenCalledWith(sampleNameFor(DEFAULT_TEMPLATE));
  });

  it('keeps a template that was already picked', () => {
    useDesignV2Store.setState({ selectedTemplate: START_SAMPLES[1].name });
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: `${WELCOME.start} →` }));

    expect(useDesignV2Store.getState().view).toBe(FIRST_STEP);
    expect(useDesignV2Store.getState().selectedTemplate).toBe(START_SAMPLES[1].name);
    expect(loadSample).not.toHaveBeenCalled();
  });
});

describe('DesignV2Layout — moving to Simulate', () => {
  /** setLogicTs stand-in: commits the source and reports the given outcome. */
  const compileTo = (outcome: 'ok' | 'error') =>
    vi.fn(async (ts: string) => {
      await Promise.resolve();
      useAppStore.setState(
        outcome === 'ok'
          ? { logicTs: ts, editorLogicTs: ts, compiledLogicJs: 'js', compilationErrors: [] }
          : { logicTs: ts, editorLogicTs: ts, compiledLogicJs: null, compilationErrors: [{ message: "Cannot find name 'foo'." }] }
      );
    });
  const edited = latePayment.LOGIC + '\n// edited';

  beforeEach(() => {
    useAppStore.setState({
      loadSample: vi.fn().mockResolvedValue(undefined),
      modelCto: latePayment.MODEL,
      editorLogicTs: edited,
      logicTs: latePayment.LOGIC,
      compiledLogicJs: 'js',
      compilationErrors: [],
      isCompiling: false,
      executionHistory: [],
      executionState: '',
    });
    useDesignV2Store.setState({ view: STEP_ID.logic, selectedTemplate: START_SAMPLES[2].name, helpRailOpen: true });
  });

  it('Next compiles the edited logic and opens Simulate when it compiles', async () => {
    const setLogicTs = compileTo('ok');
    useAppStore.setState({ setLogicTs });
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: FOOTER.next }));
    await waitFor(() => expect(useDesignV2Store.getState().view).toBe(STEP_ID.simulate));
    expect(setLogicTs).toHaveBeenCalledWith(edited);
  });

  it('Next stays on Logic and shows the error when the logic does not compile', async () => {
    const setLogicTs = compileTo('error');
    useAppStore.setState({ setLogicTs });
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: FOOTER.next }));
    await waitFor(() => expect(screen.getByText(FOOTER.logicBlocked)).toBeInTheDocument());
    expect(useDesignV2Store.getState().view).toBe(STEP_ID.logic);
    expect(screen.getByText("Cannot find name 'foo'.")).toBeInTheDocument();
  });

  it('the stepper goes through the same gate, from any step', async () => {
    const setLogicTs = compileTo('error');
    useAppStore.setState({ setLogicTs });
    useDesignV2Store.setState({ view: STEP_ID.text });
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: /Simulate/ }));
    await waitFor(() => expect(setLogicTs).toHaveBeenCalledTimes(1));
    expect(useDesignV2Store.getState().view).toBe(STEP_ID.text);
  });

  it('does not compile again when nothing changed', async () => {
    const setLogicTs = compileTo('ok');
    useAppStore.setState({ setLogicTs, editorLogicTs: latePayment.LOGIC });
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: FOOTER.next }));
    await waitFor(() => expect(useDesignV2Store.getState().view).toBe(STEP_ID.simulate));
    expect(setLogicTs).not.toHaveBeenCalled();
  });

  it('lets Simulate open when there is no logic — it says so itself', async () => {
    const setLogicTs = compileTo('ok');
    useAppStore.setState({ setLogicTs, editorLogicTs: '', logicTs: '', compiledLogicJs: null });
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: FOOTER.next }));
    await waitFor(() => expect(useDesignV2Store.getState().view).toBe(STEP_ID.simulate));
    expect(setLogicTs).not.toHaveBeenCalled();
  });

  it('other steps are not gated', () => {
    useDesignV2Store.setState({ view: STEP_ID.text });
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: FOOTER.next }));
    expect(useDesignV2Store.getState().view).toBe(STEP_ID.modelData);
  });
});
