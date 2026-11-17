/**
 * Which playground layout to show, and whether to announce the new design.
 *
 * Design v2 is the default. The classic (v1) layout stays available as an
 * opt-out, stored under the same localStorage key the old feature flag used,
 * so existing choices carry over:
 *
 * | stored `isDesignV2Enabled` | layout                                  |
 * |----------------------------|-----------------------------------------|
 * | missing                    | v2 (the new default)                    |
 * | "true"                     | v2 (opted in before it was the default) |
 * | "false"                    | classic (an explicit opt-out)           |
 *
 * People moved to v2 by the default (key missing) see a one-time banner that
 * explains the change and offers a way back. Whether it has been shown is kept
 * under its own key, so it appears once even if the user never dismisses it.
 */

export const DESIGN_V2_STORAGE_KEY = "isDesignV2Enabled";
export const DESIGN_V2_NOTICE_STORAGE_KEY = "designV2NoticeSeen";

export interface DesignV2Preference {
  /** Whether to show design v2. */
  enabled: boolean;
  /** True when no choice is stored, so v2 comes from the default rather than the user. */
  byDefault: boolean;
}

/** Reads the stored layout choice. Without storage (SSR, blocked storage) the default applies. */
export const readDesignV2Preference = (): DesignV2Preference => {
  try {
    const stored = typeof window === "undefined" ? null : window.localStorage.getItem(DESIGN_V2_STORAGE_KEY);
    if (stored === null) return { enabled: true, byDefault: true };
    return { enabled: stored !== "false", byDefault: false };
  } catch {
    return { enabled: true, byDefault: true };
  }
};

/** Stores the layout choice; a failure to write only loses the choice for later visits. */
export const writeDesignV2Preference = (enabled: boolean): void => {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(DESIGN_V2_STORAGE_KEY, String(enabled));
  } catch {
    // Storage blocked or full: the choice still applies for this visit.
  }
};

/**
 * Whether to show the one-time announcement: only to people on v2 by default
 * who have not seen it yet. If storage can't be read the banner is not shown,
 * because there would be no way to stop it reappearing on every visit.
 */
export const shouldShowDesignV2Notice = (preference: DesignV2Preference): boolean => {
  if (!preference.enabled || !preference.byDefault) return false;
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(DESIGN_V2_NOTICE_STORAGE_KEY) === null;
  } catch {
    return false;
  }
};

/** Records that the announcement has been shown, so it is not shown again. */
export const markDesignV2NoticeSeen = (): void => {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(DESIGN_V2_NOTICE_STORAGE_KEY, "true");
  } catch {
    // Storage blocked: the banner stays dismissed for this visit only.
  }
};
