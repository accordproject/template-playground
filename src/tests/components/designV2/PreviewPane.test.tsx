import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
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

  it('saves the agreement as a PDF', async () => {
    useAppStore.setState({ agreementHtml: '<p>Terms</p>' });
    renderPane();
    fireEvent.click(pdfButton());
    await waitFor(() => expect(html2pdf.chain.save).toHaveBeenCalledTimes(1));
    expect(html2pdf.chain.set).toHaveBeenCalledWith(expect.objectContaining({ filename: PREVIEW.pdfFile }));
    expect(html2pdf.chain.from).toHaveBeenCalledWith(expect.objectContaining({ className: 'nd-preview-page' }));
  });
});
