import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import SimulateView from '../../../components/designV2/SimulateView';
import useAppStore from '../../../store/store';
import useDesignV2Store from '../../../store/designV2Store';
import { SIMULATE } from '../../../components/designV2/constants';
import { runSummary } from '../../../components/designV2/simulateRuns';
import { describeLogicModel, scaffoldFromModel } from '../../../editors/logicSource';
import { STEP_ID } from '../../../types/designV2.types';
import * as latePayment from '../../../samples/latePaymentPenalty';
import { failedRun, initRun, okRun, parseFailedRun } from './runFixtures';

// The request editor is the legacy Monaco JSONEditor; a textarea stands in for it here.
vi.mock('../../../editors/JSONEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange?: (v: string | undefined) => void }) => (
    <textarea aria-label="request editor" value={value} onChange={(e) => onChange?.(e.target.value)} />
  ),
}));

/**
 * Covers the Simulate step: compiling the logic on arrival (there is no
 * compile button), the "no logic" / "didn't compile" gates, the runs list
 * fed by executionHistory, run selection, the request / response detail and
 * the Send / restart / re-run actions that call into the legacy runner.
 */
describe('SimulateView', () => {
  const initContract = vi.fn(async () => { await Promise.resolve(); });
  const triggerContract = vi.fn(async () => { await Promise.resolve(); });
  const setLogicTs = vi.fn(async () => { await Promise.resolve(); });
  const skeleton = scaffoldFromModel(describeLogicModel(latePayment.MODEL));

  beforeEach(() => {
    initContract.mockClear();
    triggerContract.mockClear();
    setLogicTs.mockClear();
    useAppStore.setState({
      modelCto: latePayment.MODEL,
      editorLogicTs: latePayment.LOGIC,
      logicTs: latePayment.LOGIC,
      isCompiling: false,
      compilationErrors: [],
      compiledLogicJs: 'compiled',
      executionHistory: [initRun, okRun, failedRun],
      executionState: '{"count": 1}',
      isExecuting: false,
      requestJson: JSON.stringify(latePayment.REQUEST, null, 2),
      initContract,
      triggerContract,
      setLogicTs,
    });
    useDesignV2Store.setState({ view: STEP_ID.simulate, selectedRunId: null });
  });

  const runRows = () => within(screen.getByRole('list', { name: SIMULATE.runsLabel })).getAllByRole('button');
  const noDialog = () => {
    expect(screen.queryByText(SIMULATE.blocked.noLogic.title)).toBeNull();
    expect(screen.queryByText(SIMULATE.blocked.failed.title)).toBeNull();
  };

  describe('on arrival', () => {
    beforeEach(() => {
      useAppStore.setState({ compiledLogicJs: null, executionHistory: [], executionState: '' });
    });

    it('compiles logic that was never compiled', () => {
      render(<SimulateView />);
      expect(setLogicTs).toHaveBeenCalledTimes(1);
      expect(setLogicTs).toHaveBeenCalledWith(latePayment.LOGIC);
      noDialog();
    });

    it('compiles what the editor holds when it was edited since the last compile', () => {
      useAppStore.setState({ editorLogicTs: 'class X {}', compiledLogicJs: 'stale' });
      render(<SimulateView />);
      expect(setLogicTs).toHaveBeenCalledWith('class X {}');
    });

    it('leaves compiled, unchanged logic alone', () => {
      useAppStore.setState({ compiledLogicJs: 'compiled' });
      render(<SimulateView />);
      expect(setLogicTs).not.toHaveBeenCalled();
      noDialog();
    });

    it('says so while compiling', () => {
      useAppStore.setState({ isCompiling: true });
      render(<SimulateView />);
      expect(setLogicTs).not.toHaveBeenCalled();
      expect(screen.getByText(SIMULATE.compiling)).toBeInTheDocument();
      noDialog();
      expect(screen.getByRole('button', { name: SIMULATE.send })).toBeDisabled();
    });
  });

  describe('when there is no logic', () => {
    beforeEach(() => {
      useAppStore.setState({ compiledLogicJs: null, executionHistory: [], executionState: '', editorLogicTs: '', logicTs: '' });
    });

    it('does not compile; shows the "no logic" dialog and "Stay here" dismisses it', async () => {
      render(<SimulateView />);
      expect(setLogicTs).not.toHaveBeenCalled();
      expect(screen.getByText(SIMULATE.blocked.noLogic.title)).toBeInTheDocument();
      expect(screen.getByText(SIMULATE.blocked.noLogic.body)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: SIMULATE.blocked.stay }));
      // antd keeps a closed Modal mounted and hides its wrapper
      await waitFor(() =>
        expect(screen.getByText(SIMULATE.blocked.noLogic.title).closest('.ant-modal-wrap')).toHaveStyle({ display: 'none' })
      );
      expect(screen.getByRole('button', { name: SIMULATE.send })).toBeDisabled();
      expect(screen.getByRole('button', { name: SIMULATE.restart })).toBeDisabled();
    });

    it('treats the untouched skeleton from the Logic step as no logic', () => {
      useAppStore.setState({ editorLogicTs: skeleton });
      render(<SimulateView />);
      expect(setLogicTs).not.toHaveBeenCalled();
      expect(screen.getByText(SIMULATE.blocked.noLogic.title)).toBeInTheDocument();
    });

    it('"Open the Logic step" opens it', () => {
      render(<SimulateView />);
      fireEvent.click(screen.getByRole('button', { name: SIMULATE.blocked.openLogic }));
      expect(useDesignV2Store.getState().view).toBe(STEP_ID.logic);
    });
  });

  describe('when the logic did not compile', () => {
    beforeEach(() => {
      useAppStore.setState({
        compiledLogicJs: null,
        executionHistory: [],
        executionState: '',
        compilationErrors: [{ message: "Cannot find name 'foo'." }],
      });
    });

    it('shows the error in a dialog and does not compile again', () => {
      render(<SimulateView />);
      expect(setLogicTs).not.toHaveBeenCalled();
      expect(screen.getByText(SIMULATE.blocked.failed.title)).toBeInTheDocument();
      expect(screen.getByText(SIMULATE.blocked.failed.body("Cannot find name 'foo'."))).toBeInTheDocument();
    });

    it('"Jump back to Logic" opens the Logic step', () => {
      render(<SimulateView />);
      fireEvent.click(screen.getByRole('button', { name: SIMULATE.blocked.jump }));
      expect(useDesignV2Store.getState().view).toBe(STEP_ID.logic);
    });
  });

  describe('with compiled logic', () => {
    it('does not show a dialog', () => {
      render(<SimulateView />);
      noDialog();
    });

    it('offers to initialise when there are no runs yet', () => {
      useAppStore.setState({ executionHistory: [], executionState: '' });
      render(<SimulateView />);
      expect(screen.getByText(SIMULATE.noRuns)).toBeInTheDocument();
      expect(screen.getByText(SIMULATE.stats(0, 0, 0))).toBeInTheDocument();
      expect(screen.getByRole('button', { name: SIMULATE.send })).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: SIMULATE.init }));
      expect(initContract).toHaveBeenCalledTimes(1);
    });

    it('lists every run with its summary and status, and follows the latest by default', () => {
      render(<SimulateView />);
      expect(screen.getByText(SIMULATE.stats(3, 2, 1))).toBeInTheDocument();
      const rows = runRows();
      expect(rows).toHaveLength(3);
      expect(rows[0]).toHaveTextContent(runSummary(initRun));
      expect(rows[0]).toHaveTextContent(SIMULATE.status.ok);
      expect(rows[2]).toHaveTextContent(runSummary(failedRun));
      expect(rows[2]).toHaveTextContent(SIMULATE.status.failed);
      expect(rows[2]).toHaveAttribute('aria-pressed', 'true');
      expect(rows[0]).toHaveAttribute('aria-pressed', 'false');
    });

    it('shows the error of the selected failed run in an Error tab and links to trigger()', () => {
      render(<SimulateView />);
      expect(screen.getByRole('tab', { name: SIMULATE.errorTab })).toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: SIMULATE.response })).toBeNull();
      expect(screen.getByText(failedRun.error!)).toBeInTheDocument();
      expect(screen.getByText(SIMULATE.thrownIn('trigger'))).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: SIMULATE.openTrigger }));
      expect(useDesignV2Store.getState().view).toBe(STEP_ID.logic);
    });

    it('the State tab of a failed run says the state is unchanged and still shows it', () => {
      render(<SimulateView />);
      fireEvent.click(screen.getByRole('tab', { name: SIMULATE.stateAfter }));
      expect(screen.getByText(SIMULATE.stateUnchanged)).toBeInTheDocument();
      const result = screen.getByRole('region', { name: SIMULATE.resultLabel });
      expect(result).toHaveTextContent('"totalPenalty": 210');
    });

    it('a request that was not valid JSON is shown as not sent', () => {
      useAppStore.setState({ executionHistory: [initRun, okRun, parseFailedRun] });
      render(<SimulateView />);
      expect(runRows()[2]).toHaveTextContent(SIMULATE.summary.invalidRequest);
      expect(screen.getByText(parseFailedRun.error!)).toBeInTheDocument();
      expect(screen.getByText(SIMULATE.notSent)).toBeInTheDocument();
      expect(screen.queryByText(SIMULATE.thrownIn('trigger'))).toBeNull();
    });

    it('selecting a run pins it and shows its request, response, state and events', () => {
      render(<SimulateView />);
      fireEvent.click(runRows()[1]);
      expect(useDesignV2Store.getState().selectedRunId).toBe('#1');
      expect(runRows()[1]).toHaveAttribute('aria-pressed', 'true');

      const request = screen.getByRole('region', { name: SIMULATE.request });
      expect(request).toHaveTextContent('"invoiceValue": 1000');
      const result = screen.getByRole('region', { name: SIMULATE.resultLabel });
      expect(screen.getByRole('tab', { name: SIMULATE.response })).toHaveAttribute('aria-selected', 'true');
      expect(result).toHaveTextContent('"penalty": 210');

      fireEvent.click(screen.getByRole('tab', { name: SIMULATE.stateAfter }));
      expect(result).toHaveTextContent('"count": 1');
      expect(screen.queryByText(SIMULATE.stateUnchanged)).toBeNull();

      fireEvent.click(screen.getByRole('tab', { name: SIMULATE.eventsTab(1) }));
      expect(result).toHaveTextContent('LatePaymentEvent');
    });

    it('the Events tab of a run without events says so', () => {
      useDesignV2Store.setState({ selectedRunId: 'init' });
      render(<SimulateView />);
      fireEvent.click(screen.getByRole('tab', { name: SIMULATE.eventsTab(0) }));
      expect(screen.getByText('No events emitted')).toBeInTheDocument();
    });

    it('Send runs the request through triggerContract and follows the new run', async () => {
      useDesignV2Store.setState({ selectedRunId: '#1' });
      render(<SimulateView />);
      fireEvent.click(screen.getByRole('button', { name: SIMULATE.send }));
      expect(triggerContract).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(useDesignV2Store.getState().selectedRunId).toBeNull());
    });

    it('Send is disabled until the contract is initialised', () => {
      useAppStore.setState({ executionState: '' });
      render(<SimulateView />);
      expect(screen.getByRole('button', { name: SIMULATE.send })).toBeDisabled();
    });

    it('the request editor edits requestJson', () => {
      render(<SimulateView />);
      fireEvent.change(screen.getByLabelText('request editor'), { target: { value: '{ "invoiceValue": 5 }' } });
      expect(useAppStore.getState().requestJson).toBe('{ "invoiceValue": 5 }');
    });

    it('restart re-initialises the contract', () => {
      render(<SimulateView />);
      fireEvent.click(screen.getByRole('button', { name: SIMULATE.restart }));
      expect(initContract).toHaveBeenCalledTimes(1);
    });

    it('re-run resends the selected run\'s request', async () => {
      useDesignV2Store.setState({ selectedRunId: '#1' });
      render(<SimulateView />);
      fireEvent.click(screen.getByRole('button', { name: SIMULATE.rerun }));
      await waitFor(() => expect(triggerContract).toHaveBeenCalledTimes(1));
      expect(JSON.parse(useAppStore.getState().requestJson)).toEqual(okRun.request);
    });

    it('re-run on the init run initialises again', () => {
      useDesignV2Store.setState({ selectedRunId: 'init' });
      render(<SimulateView />);
      fireEvent.click(screen.getByRole('button', { name: SIMULATE.rerun }));
      expect(initContract).toHaveBeenCalledTimes(1);
      expect(triggerContract).not.toHaveBeenCalled();
    });

    it('"reuse" copies an earlier request into the editor', async () => {
      render(<SimulateView />);
      fireEvent.click(screen.getByRole('button', { name: SIMULATE.reuseMenuLabel }));
      const item = await screen.findByText(`${okRun.id} · ${runSummary(okRun)}`);
      fireEvent.click(item);
      await waitFor(() => expect(JSON.parse(useAppStore.getState().requestJson)).toEqual(okRun.request));
    });

    it('hides "reuse" when there are no trigger runs', () => {
      useAppStore.setState({ executionHistory: [initRun] });
      render(<SimulateView />);
      expect(screen.queryByRole('button', { name: SIMULATE.reuseMenuLabel })).toBeNull();
    });
  });
});
