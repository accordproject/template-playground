import React, { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import useAppStore from "../store/store";

const ToggleDarkMode: React.FC = () => {
  const { backgroundColor, toggleDarkMode } = useAppStore();
  const [isDarkMode, setIsDarkMode] = useState(backgroundColor === "#121212");

  useEffect(() => {
    setIsDarkMode(backgroundColor === "#121212");
  }, [backgroundColor]);

  const handleChange = () => {
    toggleDarkMode();
    setIsDarkMode((prev) => !prev);
    const newTheme = !isDarkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <button
      data-testid="toggle-dark-mode"
      onClick={handleChange}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${isDarkMode
          ? "bg-gray-700/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3),0_1px_1px_rgba(255,255,255,0.1)]"
          : "bg-gray-200/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_1px_1px_rgba(255,255,255,0.1)]"
        } hover:scale-105`}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <FiSun size={16} className="text-yellow-400" />
      ) : (
        <FiMoon size={16} className="text-gray-400" />
      )}
    </button>
  );
};

export default ToggleDarkMode;
