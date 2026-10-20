import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import JSZip from 'jszip';
import ImportTemplates from '../../../components/designV2/ImportTemplates';
import useAppStore from '../../../store/store';
import useDesignV2Store from '../../../store/designV2Store';
import { STEPS } from '../../../types/designV2.types';
import { IMPORT } from '../../../components/designV2/constants';
import * as blank from '../../../samples/blank';

const makeArchive = async () => {
  const zip = new JSZip();
  zip.file('package.json', JSON.stringify({ name: 'imported-nda' }));
  zip.file('text/grammar.tem.md', 'Hello {{exampleField}}');
  zip.file('model/model.cto', blank.MODEL);
  zip.file('data.json', JSON.stringify(blank.DATA));
  return zip.generateAsync({ type: 'uint8array' });
};

/** Building or reading an archive loads Concerto, which is slow on a busy CI runner. */
const SLOW = { timeout: 15_000 };

describe('ImportTemplates', () => {
  const loadImportedTemplate = vi.fn().mockResolvedValue(undefined);
  beforeEach(() => {
    loadImportedTemplate.mockClear();
    useAppStore.setState({ loadImportedTemplate });
    useDesignV2Store.setState({ selectedTemplate: null });
    useDesignV2Store.getState().start();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads an uploaded .cta and opens the next step', async () => {
    render(<ImportTemplates />);
    const bytes = await makeArchive();
    const file = new File([bytes as BlobPart], 'nda.cta');
    Object.defineProperty(file, 'arrayBuffer', { value: () => Promise.resolve(bytes.buffer) });
    fireEvent.change(screen.getByLabelText(IMPORT.upload.inputLabel), { target: { files: [file] } });
    await waitFor(() => expect(loadImportedTemplate).toHaveBeenCalled(), SLOW);
    expect((loadImportedTemplate.mock.calls as unknown[][])[0][0]).toMatchObject({ name: 'imported-nda', templateMarkdown: 'Hello {{exampleField}}' });
    expect(useDesignV2Store.getState().selectedTemplate).toBe('imported-nda');
    expect(useDesignV2Store.getState().view).toBe(STEPS[1].id);
  }, 30_000);

  it('does not change the template when the file is not an archive', async () => {
    render(<ImportTemplates />);
    const file = new File(['nope'], 'x.cta');
    Object.defineProperty(file, 'arrayBuffer', { value: () => Promise.resolve(new TextEncoder().encode('nope').buffer) });
    fireEvent.change(screen.getByLabelText(IMPORT.upload.inputLabel), { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText(/not a template archive/)).toBeInTheDocument(), SLOW);
    expect(loadImportedTemplate).not.toHaveBeenCalled();
  }, 30_000);

  it('imports from a URL', async () => {
    const bytes = await makeArchive();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(bytes.buffer) });
    vi.stubGlobal('fetch', fetchMock);
    render(<ImportTemplates />);
    fireEvent.click(screen.getByRole('button', { name: IMPORT.url.button }));
    fireEvent.change(await screen.findByLabelText(IMPORT.url.label, undefined, SLOW), { target: { value: 'https://example.org/a/nda@1.0.0.cta' } });
    fireEvent.click(screen.getByRole('button', { name: IMPORT.url.submit }));
    await waitFor(() => expect(loadImportedTemplate).toHaveBeenCalled(), SLOW);
    expect(fetchMock).toHaveBeenCalledWith('https://example.org/a/nda@1.0.0.cta');
  }, 30_000);

  it('keeps the selection with the imported template when the dialog is closed while it loads', async () => {
    const bytes = await makeArchive();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(bytes.buffer) }));
    // The sources are replaced at once; rendering and compiling take a while.
    let finishLoading!: () => void;
    loadImportedTemplate.mockImplementationOnce(() => new Promise<void>((resolve) => { finishLoading = resolve; }));
    render(<ImportTemplates />);
    fireEvent.click(screen.getByRole('button', { name: IMPORT.url.button }));
    fireEvent.change(await screen.findByLabelText(IMPORT.url.label, undefined, SLOW), { target: { value: 'https://example.org/a/nda@1.0.0.cta' } });
    fireEvent.click(screen.getByRole('button', { name: IMPORT.url.submit }));
    await waitFor(() => expect(loadImportedTemplate).toHaveBeenCalled(), SLOW);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    finishLoading();
    await waitFor(() => expect(useDesignV2Store.getState().selectedTemplate).toBe('imported-nda'));
    // Closing skipped the move to the next step, not the selection.
    expect(useDesignV2Store.getState().view).toBe(STEPS[0].id);
  }, 30_000);

  it('does not close a reopened dialog when an earlier, cancelled import finishes', async () => {
    const bytes = await makeArchive();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(bytes.buffer) }));
    let finishLoading!: () => void;
    loadImportedTemplate.mockImplementationOnce(() => new Promise<void>((resolve) => { finishLoading = resolve; }));
    render(<ImportTemplates />);
    fireEvent.click(screen.getByRole('button', { name: IMPORT.url.button }));
    fireEvent.change(await screen.findByLabelText(IMPORT.url.label, undefined, SLOW), { target: { value: 'https://example.org/a/nda@1.0.0.cta' } });
    fireEvent.click(screen.getByRole('button', { name: IMPORT.url.submit }));
    await waitFor(() => expect(loadImportedTemplate).toHaveBeenCalled(), SLOW);

    // Close, then reopen the dialog before the first import has finished.
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: IMPORT.url.button }));
    expect(await screen.findByLabelText(IMPORT.url.label, undefined, SLOW)).toBeInTheDocument();
    finishLoading();
    await waitFor(() => expect(useDesignV2Store.getState().selectedTemplate).toBe('imported-nda'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    // The reopened dialog is still open (antd removes a closed one from the DOM at once here).
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  }, 30_000);

  it('lists only compatible templates, filters like the hosted library and imports the chosen one', async () => {
    const bytes = await makeArchive();
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        url.endsWith('template-library.json')
          ? { ok: true, json: () => Promise.resolve({
              'helloworld@0.14.0': { name: 'helloworld', version: '0.14.0', description: 'Ergo hello', ciceroVersion: '^0.20.0', tags: ['reference'] },
              'helloworld@1.0.0': { name: 'helloworld', displayName: 'Hello World', version: '1.0.0', description: 'Say hello', ciceroVersion: '^2.0.0', type: 1, tags: ['reference'] },
              'late-fees@0.9.0': { name: 'late-fees', displayName: 'Late Fees', version: '0.9.0', description: 'Penalty clause', ciceroVersion: '^1.0.0', type: 0, tags: ['finance'] },
              'late-fees@1.0.0': { name: 'late-fees', displayName: 'Late Fees', version: '1.0.0', description: 'Penalty clause', ciceroVersion: '^2.0.0', type: 0, tags: ['finance'] },
              'old@1.0.0': { name: 'old', displayName: 'Old One', version: '1.0.0', description: 'Retired', ciceroVersion: '^2.0.0', archived: true, tags: ['finance'] },
            }) }
          : { ok: true, arrayBuffer: () => Promise.resolve(bytes.buffer) }
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<ImportTemplates />);
    fireEvent.click(screen.getByRole('button', { name: IMPORT.library.button }));
    // Newest compatible version only; the Ergo-era 0.14.0 and the archived template are hidden.
    expect(await screen.findByText(IMPORT.library.count(2), undefined, SLOW)).toBeInTheDocument();
    expect(screen.queryByText('Ergo hello')).not.toBeInTheDocument();
    expect(screen.queryByText('Old One')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'finance' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'reference' })).toBeInTheDocument();

    fireEvent.click(screen.getByText(IMPORT.library.showArchived));
    expect(await screen.findByText('Old One', undefined, SLOW)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: IMPORT.library.archived })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(IMPORT.library.search), { target: { value: 'penalty' } });
    expect(screen.queryByText('Hello World')).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: IMPORT.library.pick('Late Fees', '1.0.0') }, SLOW));
    await waitFor(() => expect(loadImportedTemplate).toHaveBeenCalled(), SLOW);
    expect(fetchMock).toHaveBeenCalledWith('https://templates.accordproject.org/archives/late-fees@1.0.0.cta');
  }, 30_000);
});
