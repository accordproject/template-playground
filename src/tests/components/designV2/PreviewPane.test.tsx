import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { message } from 'antd';
import PreviewPane from '../../../components/designV2/PreviewPane';
import { PREVIEW } from '../../../components/designV2/constants';
import useAppStore from '../../../store/store';

/*
 * The preview shows the agreement the store last rendered, sanitised, and
 * saves it as a PDF; before anything has rendered it says why it is empty.
 */
const html2pdf = vi.hoisted(() => {
  const chain = { set: vi.fn(), from: vi.fn(), save: vi.fn() };
  chain.set.mockReturnValue(chain);
  chain.from.mockReturnValue(chain);
  chain.save.mockResolvedValue(undefined);
  return { chain, factory: vi.fn(() => chain) };
});
vi.mock('html2pdf.js', () => ({ default: html2pdf.factory }));

const renderPane = () => render(<PreviewPane />);
const pdfButton = () => screen.getByRole('button', { name: PREVIEW.pdf });

describe('PreviewPane', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ agreementHtml: '', error: undefined });
  });

  it('shows the rendered agreement', () => {
    useAppStore.setState({ agreementHtml: '<h1>Consulting Agreement</h1><p>Made between <strong>Northwind</strong>.</p>' });
    renderPane();
    expect(screen.getByRole('heading', { name: 'Consulting Agreement' })).toBeInTheDocument();
    expect(screen.getByText('Northwind')).toBeInTheDocument();
    expect(pdfButton()).toBeEnabled();
  });

  it('sanitises the agreement before showing it', () => {
    useAppStore.setState({ agreementHtml: '<p>Terms</p><img src="x" onerror="alert(1)"><script>alert(2)</script>' });
    const { container } = renderPane();
    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(container.ownerDocument.querySelector('.nd-preview-page script')).toBeNull();
    expect(container.ownerDocument.querySelector('.nd-preview-page img')).not.toHaveAttribute('onerror');
  });

  it('keeps the last good agreement when a later render fails', () => {
    useAppStore.setState({ agreementHtml: '<p>Last good render</p>', error: 'Unknown variable' });
    renderPane();
    expect(screen.getByText('Last good render')).toBeInTheDocument();
  });

  it('says it is rendering until the first render arrives', () => {
    renderPane();
    expect(screen.getByText(PREVIEW.rendering)).toBeInTheDocument();
    expect(pdfButton()).toBeDisabled();
  });

  it('points at the problem when nothing has rendered and the render failed', () => {
    useAppStore.setState({ error: 'Unknown variable' });
    renderPane();
    expect(screen.getByText(PREVIEW.failed)).toBeInTheDocument();
    expect(screen.queryByText(PREVIEW.rendering)).not.toBeInTheDocument();
  });

  it('saves the agreement, rendered afresh, as Markdown', async () => {
    const created: Blob[] = [];
    URL.createObjectURL = vi.fn((b: Blob) => (created.push(b), 'blob:x'));
    URL.revokeObjectURL = vi.fn();
    const names: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      names.push(this.download);
    });
    const renderAgreement = vi.fn().mockResolvedValue('# Terms\n');
    useAppStore.setState({ agreementHtml: '<p>Terms</p>', renderAgreement });
    renderPane();
    fireEvent.click(screen.getByRole('button', { name: PREVIEW.markdown }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(renderAgreement).toHaveBeenCalledWith('markdown');
    expect(names).toEqual(['agreement.md']);
    expect(created[0].type).toMatch(/^text\/markdown/);
    click.mockRestore();
  });

  it('cannot save Markdown before anything has rendered', () => {
    renderPane();
    expect(screen.getByRole('button', { name: PREVIEW.markdown })).toBeDisabled();
  });

  it('saves the agreement, rendered afresh, as a PDF rather than the page on screen', async () => {
    // The page still shows an older render; the current sources render differently.
    useAppStore.setState({ agreementHtml: '<p>Stale terms</p>', renderAgreement: vi.fn().mockResolvedValue('<p>Fresh terms</p><script>x()</script>') });
    renderPane();
    fireEvent.click(pdfButton());
    await waitFor(() => expect(html2pdf.chain.save).toHaveBeenCalledTimes(1));
    expect(html2pdf.chain.set).toHaveBeenCalledWith(expect.objectContaining({ filename: PREVIEW.pdfFile }));
    const page = (html2pdf.chain.from.mock.calls as unknown[][])[0][0] as HTMLElement;
    expect(page.innerHTML).toContain('Fresh terms');
    expect(page.innerHTML).not.toContain('Stale terms');
    expect(page.querySelector('script')).toBeNull();
  });

  it('saves no PDF when the current sources do not render', async () => {
    const showError = vi.spyOn(message, 'error');
    useAppStore.setState({ agreementHtml: '<p>Stale terms</p>', renderAgreement: vi.fn().mockRejectedValue(new Error('bad data')) });
    renderPane();
    fireEvent.click(pdfButton());
    await waitFor(() => expect(showError).toHaveBeenCalledWith(PREVIEW.pdfFailed));
    expect(html2pdf.chain.save).not.toHaveBeenCalled();
    showError.mockRestore();
  });
});
