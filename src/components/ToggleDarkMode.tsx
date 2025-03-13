import { ToggleDarkModeContainer } from "../styles/components/ToggleDarkMode";
import DarkModeToggle from "react-dark-mode-toggle";
import useAppStore from "../store/store";

const ToggleDarkMode: React.FC = () => {
  const { backgroundColor, toggleDarkMode } = useAppStore();
  const isDarkMode = backgroundColor === "#121212";

  return (
    <ToggleDarkModeContainer>
    <DarkModeToggle
      className="dark-mode-toggle"
      onChange={toggleDarkMode}
      checked={isDarkMode}
      size={50}
    />
  </ToggleDarkModeContainer>
  );
};

export default ToggleDarkMode;