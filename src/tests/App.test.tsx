import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../App';
import useDesignV2Store from '../store/designV2Store';
import { FIRST_STEP, STEP_ID } from '../types/designV2.types';

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
  SHARED_TEMPLATE_NAME: 'Shared template',
  default: Object.assign(vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      init: state.init,
      loadFromLink: state.loadFromLink,
      backgroundColor: '#ffffff',
      textColor: '#121212',
      isDesignV2Enabled: state.isDesignV2Enabled,
    })
  ), { getState: () => ({ error: 'Failed to load shared content' }) }),
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
    state.init.mockClear();
    state.loadFromLink.mockReset().mockResolvedValue(true);
    useDesignV2Store.getState().resetFlow();
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

  it.each(['?data=valid', '#data=valid'])('routes a new %s link from an existing Template view', async (url) => {
    state.isDesignV2Enabled = true;
    useDesignV2Store.getState().start();
    const router = createMemoryRouter([{ path: '*', element: <App /> }], { initialEntries: ['/'] });
    render(<RouterProvider router={router} />);
    await screen.findByTestId('design-v2-shell');
    await act(() => router.navigate('/' + url));
    await waitFor(() => expect(useDesignV2Store.getState().view).toBe(STEP_ID.text));
    expect(state.loadFromLink).toHaveBeenCalledWith('valid');
    expect(useDesignV2Store.getState().selectedTemplate).toBe('Shared template');

    act(() => useDesignV2Store.getState().setView(FIRST_STEP));
    expect(useDesignV2Store.getState().view).toBe(FIRST_STEP);
  });

  it('initializes only once when navigating between ordinary routes', async () => {
    state.isDesignV2Enabled = true;
    const router = createMemoryRouter([{ path: '*', element: <App /> }], { initialEntries: ['/'] });
    render(<RouterProvider router={router} />);
    await screen.findByTestId('design-v2-shell');
    await act(() => router.navigate('/learn'));
    await screen.findByTestId('learn-page');
    await act(() => router.navigate('/'));
    await screen.findByTestId('design-v2-shell');
    expect(state.init).toHaveBeenCalledTimes(1);
  });

  it('a failed new link clears the old selection and returns to welcome', async () => {
    state.isDesignV2Enabled = true;
    const router = createMemoryRouter([{ path: '*', element: <App /> }], { initialEntries: ['/?data=valid'] });
    render(<RouterProvider router={router} />);
    await waitFor(() => expect(useDesignV2Store.getState().view).toBe(STEP_ID.text));
    state.loadFromLink.mockResolvedValue(false);
    await act(() => router.navigate('/?data=invalid'));
    await waitFor(() => expect(useDesignV2Store.getState().view).toBe('welcome'));
    expect(useDesignV2Store.getState().selectedTemplate).toBeNull();

  });

  it.each(['?data=valid', '#data=valid'])('preserves %s when redirecting a shared link from /learn', async (url) => {
    state.isDesignV2Enabled = true;
    const router = createMemoryRouter([{ path: '*', element: <App /> }], { initialEntries: ['/learn' + url] });
    render(<RouterProvider router={router} />);

    await screen.findByTestId('design-v2-shell');
    expect(router.state.location.pathname).toBe('/');
    expect(router.state.location.search + router.state.location.hash).toBe(url);
    await waitFor(() => expect(useDesignV2Store.getState().view).toBe(STEP_ID.text));
    expect(state.loadFromLink).toHaveBeenCalledTimes(1);
    expect(state.init).not.toHaveBeenCalled();
  });

  it.each(['?data=invalid', '#data=invalid'])('keeps a failed %s redirect on welcome', async (url) => {
    state.isDesignV2Enabled = true;
    state.loadFromLink.mockResolvedValue(false);
    useDesignV2Store.getState().start();
    const router = createMemoryRouter([{ path: '*', element: <App /> }], { initialEntries: ['/learn' + url] });
    render(<RouterProvider router={router} />);

    await screen.findByTestId('design-v2-shell');
    expect(router.state.location.pathname).toBe('/');
    expect(router.state.location.search + router.state.location.hash).toBe(url);
    await waitFor(() => expect(useDesignV2Store.getState().view).toBe('welcome'));
    expect(useDesignV2Store.getState().selectedTemplate).toBeNull();
    expect(state.loadFromLink).toHaveBeenCalledTimes(1);
    expect(state.init).not.toHaveBeenCalled();
  });
});
