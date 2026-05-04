import { useMemo } from "react";
import useAppStore from "../store/store";

/**
<<<<<<< Rishabh060105/issue-773-session-key-storage
 * Custom hook that derives the Monaco editor theme from the branch's boolean theme state.
 * Returns "darkTheme" when dark mode is enabled, otherwise "lightTheme".
 */
export default function useThemeName(): string {
  const isDarkMode = useAppStore((state) => state.isDarkMode);

  const themeName = useMemo(
    () => (isDarkMode ? "darkTheme" : "lightTheme"),
    [isDarkMode]
=======
 * Custom hook that derives the editor theme name from the current background color.
 * Returns "darkTheme" when the background is dark (#121212), otherwise "lightTheme".
 */
export default function useThemeName(): string {
  const backgroundColor = useAppStore((state) => state.backgroundColor);

  const themeName = useMemo(
    () => (backgroundColor === "#121212" ? "darkTheme" : "lightTheme"),
    [backgroundColor]
>>>>>>> main
  );

  return themeName;
}
