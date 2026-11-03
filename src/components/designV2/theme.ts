import { theme, type ThemeConfig } from "antd";

/**
 * Ant Design theme for the design-v2 shell.
 *
 * The palette follows the "Template Playground v4" mock (teal on navy, IBM
 * Plex) and mirrors the --nd-* CSS tokens in DesignV2Layout.css. Selects the
 * same algorithm as the app theme so Ant Design controls track the v2 shell.
 */
export const V2_PALETTE = {
  teal: "#0a8188",
  tealDark: "#0e5c7a",
  ink: "#0f2027",
  fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
} as const;

export const designV2Theme = (isDark: boolean): ThemeConfig => ({
  algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    colorPrimary: isDark ? "#50c5c7" : V2_PALETTE.teal,
    colorInfo: isDark ? "#50c5c7" : V2_PALETTE.teal,
    colorLink: isDark ? "#72d4d3" : V2_PALETTE.tealDark,
    ...(isDark ? {} : { colorTextBase: V2_PALETTE.ink }),
    fontFamily: V2_PALETTE.fontFamily,
    fontSize: 13,
    borderRadius: 8,
  },
});
