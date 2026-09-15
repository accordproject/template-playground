import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StartView } from '../../../components/designV2/views';
import useDesignV2Store from '../../../store/designV2Store';
import { START, START_SAMPLES } from '../../../components/designV2/constants';
import { countStepsAfterTemplate, LOGIC_ONLY_STEP_KEYS, STEP_ID } from '../../../types/designV2.types';
import { SAMPLES } from '../../../samples';

/**
 * Covers the "Choose a template type" gallery: one card per START_SAMPLES
 * entry, picking a card selects it (and follows its logic flag), and the
 * Blank / include-logic controls update the v2 store.
 */
describe('START_SAMPLES', () => {
  it('every card points at a real sample in src/samples', () => {
    const names = SAMPLES.map((s) => s.NAME);
    for (const card of START_SAMPLES) {
      expect(names).toContain(card.sampleName);
    }
  });

  it('cards that turn logic on point at samples that ship logic', () => {
    for (const card of START_SAMPLES) {
      const sample = SAMPLES.find((s) => s.NAME === card.sampleName)!;
      expect(Boolean(sample.LOGIC)).toBe(card.logic);
    }
  });
});

describe('StartView', () => {
  beforeEach(() => {
    useDesignV2Store.setState({ selectedTemplate: null, includeLogic: true });
  });

  const cards = () => screen.getAllByRole('button', { pressed: false }).concat(
    screen.queryAllByRole('button', { pressed: true })
  );

  it('renders one card per sample with its name, step count and note', () => {
    render(<StartView />);
    for (const sample of START_SAMPLES) {
      expect(screen.getByText(sample.name)).toBeInTheDocument();
      const steps = START.stepsLabel(countStepsAfterTemplate(sample.logic));
      expect(
        screen.getByRole('button', { name: START.cardLabel(sample.name, steps, sample.note) })
      ).toBeInTheDocument();
    }
    expect(cards()).toHaveLength(START_SAMPLES.length);
  });

  it('starts with no card selected', () => {
    render(<StartView />);
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0);
  });

  it('picking a card selects it and follows its logic flag', () => {
    render(<StartView />);
    const noLogic = START_SAMPLES.find((s) => !s.logic)!;
    const withLogic = START_SAMPLES.find((s) => s.logic)!;

    fireEvent.click(screen.getByText(noLogic.name));
    expect(useDesignV2Store.getState().selectedTemplate).toBe(noLogic.name);
    expect(useDesignV2Store.getState().includeLogic).toBe(false);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);

    fireEvent.click(screen.getByText(withLogic.name));
    expect(useDesignV2Store.getState().selectedTemplate).toBe(withLogic.name);
    expect(useDesignV2Store.getState().includeLogic).toBe(true);
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
  });

  it('"+ Blank" selects the blank template without touching the logic toggle', () => {
    render(<StartView />);
    fireEvent.click(screen.getByRole('button', { name: START.blank }));
    expect(useDesignV2Store.getState().selectedTemplate).toBe(START.blankName);
    expect(useDesignV2Store.getState().includeLogic).toBe(true);
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0);
  });

  it('the include-logic hint names the logic-only steps', () => {
    render(<StartView />);
    const ids = LOGIC_ONLY_STEP_KEYS.map((key) => STEP_ID[key]);
    expect(screen.getByText(`steps ${ids.join(' & ')}`)).toBeInTheDocument();
    expect(screen.getByText('steps 5 & 6')).toBeInTheDocument();
  });

  it('the include-logic checkbox writes to the store', () => {
    render(<StartView />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(useDesignV2Store.getState().includeLogic).toBe(false);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(useDesignV2Store.getState().includeLogic).toBe(true);
  });
});
