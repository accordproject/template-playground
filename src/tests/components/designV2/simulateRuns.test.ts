import { describe, it, expect } from 'vitest';
import { describeFields, pretty, runStats, runSummary } from '../../../components/designV2/simulateRuns';
import { SIMULATE } from '../../../components/designV2/constants';
import { failedRun, initRun, okRun, parseFailedRun } from './runFixtures';

describe('simulateRuns helpers', () => {
  it('describeFields lists scalar fields and skips Concerto metadata', () => {
    expect(describeFields(okRun.stateAfter)).toBe('count 2 · owner Alice');
    expect(describeFields({ $class: 'x', $timestamp: 'y', nested: { a: 1 }, flag: true })).toBe('flag true');
    expect(describeFields(null)).toBe('');
  });

  it('runSummary describes init, successful and failed triggers', () => {
    expect(runSummary(initRun)).toBe(SIMULATE.summary.init);
    expect(runSummary({ ...initRun, error: 'boom' })).toBe(SIMULATE.summary.initFailed);
    expect(runSummary(okRun)).toBe('increment 2 → "Alice\'s count is now 2 (of 10)"');
    expect(runSummary({ ...okRun, response: { newCount: 2 } })).toBe('increment 2 → ok');
    expect(runSummary(failedRun)).toBe(`increment 9 — ${SIMULATE.summary.triggerFailed}`);
    expect(runSummary(parseFailedRun)).toBe(`#3 — ${SIMULATE.summary.invalidRequest}`);
  });

  it('runSummary falls back to the run id when the request has no scalar fields', () => {
    expect(runSummary({ ...okRun, request: {}, response: {} })).toBe('#1 → ok');
  });

  it('runStats counts ok and failed runs and remembers the last failure', () => {
    expect(runStats([])).toEqual({ runs: 0, ok: 0, failed: 0, lastFailedId: null });
    expect(runStats([initRun, okRun, failedRun])).toEqual({ runs: 3, ok: 2, failed: 1, lastFailedId: '#2' });
  });

  it('pretty prints indented JSON', () => {
    expect(pretty({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(pretty(undefined)).toBe('');
  });
});
