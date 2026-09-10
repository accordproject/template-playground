import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StartView } from '../../../components/designV2/views';
import useDesignV2Store from '../../../store/designV2Store';
import useAppStore from '../../../store/store';
import { START, START_SAMPLES, sampleNameFor } from '../../../components/designV2/constants';
import { STEPS_AFTER_TEMPLATE } from '../../../types/designV2.types';
import { SAMPLES } from '../../../samples';

/**
 * Covers the "Choose a template type" gallery: one card per START_SAMPLES
 * entry, picking a card selects it, and "+ Blank" updates the v2 store.
 * Every card ships logic, so every card walks the same steps.
 */
describe('START_SAMPLES', () => {
  it('every card points at a real sample in src/samples', () => {
    const names = SAMPLES.map((s) => s.NAME);
    for (const card of START_SAMPLES) {
      expect(names).toContain(card.sampleName);
    }
  });

  it('every card points at a sample that ships logic and a default request', () => {
    for (const card of START_SAMPLES) {
      const sample = SAMPLES.find((s) => s.NAME === card.sampleName)!;
      expect(sample.LOGIC, card.name).toBeTruthy();
      expect(sample.REQUEST, card.name).toBeTruthy();
    }
  });
});

describe('StartView', () => {
  beforeEach(() => {
    useDesignV2Store.setState({ selectedTemplate: null });
  });

  const cards = () => screen.getAllByRole('button', { pressed: false }).concat(
    screen.queryAllByRole('button', { pressed: true })
  );

  it('renders one card per sample with its name, the full step count and its note', () => {
    render(<StartView />);
    const steps = START.stepsLabel(STEPS_AFTER_TEMPLATE);
    for (const sample of START_SAMPLES) {
      expect(screen.getByText(sample.name)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: START.cardLabel(sample.name, steps, sample.note) })
      ).toBeInTheDocument();
    }
    expect(cards()).toHaveLength(START_SAMPLES.length);
    expect(screen.getAllByText(START.tags.logic)).toHaveLength(START_SAMPLES.length);
  });

  it('starts with no card selected', () => {
    render(<StartView />);
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0);
  });

  it('picking a card selects it, and only it', () => {
    render(<StartView />);
    const [first, second] = START_SAMPLES;

    fireEvent.click(screen.getByText(first.name));
    expect(useDesignV2Store.getState().selectedTemplate).toBe(first.name);
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);

    fireEvent.click(screen.getByText(second.name));
    expect(useDesignV2Store.getState().selectedTemplate).toBe(second.name);
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
  });

  it('"+ Blank" selects the blank template', () => {
    render(<StartView />);
    fireEvent.click(screen.getByRole('button', { name: START.blank }));
    expect(useDesignV2Store.getState().selectedTemplate).toBe(START.blankName);
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0);
  });

  it('picking a card or Blank loads its sample into the app store right away', () => {
    const loadSample = vi.fn().mockResolvedValue(undefined);
    useAppStore.setState({ loadSample });
    render(<StartView />);

    fireEvent.click(screen.getByText(START_SAMPLES[0].name));
    expect(loadSample).toHaveBeenLastCalledWith(START_SAMPLES[0].sampleName);

    fireEvent.click(screen.getByRole('button', { name: START.blank }));
    expect(loadSample).toHaveBeenLastCalledWith(sampleNameFor(START.blankName));
    expect(loadSample).toHaveBeenCalledTimes(2);
  });

  it('has no include-logic toggle: logic is part of every template', () => {
    render(<StartView />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
