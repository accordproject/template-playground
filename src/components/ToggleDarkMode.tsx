import React, { useEffect, useState } from "react";
import { ToggleDarkModeContainer } from "../styles/components/ToggleDarkMode";
import DarkModeToggle from "react-dark-mode-toggle";
import useAppStore from "../store/store";

const ToggleDarkMode: React.FC = () => {
  const { backgroundColor, toggleDarkMode } = useAppStore();
  const [isDarkMode, setIsDarkMode] = useState(backgroundColor === "#121212");

  useEffect(() => {
    setIsDarkMode(backgroundColor === "#121212");
  }, [backgroundColor]);

  const handleChange = () => {
    toggleDarkMode();
    setIsDarkMode(isChecked);
  };

  return (
    <ToggleDarkModeContainer>
      <DarkModeToggle
        className="dark-mode-toggle"
        onChange={handleChange}
        checked={isDarkMode}
        size={50}
      />
    </ToggleDarkModeContainer>
  );
};

export default ToggleDarkMode;
