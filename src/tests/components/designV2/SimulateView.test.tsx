import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { message } from 'antd';
import '@testing-library/jest-dom';
import SimulateView from '../../../components/designV2/SimulateView';
import useAppStore from '../../../store/store';
import useDesignV2Store from '../../../store/designV2Store';
import { SIMULATE } from '../../../components/designV2/constants';
import { pretty, runSummary } from '../../../components/designV2/simulateRuns';
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
 * Covers the Simulate step: the "no logic" dialog, the runs list fed by
 * executionHistory, run selection, the request / response detail and the
 * Send / restart / re-run actions that call into the legacy runner. The
 * logic is compiled before the step opens (DesignV2Layout.test covers that).
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
  const noDialog = () => expect(screen.queryByText(SIMULATE.blocked.title)).toBeNull();

  it('never compiles on its own — that happens before the step opens', () => {
    useAppStore.setState({ compiledLogicJs: null, editorLogicTs: 'class X {}' });
    render(<SimulateView />);
    expect(setLogicTs).not.toHaveBeenCalled();
  });

  describe('when there is no logic', () => {
    beforeEach(() => {
      useAppStore.setState({ compiledLogicJs: null, executionHistory: [], executionState: '', editorLogicTs: '', logicTs: '' });
    });

    it('shows the "no logic" dialog and "Stay here" dismisses it', async () => {
      render(<SimulateView />);
      expect(screen.getByText(SIMULATE.blocked.title)).toBeInTheDocument();
      expect(screen.getByText(SIMULATE.blocked.body)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: SIMULATE.blocked.stay }));
      // antd keeps a closed Modal mounted and hides its wrapper
      await waitFor(() =>
        expect(screen.getByText(SIMULATE.blocked.title).closest('.ant-modal-wrap')).toHaveStyle({ display: 'none' })
      );
      expect(screen.getByRole('button', { name: SIMULATE.send })).toBeDisabled();
      expect(screen.getByRole('button', { name: SIMULATE.restart })).toBeDisabled();
    });

    it('treats the untouched skeleton from the Logic step as no logic', () => {
      useAppStore.setState({ editorLogicTs: skeleton });
      render(<SimulateView />);
      expect(screen.getByText(SIMULATE.blocked.title)).toBeInTheDocument();
    });

    it('"Open the Logic step" opens it', () => {
      render(<SimulateView />);
      fireEvent.click(screen.getByRole('button', { name: SIMULATE.blocked.openLogic }));
      expect(useDesignV2Store.getState().view).toBe(STEP_ID.logic);
    });
  });

  describe('with compiled logic', () => {
    describe('copy', () => {
      let clipboardDescriptor: PropertyDescriptor | undefined;
      const copyButton = () => within(screen.getByRole('region', { name: SIMULATE.request })).getByRole('button');

      beforeEach(() => {
        clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
        Object.defineProperty(navigator, 'clipboard', { configurable: true, writable: true, value: undefined });
        vi.spyOn(message, 'error').mockImplementation(vi.fn());
        vi.useFakeTimers();
        useDesignV2Store.setState({ selectedRunId: okRun.id });
      });

      afterEach(() => {
        if (clipboardDescriptor) Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
        else Reflect.deleteProperty(navigator, 'clipboard');
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
      });

      it('reports failure when the Clipboard API is unavailable', async () => {
        render(<SimulateView />);
        await act(() => { fireEvent.click(copyButton()); return Promise.resolve(); });
        expect(message.error).toHaveBeenCalledWith(SIMULATE.copyFailed);
        expect(copyButton()).toHaveTextContent(SIMULATE.requestActions);
      });

      it('starts the confirmation timer only after the pending write succeeds', async () => {
        let resolveWrite!: () => void;
        const pendingWrite = new Promise<void>((resolve) => { resolveWrite = resolve; });
        const writeText = vi.fn(() => pendingWrite);
        Object.assign(navigator, { clipboard: { writeText } });
        render(<SimulateView />);
        fireEvent.click(copyButton());
        expect(writeText).toHaveBeenCalledWith(pretty(okRun.request));
        expect(copyButton()).toHaveTextContent(SIMULATE.requestActions);

        act(() => { vi.advanceTimersByTime(2400); });
        expect(copyButton()).toHaveTextContent(SIMULATE.requestActions);
        expect(message.error).not.toHaveBeenCalled();

        await act(() => { resolveWrite(); return pendingWrite; });
        expect(copyButton()).toHaveTextContent(SIMULATE.copied);
        act(() => { vi.advanceTimersByTime(1199); });
        expect(copyButton()).toHaveTextContent(SIMULATE.copied);
        act(() => { vi.advanceTimersByTime(1); });
        expect(copyButton()).toHaveTextContent(SIMULATE.requestActions);
      });

      it('handles a rejected write without showing a copied confirmation', async () => {
        const writeText = vi.fn().mockRejectedValue(new DOMException('Clipboard denied', 'NotAllowedError'));
        Object.assign(navigator, { clipboard: { writeText } });
        render(<SimulateView />);
        await act(() => { fireEvent.click(copyButton()); return Promise.resolve(); });
        expect(message.error).toHaveBeenCalledWith(SIMULATE.copyFailed);
        expect(copyButton()).toHaveTextContent(SIMULATE.requestActions);
      });

      it('copies the exact selected request and confirms success', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, { clipboard: { writeText } });
        render(<SimulateView />);
        await act(() => { fireEvent.click(copyButton()); return Promise.resolve(); });
        expect(writeText).toHaveBeenCalledTimes(1);
        expect(writeText).toHaveBeenCalledWith(pretty(okRun.request));
        expect(copyButton()).toHaveTextContent(SIMULATE.copied);
        expect(message.error).not.toHaveBeenCalled();
      });

      it('allows a successful retry after a rejected write', async () => {
        const writeText = vi.fn()
          .mockRejectedValueOnce(new DOMException('Clipboard denied', 'NotAllowedError'))
          .mockResolvedValueOnce(undefined);
        Object.assign(navigator, { clipboard: { writeText } });
        render(<SimulateView />);
        await act(() => { fireEvent.click(copyButton()); return Promise.resolve(); });
        expect(message.error).toHaveBeenCalledTimes(1);
        expect(copyButton()).toHaveTextContent(SIMULATE.requestActions);

        await act(() => { fireEvent.click(copyButton()); return Promise.resolve(); });
        expect(writeText).toHaveBeenCalledTimes(2);
        expect(writeText).toHaveBeenNthCalledWith(1, pretty(okRun.request));
        expect(writeText).toHaveBeenNthCalledWith(2, pretty(okRun.request));
        expect(copyButton()).toHaveTextContent(SIMULATE.copied);
        expect(message.error).toHaveBeenCalledTimes(1);
      });

      it('does not confirm an old copy on a newly selected run', async () => {
        let resolveWrite!: () => void;
        const pendingWrite = new Promise<void>((resolve) => { resolveWrite = resolve; });
        const writeText = vi.fn(() => pendingWrite);
        Object.assign(navigator, { clipboard: { writeText } });
        render(<SimulateView />);
        fireEvent.click(copyButton());
        fireEvent.click(runRows()[0]);
        await act(() => { resolveWrite(); return pendingWrite; });
        expect(writeText).toHaveBeenCalledWith(pretty(okRun.request));
        expect(copyButton()).toHaveTextContent(SIMULATE.requestActions);
        expect(message.error).not.toHaveBeenCalled();
      });
    });

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
