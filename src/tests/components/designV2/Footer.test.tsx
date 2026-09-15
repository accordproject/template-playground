import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '../../../components/designV2/Footer';
import { FOOTER } from '../../../components/designV2/constants';
import useAppStore from '../../../store/store';
import { STEP_ID } from '../../../types/designV2.types';

/** The problems pill mirrors the app store's error: green when there is none, red with the message otherwise. */
describe('Design v2 Footer', () => {
  const noop = vi.fn();
  beforeEach(() => {
    useAppStore.setState({ error: undefined });
  });

  it('shows "no problems" while the store has no error', () => {
    render(<Footer view={STEP_ID.modelData} onBack={noop} onNext={noop} />);
    expect(screen.getByText(FOOTER.noProblems)).toBeInTheDocument();
    expect(screen.queryByText(FOOTER.problem)).not.toBeInTheDocument();
  });

  it("shows the store's full error message next to a red pill", () => {
    useAppStore.setState({ error: 'Invalid CTO model: Expected "-->", "@", "o"' });
    render(<Footer view={STEP_ID.modelData} onBack={noop} onNext={noop} />);
    expect(screen.getByText(FOOTER.problem)).toBeInTheDocument();
    expect(screen.getByText('Invalid CTO model: Expected "-->", "@", "o"')).toBeInTheDocument();
    expect(screen.queryByText(FOOTER.noProblems)).not.toBeInTheDocument();
  });
});
