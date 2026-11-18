import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { message } from 'antd';
import useAppStore from '../../../store/store';
import DesignV2Notice from '../../../components/designV2/DesignV2Notice';
import { NOTICE, URLS } from '../../../components/designV2/constants';

describe('DesignV2Notice', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({ isDesignV2Enabled: true, showDesignV2Notice: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when the notice is not due', () => {
    useAppStore.setState({ showDesignV2Notice: false });

    const { container } = render(<DesignV2Notice />);

    expect(container).toBeEmptyDOMElement();
    expect(localStorage.getItem('designV2NoticeSeen')).toBeNull();
  });

  it('shows the announcement as a polite status, with a feedback link', () => {
    render(<DesignV2Notice />);

    const region = screen.getByRole('region', { name: NOTICE.label });
    expect(region).toHaveTextContent(NOTICE.title);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const link = screen.getByRole('link', { name: NOTICE.feedback });
    expect(link).toHaveAttribute('href', URLS.designFeedback);
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('records the notice as seen as soon as it shows', () => {
    render(<DesignV2Notice />);

    expect(localStorage.getItem('designV2NoticeSeen')).toBe('true');
  });

  it('does not come back when it is mounted again (navigation or a layout switch)', () => {
    const first = render(<DesignV2Notice />);
    expect(screen.getByRole('region', { name: NOTICE.label })).toBeInTheDocument();
    first.unmount();

    render(<DesignV2Notice />);

    expect(screen.queryByRole('region', { name: NOTICE.label })).not.toBeInTheDocument();
  });

  it('"Got it" hides the notice and keeps design v2', () => {
    render(<DesignV2Notice />);

    fireEvent.click(screen.getByRole('button', { name: NOTICE.dismiss }));

    expect(useAppStore.getState().showDesignV2Notice).toBe(false);
    expect(useAppStore.getState().isDesignV2Enabled).toBe(true);
    expect(screen.queryByRole('region', { name: NOTICE.label })).not.toBeInTheDocument();
  });

  it('"Switch to classic" opts out at once, persists it and says how to come back', () => {
    const info = vi.spyOn(message, 'info');
    render(<DesignV2Notice />);

    fireEvent.click(screen.getByRole('button', { name: NOTICE.switchToClassic }));

    expect(useAppStore.getState().isDesignV2Enabled).toBe(false);
    expect(localStorage.getItem('isDesignV2Enabled')).toBe('false');
    expect(useAppStore.getState().showDesignV2Notice).toBe(false);
    expect(info).toHaveBeenCalledWith(NOTICE.switched);
  });
});
