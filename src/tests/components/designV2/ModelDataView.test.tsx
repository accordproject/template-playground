import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModelDataView } from '../../../components/designV2/ModelDataView';
import { HELP_RAIL, MODEL_DATA, START, START_SAMPLES, sampleNameFor } from '../../../components/designV2/constants';
import useAppStore from '../../../store/store';
import useDesignV2Store from '../../../store/designV2Store';
import { SAMPLES } from '../../../samples';
import * as counter from '../../../samples/counterLogic';
import { NAME as BLANK_SAMPLE_NAME } from '../../../samples/blank';

/*
 * Monaco is replaced by a plain div: the view under test is the chrome around
 * the editors (file headers, status bars, format / copy / reset) and its
 * wiring to the app store, not the editors themselves.
 */
vi.mock('@monaco-editor/react', () => ({
  useMonaco: () => null,
  Editor: ({ language }: { language: string }) => <div data-testid={`monaco-${language}`} />,
}));

const counterData = JSON.stringify(counter.DATA, null, 2);

describe('sampleNameFor', () => {
  it('maps every Start card to its sample and the blank card to the blank sample', () => {
    for (const card of START_SAMPLES) {
      expect(sampleNameFor(card.name)).toBe(card.sampleName);
    }
    expect(sampleNameFor(START.blankName)).toBe(BLANK_SAMPLE_NAME);
    expect(SAMPLES.map((s) => s.NAME)).toContain(BLANK_SAMPLE_NAME);
  });

  it('returns undefined when nothing or something unknown is selected', () => {
    expect(sampleNameFor(null)).toBeUndefined();
    expect(sampleNameFor('not a card')).toBeUndefined();
  });
});

