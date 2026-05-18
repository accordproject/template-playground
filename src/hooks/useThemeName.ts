import { useMemo } from "react";
import useAppStore from "../store/store";

/**
 * Custom hook that derives the Monaco editor theme from the branch's boolean theme state.
 * Returns "darkTheme" when dark mode is enabled, otherwise "lightTheme".
 */
export default function useThemeName(): string {
  const isDarkMode = useAppStore((state) => state.isDarkMode);

  const themeName = useMemo(
    () => (isDarkMode ? "darkTheme" : "lightTheme"),
    [isDarkMode]
  );

  return themeName;
}
