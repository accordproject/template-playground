import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { message } from 'antd';
import App from '../App';

/**
 * Covers the rollout boundary in App.tsx: the "/" route renders the Design v2
 * shell when the flag is on and the legacy layout when it is off, while
 * "/learn" is unaffected by the flag.
 */

// Stable mocks: App's init effect depends on these identities, so they must
// not be recreated on every render.
const state = vi.hoisted(() => ({
  isDesignV2Enabled: false,
  init: vi.fn().mockResolvedValue(undefined),
  loadFromLink: vi.fn().mockResolvedValue(true),
}));

vi.mock('../store/store', () => ({
  default: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      init: state.init,
      loadFromLink: state.loadFromLink,
      backgroundColor: '#ffffff',
      textColor: '#121212',
      isDesignV2Enabled: state.isDesignV2Enabled,
    })
  ),
}));

vi.mock('../components/Tour', () => ({ default: { start: vi.fn().mockResolvedValue(undefined) } }));
vi.mock('../components/Navbar', () => ({ default: () => <nav data-testid="legacy-navbar" /> }));
vi.mock('../components/PlaygroundSidebar', () => ({ default: () => <aside data-testid="legacy-sidebar" /> }));
vi.mock('../components/Content', () => ({ default: () => <div data-testid="learn-content" /> }));
vi.mock('../pages/MainContainer', () => ({ default: () => <div data-testid="legacy-main" /> }));
vi.mock('../pages/LearnNow', () => ({ default: () => <div data-testid="learn-page" /> }));
vi.mock('../components/designV2/DesignV2Layout', () => ({ default: () => <div data-testid="design-v2-shell" /> }));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

describe('App - Design v2 feature flag routing', () => {
  beforeEach(() => {
    localStorage.setItem('hasVisited', 'true');
    state.isDesignV2Enabled = false;
    window.location.hash = '';
  });

  it('renders the legacy layout on "/" when the flag is off', async () => {
    renderAt('/');

    expect(await screen.findByTestId('legacy-main')).toBeInTheDocument();
    expect(screen.getByTestId('legacy-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('legacy-sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId('design-v2-shell')).not.toBeInTheDocument();
  });

  it('renders the Design v2 shell on "/" and hides the legacy navbar when the flag is on', async () => {
    state.isDesignV2Enabled = true;
    renderAt('/');

    expect(await screen.findByTestId('design-v2-shell')).toBeInTheDocument();
    expect(screen.queryByTestId('legacy-navbar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('legacy-sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('legacy-main')).not.toBeInTheDocument();
  });

  it('leaves "/learn" unchanged when the flag is on', async () => {
    state.isDesignV2Enabled = true;
    renderAt('/learn');

    expect(await screen.findByTestId('learn-page')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('legacy-navbar')).toBeInTheDocument());
    expect(screen.queryByTestId('design-v2-shell')).not.toBeInTheDocument();
  });
});

describe('App - Share link initialization and error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('hasVisited', 'true');
    state.isDesignV2Enabled = false;
    window.location.hash = '';
  });

  afterEach(() => {
    window.location.hash = '';
  });

  it('displays error toast, cleans URL, and falls back to init() when #data is corrupted (returns false)', async () => {
    const errorSpy = vi
      .spyOn(message, 'error')
      .mockImplementation(() => undefined as unknown as ReturnType<typeof message.error>);
    state.loadFromLink.mockResolvedValueOnce(false);

    window.location.hash = '#data=invalid-data';

    renderAt('/');

    await waitFor(() => {
      expect(state.loadFromLink).toHaveBeenCalledWith('invalid-data');
    });

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        'Unable to load template from link. The link may be corrupted or invalid.'
      );
    });

    await waitFor(() => {
      expect(state.init).toHaveBeenCalled();
    });

    expect(window.location.hash).toBe('');
    expect(await screen.findByTestId('legacy-main')).toBeInTheDocument();
  });

  it('displays error toast, cleans URL, and falls back to init() when loadFromLink throws an exception', async () => {
    const errorSpy = vi
      .spyOn(message, 'error')
      .mockImplementation(() => undefined as unknown as ReturnType<typeof message.error>);
    state.loadFromLink.mockRejectedValueOnce(new Error('Decompression error'));

    window.location.hash = '#data=corrupted-error';

    renderAt('/');

    await waitFor(() => {
      expect(state.loadFromLink).toHaveBeenCalledWith('corrupted-error');
    });

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        'Unable to load template from link. The link may be corrupted or invalid.'
      );
    });

    await waitFor(() => {
      expect(state.init).toHaveBeenCalled();
    });

    expect(window.location.hash).toBe('');
    expect(await screen.findByTestId('legacy-main')).toBeInTheDocument();
  });

  it('loads template successfully without error when #data is valid', async () => {
    const errorSpy = vi
      .spyOn(message, 'error')
      .mockImplementation(() => undefined as unknown as ReturnType<typeof message.error>);
    state.loadFromLink.mockResolvedValueOnce(true);

    window.location.hash = '#data=valid-data';

    renderAt('/');

    await waitFor(() => {
      expect(state.loadFromLink).toHaveBeenCalledWith('valid-data');
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(state.init).not.toHaveBeenCalled();
    expect(await screen.findByTestId('legacy-main')).toBeInTheDocument();
  });
});

