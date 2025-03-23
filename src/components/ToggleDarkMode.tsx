import { Switch } from "antd";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import useAppStore from "../store/store"; // Adjust the path to your store

const ToggleDarkMode = () => {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const toggleDarkMode = useAppStore((state) => state.toggleDarkMode);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <SunOutlined
        style={{
          fontSize: "20px",
          color: isDarkMode ? "#888" : "#fff", // Dimmed when dark mode is on
        }}
      />
      <Switch
        checked={isDarkMode}
        onChange={toggleDarkMode}
        style={{
          backgroundColor: isDarkMode ? "#19c6c7" : "#888", // Blue when dark mode is on
        }}
      />
      <MoonOutlined
        style={{
          fontSize: "20px",
          color: isDarkMode ? "#19c6c7" : "#888", // Blue when dark mode is on
        }}
      />
    </div>
  );
};

export default ToggleDarkMode;
