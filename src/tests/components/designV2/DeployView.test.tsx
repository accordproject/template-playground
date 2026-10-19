import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { DirectoryHandle } from '../../../utils/saveToFolder';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { message } from 'antd';
import { DeployView, agreementText } from '../../../components/designV2/DeployView';
import { DEPLOY, DEPLOY_CARDS, URLS } from '../../../components/designV2/constants';
import useAppStore from '../../../store/store';
import { decompress } from '../../../utils/compression/compression';
import * as latePayment from '../../../samples/latePaymentPenalty';

/** html2pdf.js draws with a real canvas; record what it is asked to do instead. */
const pdf = vi.hoisted(() => {
  const calls: { options?: Record<string, unknown>; source?: HTMLElement; saved: number } = { saved: 0 };
  const worker = {
    set: (options: Record<string, unknown>) => ((calls.options = options), worker),
    from: (source: HTMLElement) => ((calls.source = source), worker),
    save: () => (calls.saved++, Promise.resolve()),
  };
  return { calls, html2pdf: () => worker };
});
vi.mock('html2pdf.js', () => ({ default: pdf.html2pdf }));

/** Building or reading an archive loads Concerto, which is slow on a busy CI runner. */
const SLOW = { timeout: 15_000 };

describe('DeployView', () => {
  beforeEach(() => {
    useAppStore.setState({
      agreementHtml: '<p>Stale</p>',
      renderAgreement: vi.fn().mockResolvedValue('<p>Hello <b>Ana</b></p>'),
      sampleName: 'My Template',
      error: undefined,
    });
  });

  it('gives every card a description', () => {
    expect(DEPLOY_CARDS).toHaveLength(8);
    for (const card of DEPLOY_CARDS) expect(card.description.trim().length, card.title).toBeGreaterThan(20);
    render(<DeployView />);
    for (const card of DEPLOY_CARDS) {
      expect(screen.getByRole('heading', { name: card.title })).toBeInTheDocument();
      expect(screen.getByText(card.description)).toBeInTheDocument();
      expect(card.details.length, card.title).toBeGreaterThanOrEqual(2);
    }
    for (const group of DEPLOY.groups) {
      expect(screen.getByRole('region', { name: group.title })).toBeInTheDocument();
    }
  });

  it('names each button by its visible label', () => {
    render(<DeployView />);
    for (const card of DEPLOY_CARDS) {
      const card_ = within(screen.getByRole('article', { name: card.title }));
      const control = card.href ? card_.getByRole('link') : card_.getByRole('button');
      expect(control.getAttribute('aria-label') ?? control.textContent).toMatch(new RegExp(`^${card.button}`));
    }
  });

  it('opens docs-only cards in a new tab', () => {
    render(<DeployView />);
    for (const card of DEPLOY_CARDS.filter((c) => 'href' in c)) {
      const link = within(screen.getByRole('article', { name: card.title })).getByRole('link', { name: new RegExp(`^${card.button}`) });
      expect(link).toHaveAttribute('href', 'href' in card ? card.href : '');
      expect(link).toHaveAttribute('target', '_blank');
    }
    expect(DEPLOY_CARDS.filter((c) => 'href' in c).map((c) => c.title)).toEqual([
      'Deploy to an APAP server',
      'Embed in your app',
      'Deploy to an MCP server',
    ]);
  });

  it('copies the rendered agreement text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<DeployView />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy text' }));
    await waitFor(() => expect(writeText).toHaveBeenCalled(), SLOW);
    // Rendered afresh, not the agreementHtml still catching up with an edit.
    expect(String((writeText.mock.calls as unknown[][])[0][0])).toBe('Hello Ana');
  }, 30_000);

  it('downloads the template as a .cta named after the template', async () => {
    const created: Blob[] = [];
    URL.createObjectURL = vi.fn((b: Blob) => (created.push(b), 'blob:x'));
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<DeployView />);
    fireEvent.click(screen.getByRole('button', { name: 'Download .cta' }));
    await waitFor(() => expect(click).toHaveBeenCalled(), SLOW);
    expect(created[0].size).toBeGreaterThan(100);
    click.mockRestore();
  }, 30_000);

  it('exports the logic as edited, not the last compiled one', async () => {
    const zips: Blob[] = [];
    URL.createObjectURL = vi.fn((b: Blob) => (zips.push(b), 'blob:x'));
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    useAppStore.setState({ logicTs: 'old', editorLogicTs: 'class Edited {}' });
    render(<DeployView />);
    fireEvent.click(screen.getByRole('button', { name: 'Download .cta' }));
    await waitFor(() => expect(click).toHaveBeenCalled(), SLOW);
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(
      await new Promise<ArrayBuffer>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(zips[0]);
      }),
    );
    expect(await zip.file('logic/logic.ts')!.async('string')).toBe('class Edited {}');
    click.mockRestore();
  }, 30_000);

  it('keeps paragraph and line breaks in the copied text', () => {
    expect(agreementText('<h1>Title</h1><p>First</p><p>Second<br>line two</p><ul><li>a</li><li>b</li></ul>')).toBe(
      'Title\n\nFirst\n\nSecond\nline two\n\na\n\nb'
    );
    expect(agreementText('<table><tr><th>Currency</th><th>Amount</th></tr><tr><td>USD</td><td>100</td></tr></table>')).toBe(
      'Currency\tAmount\n\nUSD\t100'
    );
    // An empty edge cell keeps its column.
    expect(agreementText('<table><tr><td></td><td>100</td></tr><tr><td>Total</td><td></td></tr></table>')).toBe('\t100\n\nTotal\t');
  });

  it('starts the clipboard write inside the click, for Safari', async () => {
    let resolveRender: (html: string) => void = () => undefined;
    useAppStore.setState({ renderAgreement: () => new Promise<string>((r) => (resolveRender = r)) });
    const items: { types: Record<string, Promise<Blob>> }[] = [];
    const write = vi.fn((list: { types: Record<string, Promise<Blob>> }[]) => {
      items.push(...list);
      return Promise.all(list.map((i) => i.types['text/plain'])).then(() => undefined);
    });
    Object.assign(navigator, { clipboard: { write, writeText: vi.fn() } });
    vi.stubGlobal('ClipboardItem', class {
      constructor(public types: Record<string, Promise<Blob>>) {}
    });
    render(<DeployView />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy text' }));
    // Called synchronously from the click, before the render finished.
    expect(write).toHaveBeenCalledTimes(1);
    resolveRender('<p>Hello <b>Bob</b></p>');
    const blob = await items[0].types['text/plain'];
    const text = await new Promise<string>((r) => {
      const reader = new FileReader();
      reader.onload = () => r(String(reader.result));
      reader.readAsText(blob);
    });
    expect(text).toBe('Hello Bob');
    vi.unstubAllGlobals();
  }, 30_000);

  it('downloads the freshly rendered, sanitised agreement as an A4 PDF', async () => {
    pdf.calls.saved = 0;
    useAppStore.setState({
      renderAgreement: vi.fn().mockResolvedValue('<p>Signed by <b>Bob</b></p><img src="x" onerror="alert(1)">'),
    });
    render(<DeployView />);
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    await waitFor(() => expect(pdf.calls.saved).toBe(1), SLOW);
    expect(pdf.calls.source?.textContent).toBe('Signed by Bob');
    expect(pdf.calls.source?.innerHTML).not.toContain('onerror');
    expect(pdf.calls.options).toMatchObject({
      filename: 'agreement.pdf',
      html2canvas: { useCORS: true },
      jsPDF: { format: 'a4' },
    });
  });

  it('does not produce a PDF when the current sources do not render', async () => {
    pdf.calls.saved = 0;
    const error = vi.spyOn(message, 'error');
    useAppStore.setState({ renderAgreement: vi.fn().mockRejectedValue(new Error('bad data')) });
    render(<DeployView />);
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    await waitFor(() => expect(error).toHaveBeenCalled(), SLOW);
    expect(String(error.mock.calls[0][0])).toContain('bad data');
    expect(pdf.calls.saved).toBe(0);
    error.mockRestore();
  });

  describe('Share link', () => {
    const linkFrom = async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });
      render(<DeployView />);
      fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
      await waitFor(() => expect(writeText).toHaveBeenCalled(), SLOW);
      const url = String((writeText.mock.calls as unknown[][])[0][0]);
      expect(url.startsWith(`${window.location.origin}/#data=`)).toBe(true);
      return decompress(url.split('#data=')[1]);
    };

    beforeEach(() => {
      useAppStore.setState({
        templateMarkdown: 'Hello {{name}}',
        modelCto: 'namespace org.example@1.0.0',
        data: '{"name":"Bob"}',
        logicTs: 'class Old {}',
        editorLogicTs: 'class Edited {}',
        agreementHtml: '<p>Hello Alice, confidential</p>',
        renderAgreement: vi.fn().mockResolvedValue('<p>Hello Bob</p>'),
      });
    });

    it('carries the current sources, the edited logic and a freshly rendered agreement', async () => {
      const payload = await linkFrom();
      expect(payload).toMatchObject({
        templateMarkdown: 'Hello {{name}}',
        modelCto: 'namespace org.example@1.0.0',
        data: '{"name":"Bob"}',
        logicTs: 'class Edited {}',
        agreementHtml: '<p>Hello Bob</p>',
      });
      expect(JSON.stringify(payload)).not.toContain('confidential');
    }, 30_000);

    it('leaves deleted logic out', async () => {
      useAppStore.setState({ editorLogicTs: '' });
      expect((await linkFrom()).logicTs).toBeUndefined();
    }, 30_000);

    it('never falls back to the stale agreement when the sources do not render', async () => {
      useAppStore.setState({ renderAgreement: vi.fn().mockRejectedValue(new Error('bad data')) });
      const payload = await linkFrom();
      expect(payload.agreementHtml).toBeUndefined();
      expect(JSON.stringify(payload)).not.toContain('confidential');
    }, 30_000);
  });

  it('refuses to export when the current sources do not render', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    useAppStore.setState({ renderAgreement: vi.fn().mockRejectedValue(new Error('Unexpected token in data.json')) });
    render(<DeployView />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy text' }));
    expect(await screen.findByText(new RegExp(DEPLOY.renderError.slice(0, 30)), undefined, SLOW)).toBeInTheDocument();
    expect(writeText).not.toHaveBeenCalled();
  }, 30_000);

  describe('Open in vscode.dev', () => {
    const files: string[] = [];
    const dir = (name: string): DirectoryHandle => ({
      name,
      getDirectoryHandle: (child: string, options?: { create?: boolean }) =>
        options?.create ? Promise.resolve(dir(`${name}/${child}`)) : Promise.reject(new DOMException('missing', 'NotFoundError')),
      getFileHandle: (file: string) =>
        Promise.resolve({
          createWritable: () =>
            Promise.resolve({ write: () => Promise.resolve(files.push(`${name}/${file}`)).then(() => undefined), close: () => Promise.resolve() }),
        }),
    });
    const open = vi.fn();

    beforeEach(() => {
      files.length = 0;
      open.mockReset();
      vi.stubGlobal('open', open);
    });
    afterEach(() => {
      vi.unstubAllGlobals();
      delete (window as { showDirectoryPicker?: unknown }).showDirectoryPicker;
    });

    it('opens the folder picker inside the click, then saves the template there', async () => {
      const picker = vi.fn().mockResolvedValue(dir('Documents'));
      Object.assign(window, { showDirectoryPicker: picker });
      const success = vi.spyOn(message, 'success');
      render(<DeployView />);
      fireEvent.click(screen.getByRole('button', { name: '1. Save as folder' }));
      // Synchronously from the click, before the archive is built (user activation).
      expect(picker).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(success).toHaveBeenCalled(), SLOW);
      // vscode.dev is the card's own link, not a pop-up after the save.
      expect(open).not.toHaveBeenCalled();
      success.mockRestore();
      expect(files).toEqual(expect.arrayContaining([
        'Documents/my-template/package.json',
        'Documents/my-template/text/grammar.tem.md',
        'Documents/my-template/model/model.cto',
      ]));
    }, 30_000);

    it('does nothing when the folder picker is closed', async () => {
      const picker = vi.fn().mockRejectedValue(new DOMException('closed', 'AbortError'));
      Object.assign(window, { showDirectoryPicker: picker });
      const error = vi.spyOn(message, 'error');
      const success = vi.spyOn(message, 'success');
      render(<DeployView />);
      const button = screen.getByRole('button', { name: '1. Save as folder' });
      fireEvent.click(button);
      await waitFor(() => expect(picker).toHaveBeenCalled(), SLOW);
      await waitFor(() => expect(button).not.toBeDisabled(), SLOW);
      expect(open).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(success).not.toHaveBeenCalled();
      error.mockRestore();
      success.mockRestore();
    }, 30_000);

    it('downloads a .cta and explains when the browser cannot save folders', async () => {
      URL.createObjectURL = vi.fn(() => 'blob:x');
      URL.revokeObjectURL = vi.fn();
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
      render(<DeployView />);
      fireEvent.click(screen.getByRole('button', { name: '1. Save as folder' }));
      expect(await screen.findByText(DEPLOY.noFolderSupport, undefined, SLOW)).toBeInTheDocument();
      expect(click).toHaveBeenCalled();
      click.mockRestore();
    }, 30_000);

    it('also links straight to vscode.dev', () => {
      render(<DeployView />);
      const link = within(screen.getByRole('article', { name: 'Open in vscode.dev' })).getByRole('link', { name: /^2\. Open vscode\.dev/ });
      expect(link).toHaveAttribute('href', URLS.vscodeDev);
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('Download template archive', () => {
    const saved: { blob: Blob; fileName: string }[] = [];
    let click: { mockRestore: () => void };

    beforeEach(() => {
      saved.length = 0;
      const blobs = new Map<string, Blob>();
      // jsdom has no object URLs: record each Blob under a made-up one.
      URL.createObjectURL = vi.fn((blob: Blob) => {
        const url = `blob:test/${blobs.size}`;
        blobs.set(url, blob);
        return url;
      });
      URL.revokeObjectURL = vi.fn();
      click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        saved.push({ blob: blobs.get(this.href)!, fileName: this.download });
      });
      useAppStore.setState({
        sampleName: latePayment.NAME,
        templateMarkdown: latePayment.TEMPLATE,
        modelCto: latePayment.MODEL,
        logicTs: latePayment.LOGIC,
        editorLogicTs: latePayment.LOGIC + '\n// edited',
      });
    });
    afterEach(() => click.mockRestore());

    const download = async () => {
      render(<DeployView />);
      fireEvent.click(screen.getByRole('button', { name: 'Download .cta' }));
      await waitFor(() => expect(saved).toHaveLength(1), SLOW);
      const buffer = await new Promise<ArrayBuffer>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(saved[0].blob);
      });
      const JSZip = (await import('jszip')).default;
      return { fileName: saved[0].fileName, zip: await JSZip.loadAsync(buffer) };
    };

    it('saves a .cta named after the sample, with the text, model and the edited logic', async () => {
      const { fileName, zip } = await download();
      expect(fileName).toBe('late-payment-penalty-with-logic.cta');
      expect(await zip.file('text/grammar.tem.md')!.async('string')).toBe(latePayment.TEMPLATE);
      expect(await zip.file('model/model.cto')!.async('string')).toBe(latePayment.MODEL);
      expect(await zip.file('logic/logic.ts')!.async('string')).toBe(latePayment.LOGIC + '\n// edited');
    }, 30_000);

    it('leaves logic out of a template without logic', async () => {
      useAppStore.setState({ logicTs: '', editorLogicTs: '' });
      const { zip } = await download();
      expect(zip.file('logic/logic.ts')).toBeNull();
    }, 30_000);
  });
});
