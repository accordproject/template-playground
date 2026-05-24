import { useMemo } from "react";
import useAppStore from "../store/store";

/**
 * Custom hook that derives the editor theme name from the current background color.
 * Returns "darkTheme" when the background is dark (#121212), otherwise "lightTheme".
 */
export default function useThemeName(): string {
  const backgroundColor = useAppStore((state) => state.backgroundColor);

  const themeName = useMemo(
    () => (backgroundColor === "#121212" ? "darkTheme" : "lightTheme"),
    [backgroundColor]
  );

  return themeName;
}
