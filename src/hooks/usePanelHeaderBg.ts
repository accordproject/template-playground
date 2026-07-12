import { useMemo } from "react";
import useAppStore from "../store/store";

/**
 * Custom hook that derives the panel header background color from the global theme.
 * Returns a light or dark theme color based on the current background color.
 */
export default function usePanelHeaderBg(): string {
  const backgroundColor = useAppStore((state) => state.backgroundColor);

  return useMemo(() => {
    const headerLight = "#f8fafc";
    const headerDark = "#1e293b";
    return backgroundColor === "#ffffff" ? headerLight : headerDark;
  }, [backgroundColor]);
}
