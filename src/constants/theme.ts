/**
 * Theme utilities for the application.
 * 
 * The primary theme state is `isDarkMode: boolean` in the Zustand store.
 * Ant Design theming is handled via ConfigProvider with darkAlgorithm.
 * CSS variables are managed via data-theme attribute on the document element.
 */

export type ThemeName = 'dark' | 'light';

/**
 * Get theme name from isDarkMode boolean.
 * Useful for components that need the string value (e.g., data-theme attribute).
 */
export function getThemeName(isDarkMode: boolean): ThemeName {
  return isDarkMode ? 'dark' : 'light';
}
