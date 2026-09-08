import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModelDataView } from '../../../components/designV2/ModelDataView';
import { MODEL_DATA, START, START_SAMPLES, sampleNameFor } from '../../../components/designV2/constants';
import useAppStore from '../../../store/store';
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
    expect(model.getByText(MODEL_DATA.model.badge)).toBeInTheDocument();
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

  it('routes a CTO error to the model pane and leaves the data pane green', () => {
    useAppStore.setState({ error: 'Invalid CTO model: Line 3 column 5' });
    render(<ModelDataView />);
    expect(pane(MODEL_DATA.model.paneLabel).getByText(/Invalid CTO model/)).toBeInTheDocument();
    expect(pane(MODEL_DATA.model.paneLabel).queryByText(MODEL_DATA.model.ok)).not.toBeInTheDocument();
    expect(pane(MODEL_DATA.data.paneLabel).getByText(MODEL_DATA.data.ok)).toBeInTheDocument();
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

  it('"copy" writes the model to the clipboard', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<ModelDataView />);
    fireEvent.click(pane(MODEL_DATA.model.paneLabel).getByRole('button', { name: MODEL_DATA.copy }));
    expect(writeText).toHaveBeenCalledWith(counter.MODEL);
  });
});
