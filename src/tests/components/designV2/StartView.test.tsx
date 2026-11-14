import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StartView } from '../../../components/designV2/views';
import useDesignV2Store from '../../../store/designV2Store';
import useAppStore from '../../../store/store';
import { START, START_BLANK, START_SAMPLES, sampleNameFor } from '../../../components/designV2/constants';
import { FIRST_STEP, STEPS } from '../../../types/designV2.types';
import { SAMPLES } from '../../../samples';

/**
 * Covers the "Choose a template" gallery: one card per START_SAMPLES entry,
 * each with its own "Start with this template" button that picks the
 * template, loads its sample and opens the next step in one click. The
 * blank template is a fourth card that does the same with the empty sample.
 */
describe('START_SAMPLES', () => {
  it('every card points at a real sample in src/samples', () => {
    const names = SAMPLES.map((s) => s.NAME);
    for (const card of START_SAMPLES) {
      expect(names).toContain(card.sampleName);
    }
  });

  it('is a tour: text-only cards first, then one that ships logic with a default request', () => {
    const samples = START_SAMPLES.map((card) => SAMPLES.find((s) => s.NAME === card.sampleName)!);
    const withLogic = samples.filter((s) => s.LOGIC);
    expect(withLogic.length).toBeGreaterThanOrEqual(1);
    expect(withLogic.length).toBeLessThan(samples.length);
    for (const sample of withLogic) expect(sample.REQUEST, sample.NAME).toBeTruthy();
    expect(samples[0].LOGIC).toBeUndefined();
  });

  it('speaks about the agreement, not the engine', () => {
    for (const card of START_SAMPLES) {
      const copy = [card.tagline, ...card.demonstrates].join(' ');
      expect(copy, card.name).not.toMatch(/init\(\)|trigger\(\)|request|\bstate\b|event/i);
    }
  });

  it('every card says what it demonstrates', () => {
    for (const card of START_SAMPLES) {
      expect(card.demonstrates.length, card.name).toBeGreaterThanOrEqual(2);
      for (const point of card.demonstrates) expect(point.trim().length, card.name).toBeGreaterThan(10);
      expect(card.tagline.trim().length, card.name).toBeGreaterThan(0);
    }
  });
});

describe('StartView', () => {
  const loadSample = vi.fn().mockResolvedValue(undefined);
  const secondStep = STEPS[1].id;

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ loadSample });
    useDesignV2Store.setState({ view: FIRST_STEP, selectedTemplate: null });
  });

  it('renders one card per sample with its name, what it demonstrates and a start button', () => {
    render(<StartView />);
    for (const sample of START_SAMPLES) {
      expect(screen.getByText(sample.name)).toBeInTheDocument();
      for (const point of sample.demonstrates) expect(screen.getByText(point)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: START.openLabel(sample.name) })).toBeInTheDocument();
    }
    expect(screen.getAllByText(START.open)).toHaveLength(START_SAMPLES.length + 1);
  });

  it('renders the blank template as a card like the others, without a demonstrates list', () => {
    render(<StartView />);
    const card = screen.getByRole('article', { name: START_BLANK.name });
    expect(card).toHaveClass('nd-sample-card', `nd-sample-card-${START_BLANK.accent}`);
    expect(within(card).getByText(START_BLANK.tagline)).toBeInTheDocument();
    expect(within(card).queryByRole('list')).not.toBeInTheDocument();
    expect(within(card).getByRole('button', { name: START.openLabel(START_BLANK.name) })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /start blank/i })).not.toBeInTheDocument();
  });

  it('marks no card as current until a template is picked', () => {
    render(<StartView />);
    expect(screen.queryByText(START.current)).not.toBeInTheDocument();
  });

  it('marks the picked template as current when coming back to the gallery', () => {
    useDesignV2Store.setState({ selectedTemplate: START_SAMPLES[1].name });
    render(<StartView />);
    expect(screen.getAllByText(START.current)).toHaveLength(1);
    expect(screen.getByRole('article', { name: START_SAMPLES[1].name })).toHaveAttribute('aria-current', 'true');
  });

  it("a card's button picks its template, loads the sample and opens the next step", () => {
    render(<StartView />);
    const [, second] = START_SAMPLES;

    fireEvent.click(screen.getByRole('button', { name: START.openLabel(second.name) }));
    expect(useDesignV2Store.getState().selectedTemplate).toBe(second.name);
    expect(loadSample).toHaveBeenCalledWith(second.sampleName);
    expect(useDesignV2Store.getState().view).toBe(secondStep);
  });

  it('clicking the card body does nothing — only the button opens a template', () => {
    render(<StartView />);
    fireEvent.click(screen.getByText(START_SAMPLES[0].name));
    expect(useDesignV2Store.getState().selectedTemplate).toBeNull();
    expect(useDesignV2Store.getState().view).toBe(FIRST_STEP);
    expect(loadSample).not.toHaveBeenCalled();
  });

  it("the blank card's button opens the next step on the blank template", () => {
    render(<StartView />);
    fireEvent.click(screen.getByRole('button', { name: START.openLabel(START_BLANK.name) }));
    expect(useDesignV2Store.getState().selectedTemplate).toBe(START.blankName);
    expect(loadSample).toHaveBeenCalledWith(sampleNameFor(START.blankName));
    expect(useDesignV2Store.getState().view).toBe(secondStep);
  });

  it('has no include-logic toggle and no AI draft button', () => {
    render(<StartView />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText(/draft with ai/i)).not.toBeInTheDocument();
  });
});
