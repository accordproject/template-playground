import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DESIGN_V2_NOTICE_STORAGE_KEY,
  DESIGN_V2_STORAGE_KEY,
  markDesignV2NoticeSeen,
  readDesignV2Preference,
  shouldShowDesignV2Notice,
  writeDesignV2Preference,
} from '../../utils/designV2Preference';

describe('designV2Preference', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('readDesignV2Preference', () => {
    it.each([
      [null, { enabled: true, byDefault: true }],
      ['true', { enabled: true, byDefault: false }],
      ['false', { enabled: false, byDefault: false }],
    ])('stored %s resolves to %o', (stored, expected) => {
      if (stored !== null) localStorage.setItem(DESIGN_V2_STORAGE_KEY, stored);

      expect(readDesignV2Preference()).toEqual(expected);
    });

    it('falls back to the default when storage throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });

      expect(readDesignV2Preference()).toEqual({ enabled: true, byDefault: true });
    });
  });

  describe('writeDesignV2Preference', () => {
    it('stores the choice as "true" or "false"', () => {
      writeDesignV2Preference(false);
      expect(localStorage.getItem(DESIGN_V2_STORAGE_KEY)).toBe('false');

      writeDesignV2Preference(true);
      expect(localStorage.getItem(DESIGN_V2_STORAGE_KEY)).toBe('true');
    });

    it('does not throw when storage is blocked', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked');
      });

      expect(() => writeDesignV2Preference(false)).not.toThrow();
    });
  });

  describe('shouldShowDesignV2Notice', () => {
    it('shows only on design v2 by default, until marked as seen', () => {
      const byDefault = { enabled: true, byDefault: true };
      expect(shouldShowDesignV2Notice(byDefault)).toBe(true);

      markDesignV2NoticeSeen();

      expect(localStorage.getItem(DESIGN_V2_NOTICE_STORAGE_KEY)).toBe('true');
      expect(shouldShowDesignV2Notice(byDefault)).toBe(false);
    });

    it('does not show for an explicit choice either way', () => {
      expect(shouldShowDesignV2Notice({ enabled: true, byDefault: false })).toBe(false);
      expect(shouldShowDesignV2Notice({ enabled: false, byDefault: false })).toBe(false);
    });

    it('does not show when storage cannot be read, so it cannot repeat on every visit', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });

      expect(shouldShowDesignV2Notice({ enabled: true, byDefault: true })).toBe(false);
    });
  });
});
