import React, { useEffect, useState } from "react";
import { ToggleDarkModeContainer } from "../styles/components/ToggleDarkMode";
import DarkModeToggle from "react-dark-mode-toggle";
import useAppStore from "../store/store";
import { useSpeechRecognition } from "react-speech-recognition";

const ToggleDarkMode: React.FC = () => {
  const { backgroundColor, toggleDarkMode } = useAppStore();  
  const [isDarkMode, setIsDarkMode] = useState(backgroundColor === "#121212");

  // Speech Recognition Hook
  const { transcript, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    setIsDarkMode(backgroundColor === "#121212");
  }, [backgroundColor]);

  // Auto-toggle based on time (Dark Mode after 7 PM, Light Mode after 7 AM)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 19 || hour < 7) {
      setIsDarkMode(true);
      toggleDarkMode();
    } else {
      setIsDarkMode(false);
      toggleDarkMode();
    }
  }, []);

  // Listen for voice commands
  useEffect(() => {
    if (transcript.toLowerCase().includes("enable dark mode")) {
      setIsDarkMode(true);
      toggleDarkMode();
      resetTranscript();
    } else if (transcript.toLowerCase().includes("disable dark mode")) {
      setIsDarkMode(false);
      toggleDarkMode();
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const handleChange = () => {
    toggleDarkMode();
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ToggleDarkModeContainer>
      <DarkModeToggle
        className="dark-mode-toggle"
        onChange={handleChange}
        checked={isDarkMode}
        size={80}
      />
    </ToggleDarkModeContainer>
  );
};

export default ToggleDarkMode;
