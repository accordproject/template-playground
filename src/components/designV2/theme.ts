import { theme, type ThemeConfig } from "antd";

/**
 * Ant Design theme for the design-v2 shell.
 *
 * The palette follows the "Template Playground v4" mock (teal on navy, IBM
 * Plex) and mirrors the --nd-* CSS tokens in DesignV2Layout.css. It differs
 * from the brand tokens in src/utils/theme.ts on purpose; unifying the two is
 * a design decision tracked in the dark-mode follow-up (#970).
 *
 * The light algorithm is used regardless of the app theme for now: the CSS
 * shell has no dark tokens yet, and switching only the antd controls to dark
 * made them illegible on the light shell. #970 enables darkAlgorithm together
 * with the dark --nd-* overrides.
 */
export const V2_PALETTE = {
  teal: "#0a8188",
  tealDark: "#0e5c7a",
  ink: "#0f2027",
  fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
} as const;

export const designV2Theme = (): ThemeConfig => ({
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: V2_PALETTE.teal,
    colorInfo: V2_PALETTE.teal,
    colorLink: V2_PALETTE.tealDark,
    colorTextBase: V2_PALETTE.ink,
    fontFamily: V2_PALETTE.fontFamily,
    fontSize: 13,
    borderRadius: 8,
  },
});
