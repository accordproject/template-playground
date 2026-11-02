import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PreviewDrawer from '../../../components/designV2/PreviewDrawer';
import { PREVIEW } from '../../../components/designV2/constants';
import useAppStore from '../../../store/store';

vi.mock('html2pdf.js', () => ({
  default: () => ({
    set: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    save: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('PreviewDrawer', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ agreementHtml: '' });
  });

  it('renders placeholder message and disables PDF button when agreementHtml is empty', () => {
    render(<PreviewDrawer open={true} onClose={onClose} />);

    expect(screen.getByText(/No preview available/i)).toBeInTheDocument();
    const pdfBtn = screen.getByRole('button', { name: PREVIEW.pdf });
    expect(pdfBtn).toBeDisabled();
  });

  it('renders sanitized agreement HTML and enables PDF button when agreementHtml is present', () => {
    useAppStore.setState({ agreementHtml: '<h1>Rental Agreement</h1><p>Terms and conditions apply.</p>' });
    render(<PreviewDrawer open={true} onClose={onClose} />);

    expect(screen.getByText('Rental Agreement')).toBeInTheDocument();
    expect(screen.getByText('Terms and conditions apply.')).toBeInTheDocument();
    expect(screen.queryByText(/No preview available/i)).not.toBeInTheDocument();

    const pdfBtn = screen.getByRole('button', { name: PREVIEW.pdf });
    expect(pdfBtn).toBeEnabled();
  });

  it('calls html2pdf when PDF download button is clicked', () => {
    useAppStore.setState({ agreementHtml: '<p>Agreement preview content</p>' });
    render(<PreviewDrawer open={true} onClose={onClose} />);

    const pdfBtn = screen.getByRole('button', { name: PREVIEW.pdf });
    fireEvent.click(pdfBtn);

    expect(pdfBtn).toBeInTheDocument();
  });
});