describe('ModelDataView', () => {
  const setModelCto = vi.fn().mockResolvedValue(undefined);
  const setData = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    useDesignV2Store.setState({ modelDataPanes: { model: true, data: true }, helpRailOpen: true });
    useAppStore.setState({
      sampleName: counter.NAME,
      samples: SAMPLES,
      editorModelCto: counter.MODEL,
      modelCto: counter.MODEL,
      editorAgreementData: counterData,
      data: counterData,
      error: undefined,
      // The real setters kick off a debounced rebuild; the wiring is what matters here.
      setModelCto,
      setData,
    });
  });

  const pane = (label: string) => within(screen.getByRole('region', { name: label }));

  it('shows model.cto and data.json side by side, each in its own editor', async () => {
    render(<ModelDataView />);
    const model = pane(MODEL_DATA.model.paneLabel);
    const data = pane(MODEL_DATA.data.paneLabel);
    expect(model.getByText(MODEL_DATA.model.file)).toBeInTheDocument();
    expect(model.getByRole('link', { name: `${MODEL_DATA.model.badge} ↗` })).toHaveAttribute(
      'href',
      MODEL_DATA.model.badgeHref
    );
    expect(data.getByText(MODEL_DATA.data.file)).toBeInTheDocument();
    expect(data.getByText(MODEL_DATA.data.badge)).toBeInTheDocument();
    // The editors are lazy-loaded, so they show up a tick after the chrome.
    expect(await model.findByTestId('monaco-concerto')).toBeInTheDocument();
    expect(await data.findByTestId('monaco-json')).toBeInTheDocument();
  });

  it('summarises the counter sample in both status bars', () => {
    render(<ModelDataView />);
    const model = pane(MODEL_DATA.model.paneLabel);
    expect(model.getByText(MODEL_DATA.model.ok)).toBeInTheDocument();
    expect(model.getByText('org.acme.counter@1.0.0')).toBeInTheDocument();
    expect(model.getByText(MODEL_DATA.model.template('CounterContract', 2))).toBeInTheDocument();

    const data = pane(MODEL_DATA.data.paneLabel);
    expect(data.getByText(MODEL_DATA.data.ok)).toBeInTheDocument();
    expect(data.getByText(MODEL_DATA.data.required(2, 2))).toBeInTheDocument();
  });

  it('routes a CTO error to the model pane and marks the data as not checked', () => {
    useAppStore.setState({ error: 'Invalid CTO model: Line 3 column 5' });
    render(<ModelDataView />);
    expect(pane(MODEL_DATA.model.paneLabel).getByText(/Invalid CTO model/)).toBeInTheDocument();
    expect(pane(MODEL_DATA.model.paneLabel).queryByText(MODEL_DATA.model.ok)).not.toBeInTheDocument();
    const data = pane(MODEL_DATA.data.paneLabel);
    expect(data.getByText(MODEL_DATA.data.notChecked)).toBeInTheDocument();
    expect(data.queryByText(MODEL_DATA.data.ok)).not.toBeInTheDocument();
  });

  it('routes a JSON or instance error to the data pane', () => {
    useAppStore.setState({ error: 'Invalid JSON data: Unexpected token' });
    render(<ModelDataView />);
    expect(pane(MODEL_DATA.data.paneLabel).getByText(/Invalid JSON data/)).toBeInTheDocument();
    expect(pane(MODEL_DATA.model.paneLabel).getByText(MODEL_DATA.model.ok)).toBeInTheDocument();
  });

  it('flags unparseable data and counts missing required fields', () => {
    useAppStore.setState({ editorAgreementData: '{ "owner": "Alice" }' });
    const { unmount } = render(<ModelDataView />);
    expect(pane(MODEL_DATA.data.paneLabel).getByText(MODEL_DATA.data.required(1, 2))).toBeInTheDocument();
    unmount();

    useAppStore.setState({ editorAgreementData: '{ not json' });
    render(<ModelDataView />);
    expect(pane(MODEL_DATA.data.paneLabel).getByText(new RegExp(MODEL_DATA.data.invalidJson))).toBeInTheDocument();
  });

  it('"format" pretty-prints the data through the store', () => {
    useAppStore.setState({ editorAgreementData: '{"$class":"x","owner":"Alice","maxCount":10}' });
    render(<ModelDataView />);
    fireEvent.click(pane(MODEL_DATA.data.paneLabel).getByRole('button', { name: MODEL_DATA.format }));
    const pretty = JSON.stringify({ $class: 'x', owner: 'Alice', maxCount: 10 }, null, 2);
    expect(useAppStore.getState().editorAgreementData).toBe(pretty);
    expect(setData).toHaveBeenCalledWith(pretty);
  });

  it('"reset" restores the loaded sample\'s data', () => {
    useAppStore.setState({ editorAgreementData: '{ "owner": "Bob" }' });
    render(<ModelDataView />);
    fireEvent.click(pane(MODEL_DATA.data.paneLabel).getByRole('button', { name: MODEL_DATA.reset }));
    expect(useAppStore.getState().editorAgreementData).toBe(counterData);
    expect(setData).toHaveBeenCalledWith(counterData);
  });

  it('"format" on the model re-prints the Concerto file through the store', () => {
    const messy = 'namespace org.acme.counter@1.0.0\n@template concept C {   o String owner }';
    useAppStore.setState({ editorModelCto: messy });
    render(<ModelDataView />);
    fireEvent.click(pane(MODEL_DATA.model.paneLabel).getByRole('button', { name: MODEL_DATA.format }));
    const formatted = useAppStore.getState().editorModelCto;
    expect(formatted).not.toBe(messy);
    expect(formatted).toContain('concept C');
    expect(setModelCto).toHaveBeenCalledWith(formatted);
  });

  it('closing a pane leaves the other one alone, and a chip brings it back', () => {
    render(<ModelDataView />);
    fireEvent.click(screen.getByRole('button', { name: MODEL_DATA.closePane(MODEL_DATA.data.file) }));
    expect(screen.queryByRole('region', { name: MODEL_DATA.data.paneLabel })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: MODEL_DATA.model.paneLabel })).toBeInTheDocument();
    expect(useDesignV2Store.getState().modelDataPanes).toEqual({ model: true, data: false });

    fireEvent.click(screen.getByRole('button', { name: MODEL_DATA.reopenPane(MODEL_DATA.data.file) }));
    expect(screen.getByRole('region', { name: MODEL_DATA.data.paneLabel })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: MODEL_DATA.reopenPane(MODEL_DATA.data.file) })
    ).not.toBeInTheDocument();
  });

  it('the last open pane cannot be closed', () => {
    useDesignV2Store.setState({ modelDataPanes: { model: false, data: true } });
    render(<ModelDataView />);
    const close = screen.getByRole('button', { name: MODEL_DATA.closePane(MODEL_DATA.data.file) });
    expect(close).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(close);
    expect(screen.getByRole('region', { name: MODEL_DATA.data.paneLabel })).toBeInTheDocument();
    expect(useDesignV2Store.getState().modelDataPanes).toEqual({ model: false, data: true });
    expect(
      screen.getByRole('button', { name: MODEL_DATA.reopenPane(MODEL_DATA.model.file) })
    ).toBeInTheDocument();
  });

  it('fills the help rail: live checklist, "why this step" note with links, "how it works" steps', () => {
    render(<ModelDataView />);
    const rail = within(screen.getByRole('complementary'));
    const checks = MODEL_DATA.help.checks;
    expect(rail.getByText(MODEL_DATA.help.checklistTitle)).toBeInTheDocument();
    expect(rail.getByText(HELP_RAIL.count(4, 4))).toBeInTheDocument();
    expect(rail.getByText(checks.templateConcept).closest('li')).toHaveClass('nd-check-done');
    expect(rail.getByText('CounterContract')).toBeInTheDocument();
    expect(rail.getByText('2/2')).toBeInTheDocument();

    expect(rail.getByText(MODEL_DATA.help.why.note)).toBeInTheDocument();
    for (const link of MODEL_DATA.help.why.links) {
      expect(rail.getByRole('link', { name: `↗ ${link.label}` })).toHaveAttribute('href', link.href);
    }

    fireEvent.click(rail.getByRole('tab', { name: HELP_RAIL.tabHow }));
    for (const step of MODEL_DATA.help.how) {
      expect(rail.getByText(step)).toBeInTheDocument();
    }
  });

  it('the checklist reflects errors and missing fields', () => {
    useAppStore.setState({ error: 'Invalid CTO model: Line 3', editorAgreementData: '{ "owner": "Alice" }' });
    render(<ModelDataView />);
    const rail = within(screen.getByRole('complementary'));
    const checks = MODEL_DATA.help.checks;
    expect(rail.getByText(checks.modelParses).closest('li')).toHaveClass('nd-check-error');
    // A broken model means the data cannot be checked: not green, not red.
    expect(rail.getByText(checks.dataValid).closest('li')).toHaveClass('nd-check-todo');
    expect(rail.getByText(checks.needsModel)).toBeInTheDocument();
    expect(rail.getByText(checks.requiredFields).closest('li')).toHaveClass('nd-check-todo');
    expect(rail.getByText('1/2')).toBeInTheDocument();
    expect(rail.getByText(HELP_RAIL.count(1, 4))).toBeInTheDocument();
  });

  it('the help rail can be closed and brought back with the "? Help" chip', () => {
    render(<ModelDataView />);
    fireEvent.click(screen.getByRole('button', { name: HELP_RAIL.close }));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(useDesignV2Store.getState().helpRailOpen).toBe(false);
    // Both editors keep working without the rail.
    expect(screen.getByRole('region', { name: MODEL_DATA.model.paneLabel })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: MODEL_DATA.data.paneLabel })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: HELP_RAIL.reopen }));
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: HELP_RAIL.reopen })).not.toBeInTheDocument();
  });

  it('"copy" writes the model to the clipboard', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<ModelDataView />);
    fireEvent.click(pane(MODEL_DATA.model.paneLabel).getByRole('button', { name: MODEL_DATA.copy }));
    expect(writeText).toHaveBeenCalledWith(counter.MODEL);
  });
});
