import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import DesignV2Layout from '../../../components/designV2/DesignV2Layout';
import { DEFAULT_TEMPLATE } from '../../../components/designV2/usePickTemplate';
import { PREVIEW, START_SAMPLES, URLS, WELCOME, sampleNameFor } from '../../../components/designV2/constants';
import useAppStore from '../../../store/store';
import useDesignV2Store from '../../../store/designV2Store';
import { FIRST_STEP, STEP_ID } from '../../../types/designV2.types';

/*
 * Covers entering the flow: "Start building" must land on a template with
 * logic, so the editor steps never open on the app store's startup sample.
 * Also the hero's "How it works" link and where the Preview toggle lives.
 */
vi.mock('@monaco-editor/react', () => ({
  useMonaco: () => null,
  Editor: ({ language }: { language: string }) => <div data-testid={`monaco-${language}`} />,
}));

const renderLayout = () =>
  render(
    <MemoryRouter>
      <DesignV2Layout />
    </MemoryRouter>
  );

describe('DesignV2Layout — Start building', () => {
  const loadSample = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ loadSample });
    useDesignV2Store.setState({ view: 'welcome', selectedTemplate: null });
  });

  it('picks and loads the first gallery card when nothing was picked', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: `${WELCOME.start} →` }));

    expect(useDesignV2Store.getState().view).toBe(FIRST_STEP);
    expect(useDesignV2Store.getState().selectedTemplate).toBe(DEFAULT_TEMPLATE);
    expect(DEFAULT_TEMPLATE).toBe(START_SAMPLES[0].name);
    expect(loadSample).toHaveBeenCalledWith(sampleNameFor(DEFAULT_TEMPLATE));
  });

  it('keeps a template that was already picked', () => {
    useDesignV2Store.setState({ selectedTemplate: START_SAMPLES[1].name });
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: `${WELCOME.start} →` }));

    expect(useDesignV2Store.getState().view).toBe(FIRST_STEP);
    expect(useDesignV2Store.getState().selectedTemplate).toBe(START_SAMPLES[1].name);
    expect(loadSample).not.toHaveBeenCalled();
  });

  it('"How it works" opens the docs site in a new tab', () => {
    renderLayout();
    const link = screen.getByRole('link', { name: WELCOME.howItWorks });
    expect(link).toHaveAttribute('href', URLS.templateDocs);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

describe('DesignV2Layout — Preview toggle', () => {
  beforeEach(() => {
    useAppStore.setState({ loadSample: vi.fn().mockResolvedValue(undefined) });
    useDesignV2Store.setState({ selectedTemplate: START_SAMPLES[0].name, previewOpen: false, helpRailOpen: true });
  });

  it('is not in the header on the Start step', () => {
    useDesignV2Store.setState({ view: FIRST_STEP });
    renderLayout();
    expect(screen.queryByRole('button', { name: PREVIEW.toggle })).not.toBeInTheDocument();
  });

  it.each([STEP_ID.text, STEP_ID.modelData])('on step %s it opens and closes the drawer', (view) => {
    useDesignV2Store.setState({ view });
    renderLayout();
    const toggle = screen.getByRole('button', { name: PREVIEW.toggle });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(useDesignV2Store.getState().previewOpen).toBe(true);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(toggle);
    expect(useDesignV2Store.getState().previewOpen).toBe(false);
  });
});
