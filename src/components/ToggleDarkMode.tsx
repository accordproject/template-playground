import React, { useEffect, useState } from "react";
import useAppStore from "../store/store";
import { FaMoon, FaSun } from "react-icons/fa";

const ToggleDarkMode: React.FC = () => {
  const { backgroundColor, toggleDarkMode } = useAppStore();
  const [isDarkMode, setIsDarkMode] = useState(backgroundColor === "#121212");

  useEffect(() => {
    setIsDarkMode(backgroundColor === "#121212");
  }, [backgroundColor]);

  const handleChange = () => {
    toggleDarkMode();
    const newTheme = !isDarkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div
      onClick={handleChange}
      style={{
        width: "60px",
        height: "32px",
        borderRadius: "50px",
        backgroundColor: "#E2E8F0", 
        display: "flex",
        alignItems: "center",
        justifyContent: isDarkMode ? "flex-end" : "flex-start", 
        padding: "4px",
        cursor: "pointer",
        transition: "background-color 0.3s ease, justify-content 0.3s ease",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: "#ffffff", 
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isDarkMode ? "#FBBF24" : "#1A202C", 
          transition: "color 0.3s ease",
        }}
      >
        {isDarkMode ? <FaMoon size={12} /> : <FaSun size={12} />}
      </div>
    </div>
  );
};

export default ToggleDarkMode;
